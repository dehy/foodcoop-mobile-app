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
                <ListItem topDivider>
                    <ListItem.Content>
                        <ListItem.Title>Marque</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Title right>{brand}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
                <ListItem topDivider>
                    <ListItem.Content>
                        <ListItem.Title>Modèle</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Title right>{deviceId}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
                <ListItem topDivider>
                    <ListItem.Content>
                        <ListItem.Title>Système</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Title right>{systemName}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
                <ListItem topDivider>
                    <ListItem.Content>
                        <ListItem.Title>Version Système</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Title right>{systemVersion}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
                <ListItem topDivider>
                    <ListItem.Content>
                        <ListItem.Title>Version App</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Title right>{readableVersion()}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
            </SafeAreaView>
        );
    }
}
