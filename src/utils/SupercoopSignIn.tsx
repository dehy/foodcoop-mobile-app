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

export default class SupercoopSignIn {
    private static instance: SupercoopSignIn;
    private currentUser?: User;
    private pem: string;

    config: AuthConfiguration = {
        issuer: '***REMOVED***',
        clientId: '***REMOVED***',
        redirectUrl: '***REMOVED***',
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
        useNonce: true,
    };

    // ***REMOVED***/oauth/jwks.json
    private static jwk = {
        alg: 'RS256',
        e: 'AQAB',
        kid: null,
        kty: 'RSA',
        n:
            'yjsxahqYhF7VAqEvExXCS2httxs--O5ze-36PsYpsVhcTMLEhK6Quwl87B_fqzlCjRj7hpaK7jhanpgO0-Vty9SrI5OqwEPtaU_qsWnp70F9aG5rnpKQ7F4rreDK9WHX9GYxBmKIoRYK_12kQAsLYaZ3l1hdpWGLiFJpqufHVBa16FQUA--gMRSJf5P13e51DiMtXfe-PU6o3_sAIsvzBsmXCguuI4tPzMwsHblkmta7bKnXsbz3CzyeFJBVQ4O7RGAsFl4V831bXd-nIoiKlgHSA83EVt4TnL8cYHTnyqhgOhwkXUiyBJ_oSdB9E-4FVFANfG-PCZUUcAWKn6TcZmu5kC7v7WXImdBX1r69Gl47Axgwe9eiWcjpNUWVXIpooC3wLv0B1ife7_D1OZtBEnHEat_4IZU9NFFPygvZV9enyuVhdWhpgpfUFymUyOe0HUzkUp-fwq4uNXaZeSMo-mIRMavv8-IcYwKdmzf4sWLN0Rkwy4G2xMUUxCgGTezLU_Ds9o7m09TbvRQ7BpbQetKZ4F4iG6G4vTkn5hW4luli_B-lCnquXcPPQgt2DzhT552IpmSg0q1sfzOcFab9Up27ROViLR01-GGJW1AqB9EhCMMJEr1fTJ7JI8O3S6-G2Ml3za4hT_vWro4xTaYVeGO4BUUmGnR6dVVDVLbnh8k',
        use: 'sig',
    };

    public static getInstance(): SupercoopSignIn {
        if (SupercoopSignIn.instance == undefined) {
            SupercoopSignIn.instance = new SupercoopSignIn();
        }

        return this.instance;
    }

    constructor() {
        this.currentUser = undefined;
        const keyObj = KEYUTIL.getKey(SupercoopSignIn.jwk) as RSAKey;
        this.pem = KEYUTIL.getPEM(keyObj);
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
        const user = this.getUserFromToken(idToken);
        if (undefined === user) {
            try {
                const result = await refresh(this.config, { refreshToken: refreshToken });
                const user = this.getUserFromToken(result.idToken);
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
            const user = this.getUserFromToken(result.idToken);
            this.saveTokensFromResult(result);
            this.setCurrentUser(user);
        } catch (error) {
            throw error; // TODO: Throw better
        }
    };

    signOut = async (): Promise<void> => {
        await this.removeTokensFromSecureStorage();
        Mailjet.getInstance().setSender(undefined, undefined);
    };

    idTokenIsValid(token: string): boolean {
        return KJUR.jws.JWS.verifyJWT(token, this.pem, {
            alg: ['RS256'],
            iss: ['***REMOVED***'],
        });
    }

    getUserFromToken(token: string): User {
        if (true === this.idTokenIsValid(token)) {
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
