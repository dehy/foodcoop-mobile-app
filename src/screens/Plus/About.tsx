import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import DeviceInfo from 'react-native-device-info';
import { Options } from 'react-native-navigation';
import { ListItem } from 'react-native-elements';

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
});

export default class ProfileAbout extends React.Component<{}, {}> {
    constructor(props: {}) {
        super(props);
    }

    static get options(): Options {
        return defaultScreenOptions('À propos');
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <Text style={[styles.title, { marginTop: 16 }]}>{DeviceInfo.getApplicationName()}</Text>
                <ListItem title="Système" rightTitle={DeviceInfo.getSystemName()} topDivider />
                <ListItem title="Version" rightTitle={DeviceInfo.getVersion()} topDivider />
                <ListItem title="Build" rightTitle={DeviceInfo.getBuildNumber()} topDivider />
            </SafeAreaView>
        );
    }
}