import React, { Component } from 'react'
import { SafeAreaView, Text, StyleSheet } from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation'

export default class ProfileAbout extends React.Component {
    constructor(props) {
        super(props)
    }

    static get options() {
        return defaultScreenOptions("À propos");
    }

    render() {
        return (
            <SafeAreaView>
                <Text style={styles.title}>Supercoop</Text>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    }
})