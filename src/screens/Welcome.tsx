import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Alert } from 'react-native';
import { goHome } from '../utils/navigation';
import { readableVersion } from '../utils/helpers';
import LogoSupercoop from '../../assets/svg/supercoop.svg';
import SupercoopSignIn, { SupercoopSignInButton } from '../utils/SupercoopSignIn';

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

export const Welcome = (props: Props) => {
    const [signInInProgress, setSignInInProgress] = useState<boolean>(false);

    const authWithSupercoop = async (): Promise<void> => {
        setSignInInProgress(true);
        SupercoopSignIn.getInstance()
            .signIn()
            .then(
                () => {
                    setSignInInProgress(false);
                    goHome();
                },
                reason => {
                    Alert.alert('Erreur', "Une erreur s'est produite lors de la connexion");
                    console.error(reason);
                    setSignInInProgress(false);
                },
            );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, width: '100%', marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <LogoSupercoop height="80%" width="80%" />
            </View>
            <Text style={styles.welcome}>Bienvenue, Supercoopain•e !</Text>
            <Text style={styles.instructions}>
                Pour commencer à utiliser l&apos;application, connectes-toi à ton compte Supercoop grâce au bouton
                ci-dessous. On se retrouve juste après !
            </Text>
            <View style={{ height: 96, flex: 0, alignItems: 'center' }}>
                <SupercoopSignInButton
                    title="Se connecter"
                    onPress={authWithSupercoop}
                    disabled={signInInProgress}
                />
            </View>
            <Text style={styles.version}>{readableVersion()}</Text>
        </SafeAreaView>
    );
}
