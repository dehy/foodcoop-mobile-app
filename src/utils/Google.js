import React from 'react'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import { goToAuth } from './navigation';
import Sentry from 'react-native-sentry';

export default class Google extends React.Component {

    static instance = null;

    static getInstance() {
        if (Google.instance == null) {
            Google.instance = new Google();
        }

        return this.instance;
    }

    constructor(props) {
        super(props);
        this.state = {
            currentUser: null
        }

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

    componentDidUpdate() {
        Sentry.setUserContext({
            email: this.state.currentUser ? this.state.currentUser.email : null
        })
    }

    signInSilently = async (signedInCallback, signedOutCallback) => {
        this.isSignedIn(signedInCallback, (signedInCallback) => {
            GoogleSignin.signInSilently().then((user) => {
                this.state.currentUser = user;
                signedInCallback();
            }, (error) => {
                if (error.code === statusCodes.SIGN_IN_REQUIRED) {
                    signedOutCallback();
                }
                console.log(error);
            })
        });
    }

    isSignedIn = async (signedInCallback, signedOutCallback) => {
        GoogleSignin.isSignedIn().then(async (isSignedIn) => {
            if (isSignedIn) {
                GoogleSignin.getCurrentUser().then((user) => {
                    if (user === null) {
                        this.signOut(goToAuth);
                    } else {
                        this.state.currentUser = user;
                        signedInCallback();
                    }
                });
            } else {
                signedOutCallback();
            }
        }, (reason) => {
            console.error(reason);
        })
    }

    signIn = async (signedInCallback) => {
        GoogleSignin.hasPlayServices().then((hasPlayServices) => {
            console.log('hasPlayServices', hasPlayServices)
            if (hasPlayServices) {
                this.signOut(() => {
                    GoogleSignin.signIn().then((user) => {
                        this.state.currentUser = user;
                        signedInCallback();
                    }, (reason) => {
                        console.error('Google Sign In rejected', reason);
                    })
                })
            }
        }, (reason) => {
            console.error('Google Play Services error', reason)
        });
    }

    getUsername() {
        if (this.state.currentUser === null ||
            this.state.currentUser.user.name === null) {
            return "John Doe";
        }
        return this.state.currentUser.user.name;
    }

    getUserPhoto() {
        if (this.state.currentUser === null ||
            this.state.currentUser.user.photo === null) {
            return "";
        }
        return this.state.currentUser.user.photo;
    }

    signOut = async (signedOutCallback) => {
        // await GoogleSignin.revokeAccess();
        GoogleSignin.signOut().then(() => {
            this.state.currentUser = null;
            signedOutCallback();
        });
    };
}