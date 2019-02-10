import React from 'react'
import {
    View,
    Text,
    Button,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList
} from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation } from 'react-native-navigation';

export default class InventoryNew extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(passProps) {
        var options = defaultScreenOptions("Nouveau");
        options.topBar.leftButtons = [
            {
                id: 'cancel',
                text: 'Annuler'
            }
        ];
        options.topBar.rightButtons = [
            {
                id: 'save',
                text: 'Enregistrer'
            }
        ];

        return options;
    }

    navigationButtonPressed({ buttonId }) {
        // will be called when "buttonOne" is clicked
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
        if (buttonId === 'save') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    saveAndPop() {
        // TODO: save form
        Navigation.pop(this.props.componentId);
    }

    render() {
        return (
            <SafeAreaView>
                <Text>Fomulaire</Text>
            </SafeAreaView>
        )
    }

    takePicture = async function () {
        if (this.camera) {
            const options = { quality: 0.5, base64: true };
            const data = await this.camera.takePictureAsync(options);
            console.log(data.uri);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    capture: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 15,
        paddingHorizontal: 20,
        alignSelf: 'center',
        margin: 20,
    },
});