import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView } from 'react-native';
import { goHome } from '../utils/navigation';
import { GoogleSigninButton } from 'react-native-google-signin';
import Google from '../utils/Google';
import LogoSupercoop from '../../assets/svg/supercoop.svg';

export default class Welcome extends Component {
    constructor(props) {
        super(props);
        this.state = {
            signinInProgress: false
        };
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, width: '100%', marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <LogoSupercoop height="80%" width="80%" />
                </View>
                <Text style={styles.welcome}>Bienvenue, Supercoopain•e !</Text>
                <Text style={styles.instructions}>
                    Pour commencer à utiliser l'application, connectes-toi à ton compte Supercoop
                    grâce au bouton ci-dessous. Tu auras besoin de tes identifiants Google Supercoop.
                    On se retrouve juste après !
                </Text>
                <View style={{ height: 96, flex: 0 }}>
                    <GoogleSigninButton
                        style={{ width: 230, height: 48, margin: 12 }}
                        size={GoogleSigninButton.Size.Standard}
                        color={GoogleSigninButton.Color.Dark}
                        onPress={() => {
                            this.setState({
                                signinInProgress: true
                            })
                            Google.getInstance().signIn(() => {
                                this.setState({
                                    signinInProgress: false
                                })
                                goHome();
                            })
                        }}
                        disabled={this.state.signinInProgress} />
                </View>
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
        flex: 0,
        fontSize: 30,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        flex: 0,
        textAlign: 'justify',
        color: '#333333',
        marginTop: 40,
        marginRight: 20,
        marginBottom: 40,
        marginLeft: 20
    },
});
