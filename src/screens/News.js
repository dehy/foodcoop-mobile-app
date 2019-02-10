import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { defaultScreenOptions } from "../utils/navigation";

export default class News extends React.Component {
    static get options() {
        return defaultScreenOptions("Agenda");
    }

    render() {
        return (
            <View></View>
            // <WebView
            //   source={{ uri: "https://supercoop.fr/evenements/" }}
            //   style={{ marginTop: 0 }}
            //   onLoadProgress={e => console.log(e.nativeEvent.progress)}
            // />
        );
    }
}