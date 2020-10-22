import React from 'react';
import {
    EmitterSubscription,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';
import materialStyle from '../../styles/material';
import bootstrapStyle from '../../styles/bootstrap';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import ActionSheet from 'react-native-action-sheet';
import InventorySession from '../../entities/InventorySession';
import InventoryEntry from '../../entities/InventoryEntry';
import { Button, Icon, ListItem } from 'react-native-elements';

export interface InventoryShowProps {
    inventorySessionId: number;
}

interface InventoryShowState {
    inventorySession?: InventorySession;
    inventoryEntries: InventoryEntry[];
}

interface InventoryData {
    key: string;
    title?: string;
    subtitle?: string;
    image: { uri: string } | null;
    metadata: string;
    inventoryEntry: InventoryEntry;
}

export default class InventoryShow extends React.Component<InventoryShowProps, InventoryShowState> {
    modalDismissedListener?: EmitterSubscription;

    constructor(props: InventoryShowProps) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            inventorySession: undefined,
            inventoryEntries: [],
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Inventaire');

        return options;
    }

    componentDidMount(): void {
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadInventorySession();
        });

        this.loadInventorySession();
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
    }

    componentDidAppear(): void {
        this.loadInventorySession();
    }

    loadInventorySession(): void {
        InventorySessionFactory.sharedInstance()
            .find(this.props.inventorySessionId)
            .then(inventorySession => {
                this.setState({
                    inventorySession: inventorySession,
                });
                this.loadInventoryEntries();
            });
    }

    loadInventoryEntries(): void {
        if (!this.state.inventorySession) {
            throw new Error('Missing inventorySession');
        }
        InventoryEntryFactory.sharedInstance()
            .findForInventorySession(this.state.inventorySession)
            .then(entries => {
                this.setState({
                    inventoryEntries: entries,
                });
            });
    }

    deleteInventoryEntry(inventoryEntry: InventoryEntry): void {
        InventoryEntryFactory.sharedInstance()
            .delete(inventoryEntry)
            .then(() => {
                this.loadInventoryEntries();
            });
    }

    computeEntriesData(): InventoryData[] {
        const listDatas = [];
        for (const k in this.state.inventoryEntries) {
            const entry = this.state.inventoryEntries[k];
            const data: InventoryData = {
                key: 'inventory-entry-' + entry.id,
                title: entry.articleName,
                subtitle: entry.articleBarcode,
                image: entry.articleImage ? { uri: entry.articleImage } : null,
                metadata: `${entry.articleQuantity} ${ProductProduct.quantityUnitAsString(entry.articleUnit)}`,
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
                            name: 'Scanner',
                            passProps: {
                                inventory: this.state.inventorySession,
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

    openExportModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Inventory/Export',
                            passProps: {
                                inventory: this.state.inventorySession,
                                inventoryEntries: this.state.inventoryEntries,
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

    didTapIventoryEntry(inventoryEntry: InventoryEntry): void {
        const title = inventoryEntry.articleName;
        const buttonsIos = ['Supprimer', 'Annuler'];
        const buttonsAndroid = ['Supprimer'];
        const DESTRUCTIVE_INDEX = 0;
        const CANCEL_INDEX = 1;

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

    render(): React.ReactNode {
        if (!this.state.inventorySession) {
            return null;
        }
        const inventory = this.state.inventorySession;
        let lastSentAtInfo, wasModifiedWarning;
        // console.error(inventory.lastSentAt);

        if (inventory.lastSentAt != null) {
            lastSentAtInfo = (
                <View style={bootstrapStyle.infoView}>
                    <Text style={bootstrapStyle.infoText}>
                        Inventaire déjà envoyé le {inventory.lastSentAt.format('DD/MM/YYYY')} à{' '}
                        {inventory.lastSentAt.format('HH[h]mm')}
                    </Text>
                </View>
            );
        }
        if (
            inventory.lastSentAt &&
            inventory.lastModifiedAt &&
            inventory.lastSentAt.unix() < inventory.lastModifiedAt.unix()
        ) {
            wasModifiedWarning = (
                <View style={bootstrapStyle.warningView}>
                    <Text style={bootstrapStyle.warningText}>Inventaire modifié depuis le dernier envoi !</Text>
                </View>
            );
        }
        return (
            <SafeAreaView>
                <ScrollView style={{ height: '100%' }}>
                    {lastSentAtInfo}
                    {wasModifiedWarning}
                    <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingTop: 16 }}>
                        <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                {inventory.date ? inventory.date.format('dddd') : '-'}
                            </Text>
                            <Text style={{ fontSize: 30, textAlign: 'center' }}>
                                {inventory.date ? inventory.date.format('DD MMMM') : '-'}
                            </Text>
                            <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                {inventory.date ? inventory.date.format('YYYY') : '-'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'column', flex: 1 }}>
                            <Text style={{ fontSize: 24, textAlign: 'center' }}>Zone</Text>
                            <Text style={{ fontSize: 50, textAlign: 'center' }}>{inventory.zone}</Text>
                        </View>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            backgroundColor: 'white',
                            paddingVertical: 16,
                        }}
                    >
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
                    {this.state.inventoryEntries.length > 0 ? (
                        <FlatList
                            scrollEnabled={false}
                            style={{ backgroundColor: 'white' }}
                            data={this.computeEntriesData()}
                            renderItem={({ item }): React.ReactElement => (
                                <ListItem
                                    onPress={(): void => {
                                        this.didTapIventoryEntry(item.inventoryEntry);
                                    }}
                                    bottomDivider
                                >
                                    <ListItem.Content>
                                        <ListItem.Title>{item.title}</ListItem.Title>
                                        <ListItem.Subtitle>{item.subtitle}</ListItem.Subtitle>
                                    </ListItem.Content>
                                    <ListItem.Content right>
                                        <Text style={{ textAlign: 'right' }}>{item.metadata}</Text>
                                    </ListItem.Content>
                                </ListItem>
                            )}
                        />
                    ) : (
                        <View>
                            <Text style={{ fontSize: 25, textAlign: 'center', marginTop: 30, marginHorizontal: 8 }}>
                                Aucun article pour le moment. Appuie sur le bouton &quot;Scanner&quot; pour démarrer !
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }
}
