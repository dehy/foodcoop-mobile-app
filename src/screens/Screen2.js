import React from 'react'
import {
    View,
    Text,
    Button,
    StyleSheet,
} from 'react-native'
import { Navigation } from 'react-native-navigation';
import { defaultScreenOptions } from '../utils/navigation';

export default class Screen2 extends React.Component {
    static get options() {
        return defaultScreenOptions("Screen #2");
    }
    render() {
        return (
            <View style={styles.container}>
                <Text>Screen 2</Text>
                <Button
                    onPress={() => Navigation.pop(this.props.componentId)}
                    title="Go Back"
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