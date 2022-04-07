import React from 'react';
import {View, Text, SafeAreaView, FlatList, Alert, Image} from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import {ListItem, ThemeProvider, SearchBar} from 'react-native-elements';
import {Navigation, Options, EventSubscription} from 'react-native-navigation';
import ImagePicker, {ImagePickerResponse} from 'react-native-image-picker';
import GoodsReceiptEntry, {EntryStatus} from '../../../entities/Lists/GoodsReceiptEntry';
import GoodsReceiptList from '../../../entities/Lists/GoodsReceiptList';
import GoodsReceiptService from '../../../services/GoodsReceiptService';
import ListAttachment from '../../../entities/Lists/ListAttachment';
import ProductProduct from '../../../entities/Odoo/ProductProduct';
import {defaultScreenOptions} from '../../../utils/navigation';
import {displayNumber} from '../../../utils/helpers';
import moment from 'moment';
import * as RNFS from 'react-native-fs';
import Fuse from 'fuse.js';
import Database from '../../../utils/Database';

export interface Props {
    componentId: string;
    list: GoodsReceiptList;
}

interface State {
    listEntries: GoodsReceiptEntry[];
    listAttachements: ListAttachment[];
    entriesToDisplay: GoodsReceiptEntry[];
    filter: string;
}

export default class ListsGoodsReceiptShow extends React.Component<Props, State> {
    static screenName = 'Lists/GoodsReceipt/Show';

