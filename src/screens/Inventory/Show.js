import React from 'react'
import {
    Button,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
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
import materialStyle from '../../styles/material';
import material from '../../styles/material';
import OdooProduct from '../../entities/OdooProduct';

export default class InventoryShow extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            inventoryEntries: []
        }
    }

    static options(passProps) {
        var options = defaultScreenOptions("Inventaire");

        return options;
    }

    componentDidMount() {
        InventoryEntryFactory
            .sharedInstance()
            .findForInventorySession(this.props.inventory)
            .then(entries => {
                this.setState({
                    inventoryEntries: entries
                })
            })
    }

    computeEntriesData() {
        const listDatas = [];
        for (k in this.state.inventoryEntries) {
            const entry = this.state.inventoryEntries[k];
            const data = {
                key: 'inventory-entry-' + entry.id,
                title: entry.articleName,
                subtitle: entry.articleBarcode,
                image: entry.articleImage ? { uri: entry.articleImage } : null,
                metadata: `${entry.articleQuantity}\n${OdooProduct.quantityUnitAsString(entry.articleUnit)}`
            }
            listDatas.push(data);
        }
        return listDatas;
    }

    openScannerModal() {
        Navigation.showModal({
            stack: {
                children: [{
                    component: {
                        name: 'Inventory/Scan',
                        passProps: {
                            inventory: this.props.inventory
                        },
                        options: {
                            topBar: {

                            }
                        }
                    }
                }]
            }
        });
    }

    openExportModal() {
        Navigation.showModal({
            stack: {
                children: [{
                    component: {
                        name: 'Inventory/Export',
                        passProps: {
                            inventory: this.props.inventory,
                            inventoryEntries: this.state.inventoryEntries
                        },
                        options: {
                            topBar: {

                            }
                        }
                    }
                }]
            }
        });
    }

    render() {
        if (!this.props.inventory) { return null }
        return (
            <SafeAreaView>
                <ScrollView>
                    <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingTop: 16 }}>
                        <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>{this.props.inventory.date.format('dddd')}</Text>
                            <Text style={{ fontSize: 30, textAlign: 'center' }}>{this.props.inventory.date.format('DD MMMM')}</Text>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>{this.props.inventory.date.format('YYYY')}</Text>
                            {/* <Text style={{fontSize: 25, textAlign: 'center'}}>{this.props.inventory.date.format('YYYY')}</Text> */}
                        </View>
                        <View style={{ flexDirection: 'column', flex: 1 }}>
                            <Text style={{ fontSize: 24, textAlign: 'center' }}>Zone</Text>
                            <Text style={{ fontSize: 50, textAlign: 'center' }}>{this.props.inventory.zone}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', paddingVertical: 16 }}>
                        <Icon.Button
                            onPress={() => {
                                this.openScannerModal();
                            }}
                            name="barcode"
                        >Scanner</Icon.Button>
                        <Icon.Button
                            onPress={() => {
                                this.openExportModal();
                            }}
                            name="file-export"
                            title="Exporter"
                        >Envoyer</Icon.Button>
                    </View>
                    {this.state.inventoryEntries.length > 0 ? (
                        <FlatList
                            scrollEnabled={false}
                            style={{ backgroundColor: 'white' }}
                            data={this.computeEntriesData()}
                            renderItem={({ item }) =>
                                <View style={materialStyle.row}>
                                    <View style={materialStyle.rowContent}>
                                        <Text style={materialStyle.rowTitle}>{item.title}</Text>
                                        <Text style={materialStyle.rowSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <Text>{item.metadata}</Text>
                                </View>
                            }
                        />
                    ) : (
                        <View>
                            <Text style={{ fontSize: 25, textAlign: 'center', marginTop: 30}}>Aucun article pour le moment !</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    itemImage: {
        width: 40,
        height: 40,
    },
    itemName: {
        fontWeight: 'bold'
    },
    itemBarcode: {

    }
});