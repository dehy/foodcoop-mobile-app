import {KEYUTIL, KJUR} from 'jsrsasign';
import JwtDecode from 'jwt-decode';
import {AuthConfiguration, authorize, AuthorizeResult, logout, refresh, RefreshResult} from 'react-native-app-auth';
import * as Sentry from '@sentry/react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Button, ButtonProps} from 'react-native';
import React from 'react';
import Mailjet from './Mailjet';
import Config from 'react-native-config';
import Odoo from './Odoo';

interface User {
    email: string;
    sub: string;
    name: string;
    given_name: string;
}

interface SupercoopKey {
    alg: string;
    e: string;
    kid?: string;
    kty: string;
    n: string;
    use: string;
}

interface SupercoopJWKsResponse {
    keys: SupercoopKey[];
}

export default class SupercoopSignIn {
    private static instance: SupercoopSignIn;
    private currentUser?: User;
    private PEMs: string[] = [];

    config: AuthConfiguration = {
        issuer: Config.OPENID_CONNECT_ISSUER!,
        clientId: Config.OPENID_CONNECT_CLIENT_ID!,
        redirectUrl: Config.OPENID_CONNECT_REDIRECT_URL!,
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
        useNonce: true,
    };

    public static getInstance(): SupercoopSignIn {
        if (SupercoopSignIn.instance === undefined) {
            SupercoopSignIn.instance = new SupercoopSignIn();
        }

        return this.instance;
    }

    constructor() {
        this.currentUser = undefined;
    }

    async fetchJwks(): Promise<void> {
        if (this.PEMs.length === 0) {
            const result = await fetch(`${this.config.issuer}/oauth/jwks.json`);
            const json = (await result.json()) as SupercoopJWKsResponse;
            json.keys.forEach(key => {
                const keyObj = KEYUTIL.getKey(key);
                this.PEMs.push(KEYUTIL.getPEM(keyObj));
            });
        }
    }

    getName(): string {
        return this.currentUser?.name ?? 'John Doe';
    }

    getFirstname(): string | null {
        return this.currentUser ? this.currentUser.given_name : null;
    }

    getFirstnameSlug(): RegExpMatchArray | null {
        const email = this.getEmail();
        if (email === null) {
            return null;
        }
        return email.match(/^[^.]+/);
    }

    getEmail(): string {
        return this.currentUser?.email ?? 'john.doe@supercoop.fr';
    }

    getUserPhoto(): string | undefined {
        return undefined;
    }

    setCurrentUser(user?: User | undefined): void {
        this.currentUser = user;
        if (undefined !== user) {
            Sentry.setUser({email: user.email});
            Mailjet.getInstance().setSender(user.name);
        } else {
            Sentry.setUser(null);
            Mailjet.getInstance().setSender();
        }
    }

    signInSilently = async (): Promise<void> => {
        const {refreshToken, idToken} = await this.getTokensFromSecureStorage();
        if (!idToken) {
            Odoo.getInstance().setToken(undefined);
            return;
        }
        let user = await this.getUserFromToken(idToken);
        if (undefined === user && refreshToken) {
            const result = await refresh(this.config, {refreshToken});
            user = await this.getUserFromToken(result.idToken);
            this.saveTokensFromResult(result);
            this.setCurrentUser(user);
            Odoo.getInstance().setToken(result.idToken);
            return;
        }
        this.setCurrentUser(user);
        Odoo.getInstance().setToken(idToken);
    };

    signIn = async (): Promise<void> => {
        const result = await authorize(this.config);
        console.debug('SignIn result: ', result);
        const user = await this.getUserFromToken(result.idToken);
        this.saveTokensFromResult(result);
        this.setCurrentUser(user);
        Odoo.getInstance().setToken(result.idToken);
        return;
    };

    signOut = async (): Promise<void> => {
        const idToken = (await this.getTokensFromSecureStorage()).idToken;
        await this.removeTokensFromSecureStorage();
        Odoo.getInstance().setToken(undefined);
        this.setCurrentUser();
        const issuer = Config.OPENID_CONNECT_ISSUER!;
        const clientId = Config.OPENID_CONNECT_CLIENT_ID!;
        if (idToken !== null) {
            await logout(
                {
                    issuer,
                    clientId,
                },
                {
                    idToken,
                    postLogoutRedirectUrl: Config.OPENID_CONNECT_REDIRECT_URL!,
                },
            );
        }
    };

    async idTokenIsValid(token: string): Promise<boolean> {
        await this.fetchJwks();
        for (const pem of this.PEMs) {
            const isValid = KJUR.jws.JWS.verifyJWT(token, pem, {
                alg: ['RS256'],
                iss: [Config.OPENID_CONNECT_ISSUER!],
            });
            if (isValid === true) {
                return true;
            }
        }
        return false;
    }

    async getUserFromToken(token: string): Promise<User> {
        const tokenIsValid = await this.idTokenIsValid(token);
        if (tokenIsValid === true) {
            console.info('idToken is valid');
            return JwtDecode<User>(token);
        }
        throw new Error('Invalid idToken');
    }

    private async saveTokensFromResult(result: AuthorizeResult | RefreshResult): Promise<void> {
        if (result.refreshToken) {
            await EncryptedStorage.setItem('refreshToken', result.refreshToken);
        } else {
            await EncryptedStorage.removeItem('refreshToken');
        }
        await EncryptedStorage.setItem('idToken', result.idToken);
    }

    private async getTokensFromSecureStorage(): Promise<{refreshToken: string | null; idToken: string | null}> {
        const refreshToken = await EncryptedStorage.getItem('refreshToken');
        const idToken = await EncryptedStorage.getItem('idToken');

        return {refreshToken, idToken};
    }

    private async removeTokensFromSecureStorage(): Promise<void> {
        await EncryptedStorage.removeItem('refreshToken');
        await EncryptedStorage.removeItem('idToken');
    }
}

export const SupercoopSignInButton = (props: ButtonProps) => {
    return <Button title={this.props.title} onPress={this.props.onPress} disabled={this.props.disabled} />;
}
