import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView } from 'react-native';
import { goHome } from '../utils/navigation';
import { GoogleSigninButton } from 'react-native-google-signin';
import Google from '../utils/Google';

export default class Welcome extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSigninInProgress: false
        };
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                    <Image
                        resizeMode='contain'
                        source={require('../../assets/images/welcome_supercoop.png')}
                        style={{height: '20%'}}
                    />
                <Text style={styles.welcome}>Bienvenue, Supercoopain•e !</Text>
                <Text style={styles.instructions}>
                    Pour commencer à utiliser l'application, connectes-toi à ton compte Supercoop
                    grâce au bouton ci-dessous. Tu auras besoin de tes identifiants Google Supercoop.
                    On se retrouve juste après !
                </Text>
                <GoogleSigninButton
                    style={{ width: 230, height: 48, margin: 12 }}
                    size={GoogleSigninButton.Size.Standard}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={() => {
                        this.state.isSigninInProgress = true;
                        Google.getInstance().signIn(() => {
                            this.state.isSigninInProgress = false;
                            goHome();
                        })
                    }}
                    disabled={this.state.isSigninInProgress} />
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: '100%'
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
