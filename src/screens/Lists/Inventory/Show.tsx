import React from 'react';
import {EmitterSubscription, FlatList, Platform, SafeAreaView, Text, View} from 'react-native';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Navigation, Options, OptionsModalPresentationStyle} from 'react-native-navigation';
import bootstrapStyle from '../../../styles/bootstrap';
import ProductProduct from '../../../entities/Odoo/ProductProduct';
import ActionSheet from 'react-native-action-sheet';
import {Button, Icon, ListItem} from 'react-native-elements';
import InventoryList from '../../../entities/Lists/InventoryList';
import InventoryEntry from '../../../entities/Lists/InventoryEntry';
import {getConnection, Repository} from 'typeorm';
import {DateTime} from 'luxon';

export interface Props {
    list: InventoryList;
}

interface State {
    listEntries: InventoryEntry[];
    refreshing: boolean;
}

interface InventoryData {
    key: string;
    title?: string;
    subtitle?: string;
    image: {uri: string} | null;
    metadata: string;
    inventoryEntry: InventoryEntry;
}

export default class ListsGoodsReceiptShow extends React.Component<Props, State> {
    modalDismissedListener?: EmitterSubscription;
    inventoryListRepository: Repository<InventoryList>;
    inventoryEntryRepository: Repository<InventoryEntry>;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.inventoryListRepository = getConnection().getRepository(InventoryList);
        this.inventoryEntryRepository = getConnection().getRepository(InventoryEntry);

