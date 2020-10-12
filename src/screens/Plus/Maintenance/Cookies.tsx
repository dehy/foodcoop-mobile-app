import React from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { defaultScreenOptions } from '../../../utils/navigation';
import CookieManager from 'react-native-cookies';
import Odoo from '../../../utils/Odoo';
import { Navigation, Options } from 'react-native-navigation';
import { ListItem } from 'react-native-elements';

interface CookiesMaintenanceState {
    cookieItemList: CookiesMaintenanceFlatListItem[];
}

interface CookiesMaintenanceFlatListItem {
    key: string;
    title: string;
    subtitle: string;
}

const styles = StyleSheet.create({
    separator: {},
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default class CookiesMaintenance extends React.Component<{}, CookiesMaintenanceState> {
    cookies: Cookie[] = [];
    state: CookiesMaintenanceState = {
        cookieItemList: [],
    };
    constructor(props: {}) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static get options(): Options {
        return defaultScreenOptions('Cookies');
    }

    componentDidAppear(): void {
        this.fetchAllCookies();
    }

    fetchAllCookies(): void {
        const cookieItemList: CookiesMaintenanceFlatListItem[] = [];
        if (Platform.OS == 'ios') {
            CookieManager.getAll().then(cookies => {
                // console.debug('CookieManager.getAll =>', cookies);
                this.cookies = cookies;
                for (const cookieKey in cookies) {
                    const cookie = cookies[cookieKey];
                    cookieItemList.push({
                        key: cookieKey,
                        title: cookie.name,
                        subtitle: cookie.domain,
                    });
                }
                this.setState({ cookieItemList: cookieItemList });
            });
        }
        if (Platform.OS == 'android') {
            // TODO
        }
    }

    clearAllCookies(): void {
        CookieManager.clearAll().then((): void => {
            Odoo.getInstance().resetApiAuthDetails();
            Alert.alert('Cookies effacés');
            this.fetchAllCookies();
        });
    }

    didTapCookieItem = (key: string): void => {
        // console.debug('didTapCookieItem()', key);
        const cookie = this.cookies.find(cookie => {
            if (key === cookie.name) {
                return true;
            }
            return false;
        });
        if (undefined === cookie) {
            console.error(`Unknown cookie named ${key} tapped`);
            return;
        }
        const alertBody = `domain: ${cookie.domain}
name: ${cookie.name}
value: ${cookie.value}
path: ${cookie.path}`;
        Alert.alert('Détails du cookie', alertBody);
    };

    didTapActionItem = (key: string): void => {
        switch (key) {
            case 'clear-cookies':
                Alert.alert(
                    'Effacer les 🍪',
                    "Es-tu vraiment sûr(e) de vouloir effacer les cookies utilisés par l'application ?",
                    [
                        {
                            text: 'NON ! 😱',
                        },
                        {
                            text: 'Je suis sûr(e) et certain(e) ! 💣',
                            style: 'destructive',
                            onPress: (): void => {
                                this.clearAllCookies();
                            },
                        },
                    ],
                );
                break;
        }
    };

    renderCookieList(): React.ReactElement {
        console.debug(this.state.cookieItemList);

        return (
            <FlatList
                scrollEnabled={false}
                data={this.state.cookieItemList}
                keyExtractor={(item): string => {
                    return item.title;
                }}
                renderItem={({ item }): React.ReactElement => (
                    <ListItem onPress={(): void => this.didTapCookieItem(item.key)} bottomDivider>
                        <ListItem.Content>
                            <ListItem.Title>{item.title}</ListItem.Title>
                        </ListItem.Content>
                        <ListItem.Content right>
                            <ListItem.Title right>{item.subtitle}</ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
            />
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                {this.renderCookieList()}
                <FlatList
                    scrollEnabled={false}
                    ItemSeparatorComponent={({ highlighted }): React.ReactElement => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[{ title: 'Effacer les cookies', key: 'clear-cookies', color: 'red' }]}
                    renderItem={({ item }): React.ReactElement => (
                        <ListItem onPress={(): void => this.didTapActionItem(item.key)}>
                            <ListItem.Content>
                                <ListItem.Title style={{ color: item.color ?? 'black' }}>{item.title}</ListItem.Title>
                            </ListItem.Content>
                        </ListItem>
                    )}
                />
            </SafeAreaView>
        );
    }
}
