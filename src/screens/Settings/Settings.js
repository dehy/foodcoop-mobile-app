import React from 'react'
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import { Avatar } from 'react-native-elements';
import { defaultScreenOptions, goToAuth } from '../../utils/navigation'
import Google from '../../utils/Google';
import { Navigation } from 'react-native-navigation';

export default class Profile extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    static get options() {
        console.log(this.state);
        return defaultScreenOptions("Paramètres");
    }
    _onPress = (key) => {
        switch (key) {
            case 'about':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Settings/About',
                    }
                })
                break;
            case 'database':
                Navigation.push(this.props.componentId, {
                    component: {
                        name: 'Settings/Database'
                    }
                })
                break;
            case 'logout':
                Alert.alert("Déconnexion", "Es-tu sûr de vouloir te déconnecter ?", [
                    {
                        text: 'Annuler',
                        style: 'cancel',
                    },
                    {
                        text: 'Oui', onPress: () => Google.getInstance().signOut().then(() => {
                            goToAuth();
                        })
                    }
                ])
                break;
        }
    }
    render() {
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
                        ItemSeparatorComponent={({ highlighted }) => (
                            <View style={[styles.separator, highlighted && { marginLeft: 0 }]} />
                        )}
                        data={[
                            { title: "À propos", key: "about" },
                            { title: "Base de données locale", key: "database" },
                            { title: "Se déconnecter", key: "logout", color: "red" }
                        ]}
                        renderItem={({ item, separators }) =>
                            <TouchableHighlight
                                onPress={() => this._onPress(item.key)}
                                onShowUnderlay={separators.highlight}
                                onHideUnderlay={separators.unhighlight}>
                                <View style={styles.listItem}>
                                    <Text style={[styles.listItemText, { color: item.color ? item.color : "black" }]}>{item.title}</Text>
                                </View>
                            </TouchableHighlight>
                        }
                    />
                </ScrollView>
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
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 16,
        marginBottom: 16
    },
    avatar: {
        marginRight: 16
    },
    profilePhoto: {
        borderRadius: 64,
        width: 128,
        height: 128,
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