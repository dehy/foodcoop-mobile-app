import React from 'react'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import { goToAuth } from './navigation';
import Sentry from 'react-native-sentry';

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
                    'https://www.googleapis.com/auth/gmail.compose'
                ],
                hostedDomain: 'supercoop.fr'
            });
        } catch (error) {
            console.error('Google Signin configure error', error);
        }
    }

    setCurrentUser(user) {
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
        this.setCurrentUser(null);
    };
}