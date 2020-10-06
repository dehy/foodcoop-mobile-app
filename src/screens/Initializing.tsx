import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { goHome, goToAuth } from '../utils/navigation';
import Database from '../utils/Database';
import Odoo from '../utils/Odoo';
import SupercoopSignIn from '../utils/SupercoopSignIn';

export interface InitialisingProps {
    componentId: string;
}

const styles = StyleSheet.create({
    welcome: {
        fontSize: 28,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default class Initialising extends React.Component<InitialisingProps> {
    constructor(props: InitialisingProps) {
        super(props);
        this.state = {
            loggedUser: null,
        };
    }

    componentDidMount(): void {
        Database.sharedInstance()
            .migrate()
            .then(success => {
                if (success) {
                    Odoo.getInstance()
                        .fetchBarcodeNomenclature()
                        .then(() => {
                            this.signInSilently();
                        });
                }
            });
    }

    signInSilently(): void {
        SupercoopSignIn.getInstance()
            .signInSilently()
            .then(
                () => {
                    console.debug('Previously Authenticated.');
                    goHome();
                },
                () => {
                    console.debug('Going to authentication screen.');
                    goToAuth();
                },
            );
    }

    render(): React.ReactNode {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>Chargement...</Text>
            </View>
        );
    }
}
