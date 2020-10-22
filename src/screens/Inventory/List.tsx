import React from 'react';
import { EmitterSubscription, View, SafeAreaView, FlatList } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import InventorySession from '../../entities/InventorySession';
import { ListItem, Button, Icon, ThemeProvider } from 'react-native-elements';
import merge from 'deepmerge';

export interface InventoryListProps {
    componentId: string;
    item: InventorySession;
}

interface InventoryListState {
    inventoriesData: InventorySessionListItem[];
    refreshing: boolean;
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
            type: 'font-awesome-5',
        },
    };

    modalDismissedListener?: EmitterSubscription;

    constructor(props: InventoryListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            inventoriesData: [],
            refreshing: true,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Inventaires');
        const buttons = {
            topBar: {
                rightButtons: [
                    {
                        id: 'inventory-new',
                        text: 'Nouveau',
                    },
                ],
            },
        };
        return merge(options, buttons);
    }

    componentDidAppear(): void {
        this.loadData();
    }

    componentDidMount(): void {
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadData();
        });

        this.loadData();
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
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
                    refreshing: false,
                });
            });
    }

    _handleRefresh = (): void => {
        this.setState(
            {
                refreshing: true,
            },
            () => {
                this.loadData();
            },
        );
    };

    openNewInventoryModal = (): void => {
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
    };

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
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

    renderHeader = (): React.ReactElement => {
        return (
            <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'center' }}>
                <Button
                    title=" Nouvel inventaire"
                    icon={<Icon type="font-awesome-5" name="plus-circle" color="white" />}
                    onPress={(): void => {
                        this.openNewInventoryModal();
                    }}
                />
            </View>
        );
    };

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <FlatList
                        style={{ backgroundColor: 'white', height: '100%' }}
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
                                bottomDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>{item.title}</ListItem.Title>
                                    <ListItem.Subtitle>{item.subtitle}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Content right>
                                    <ListItem.Title right>{item.detailText}</ListItem.Title>
                                </ListItem.Content>
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            </ListItem>
                        )}
                        // ListHeaderComponent={this.renderHeader}
                        onRefresh={this._handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
