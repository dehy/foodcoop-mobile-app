import React from 'react';
import {
    View,
    Text,
    Button,
    FlatList,
    SafeAreaView,
    StyleSheet,
    AsyncStorage
} from 'react-native';
import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { USER_KEY } from '../config';
import { GoogleSignin } from 'react-native-google-signin';
import { goToAuth, goToScreen } from '../utils/navigation';

export default class Menu extends React.Component {
    googleSignOut = async () => {
        try {
            // await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            await AsyncStorage.removeItem(USER_KEY);
            goToAuth();
        } catch (error) {
            console.error(error);
        }
    };
    render() {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={[styles.item, styles.profile]}>Prénom</Text>
                <View>
                    <FlatList
                        data={[
                            {icon: "newspaper", key: "Actualité", pushTo: "News"},
                            {icon: "search", key: "Inventaire", pushTo: "Inventory"}
                        ]}
                        renderItem={({item}) => 
                            <Icon.Button
                                backgroundColor="#FFFFFF"
                                color="#000000"
                                borderRadio="0"
                                name={item.icon}
                                onPress={() => {
                                    goToScreen(item.pushTo);
                                }}
                            >
                                {item.key}
                            </Icon.Button>}
                    />
                </View>
                <View style={styles.spaceItem}></View>
                <Icon.Button
                    name="sign-out-alt"
                    backgroundColor="#FFFFFF"
                    color="#000000"
                    borderRadio="0"
                    buttonStyle={[styles.item, styles.disconnectItem]}
                    containerStyle={{ padding: 10 }}
                    onPress={this.googleSignOut}
                >
                    Se déconnecter
                </Icon.Button>
            </SafeAreaView>
        );
    }

    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        width: "75%"
    },
    profile: {
        marginTop: 20,
        height: 66,
        backgroundColor: "#FF0000",
    },
    item: {
        height: 44,
        padding: 10,
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "left",
        textAlignVertical: "center"
    },
    disconnectItem: {
        backgroundColor: "#FF0000"
    },
    spaceItem: {
        flexGrow: 1
    }
});