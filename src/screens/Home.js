import React from 'react'
import {
    View,
    Text,
    Button,
    StyleSheet,
    AsyncStorage,
    Alert
} from 'react-native'
import { goToAuth } from '../utils/navigation'
import { Navigation } from 'react-native-navigation';
import Drawer from '../utils/Drawer';

import { USER_KEY } from '../config'

export default class Home extends React.Component {
    static get options() {
        return {
            topBar: {
                title: {
                    text: 'Home',
                    fontSize: 20,
                },
                leftButtons: [
                    {
                        id: 'leftDrawer',
                        icon: require('../../assets/icons/menu.png')
                    }
                ]
            }
        };
    }
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    navigationButtonPressed({ buttonId }) {
        if (buttonId == 'leftDrawer') {
            Drawer.open('left')
        }
    }
    logout = async () => {
        try {
            await AsyncStorage.removeItem(USER_KEY)
            goToAuth()
        } catch (err) {
            console.log('error signing out...: ', err)
        }
    }
    render() {
        return (
            <View style={styles.container}>
                <Text>Hello from Home screen.</Text>
                <Button
                    onPress={this.logout}
                    title="Sign Out"
                />
                <Button
                    onPress={() => {
                        Navigation.push(this.props.componentId, {
                            component: {
                                name: 'Screen2',
                            }
                        });
                    }}
                    title="View next screen"
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})