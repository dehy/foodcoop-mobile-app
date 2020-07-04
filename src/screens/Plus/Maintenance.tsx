import React from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import materialStyle from '../../styles/material';
import { ListItem } from 'react-native-elements';

export interface MaintenanceProps {
    componentId: string;
}

interface MaintenanceFlatListItem {
    key: string;
    title: string;
    color?: string;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profile: {
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 16,
        marginBottom: 16,
    },
    avatar: {
        marginRight: 16,
    },
    profilePhoto: {
        borderRadius: 64,
        width: 128,
        height: 128,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 12,
        marginBottom: 12,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    listItem: {
        backgroundColor: 'white',
        height: 44,
        padding: 10,
        textAlignVertical: 'center',
    },
    listItemText: {
        fontSize: 17,
    },
    separator: {
        backgroundColor: '#000000',
    },
});

export default class Maintenance extends React.Component<MaintenanceProps, {}> {
    private flatListItems: MaintenanceFlatListItem[] = [
        { title: 'Base de donnée locale', key: 'database' },
        { title: 'Cookies', key: 'cookies' },
    ];
    constructor(props: MaintenanceProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    static get options(): Options {
        return defaultScreenOptions('Maintenance');
    }
    _onPress = (key: string): void => {
        switch (key) {
            case 'database':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Plus/Maintenance/Database',
                    },
                });
                break;
            case 'cookies':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Plus/Maintenance/Cookies',
                    },
                });
                break;
        }
    };
    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    style={{ height: '100%' }}
                    ItemSeparatorComponent={({ highlighted }): React.ReactElement => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={this.flatListItems}
                    renderItem={({ item }): React.ReactElement => (
                        <ListItem
                            onPress={(): void => this._onPress(item.key)}
                            title={item.title}
                            bottomDivider
                            chevron
                        />
                    )}
                />
            </SafeAreaView>
        );
    }
}
