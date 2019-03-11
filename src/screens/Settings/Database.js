import React, { Component } from 'react'
import { Alert, FlatList, SafeAreaView, TouchableHighlight, Text, StyleSheet, View } from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation'
import Database from '../../utils/Database';
import materialStyle from '../../styles/material';

export default class ProfileSettings extends React.Component {
    constructor(props) {
        super(props)
    }

    static get options() {
        return defaultScreenOptions("Paramètres");
    }

    resetDatabase() {
        Database.sharedInstance().resetDatabase().then(() => {
            Database.sharedInstance().migrate().then(() => {
                Alert.alert("Base de donnée", "La base de donnée a bien été effacée");
            });
        });
    }

    _onPress = (key) => {
        switch(key) {
            case 'reset-db':
                Alert.alert(
                    "Effacer la base de donnée locale",
                    "Êtes-vous vraiment sûr(e) de vouloir effacer la base de donnée locale ? Aucune récupération possible !",
                    [{
                        text: "NON!"
                    }, {
                        text: "Je suis sûr(e) et certain(e)",
                        style: "destructive",
                        onPress: () => {
                            this.resetDatabase();
                        }
                    }]
                )
                break;
        }
    }

    render() {
        return (
            <SafeAreaView>
                <FlatList
                    ItemSeparatorComponent={({ highlighted }) => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[
                        { title: "Effacer la base de donnée locale", key: "reset-db", color: "red" }
                    ]}
                    renderItem={({ item, separators }) =>
                        <TouchableHighlight
                            onPress={() => this._onPress(item.key)}
                            onShowUnderlay={separators.highlight}
                            onHideUnderlay={separators.unhighlight}>
                            <View style={materialStyle.row}>
                                <View style={materialStyle.rowContent}>
                                    <Text style={[materialStyle.rowTitle, {color: item.color?item.color:"black"}]}>{item.title}</Text>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    }
})