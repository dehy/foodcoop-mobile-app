import { KEYUTIL, KJUR, RSAKey } from 'jsrsasign';
import JwtDecode from 'jwt-decode';
import { AuthConfiguration, authorize, AuthorizeResult, refresh, RefreshResult } from 'react-native-app-auth';
import * as Sentry from '@sentry/react-native';
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage';
import { Button, ButtonProps } from 'react-native';
import React, { Component, ReactElement } from 'react';
import Mailjet from './Mailjet';

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

interface RawRsaKey {
    n: string;
    e: string;
}

export default class SupercoopSignIn {
    private static instance: SupercoopSignIn;
    private currentUser?: User;
    private PEMs: string[] = [];

    config: AuthConfiguration = {
        issuer: '***REMOVED***',
        clientId: '***REMOVED***',
        redirectUrl: '***REMOVED***',
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
        useNonce: true,
    };

    public static getInstance(): SupercoopSignIn {
        if (SupercoopSignIn.instance == undefined) {
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
                const keyObj = KEYUTIL.getKey(key) as RSAKey;
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
        return email.match(/^[^\.]+/);
    }

    getEmail(): string {
        return this.currentUser?.email ?? 'john.doe@supercoop.fr';
    }

    getUserPhoto(): string | undefined {
        return undefined;
    }

    setCurrentUser(user: User | undefined): void {
        // console.debug(user);
        this.currentUser = user;
        if (undefined !== user) {
            Sentry.setUser({ email: user.email });
            Mailjet.getInstance().setSender(user.email, user.name);
        } else {
            Sentry.setUser(null);
        }
    }

    signInSilently = async (): Promise<void> => {
        const { refreshToken, idToken } = await this.getTokensFromSecureStorage();
        const user = await this.getUserFromToken(idToken);
        if (undefined === user) {
            try {
                const result = await refresh(this.config, { refreshToken: refreshToken });
                const user = await this.getUserFromToken(result.idToken);
                this.saveTokensFromResult(result);
                this.setCurrentUser(user);
                return;
            } catch (error) {
                throw error;
            }
        }
        this.setCurrentUser(user);
    };

    signIn = async (): Promise<void> => {
        try {
            const result = await authorize(this.config);
            console.debug(result);
            const user = await this.getUserFromToken(result.idToken);
            this.saveTokensFromResult(result);
            this.setCurrentUser(user);
            return;
        } catch (error) {
            throw error; // TODO: Throw better
        }
    };

    signOut = async (): Promise<void> => {
        await this.removeTokensFromSecureStorage();
        Mailjet.getInstance().setSender(undefined, undefined);
    };

    async idTokenIsValid(token: string): Promise<boolean> {
        await this.fetchJwks();
        for (const pem of this.PEMs) {
            const isValid = KJUR.jws.JWS.verifyJWT(token, pem, {
                alg: ['RS256'],
                iss: ['***REMOVED***'],
            });
            if (true === isValid) {
                return true;
            }
            continue;
        }
        return false;
    }

    async getUserFromToken(token: string): Promise<User> {
        const tokenIsValid = await this.idTokenIsValid(token);
        if (true === tokenIsValid) {
            console.info('idToken is valid');
            return JwtDecode<User>(token);
        }
        throw undefined;
    }

    private async saveTokensFromResult(result: AuthorizeResult | RefreshResult): Promise<void> {
        if (result.refreshToken) {
            await RNSecureStorage.set('refreshToken', result.refreshToken, { accessible: ACCESSIBLE.WHEN_UNLOCKED });
        } else {
            await RNSecureStorage.remove('refreshToken');
        }
        await RNSecureStorage.set('idToken', result.idToken, { accessible: ACCESSIBLE.WHEN_UNLOCKED });
    }

    private async getTokensFromSecureStorage(): Promise<any> {
        const refreshToken = await RNSecureStorage.get('refreshToken');
        const idToken = await RNSecureStorage.get('idToken');

        return { refreshToken, idToken };
    }

    private async removeTokensFromSecureStorage(): Promise<void> {
        await RNSecureStorage.remove('refreshToken');
        await RNSecureStorage.remove('idToken');
    }
}

export class SupercoopSignInButton extends Component<ButtonProps, {}> {
    render(): ReactElement {
        return <Button title={this.props.title} onPress={this.props.onPress} />;
    }
}
