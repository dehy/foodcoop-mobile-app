import React from 'react';
import { Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, ListItem } from 'react-native-elements';
import { goToAuth } from '../utils/navigation';
import Google from '../utils/Google';
import { Navigation } from 'react-native-navigation';

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
                        onPress: (): Promise<void> =>
                            Google.getInstance()
                                .signOut()
                                .then(() => {
                                    goToAuth();
                                }),
                    },
                ]);
                break;
        }
    };
    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <ScrollView style={{ height: '100%' }}>
                    <View style={styles.profile}>
                        <Avatar
                            rounded
                            size="large"
                            source={{
                                uri: Google.getInstance().getUserPhoto(),
                            }}
                            containerStyle={styles.avatar}
                        />
                        <View>
                            <Text style={styles.profileName}>{Google.getInstance().getUsername()}</Text>
                            <Text>{Google.getInstance().getEmail()}</Text>
                        </View>
                    </View>
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
                            <ListItem
                                onPress={(): void => this._onPress(item.key)}
                                title={item.title}
                                titleStyle={{ color: item.color ?? 'black' }}
                                topDivider
                                chevron={item.chevron ?? true}
                            />
                        )}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}
