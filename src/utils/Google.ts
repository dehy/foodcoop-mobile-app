import { GoogleSignin, User } from '@react-native-community/google-signin';
import { Base64 } from 'js-base64';
import base64url from 'base64url';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';
import AppLogger from './AppLogger';
import { readableVersion, systemName } from './helpers';

export interface MailAttachment {
    filepath: string;
    filename?: string;
    filetype?: string;
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
        // console.debug(user);
        this.currentUser = user;
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
            // console.debug('tokens: ', tokens);
            if (tokens) {
                // console.debug('accessToken: ', tokens.accessToken);
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
    async sendEmail(
        to: string,
        cc: string,
        subject: string,
        body: string,
        attachments: Array<MailAttachment> = [],
    ): Promise<void> {
        // console.debug(to, subject, body, attachments);

        const from = this.getEmail();
        subject = __DEV__ ? '[Test]' + subject : subject;
        const subjectBase64 = '=?utf-8?B?' + Base64.encode(subject) + '?=';
        const bodyBase64 = Base64.encode(body);

        const messageBoundary = Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, '')
            .substr(0, 32);
        let rfc822Message = `X-Supercoop-App-Version: ${readableVersion}
X-Supercoop-App-Platform: ${systemName}
From: ${from}
To: ${__DEV__ ? from : to}
`;
        if (cc != '') {
            rfc822Message += `Cc: ${__DEV__ ? from : cc}
`;
        }
        rfc822Message += `Subject: ${subjectBase64}
Content-Type: multipart/mixed; charset=utf-8; boundary="${messageBoundary}"
MIME-Version: 1.0

--${messageBoundary}
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: base64

${bodyBase64}`;

        for (const key in attachments) {
            // console.debug('Attachment key:', key);
            if (attachments.hasOwnProperty(key)) {
                const attachment = attachments[key];
                // console.debug('Attachment: ', attachment);
                const fileContentBase64 = Base64.encode(await RNFS.readFile(attachment.filepath));
                const filename = attachment.filename || attachment.filepath.split('/').pop();
                const filetype = attachment.filetype || mime.lookup(attachment.filepath);
                const fileCharset = mime.charset(attachment.filepath);
                const filesize = (await RNFS.stat(attachment.filepath)).size;

                const chartsetStr = fileCharset != false ? ` charset="${fileCharset}";` : '';
                const rfc822Attachment = `
--${messageBoundary}
Content-Type: ${filetype};${chartsetStr} name="${filename}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${filename}"; size=${filesize}

${fileContentBase64}`;

                rfc822Message = rfc822Message.concat(rfc822Attachment);
            }
        }

        rfc822Message = rfc822Message.concat(`
--${messageBoundary}--`);

        const endpoint = 'https://www.googleapis.com/gmail/v1/users/{userId}/messages/send';
        const url = endpoint.replace(/\{userId\}/, 'me');
        const rfc822MessageBase64 = base64url.encode(rfc822Message);

        const requestBody = `{
    "raw": "${rfc822MessageBase64}"
}`;

        const accessToken = await this.getAccessToken();
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: `Bearer ${accessToken}`,
                'Content-Length': requestBody.length.toString(),
            },
            body: requestBody,
        });

        if (result.ok) {
            return;
        }
        result.text().then(string => {
            AppLogger.getLogger().error(string);
        });
        throw new Error();
    }
}
