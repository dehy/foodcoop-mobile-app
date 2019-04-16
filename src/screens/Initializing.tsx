import React from 'react'
import {
    View,
    Text,
    StyleSheet,
} from 'react-native'
import Google from '../utils/Google';
import { goHome, goToAuth } from '../utils/navigation';
import Database from '../utils/Database';

export default class Initialising extends React.Component {
    constructor(props: object) {
        super(props);
        this.state = {
            loggedUser: null
        };
    }
    
    componentDidMount() {
        Database.sharedInstance().migrate().then((success) => {
            if (success) {
                this.signInSilently();
            }
        });
    }

    signInSilently(): void {
        Google.getInstance().signInSilently().then(() => {
            goHome();
        }, (reason) => {
            goToAuth();
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>Chargement...</Text>
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