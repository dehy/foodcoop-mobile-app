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
        var options = defaultScreenOptions("Nouvel inventaire");
        options.topBar.rightButtons = [
            {
                id: 'cancel',
                text: 'Fermer'
            }
        ];
        // options.topBar.rightButtons = [
        //     {
        //         id: 'save',
        //         text: 'Enregistrer'
        //     }
        // ];

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
                <Text>TODO Fomulaire</Text>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({

});