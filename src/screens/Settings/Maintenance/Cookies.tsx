import React, { Component } from 'react'
import { ActivityIndicator, Alert, FlatList, Platform, SafeAreaView, TouchableHighlight, Text, StyleSheet, View } from 'react-native'
import { defaultScreenOptions } from '../../../utils/navigation'
import materialStyle from '../../../styles/material';
import CookieManager from 'react-native-cookies';
import Odoo from '../../../utils/Odoo';
import { Navigation } from 'react-native-navigation';
import { toNumber } from '../../../utils/helpers';

export interface CookiesMaintenanceProps {

}

interface CookiesMaintenanceState {
    cookieItemList: CookiesMaintenanceFlatListItem[];
}

interface CookiesMaintenanceFlatListItem {
    key: number,
    title: string,
    subtitle: string
}

export default class CookiesMaintenance extends React.Component<CookiesMaintenanceProps, CookiesMaintenanceState> {
    cookies: Cookie[] = [];
    state: CookiesMaintenanceState = {
        cookieItemList: []
    }
    constructor(props: CookiesMaintenanceProps) {
        super(props)
        Navigation.events().bindComponent(this);
    }

    static get options() {
        return defaultScreenOptions("Cookies");
    }

    componentDidMount() {
    }

    componentDidAppear() {
        this.fetchAllCookies();
    }

    fetchAllCookies() {
        let cookieItemList: CookiesMaintenanceFlatListItem[] = []
        if (Platform.OS == 'ios') {
            CookieManager.getAll()
                .then(cookies => {
                    console.debug('CookieManager.getAll =>', cookies);
                    this.cookies = cookies;
                    for (let cookieKey in cookies) {
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

    clearAllCookies() {
        CookieManager.clearAll()
            .then((res) => {
                Odoo.getInstance().resetApiAuthDetails();
                Alert.alert("Cookies effacés");
                this.fetchAllCookies();
            });
    }

    didTapCookieItem = (key: number) => {
        console.debug("didTapCookieItem()", key);
        if (this.cookies[key]) {
            const cookie = this.cookies[key];
            const alertBody = `domain: ${(cookie.domain)}
name: ${(cookie.name)}
value: ${(cookie.value)}
path: ${(cookie.path)}`;
            Alert.alert("Détails du cookie", alertBody);
        }
    }

    didTapActionItem = (key: string) => {
        switch (key) {
            case 'clear-cookies':
                Alert.alert(
                    "Effacer les 🍪",
                    "Es-tu vraiment sûr(e) de vouloir effacer les cookies utilisés par l'application ?",
                    [{
                        text: "NON ! 😱"
                    }, {
                        text: "Je suis sûr(e) et certain(e) ! 💣",
                        style: "destructive",
                        onPress: () => {
                            this.clearAllCookies();
                        }
                    }]
                )
                break;
        }
    }

    renderCookieList() {
        console.debug(this.state.cookieItemList);

        return (
            <FlatList
                scrollEnabled={false}
                data={this.state.cookieItemList}
                renderItem={({ item, separators }) =>
                    <TouchableHighlight
                        onPress={() => this.didTapCookieItem(item.key)}
                        onShowUnderlay={separators.highlight}
                        onHideUnderlay={separators.unhighlight}>
                        <View style={materialStyle.row}>
                            <View style={materialStyle.rowContent}>
                                <Text style={materialStyle.rowTitle}>{item.title}</Text>
                                <Text style={materialStyle.rowSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                }
            />

        );
    }

    render() {
        return (
            <SafeAreaView>
                {this.renderCookieList()}
                <FlatList
                    scrollEnabled={false}
                    ItemSeparatorComponent={({ highlighted }) => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[
                        { title: "Effacer les cookies", key: "clear-cookies", color: "red" }
                    ]}
                    renderItem={({ item, separators }) =>
                        <TouchableHighlight
                            onPress={(item: any) => this.didTapActionItem(item.key)}
                            onShowUnderlay={separators.highlight}
                            onHideUnderlay={separators.unhighlight}>
                            <View style={materialStyle.row}>
                                <View style={materialStyle.rowContent}>
                                    <Text style={[materialStyle.rowTitle, { color: item.color ? item.color : "black" }]}>{item.title}</Text>
                                </View>
                            </View>
                        </TouchableHighlight>
                    }
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    separator: {

    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    }
})