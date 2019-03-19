import React, { Component } from 'react'
import { SafeAreaView, Text, StyleSheet } from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation'
import DeviceInfo from 'react-native-device-info';

export default class ProfileAbout extends React.Component {
    constructor(props) {
        super(props)
    }

    static get options() {
        return defaultScreenOptions("À propos");
    }

    render() {
        return (
            <SafeAreaView style={{margin: 16}}>
                <Text style={styles.title}>{(DeviceInfo.getApplicationName())}</Text>
                <Text>Système : {(DeviceInfo.getSystemName())}</Text>
                <Text>Version: {(DeviceInfo.getVersion())}</Text>
                <Text>Build: {(DeviceInfo.getBuildNumber())}</Text>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16
    }
})