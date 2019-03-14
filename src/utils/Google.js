import React from 'react'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import { goToAuth } from './navigation';
import Sentry from 'react-native-sentry';
import base64 from 'react-native-base64';

export default class Google {

    static instance = null;

    static getInstance() {
        if (Google.instance == null) {
            Google.instance = new Google();
        }

        return this.instance;
    }

    constructor(props) {
        this.currentUser = null;

        try {
            GoogleSignin.configure({
                scopes: [
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/gmail.send'
                ],
                hostedDomain: 'supercoop.fr'
            });
        } catch (error) {
            console.error('Google Signin configure error', error);
        }
    }

    setCurrentUser(user) {
        console.debug(user);
        this.currentUser = user;
        // Sentry.setUserContext({
        //     email: this.currentUser ? this.currentUser.email : null
        // })
    }

    async signInSilently() {
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

    async isSignedIn() {
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

    async signIn() {
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

    async getAccessToken() {
        if (this.currentUser !== null) {
            const tokens = await GoogleSignin.getTokens();
            console.debug("tokens: ", tokens);
            if (tokens) {
                console.debug("accessToken: ", tokens.accessToken);
                return tokens.accessToken;
            }
        }
        return null;
    }

    getEmail() {
        return this.currentUser ? this.currentUser.user.email : null;
    }

    getFirstname() {
        return this.currentUser ? this.currentUser.user.givenName : null;
    }

    getUsername() {
        if (this.currentUser === null ||
            !('user' in this.currentUser) ||
            this.currentUser.user.name === null) {
            return "John Doe";
        }
        return this.currentUser.user.name;
    }

    getUserPhoto() {
        if (this.currentUser === null ||
            !('user' in this.currentUser) ||
            this.currentUser.user.photo === null) {
            return "";
        }
        return this.currentUser.user.photo;
    }

    async signOut() {
        await GoogleSignin.signOut();
        // await GoogleSignin.revokeAccess();
        this.setCurrentUser(null);
    };

    async revoke() {
        await GoogleSignin.revokeAccess();
    }

    /* Email Part */

    async sendInventoryEmail(subject, messageBody, csvFilename, csvString) {
        const csvSize = csvString.length;
        const csvBase64 = base64.encode(csvString);

        // const recipients = "andre.lacote@supercoop.fr,fjg@supercoop.fr";
        const recipients = "inventaire@supercoop.fr";
        const messageBodyBase64 = base64.encode(messageBody);
        const accessToken = await this.getAccessToken();

        const endpoint = "https://www.googleapis.com/gmail/v1/users/{userId}/messages/send"
        url = endpoint.replace(/\{userId\}/, "me");

        const messageBoundary = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 32);
        const fromName = this.getUsername();
        const fromEmail = this.getEmail();
        const from = `${fromName} <${fromEmail}>`;

        const rfc822Message=`From: ${fromEmail}
To: ${__DEV__ ? from : recipients}
Subject: ${(__DEV__ ? "[Test]" : "")}${subject}
Content-Type: multipart/mixed; boundary="${messageBoundary}"
MIME-Version: 1.0

--${messageBoundary}
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: base64

${messageBodyBase64}

--${messageBoundary}
Content-Type: text/comma-separated-values; charset="UTF-8"; name="${csvFilename}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${csvFilename}"; size=${csvSize}

${csvBase64}

--${messageBoundary}--`;

        const rfc822MessageBase64 = base64.encode(rfc822Message);

        const body = `{
    "raw": "${rfc822MessageBase64}"
}`

        console.debug(rfc822Message);
        console.debug(body);

        const result = await fetch(url, {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type":  "application/json; charset=UTF-8",
                "Authorization": `Bearer ${accessToken}`,
                "Content-Length": body.length
            },
            body: body
        });
        console.debug(result);

        if (result.ok) {
            return;
        }
        throw new Error();
    }
}