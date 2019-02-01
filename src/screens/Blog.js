import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

class Blog extends Component {
    static get options() {
        return {
            topBar: {
                title: {
                    text: 'Blog'
                },
            }
        };
    }
    render() {
      return (
        <WebView
          source={{ uri: "https://supercoop.fr/blog/" }}
          style={{ marginTop: 20 }}
          onLoadProgress={e => console.log(e.nativeEvent.progress)}
        />
      );
    }
  }