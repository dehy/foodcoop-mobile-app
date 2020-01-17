import React from 'react';
import { View, SafeAreaView, FlatList, ScrollView } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import InventorySession from '../../entities/InventorySession';
import { ListItem, Button, Icon, ThemeProvider } from 'react-native-elements';

export interface InventoryListProps {
    componentId: string;
    item: InventorySession;
}

interface InventoryListState {
    inventoriesData: InventorySessionListItem[];
}

interface InventorySessionListItem {
    key: string;
    id: number;
    title: string;
    subtitle: string;
    detailText: string;
    object: InventorySession;
}

interface InventorySessionTapProps {
    componentId: string;
    item: InventorySessionListItem;
}

export default class InventoryList extends React.Component<InventoryListProps, InventoryListState> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome',
        },
    };

    constructor(props: InventoryListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            inventoriesData: [],
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Inventaires');
        // options.topBar.rightButtons = [
        //     {
        //         id: 'inventory-new',
        //         text: 'Nouveau'
        //     }
        // ]

        return options;
    }

    componentDidAppear(): void {
        this.loadData();
    }

    componentDidMount(): void {
        // this.loadData();
    }

    loadData(): void {
        InventorySessionFactory.sharedInstance()
            .findAll()
            .then(async inventories => {
                const inventoriesData = [];
                for (const k in inventories) {
                    const inventory = inventories[k];
                    const inventoryEntries = await InventoryEntryFactory.sharedInstance().findForInventorySession(
                        inventory,
                    );

                    let articleCountString;
                    if (inventoryEntries.length == 0) {
                        articleCountString = 'aucun article';
                    } else {
                        articleCountString = inventoryEntries.length + ' article' + (inventories.length > 1 ? 's' : '');
                    }
                    const inventoryData: InventorySessionListItem = {
                        key: 'inventory-' + inventory.id,
                        id: inventory.id ? inventory.id : 0,
                        title: inventory.date ? inventory.date.format('DD MMMM YYYY à HH[h]mm') : '',
                        subtitle: 'Zone ' + String(inventory.zone) + ' - ' + articleCountString,
                        detailText: '',
                        object: inventory,
                    };
                    inventoriesData.push(inventoryData);
                }

                this.setState({
                    inventoriesData: inventoriesData,
                });
            });
    }

    openNewInventoryModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Inventory/New',
                        },
                    },
                ],
            },
        });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        // will be called when "buttonOne" is clicked
        if (buttonId === 'inventory-new') {
            this.openNewInventoryModal();
        }
    }

    didTapInventoryEntry = (props: InventorySessionTapProps): void => {
        Navigation.push(props.componentId, {
            component: {
                name: 'Inventory/Show',
                passProps: {
                    inventorySessionId: props.item.id,
                },
            },
        });
    };

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <ScrollView style={{ height: '100%' }}>
                        <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'center' }}>
                            <Button
                                title=" Nouvel inventaire"
                                icon={<Icon name="plus-circle" color="white" />}
                                onPress={this.openNewInventoryModal}
                            />
                        </View>
                        <FlatList
                            style={{ backgroundColor: 'white' }}
                            data={this.state.inventoriesData}
                            renderItem={({ item }): React.ReactElement => (
                                <ListItem
                                    onPress={(): void => {
                                        const inventorySessionTapProps: InventorySessionTapProps = {
                                            componentId: this.props.componentId,
                                            item: item,
                                        };
                                        this.didTapInventoryEntry(inventorySessionTapProps);
                                    }}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    rightTitle={item.detailText}
                                    bottomDivider
                                    chevron
                                />
                            )}
                        />
                    </ScrollView>
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
