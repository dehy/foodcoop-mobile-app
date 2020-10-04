import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { readableVersion, systemName, deviceId, systemVersion, brand } from '../../utils/helpers';
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
                <ListItem title="Marque" rightTitle={brand} topDivider />
                <ListItem title="Modèle" rightTitle={deviceId} topDivider />
                <ListItem title="Système" rightTitle={systemName} topDivider />
                <ListItem title="Version Système" rightTitle={systemVersion} topDivider />
                <ListItem title="Version App" rightTitle={readableVersion()} topDivider />
            </SafeAreaView>
        );
    }
}
