import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    AsyncStorage
} from 'react-native'
import { goToAuth, goHome } from '../utils/navigation'
import { USER_KEY } from '../config'

export default class Initialising extends React.Component {
    async componentDidMount() {
        try {
            const user = await AsyncStorage.getItem(USER_KEY, function (err, value) {
                JSON.parse(value)
            });
            console.log('user: ', user);
            if (user) {
                goHome();
            } else {
                goToAuth();
            }
        } catch (err) {
            console.log('error: ', err);
            goToAuth();
        }
    }

    getCurrentUserInfo = async () => {
        try {
            const userInfo = await GoogleSignin.signInSilently();
            this.setState({ userInfo });
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