import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    AsyncStorage
} from 'react-native'
import { goToAuth, goHome, goToScreen } from '../utils/navigation'
import { USER_KEY } from '../config'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'

export default class Initialising extends React.Component {
    async componentDidMount() {
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

        GoogleSignin.isSignedIn().then((isSignedIn) => {
            if (isSignedIn) {
                goHome();
            }
        })
        GoogleSignin.signInSilently().then((user) => {
            this.setState({ user });
            goHome();
        }, (error) => {
            if (error.code === statusCodes.SIGN_IN_REQUIRED) {
                goToAuth();
            }
            console.log(error);

        });
        // } catch (error) {
        //     if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        //         // user has not signed in yet
        //     } else {
        //         // some other error
        //     }
        //     goToAuth();
        // }
        // try {
        //     const user = await AsyncStorage.getItem(USER_KEY, function (err, value) {
        //         JSON.parse(value)
        //     });
        //     console.log('user: ', user);
        //     if (user) {
        //         goHome();
        //     } else {
        //         goToAuth();
        //     }
        // } catch (err) {
        //     console.log('error: ', err);
        //     goToAuth();
        // }
    }

    getCurrentUserInfo = async () => {
        try {
            GoogleSignin.signInSilently()
                .then((user) => {
                    this.setState({ user });
                });
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_REQUIRED) {
                // user has not signed in yet
            } else {
                // some other error
            }
            goToAuth();
        }
    };

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>Loading</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    welcome: {
        fontSize: 28
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});