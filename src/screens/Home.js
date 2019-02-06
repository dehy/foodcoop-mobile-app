import React from 'react'
import {
    View,
    Text,
    Button,
    SafeAreaView,
    StyleSheet,
    AsyncStorage,
    Alert
} from 'react-native'
import { defaultScreenOptions } from '../utils/navigation'
import { Navigation } from 'react-native-navigation';
import Drawer from '../utils/Drawer';

import { USER_KEY } from '../config'

import Odoo from '../utils/Odoo.js';

const odoo = new Odoo({
    host: 'labo.test.supercoop.fr',
    port: 443,
    protocol: 'https',
    database: 'PROD',
    username: 'fjg@supercoop.fr',
    password: ''
});

export default class Home extends React.Component {
    static get options() {
        console.log("options()");
        return defaultScreenOptions("Home");
    }
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    navigationButtonPressed({ buttonId }) {
        console.log(buttonId);
        if (buttonId == 'leftDrawerButton') {
            Drawer.open('left')
        }
    }
    callToOdoo() {
        odoo.connect()
            .then(response => {
                console.log(response);
                var params = {
                    // ids: [1, 2, 3, 4, 5],
                    // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
                    domain: [['active', '=', true], ['name', 'like', 'Café Michel Mexique%']],
                    fields: ['name', 'barcode', 'image', 'qty_available', 'lst_price', 'uom_id',  'standard_price', 'uom_po_id'],
                    // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
                    order: 'name DESC',
                    limit: 50,
                    offset: 0,
                }; //params
                context = null;
                odoo.search_read('product.product', params, context)
                    .then(response => {
                        console.log(response);
                    })
            })
            /* TODO :
            - demander numéro de Zone
            - récupérer le prénom de l'utilisateur
            - controler que barcode = 13 caractères
            - charger toute la bdd des produits au début pour faire du offline
            - CSV en sortie :
                nom: zone{zone}_{givenName}.csv
                colonnes :
                - Nb (quantité)
                - Code (barcode)
            - envoyer mail via API gmail à utilisateur + 2 adresse fjg@supercoop.fr + andre.lacote@supercoop.fr
            */
            .catch(e => {
                console.log(e);
            })
        ;
    }
    render() {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Hello from Home screen.</Text>
                <Button
                    onPress={() => {
                        Navigation.push(this.props.componentId, {
                            component: {
                                name: 'Screen2',
                            }
                        });
                    }}
                    title="View next screen"
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
    }
})