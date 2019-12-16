import React from 'react';
import { Alert, FlatList, SafeAreaView, TouchableHighlight, Text, StyleSheet, View } from 'react-native';
import { defaultScreenOptions } from '../../../utils/navigation';
import Database from '../../../utils/Database';
import materialStyle from '../../../styles/material';
import { Options } from 'react-native-navigation';

const styles = StyleSheet.create({
    separator: {},
});

export default class DatabaseMaintenance extends React.Component<{}, {}> {
    constructor(props: {}) {
        super(props);
    }

    static get options(): Options {
        return defaultScreenOptions('Base de donnée');
    }

    resetDatabase(): void {
        Database.sharedInstance()
            .resetDatabase()
            .then(() => {
                Database.sharedInstance()
                    .migrate()
                    .then(() => {
                        Alert.alert('Base de donnée effacée');
                    });
            });
    }

    _onPress = (key: string): void => {
        switch (key) {
            case 'reset-db':
                Alert.alert(
                    'Effacer la base de donnée locale 💣',
                    'Es-tu vraiment sûr(e) de vouloir effacer la base de donnée locale ? ⚠ Aucune récupération possible !',
                    [
                        {
                            text: '😱 NON !',
                        },
                        {
                            text: 'Je suis sûr(e) et certain(e) !',
                            style: 'destructive',
                            onPress: (): void => {
                                this.resetDatabase();
                            },
                        },
                    ],
                );
                break;
        }
    };

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    ItemSeparatorComponent={({ highlighted }): React.ReactElement => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[{ title: 'Effacer la base de donnée locale', key: 'reset-db', color: 'red' }]}
                    renderItem={({ item, separators }): React.ReactElement => (
                        <TouchableHighlight
                            onPress={(): void => this._onPress(item.key)}
                            onShowUnderlay={separators.highlight}
                            onHideUnderlay={separators.unhighlight}
                        >
                            <View style={materialStyle.row}>
                                <View style={materialStyle.rowContent}>
                                    <Text
                                        style={[materialStyle.rowTitle, { color: item.color ? item.color : 'black' }]}
                                    >
                                        {item.title}
                                    </Text>
                                </View>
                            </View>
                        </TouchableHighlight>
                    )}
                />
            </SafeAreaView>
        );
    }
}
