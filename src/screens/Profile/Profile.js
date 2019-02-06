import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableHighlight,
    Image,
    Alert
} from 'react-native'
import { defaultScreenOptions, goToAuth } from '../../utils/navigation'
import Google from '../../utils/Google';
import { Navigation } from 'react-native-navigation';

export default class Profile extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            loggedUser: null
        }
    }
    static get options() {
        console.log(this.state);
        return defaultScreenOptions("Profil");
    }
    _onPress = (key) => {
        switch(key) {
            case 'about':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Profile/About',
                    }
                })
                break;
            case 'logout':
                Alert.alert("Déconnexion", "Es-tu sûr de vouloir te déconnecter ?", [
                    {
                        text: 'Annuler',
                        style: 'cancel',
                      },
                    {text: 'Oui', onPress: () => Google.getInstance().signOut(goToAuth)}
                ])
                break;
        }
    }
    render() {
        return (
            <SafeAreaView>
                <View style={styles.profile}>
                    <Image
                        style={styles.profilePhoto}
                        source={{uri: Google.getInstance().getUserPhoto() }}
                    />
                    <Text style={styles.profileName}>{ Google.getInstance().getUsername() }</Text>
                </View>
                <FlatList
                    ItemSeparatorComponent={({ highlighted }) => (
                        <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                    )}
                    data={[
                        { title: "À propos", key: "about" },
                        { title: "Se déconnecter", key: "logout", color: "red" }
                    ]}
                    renderItem={({ item, separators }) =>
                        <TouchableHighlight
                            onPress={() => this._onPress(item.key)}
                            onShowUnderlay={separators.highlight}
                            onHideUnderlay={separators.unhighlight}>
                            <View style={styles.listItem}>
                                <Text style={[styles.listItemText, {color: item.color?item.color:"black"}]}>{item.title}</Text>
                            </View>
                        </TouchableHighlight>
                    }
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    profile: {
        textAlign: 'center',
        marginBottom: 24
    },
    profilePhoto: {
        borderRadius: 90,
        width: 180,
        height: 180,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 12,
        marginBottom: 12
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    listItem: {
        backgroundColor: 'white',
        height: 44,
        padding: 10,
        textAlignVertical: 'center',
    },
    listItemText: {
        fontSize: 17
    },
    separator: {
        backgroundColor: '#000000'
    }
})