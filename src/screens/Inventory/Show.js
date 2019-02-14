import React from 'react'
import {
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
import InventoryFactory from '../../factories/InventoryFactory';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';

export default class InventoryShow extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            inventory: null,
            inventoryEntries: []
        }
    }

    static options(passProps) {
        this.entry = {
            id: 1,
            date: "7 février 2019",
            zone: 1
        }
        var title = this.entry.date;
        var options = defaultScreenOptions(title);
        options.topBar.rightButtons = [
            {
                id: 'reorder',
                text: 'Ordonner'
            }
        ]

        return options;
    }

    componentDidMount() {
        InventoryFactory.sharedInstance().find(this.props.inventoryId).then(inventory => {
            this.setState({
                inventory: inventory
            })
            InventoryEntryFactory
                .sharedInstance()
                .findForInventory(this.state.inventory.id)
                .then(entries => {
                    this.setState({
                        inventoryEntries: entries
                    })
                }
            )
        });
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
                info: `${entry.articleQuantity} ${entry.articleUnit}`
            }
            listDatas.push(data);
        }
        return listDatas;
    }

    render() {
        return (
            <SafeAreaView>
                <View>
                    <Text>Zone: {this.state.inventory ? this.state.inventory.zone : ""}</Text>
                </View>
                <View>
                    <Button
                        onPress={() => {
                            Navigation.showModal({
                                stack: {
                                    children: [{
                                        component: {
                                            name: 'Inventory/Scan',
                                            passProps: {
                                                inventoryId: this.props.inventoryId
                                            },
                                            options: {
                                                topBar: {

                                                }
                                            }
                                        }
                                    }]
                                }
                            });
                        }}
                        title="Scanner"
                    />
                </View>
                <FlatList
                    style={{ height: '100%' }}
                    data={this.computeEntriesData()}
                    renderItem={({ item }) =>
                        <View>
                            <Image style={styles.itemImage} source={item.image} />
                            <View>
                                <Text style={styles.itemName}>{item.title}</Text>
                                <Text style={styles.itemBarcode}>{item.subtitle}</Text>
                            </View>
                            <View>
                                <Text>{item.info}</Text>
                            </View>
                        </View>
                    }
                />
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