import React from 'react'
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/FontAwesome5';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';
import CSVGenerator from '../../utils/CSVGenerator';
import Google from '../../utils/Google';
import moment from 'moment';

export default class InventoryShow extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);

        console.log(props);

        this.csvGenerator = new CSVGenerator();
        this.generatedCSV = null;

        this.state = {
            inventoryCheckPassed: null
        }
    }

    static options(passProps) {
        var options = defaultScreenOptions("Envoi d'inventaire");

        return options;
    }

    componentDidMount() {
        this.checkInventory();
    }

    checkInventory() {
        this.csvGenerator.exportInventorySession(this.props.inventory).then((csv) => {
            this.setState({
                inventoryCheckPassed: true
            })
            this.generatedCSV = csv;
        })
    }

    sendInventory() {
        const userFirstname = Google.getInstance().getFirstname();
        const zone = this.props.inventory.zone;
        const date = this.props.inventory.lastModifiedAt.format("DD/MM/YYYY");
        const time = this.props.inventory.lastModifiedAt.format("HH:mm:ss");

        const inventoryEntries = InventoryEntryFactory.sharedInstance().findForInventorySession(this.props.inventory);
        const entriesCount = inventoryEntries.length;

        const subject = `[Zone ${zone}][${date}] Résultat d'inventaire`;
        const body = `Inventaire fait par ${userFirstname}, zone ${zone}, le ${date} à ${time}
${entriesCount} produits scannés`;

        const csvFilenameDateTime = this.props.inventory.lastModifiedAt.format("YYYYMMDDHHmmss");
        const csvFilename = `${csvFilenameDateTime}-Zone${zone}_${userFirstname}.csv`

        Google.getInstance().sendInventoryEmail(subject, body, csvFilename, this.generatedCSV).then(() => {
            InventorySessionFactory.sharedInstance().updateLastSentAt(this.props.inventory, moment());
            Alert.alert("Envoyé", "Le message est parti sur les Internets Mondialisés");
        });
    }

    render() {
        let inventoryCheck = null;
        if (this.state.inventoryCheckPassed == null) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator
                                size="small"
                                color="#999999"
                                style={{paddingTop: 4, marginRight: 4}}
                            />
                    <Text>Création en cours</Text>
                </View>
            )
        }
        if (this.state.inventoryCheckPassed == true) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon name="check" color='green' style={{paddingTop: 3, marginRight: 4}}/>
                    <Text style={{color: 'green'}}>Prêt pour l'envoi</Text>
                </View>
            )
        }
        if (this.state.inventoryCheckPassed == false) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon name="times" color='red'  style={{paddingTop: 3, marginRight: 4}}/>
                    <Text style={{color: 'red'}}>Erreur !</Text>
                </View>
            )
        }

        return (
            <SafeAreaView style={{backgroundColor: 'white', padding: 16}}>
                <View>
                    <Text>
                        Tu es sur le point d'envoyer ton inventaire du {this.props.inventory.date.format("dddd DD MMMM YYYY")}, zone {this.props.inventory.zone}.
                        Il contient {this.props.inventoryEntries.length} article{this.props.inventoryEntries.length > 1 ? 's': ''}.
                    </Text>
                    <View style={{flexDirection: 'row'}}>
                        <Text>État : </Text>
                        {inventoryCheck}
                        
                    </View>
                    <Text>En tapant sur le bouton ci-dessous, il sera envoyé à l'équipe inventaire :</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'center', margin: 16}}>
                        <Icon.Button
                            name="clipboard-list"
                            onPress={() => {
                                this.sendInventory();
                            }}
                        >Envoyer mon inventaire</Icon.Button>
                    </View>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row'
    }
});