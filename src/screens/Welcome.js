import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, AsyncStorage } from 'react-native';
import { goHome } from '../utils/navigation';
import { USER_KEY } from '../config';
import { GoogleSignin, GoogleSigninButton, StatusCodes } from 'react-native-google-signin';

export default class Welcome extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSigninInProgress: false
        };
    }

    googleSignIn = async () => {
        this.state.isSigninInProgress = true
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            //   this.setState({ userInfo });
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
            console.log('user successfully signed in!', userInfo);
            goHome();
        } catch (error) {
            if (error.code === StatusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === StatusCodes.IN_PROGRESS) {
                // operation (f.e. sign in) is in progress already
            } else if (error.code === StatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
            }
            this.state.isSigninInProgress = false;
            console.error('Google Sign In failed', error);
        }
    };

    componentDidMount() {
        try {
            GoogleSignin.configure({
                hostedDomain: 'supercoop.fr'
            });
        } catch (error) {
            console.error('Google Signin configure error', error);
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../../assets/images/welcome_supercoop.png')} />
                <Text style={styles.welcome}>Bienvenue, Supercoopain•ine !</Text>
                <Text style={styles.instructions}>
                    Pour commencer à utiliser l'application, connectes-toi à ton compte Supercoop
                    grâce au bouton ci-dessous. Tu auras besoin de tes identifiants Google Supercoop.
                    On se retrouve juste après !
                </Text>
                <GoogleSigninButton
                    style={{ width: 230, height: 48 }}
                    size={GoogleSigninButton.Size.Standard}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={this.googleSignIn}
                    disabled={this.state.isSigninInProgress} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    welcome: {
        fontSize: 30,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginTop: 40,
        marginRight: 20,
        marginBottom: 40,
        marginLeft: 20
    },
});
