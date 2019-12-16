import React from 'react';
import { Alert, FlatList, Platform, SafeAreaView, TouchableHighlight, Text, StyleSheet, View } from 'react-native';
import { defaultScreenOptions } from '../../../utils/navigation';
import materialStyle from '../../../styles/material';
import CookieManager from 'react-native-cookies';
import Odoo from '../../../utils/Odoo';
import { Navigation, Options } from 'react-native-navigation';
import { toNumber } from '../../../utils/helpers';

interface CookiesMaintenanceState {
    cookieItemList: CookiesMaintenanceFlatListItem[];
}

interface CookiesMaintenanceFlatListItem {
    key: number;
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
                console.debug('CookieManager.getAll =>', cookies);
                this.cookies = cookies;
                for (const cookieKey in cookies) {
                    const cookie = cookies[cookieKey];
                    cookieItemList.push({ key: toNumber(cookieKey), title: cookie.name, subtitle: cookie.domain });
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

    didTapCookieItem = (key: number): void => {
        console.debug('didTapCookieItem()', key);
        if (this.cookies[key]) {
            const cookie = this.cookies[key];
            const alertBody = `domain: ${cookie.domain}
name: ${cookie.name}
value: ${cookie.value}
path: ${cookie.path}`;
            Alert.alert('Détails du cookie', alertBody);
        }
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
                renderItem={({ item, separators }): React.ReactElement => (
                    <TouchableHighlight
                        onPress={(): void => this.didTapCookieItem(item.key)}
                        onShowUnderlay={separators.highlight}
                        onHideUnderlay={separators.unhighlight}
                    >
                        <View style={materialStyle.row}>
                            <View style={materialStyle.rowContent}>
                                <Text style={materialStyle.rowTitle}>{item.title}</Text>
                                <Text style={materialStyle.rowSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
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
                    renderItem={({ item, separators }): React.ReactElement => (
                        <TouchableHighlight
                            onPress={(): void => this.didTapActionItem(item.key)}
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