    theme = {
        Button: {
            iconContainerStyle: {marginRight: 5},
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };

    fuse: Fuse<GoodsReceiptEntry>;
    modalDismissedListener?: EventSubscription;
    entriesToDisplay: GoodsReceiptEntry[] = [];

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            listEntries: [],
            listAttachements: [],
            entriesToDisplay: [],
            filter: '',
        };
        this.fuse = new Fuse(this.state.listEntries, {
            keys: ['productName'],
            ignoreLocation: true,
            isCaseSensitive: false,
            shouldSort: true,
        });
    }

    static options(): Options {
        const options = defaultScreenOptions('');
        const topBar = options.topBar ?? {};
        topBar.rightButtons = [
            {
                id: 'select-photo',
                icon: require('../../../../assets/icons/add-a-photo-regular.png'),
                text: 'Ajouter une photo',
            },
            {
                id: 'add-extra',
                icon: require('../../../../assets/icons/cart-plus-regular.png'),
                text: 'Ajouter un article',
            },
            {
                id: 'scan',
                icon: require('../../../../assets/icons/barcode-read-regular.png'),
                text: 'Scanner un article',
            },
            {
                id: 'export',
                icon: require('../../../../assets/icons/paper-plane-regular.png'),
                text: 'Envoyer',
            },
        ];

        return options;
    }

    componentDidAppear(): void {
        this.loadData();
    }

    componentDidMount(): void {
        this.loadData();
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadData();
        });
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
    }

    loadData(): void {
        Database.sharedInstance()
            .dataSource.getRepository(GoodsReceiptList)
            .findOne({
                where: {
                    id: this.props.list.id,
                },
                relations: {
                    entries: true,
                    attachments: true,
                },
            })
            .then((session): void => {
                if (!session) {
                    throw new Error('Session not found');
                }
                const sessionEntries = session.entries as GoodsReceiptEntry[];
                let entries: GoodsReceiptEntry[];
                if (this.state.filter) {
                    entries = this.filteredEntries(sessionEntries, this.state.filter);
                } else {
                    entries = this.orderedReceiptEntries(sessionEntries);
                }
                this.setState({
                    listEntries: (session.entries as GoodsReceiptEntry[]) ?? [],
                    listAttachements: session.attachments ?? [],
                    entriesToDisplay: entries,
                });
            });
    }

    filterEntriesWith(text: string): void {
        this.setState({
            filter: text,
            entriesToDisplay: this.filteredEntries(this.state.listEntries, text),
        });
    }

    navigationButtonPressed({buttonId}: {buttonId: string}): void {
        if (buttonId === 'select-photo') {
            this.selectPhoto();
        }
        if (buttonId === 'add-extra') {
            this.searchExtraItem();
        }
        if (buttonId === 'scan') {
            this.openGoodsReceiptScan();
        }
        if (buttonId === 'export') {
            this.openGoodsReceiptExport();
        }
    }

    openGoodsReceiptScan(productId?: number): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/GoodsReceipt/Scan',
                            passProps: {
                                list: this.props.list,
                                preselectedProductId: productId,
                            },
                        },
                    },
                ],
            },
        });
    }

    openGoodsReceiptExport = (): void => {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/GoodsReceipt/Export',
                            passProps: {
                                list: this.props.list,
                            },
                        },
                    },
                ],
            },
        });
    };

    selectPhoto = (): void => {
        const options = ['Prendre une photo', 'Sélectionner depuis la librairie', 'Annuler'];
        const destructiveButtonIndex = undefined;
        const cancelButtonIndex = 2;
        const title = 'Sélectionner une photo';

        ActionSheet.showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title,
            },
            buttonIndex => {
                if (buttonIndex === 0) {
                    ImagePicker.launchCamera(
                        {
                            mediaType: 'photo',
                        },
                        response => {
                            this.addPhotos(response);
                        },
                    );
                }
            },
        );
    };

    addPhotos = async (response: ImagePickerResponse): Promise<void> => {
        const list = this.props.list;

        GoodsReceiptService.getInstance()
            .attachementsFromImagePickerResponse(list, response)
            .then(attachments => {
                for (const attachment of attachments) {
                    Database.sharedInstance()
                        .dataSource.getRepository(ListAttachment)
                        .save(attachment)
                        .then(() => {
                            this.loadData();
                        });
                }
            });
    };

    searchExtraItem(): void {
        Alert.alert('Développement en cours');
    }

    itemBackgroundColor(entry: GoodsReceiptEntry): string {
        if (entry.quantity === null) {
            return 'white';
        }

        switch (entry.getStatus()) {
            case EntryStatus.ERROR:
                return '#d9534f';
            case EntryStatus.WARNING:
                return '#ffc30f';
            case EntryStatus.VALID:
                return '#5cb85c';
            default:
                return 'white';
        }
    }

    orderedReceiptEntries(entries: GoodsReceiptEntry[] | undefined): GoodsReceiptEntry[] {
        if (entries && entries.length > 0) {
            return entries.sort((entry1, entry2) => {
                if (entry1.productName && entry2.productName && entry1.productName.trim() > entry2.productName.trim()) {
                    return 1;
                }
                if (entry1.productName && entry2.productName && entry1.productName.trim() < entry2.productName.trim()) {
                    return -1;
                }
                return 0;
            });
        }
        return [];
    }

    filteredEntries(entries?: GoodsReceiptEntry[], filter?: string): GoodsReceiptEntry[] {
        if (!entries) {
            return [];
        }
        if (!filter) {
            return entries;
        }

        this.fuse.setCollection(entries);
        const results = this.fuse.search(filter);

        const filteredItems: GoodsReceiptEntry[] = [];
        results.forEach(result => {
            filteredItems.push(result.item);
        });

        return filteredItems;
    }

    renderHeader = (): React.ReactElement => {
        return (
            <View>
                <Text style={{fontSize: 25, margin: 12, marginBottom: 0}}>{this.props.list.partnerName}</Text>
                <Text style={{fontSize: 15, margin: 12, marginTop: 0, fontStyle: 'italic'}}>
                    {this.props.list.purchaseOrderName} - {moment(this.props.list.createdAt).format('DD MMMM YYYY')}
                </Text>
                <SearchBar
                    placeholder="Filtrer ici ..."
                    lightTheme
                    round
                    onChangeText={(text: string): void => this.filterEntriesWith(text)}
                    autoCorrect={false}
                    value={this.state.filter}
                />
            </View>
        );
    };

    renderFooter = (): React.ReactElement => {
        return (
            <View>
                <View>
                    <Text style={{fontSize: 15, margin: 5}}>Images jointes</Text>
                </View>
                {this.renderImageAttachments()}
            </View>
        );
    };

    renderEntryQty(entry: GoodsReceiptEntry): React.ReactElement {
        let correctQty;
        if (entry.isValidQuantity() === false || entry.isValidUom() === false) {
            correctQty = (
                <Text style={{fontSize: 16}}>
                    {displayNumber(entry.quantity)} {ProductProduct.quantityUnitAsString(entry.unit)}
                </Text>
            );
        }

        return (
            <ListItem.Title right>
                <Text
                    style={{
                        textAlign: 'right',
                        fontSize: entry.isValidQuantity() === false || entry.isValidUom() === false ? 12 : 16,
                        textDecorationLine:
                            entry.isValidQuantity() === false || entry.isValidUom() === false ? 'line-through' : 'none',
                    }}>
                    {displayNumber(entry.expectedProductQty)}{' '}
                    {ProductProduct.quantityUnitAsString(entry.expectedProductUom)}
                </Text>
                {correctQty}
            </ListItem.Title>
        );
    }

    renderImageAttachments(): React.ReactElement {
        return (
            <FlatList
                scrollEnabled={false}
                // style={{ backgroundColor: 'white' }}
                data={this.state.listAttachements}
                keyExtractor={(item): string => {
                    return item.path ? item.path : '';
                }}
                renderItem={({item}): React.ReactElement => {
                    const attachmentUri = `file://${RNFS.DocumentDirectoryPath}/${item.path}`;
                    console.debug(`attachment path: ${attachmentUri}`);
                    return (
                        <View>
                            <Text>Item number : {item.type}</Text>
                            <Image
                                source={{
                                    uri: attachmentUri,
                                }}
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: 300,
                                    height: 400,
                                }}
                            />
                        </View>
                    );
                }}
            />
        );
    }

    renderPackageQty(entry: GoodsReceiptEntry): React.ReactElement {
        let correctPackageQty;
        if (entry.isValidPackageQty() === false || entry.isValidProductQtyPackage() === false) {
            correctPackageQty = (
                <Text style={{fontSize: 16}}>
                    {entry.productQtyPackage} x {entry.packageQty} {ProductProduct.quantityUnitAsString(entry.unit)}
                </Text>
            );
        }
        return (
            <ListItem.Subtitle right>
                <Text
                    style={{
                        textAlign: 'right',
                        fontSize:
                            entry.isValidPackageQty() === false || entry.isValidProductQtyPackage() === false ? 12 : 16,
                        textDecorationLine:
                            entry.isValidPackageQty() === false || entry.isValidProductQtyPackage() === false
                                ? 'line-through'
                                : 'none',
                    }}>
                    {entry.expectedProductQtyPackage} x {entry.expectedPackageQty}{' '}
                    {ProductProduct.quantityUnitAsString(entry.expectedProductUom)}
                </Text>
                {correctPackageQty}
            </ListItem.Subtitle>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{height: '100%'}}>
                <ThemeProvider theme={this.theme}>
                    <FlatList
                        keyboardShouldPersistTaps="always"
                        style={{backgroundColor: 'white', height: '100%'}}
                        data={this.state.entriesToDisplay}
                        keyExtractor={(item): string => {
                            if (item.id && item.id.toString()) {
                                return item.id.toString();
                            }
                            return '';
                        }}
                        renderItem={({item}): React.ReactElement => (
                            <ListItem
                                containerStyle={{backgroundColor: this.itemBackgroundColor(item)}}
                                onPress={(): void => {
                                    this.openGoodsReceiptScan(item.productId);
                                }}
                                topDivider>
                                <ListItem.Content>
                                    <ListItem.Title numberOfLines={1} ellipsizeMode={'middle'}>
                                        {item.productName}
                                    </ListItem.Title>
                                    <ListItem.Subtitle style={item.productBarcode ? undefined : {fontStyle: 'italic'}}>
                                        {item.productBarcode ? item.productBarcode.toString() : 'Pas de code barre'}
                                    </ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Content right>
                                    {this.renderEntryQty(item)}
                                    {this.renderPackageQty(item)}
                                </ListItem.Content>
                            </ListItem>
                        )}
                        ListHeaderComponent={this.renderHeader}
                        ListFooterComponent={this.renderFooter}
                    />
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
