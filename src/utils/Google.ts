import { GoogleSignin, User } from '@react-native-community/google-signin';
import base64 from 'react-native-base64';

export interface MailAttachment {
    filename: string;
    content: string;
}

export default class Google {
    private static instance: Google;
    private currentUser?: User;

    public static getInstance(): Google {
        if (Google.instance == undefined) {
            Google.instance = new Google();
        }

        return this.instance;
    }

    constructor() {
        this.currentUser = undefined;

        try {
            GoogleSignin.configure({
                scopes: [
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/gmail.send',
                ],
                hostedDomain: 'supercoop.fr',
            });
        } catch (error) {
            console.error('Google Signin configure error', error);
        }
    }

    setCurrentUser(user: User | undefined): void {
        console.debug(user);
        this.currentUser = user;
        // Sentry.setUserContext({
        //     email: this.currentUser ? this.currentUser.email : null
        // })
    }

    async signInSilently(): Promise<void> {
        const isSignedIn = await this.isSignedIn();
        if (isSignedIn === true) {
            return;
        }
        const user = await GoogleSignin.signInSilently();
        if (user) {
            this.setCurrentUser(user);
            return;
        }
    }

    async isSignedIn(): Promise<boolean> {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
            const user = await GoogleSignin.getCurrentUser();
            if (user === null) {
                await this.signOut();
                return false;
            } else {
                this.setCurrentUser(user);
                return true;
            }
        }
        return false;
    }

    async signIn(): Promise<void> {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        if (hasPlayServices) {
            await this.signOut();
            const user = await GoogleSignin.signIn();
            if (user) {
                this.setCurrentUser(user);
                return;
            }
        }
    }

    async getAccessToken(): Promise<string | null> {
        if (this.currentUser !== undefined) {
            const tokens = await GoogleSignin.getTokens();
            console.debug('tokens: ', tokens);
            if (tokens) {
                console.debug('accessToken: ', tokens.accessToken);
                return tokens.accessToken;
            }
        }
        return null;
    }

    getEmail(): string | null {
        return this.currentUser ? this.currentUser.user.email : null;
    }

    getFirstname(): string | null {
        return this.currentUser ? this.currentUser.user.givenName : null;
    }

    getFirstnameSlug(): RegExpMatchArray | null {
        const email = this.getEmail();
        if (email === null) {
            return null;
        }
        return email.match(/^[^\.]+/);
    }

    getUsername(): string {
        if (this.currentUser === undefined || !('user' in this.currentUser) || this.currentUser.user.name === null) {
            return 'John Doe';
        }
        return this.currentUser.user.name;
    }

    getUserPhoto(): string {
        if (this.currentUser === undefined || !('user' in this.currentUser) || this.currentUser.user.photo === null) {
            return '';
        }
        return this.currentUser.user.photo;
    }

    async signOut(): Promise<void> {
        await GoogleSignin.signOut();
        // await GoogleSignin.revokeAccess();
        this.setCurrentUser(undefined);
    }

    async revoke(): Promise<void> {
        await GoogleSignin.revokeAccess();
    }

    /* Email Part */
    async sendEmail(to: string, subject: string, body: string, attachments: Array<MailAttachment> = []): Promise<void> {
        console.debug(to, subject, body, attachments);

        const from = this.getEmail();
        const bodyBase64 = base64.encode(body);

        const messageBoundary = Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, '')
            .substr(0, 32);
        let rfc822Message = `From: ${from}
To: ${__DEV__ ? from : to}
Subject: ${__DEV__ ? '[Test]' : ''}${subject}
Content-Type: multipart/mixed; boundary="${messageBoundary}"
MIME-Version: 1.0

--${messageBoundary}
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: base64

${bodyBase64}

`;

        attachments.forEach(attachment => {
            const filename = attachment.filename;
            const fileContentBase64 = base64.encode(attachment.content);
            const size = attachment.content.length;

            rfc822Message = rfc822Message.concat(`--${messageBoundary}
Content-Type: text/comma-separated-values; charset="UTF-8"; name="${filename}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${filename}"; size=${size}

${fileContentBase64}

`);
        });

        rfc822Message = rfc822Message.concat(`--${messageBoundary}--`);

        const endpoint = 'https://www.googleapis.com/gmail/v1/users/{userId}/messages/send';
        const url = endpoint.replace(/\{userId\}/, 'me');
        const rfc822MessageBase64 = base64.encode(rfc822Message);

        const requestBody = `{
    "raw": "${rfc822MessageBase64}"
}`;

        console.debug(rfc822Message);
        console.debug(requestBody);

        const accessToken = await this.getAccessToken();
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                Authorization: `Bearer ${accessToken}`,
                'Content-Length': requestBody.length.toString(),
            },
            body: requestBody,
        });
        console.debug(result);

        if (result.ok) {
            return;
        }
        throw new Error();
    }
}
