import React from 'react'
import {
    View,
    Text,
    StyleSheet,
} from 'react-native'
import Google from '../utils/Google';
import { goHome, goToAuth } from '../utils/navigation';

export default class Initialising extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedUser: null
        };
    }
    async componentDidMount() {
        Google.getInstance().signInSilently(goHome, goToAuth);
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