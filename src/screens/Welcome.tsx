import React, {Component} from 'react';
import {StyleSheet, Text, View, SafeAreaView, Alert} from 'react-native';
import {goHome} from '../utils/navigation';
import {readableVersion} from '../utils/helpers';
import LogoSupercoop from '../../assets/svg/supercoop.svg';
import SupercoopSignIn, {SupercoopSignInButton} from '../utils/SupercoopSignIn';

interface State {
    signInInProgress: boolean;
}

interface Props {
    componentId: string;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        height: '100%',
        padding: 8,
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
        marginLeft: 20,
    },
    version: {
        fontSize: 10,
        textAlign: 'right',
    },
});

export default class Welcome extends Component<Props, State> {
    static screenName = "Welcome";

    constructor(props: Props) {
        super(props);
        this.state = {
            signInInProgress: false,
        };
    }

    authWithSupercoop = async (): Promise<void> => {
        this.setState({
            signInInProgress: true,
        });
        SupercoopSignIn.getInstance()
            .signIn()
            .then(
                () => {
                    this.setState({
                        signInInProgress: false,
                    });
                    goHome();
                },
                reason => {
                    Alert.alert('Erreur', "Une erreur s'est produite lors de la connexion");
                    console.error(reason);
                    this.setState({
                        signInInProgress: false,
                    });
                },
            );
    };

    render(): React.ReactNode {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{flex: 1, width: '100%', marginTop: 20, justifyContent: 'center', alignItems: 'center'}}>
                    <LogoSupercoop height="80%" width="80%" />
                </View>
                <Text style={styles.welcome}>Bienvenue, Supercoopain•e !</Text>
                <Text style={styles.instructions}>
                    Pour commencer à utiliser l&apos;application, connectes-toi à ton compte Supercoop grâce au bouton
                    ci-dessous. On se retrouve juste après !
                </Text>
                <View style={{height: 96, flex: 0, alignItems: 'center'}}>
                    <SupercoopSignInButton
                        title="Se connecter"
                        onPress={this.authWithSupercoop}
                        disabled={this.state.signInInProgress}
                    />
                </View>
                <Text style={styles.version}>{readableVersion()}</Text>
            </SafeAreaView>
        );
    }
}
