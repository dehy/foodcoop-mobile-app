import React from 'react'
import {
    View,
    Text,
    Button,
    TouchableHighlight,
    SafeAreaView,
    FlatList
} from 'react-native'
import EStyleSheet from 'react-native-extended-stylesheet';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation } from 'react-native-navigation';
import InventoryFactory from '../../factories/InventoryFactory';

export default class InventoryList extends React.Component {
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            inventoriesData: []
        }
    }

    static options(passProps) {
        var options = defaultScreenOptions("Inventaires");
        options.topBar.rightButtons = [
            {
                id: 'inventory-new',
                text: 'Nouveau'
                // icon: require('../../../assets/icons/plus-regular.png')
            }
        ]

        return options;
    }

    componentDidMount() {
        InventoryFactory.sharedInstance().findAll().then(inventories => {
            const inventoriesData = [];
            for (k in inventories) {
                const inventory = inventories[k];
                const inventoryData = {
                    key: 'inventory-' + inventory.id,
                    id: inventory.id,
                    title: inventory.date.format('LL'),
                    subtitle: String(inventory.zone)
                }
                inventoriesData.push(inventoryData);
            }

            console.log(inventoriesData);

            this.setState({
                inventoriesData: inventoriesData
            })
        });
    }

    navigationButtonPressed({ buttonId }) {
        // will be called when "buttonOne" is clicked
        if (buttonId === 'inventory-new') {
            Navigation.showModal({
                stack: {
                    children: [{
                        component: {
                            name: 'Inventory/New'
                        }
                    }]
                }
            });
        }
    }

    didTapInventoryEntry = (props) => {
        Navigation.push(props.componentId, {
            component: {
                name: 'Inventory/Show',
                passProps: {
                    inventoryId: props.item.id
                }
            }
        });
    }

    render() {
        return (
            <SafeAreaView>
                <FlatList
                    style={{ height: '100%' }}
                    data={this.state.inventoriesData}
                    renderItem={({ item }) =>
                        <TouchableHighlight onPress={() => {
                            this.didTapInventoryEntry({
                                componentId: this.props.componentId,
                                item: item
                            })}
                        }>
                            <View style={styles.row}>
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                            </View>
                        </TouchableHighlight>
                    }
                />
            </SafeAreaView>
        )
    }
}

const styles = EStyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
    },
    row: {
        height: 44,
        paddingTop: 5,
        paddingLeft: 16
    },
    rowTitle: {
        fontSize: 17
    },
    rowSubtitle: {
        fontSize: 12,
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