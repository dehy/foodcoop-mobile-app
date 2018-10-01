import React from 'react'
import {
    View,
    Text,
    Button,
    StyleSheet
} from 'react-native'

export default class Menu extends React.Component {
    render() {
        return (
            <View style={styles.container}>
                <Text>Username</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    }
})