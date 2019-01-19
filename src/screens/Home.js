import React from 'react'
import {
    View,
    Text,
    Button,
    SafeAreaView,
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
                        id: 'leftDrawerButton',
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
        if (buttonId == 'leftDrawerButton') {
            Drawer.open('left')
        }
    }
    render() {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Hello from Home screen.</Text>
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
            </SafeAreaView>
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