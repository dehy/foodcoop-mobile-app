import React from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Icon, ListItem } from 'react-native-elements';
import { goToAuth } from '../utils/navigation';
import { Navigation } from 'react-native-navigation';
import SupercoopSignIn from '../utils/SupercoopSignIn';

export interface PlusProps {
    componentId: string;
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

export default class Plus extends React.Component<PlusProps> {
    constructor(props: PlusProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    _onPress = (key: string): void => {
        switch (key) {
            case 'about':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Plus/About',
                    },
                });
                break;
            case 'maintenance':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Plus/Maintenance',
                    },
                });
                break;
            case 'logout':
                Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
                    {
                        text: 'Annuler',
                        style: 'cancel',
                    },
                    {
                        text: 'Oui',
                        onPress: async (): Promise<void> => {
                            await SupercoopSignIn.getInstance().signOut();
                            goToAuth();
                        },
                    },
                ]);
                break;
        }
    };

    renderHeader = (): React.ReactElement => {
        const initialsMatch =
            SupercoopSignIn.getInstance()
                .getName()
                .match(/\b\w/g) || [];
        const initials: string = ((initialsMatch.shift() || '') + (initialsMatch.pop() || '')).toUpperCase();

        return (
            <View style={styles.profile}>
                <Avatar rounded size="large" title={initials} containerStyle={styles.avatar} />
                <View>
                    <Text style={styles.profileName}>{SupercoopSignIn.getInstance().getName()}</Text>
                    <Text>{SupercoopSignIn.getInstance().getEmail()}</Text>
                </View>
            </View>
        );
    };

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    scrollEnabled={false}
                    ItemSeparatorComponent={({ highlighted }): React.ReactElement => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[
                        { title: 'À propos', key: 'about' },
                        { title: 'Maintenance', key: 'maintenance' },
                        { title: 'Se déconnecter', key: 'logout', color: 'red', chevron: false },
                    ]}
                    renderItem={({ item }): React.ReactElement => (
                        <ListItem onPress={(): void => this._onPress(item.key)} topDivider>
                            <ListItem.Content>
                                <ListItem.Title style={{ color: item.color ?? 'black' }}>{item.title}</ListItem.Title>
                            </ListItem.Content>
                            {false === item.chevron ? null : (
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            )}
                        </ListItem>
                    )}
                    ListHeaderComponent={this.renderHeader}
                />
            </SafeAreaView>
        );
    }
}