        this.state = {
            listEntries: [],
            refreshing: false,
        };
    }

    static options(): Options {
        return defaultScreenOptions('Inventaire');
    }

    componentDidMount(): void {
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadInventoryEntries();
        });

        this.loadInventoryEntries();
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
    }

    componentDidAppear(): void {
        this.loadInventoryEntries();
    }

    loadInventoryEntries(): void {
        this.inventoryEntryRepository
            .find({
                where: {
                    list: this.props.list.id,
                },
            })
            .then(entries => {
                this.setState({
                    listEntries: entries,
                });
            });
    }

    _handleRefresh = (): void => {
        this.setState(
            {
                refreshing: true,
            },
            () => {
                this.loadInventoryEntries();
            },
        );
    };

    deleteInventoryEntry(inventoryEntry: InventoryEntry): void {
        if (!inventoryEntry.id) {
            return;
        }
        getConnection()
            .getRepository(InventoryEntry)
            .delete(inventoryEntry.id)
            .then(() => {
                this.loadInventoryEntries();
            });
    }

    computeEntriesData(): InventoryData[] {
        // TODO: gérer les entrées multiples
        const listDatas = [];
        for (const k in this.state.listEntries) {
            const entry = this.state.listEntries[k];
            const data: InventoryData = {
                key: 'inventory-entry-' + entry.id,
                title: entry.productName,
                subtitle: entry.productBarcode,
                image: null,
                metadata: `${entry.quantity} ${ProductProduct.quantityUnitAsString(entry.unit)}`,
                inventoryEntry: entry,
            };
            listDatas.push(data);
        }
        return listDatas;
    }

    openScannerModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/Inventory/Scan',
                            passProps: {
                                inventory: this.props.list,
                            },
                            options: {
                                topBar: {},
                                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                            },
                        },
                    },
                ],
            },
        });
    }

    openExportModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/Inventory/Export',
                            passProps: {
                                inventory: this.props.list,
                                inventoryEntries: this.state.listEntries,
                            },
                            options: {
                                topBar: {},
                            },
                        },
                    },
                ],
            },
        });
    }

    didTapInventoryEntry(inventoryEntry: InventoryEntry): void {
        const title = inventoryEntry.productName;
        const buttonsIos = ['Supprimer', 'Annuler'];
        const buttonsAndroid = ['Supprimer'];
        const DESTRUCTIVE_INDEX = 0;
        const CANCEL_INDEX = 1;

        // TODO: rajouter une entrée "commentaire"

        ActionSheet.showActionSheetWithOptions(
            {
                title: title,
                options: Platform.OS == 'ios' ? buttonsIos : buttonsAndroid,
                cancelButtonIndex: CANCEL_INDEX,
                destructiveButtonIndex: DESTRUCTIVE_INDEX,
                tintColor: 'blue',
            },
            buttonIndex => {
                if (buttonIndex == DESTRUCTIVE_INDEX) {
                    this.deleteInventoryEntry(inventoryEntry);
                }
            },
        );
    }

    renderAlerts(): React.ReactNode {
        const inventory = this.props.list;
        if (!inventory) {
            return null;
        }
        let lastSentAtInfo, wasModifiedWarning;
        if (inventory.lastSentAt != null) {
            lastSentAtInfo = (
                <View style={bootstrapStyle.infoView}>
                    <Text style={bootstrapStyle.infoText}>
                        Inventaire déjà envoyé le {inventory.lastSentAt.toLocaleString(DateTime.DATETIME_SHORT)}
                    </Text>
                </View>
            );
        }
        if (
            inventory.lastSentAt &&
            inventory.lastModifiedAt &&
            inventory.lastSentAt.toSeconds() < inventory.lastModifiedAt.toSeconds()
        ) {
            wasModifiedWarning = (
                <View style={bootstrapStyle.warningView}>
                    <Text style={bootstrapStyle.warningText}>Inventaire modifié depuis le dernier envoi !</Text>
                </View>
            );
        }

        return (
            <View>
                {lastSentAtInfo}
                {wasModifiedWarning}
            </View>
        );
    }

    renderHeader(): React.ReactElement {
        const inventory = this.props.list;
        return (
            <View style={{borderBottomWidth: 0.5, borderBottomColor: '#DDD'}}>
                {this.renderAlerts()}
                <View style={{flexDirection: 'row', backgroundColor: 'white', paddingTop: 16}}>
                    <View style={{flexDirection: 'column', flex: 1, justifyContent: 'center'}}>
                        <Text style={{fontSize: 20, textAlign: 'center'}}>
                            {inventory.createdAt ? inventory.createdAt.toFormat('cccc') : '-'}
                        </Text>
                        <Text style={{fontSize: 30, textAlign: 'center'}}>
                            {inventory.createdAt ? inventory.createdAt.toFormat('d LLLL') : '-'}
                        </Text>
                        <Text style={{fontSize: 20, textAlign: 'center'}}>
                            {inventory.createdAt ? inventory.createdAt.toFormat('yyyy') : '-'}
                        </Text>
                    </View>
                    <View style={{flexDirection: 'column', flex: 1}}>
                        <Text style={{fontSize: 24, textAlign: 'center'}}>Zone</Text>
                        <Text style={{fontSize: 50, textAlign: 'center'}}>{inventory.zone}</Text>
                    </View>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        backgroundColor: 'white',
                        paddingVertical: 16,
                    }}>
                    <Button
                        onPress={(): void => {
                            this.openScannerModal();
                        }}
                        icon={<Icon type="font-awesome-5" name="barcode" color="white" solid />}
                        title=" Scanner"
                    />
                    <Button
                        onPress={(): void => {
                            this.openExportModal();
                        }}
                        icon={<Icon type="font-awesome-5" name="file-export" color="white" solid />}
                        title=" Envoyer"
                    />
                </View>
                {this.renderNoEntry()}
            </View>
        );
    }

    renderNoEntry(): React.ReactNode {
        if (this.state.listEntries.length > 0) {
            return null;
        }
        return (
            <View>
                <Text style={{fontSize: 25, textAlign: 'center', marginTop: 30, marginHorizontal: 8}}>
                    Aucun article pour le moment. Appuie sur le bouton &quot;Scanner&quot; pour démarrer !
                </Text>
            </View>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    scrollEnabled={true}
                    style={{backgroundColor: 'white', height: '100%'}}
                    data={this.computeEntriesData()}
                    ListHeaderComponent={this.renderHeader()}
                    renderItem={({item}): React.ReactElement => (
                        <ListItem
                            onPress={(): void => {
                                this.didTapInventoryEntry(item.inventoryEntry);
                            }}
                            bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>{item.title}</ListItem.Title>
                                <ListItem.Subtitle>{item.subtitle}</ListItem.Subtitle>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <Text style={{textAlign: 'right'}}>{item.metadata}</Text>
                            </ListItem.Content>
                        </ListItem>
                    )}
                />
            </SafeAreaView>
        );
    }
}
