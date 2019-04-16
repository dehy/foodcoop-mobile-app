import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { defaultScreenOptions } from "../utils/navigation";

export default class News extends React.Component<any, any> {
    static get options() {
        return defaultScreenOptions("News");
    }

    render() {
        // if (__DEV__) {
        //     return <View></View>;
        // }
        return (
            <WebView
              source={{ uri: "https://supercoop.fr/blog/" }}
              style={{ marginTop: 0 }}
              onLoadProgress={e => console.debug(e.progress)}
            />
        );
    }
}