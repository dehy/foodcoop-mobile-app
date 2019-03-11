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
import bootstrapStyle from '../../styles/bootstrap';
import OdooProduct from '../../entities/OdooProduct';

export default class InventoryShow extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            inventorySession: null,
            inventoryEntries: []
        }
    }

    static options(passProps) {
        var options = defaultScreenOptions("Inventaire");

        return options;
    }

    componentDidAppear() {
        this.loadInventorySession();
    }

    loadInventorySession() {
        InventorySessionFactory
            .sharedInstance()
            .find(this.props.inventorySessionId)
            .then(inventorySession => {
                this.setState({
                    inventorySession: inventorySession
                });
                this.loadInventoryEntries();
            })
    }

    loadInventoryEntries() {
        InventoryEntryFactory
            .sharedInstance()
            .findForInventorySession(this.state.inventorySession)
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
            console.debug(entry.lastModifiedAt);
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
                        name: 'Scanner',
                        passProps: {
                            inventory: this.state.inventorySession
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
                            inventory: this.state.inventorySession,
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
        if (!this.state.inventorySession) { return null; }
        const inventory = this.state.inventorySession;
        let lastSentAtInfo, wasModifiedWarning;
        // console.error(inventory.lastSentAt);

        if (inventory.lastSentAt != null) {
            lastSentAtInfo = <View style={bootstrapStyle.infoView}>
                <Text style={bootstrapStyle.infoText}>
                    Inventaire déjà envoyé le {inventory.lastSentAt.format("DD/MM/YYYY")} à {inventory.lastSentAt.format("HH[h]mm")}
                </Text>
            </View>
        }
        if (inventory.lastSentAt && inventory.lastModifiedAt && (inventory.lastSentAt.unix() < inventory.lastModifiedAt.unix())) {
            wasModifiedWarning = <View style={bootstrapStyle.warningView}>
                <Text style={bootstrapStyle.warningText}>
                    Inventaire modifié depuis le dernier envoi !
                </Text>
            </View>
        }
        return (
            <SafeAreaView>
                <ScrollView>
                    {lastSentAtInfo}
                    {wasModifiedWarning}
                    <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingTop: 16 }}>
                        <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>{inventory.date.format('dddd')}</Text>
                            <Text style={{ fontSize: 30, textAlign: 'center' }}>{inventory.date.format('DD MMMM')}</Text>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>{inventory.date.format('YYYY')}</Text>
                        </View>
                        <View style={{ flexDirection: 'column', flex: 1 }}>
                            <Text style={{ fontSize: 24, textAlign: 'center' }}>Zone</Text>
                            <Text style={{ fontSize: 50, textAlign: 'center' }}>{inventory.zone}</Text>
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
                                    <Text style={{ textAlign: 'right' }}>{item.metadata}</Text>
                                </View>
                            }
                        />
                    ) : (
                            <View>
                                <Text style={{ fontSize: 25, textAlign: 'center', marginTop: 30 }}>Aucun article pour le moment !</Text>
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