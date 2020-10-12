import React from 'react';
import { View, Text, SafeAreaView, FlatList, Alert, Image } from 'react-native';
import { ListItem, ThemeProvider, SearchBar } from 'react-native-elements';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import ImagePicker from 'react-native-image-picker';
import GoodsReceiptEntry, { EntryStatus } from '../../entities/GoodsReceiptEntry';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import GoodsReceiptService from '../../services/GoodsReceiptService';
import Attachment from '../../entities/Attachment';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import { defaultScreenOptions } from '../../utils/navigation';
import { displayNumber } from '../../utils/helpers';
import { getRepository } from 'typeorm';
import moment from 'moment';
import * as RNFS from 'react-native-fs';
import Fuse from 'fuse.js';

export interface GoodsReceiptShowProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptShowState {
    sessionEntries: GoodsReceiptEntry[];
    sessionAttachments: Attachment[];
    entriesToDisplay: GoodsReceiptEntry[];
    filter: string;
}

export default class GoodsReceiptShow extends React.Component<GoodsReceiptShowProps, GoodsReceiptShowState> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };

    fuse: Fuse<GoodsReceiptEntry, Fuse.IFuseOptions<GoodsReceiptEntry>>;
    modalDismissedListener?: EventSubscription;
    entriesToDisplay: GoodsReceiptEntry[] = [];

    constructor(props: GoodsReceiptShowProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            sessionEntries: [],
            sessionAttachments: [],
            entriesToDisplay: [],
            filter: '',
        };
        this.fuse = new Fuse(this.state.sessionEntries, {
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
                id: 'add-photo',
                icon: require('../../../assets/icons/add-a-photo-regular.png'),
                text: 'Ajouter une photo',
            },
            {
                id: 'add-extra',
                icon: require('../../../assets/icons/cart-plus-regular.png'),
                text: 'Ajouter un article',
            },
            {
                id: 'scan',
                icon: require('../../../assets/icons/barcode-read-regular.png'),
                text: 'Scanner un article',
            },
            {
                id: 'export',
                icon: require('../../../assets/icons/paper-plane-regular.png'),
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
        getRepository(GoodsReceiptSession)
            .findOne(this.props.session.id, {
                relations: ['goodsReceiptEntries', 'attachments'],
            })
            .then((session): void => {
                //console.log(session);
                if (!session) {
                    throw new Error('Session not found');
                }
                let entries;
                if (this.state.filter) {
                    entries = this.filteredEntries(session.goodsReceiptEntries, this.state.filter);
                } else {
                    entries = this.orderedReceiptEntries(session.goodsReceiptEntries);
                }
                this.setState({
                    sessionEntries: session.goodsReceiptEntries ?? [],
                    sessionAttachments: session.attachments ?? [],
                    entriesToDisplay: entries,
                });
            });
    }

    filterEntriesWith(text: string): void {
        this.setState({
            filter: text,
            entriesToDisplay: this.filteredEntries(this.state.sessionEntries, text),
        });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'add-photo') {
            this.addPhoto();
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

    //   didTapGoodsReceiptSessionItem = (props: GoodsReceiptSessionTapProps) => {
    //     Navigation.push(props.componentId, {
    //       component: {
    //         name: "GoodsReceipt/Show",
    //         passProps: {
    //           inventorySessionId: props.item.id
    //         }
    //       }
    //     });
    //   };

    openGoodsReceiptScan(productId?: number): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'GoodsReceipt/Scan',
                            passProps: {
                                session: this.props.session,
                                preselectedProductId: productId,
                            },
                        },
                    },
                ],
            },
        });
    }

    openGoodsReceiptExport = (): void => {
        // if (false == this.state.session.isReadyForExport()) {
        //     Alert.alert(`Au moins un des produits n'a pas été scanné. Merci de finir la réception.`);
        //     return;
        // }
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'GoodsReceipt/Export',
                            passProps: {
                                session: this.props.session,
                            },
                        },
                    },
                ],
            },
        });
    };

    addPhoto(): void {
        const options = {
            title: 'Selectionner une photo',
            cancelButtonTitle: 'Annuler',
            takePhotoButtonTitle: 'Prendre une photo',
            chooseFromLibraryButtonTitle: 'Sélectionner depuis la librairie',
            // customButtons: [{ name: 'fb', title: 'Choose Photo from Facebook' }],
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        ImagePicker.showImagePicker(options, response => {
            console.debug('Response = ', response);

            if (response.didCancel) {
                console.debug('User cancelled image picker');
            } else if (response.error) {
                console.debug('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.debug('User tapped custom button: ', response.customButton);
            } else {
                // You can also display the image using data:
                // const source = { uri: 'data:image/jpeg;base64,' + response.data };
                const session: GoodsReceiptSession = this.props.session;

                GoodsReceiptService.getInstance()
                    .attachementFromImagePicker(session, response)
                    .then(attachement => {
                        getRepository(Attachment)
                            .save(attachement)
                            .then(() => {
                                this.loadData();
                            });
                    });
            }
        });
    }

    searchExtraItem(): void {
        Alert.alert('Développement en cours');
    }

    itemBackgroundColor(entry: GoodsReceiptEntry): string {
        if (entry.productQty === null) {
            return 'transparent';
        }

        switch (entry.getStatus()) {
            case EntryStatus.ERROR:
                return '#d9534f';
                break;
            case EntryStatus.WARNING:
                return '#ffc30f';
                break;
            case EntryStatus.VALID:
                return '#5cb85c';
                break;
            default:
                return 'transparent';
                break;
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
                <Text style={{ fontSize: 25, margin: 5 }}>{this.props.session.partnerName}</Text>
                <Text style={{ fontSize: 15, margin: 5, fontStyle: 'italic' }}>
                    {this.props.session.poName} - {moment(this.props.session.createdAt).format('DD MMMM YYYY')}
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
                    <Text style={{ fontSize: 15, margin: 5 }}>Images jointes</Text>
                </View>
                {this.renderImageAttachments()}
            </View>
        );
    };

    renderEntryQty(entry: GoodsReceiptEntry): React.ReactElement {
        let correctQty;
        if (false === entry.isValidQuantity() || false === entry.isValidUom()) {
            correctQty = (
                <Text style={{ fontSize: 16 }}>
                    {displayNumber(entry.productQty)} {ProductProduct.quantityUnitAsString(entry.productUom)}
                </Text>
            );
        }
        return (
            <View style={{ alignItems: 'flex-end' }}>
                <Text
                    style={{
                        fontSize: false === entry.isValidQuantity() || false === entry.isValidUom() ? 12 : 16,
                        textDecorationLine:
                            false === entry.isValidQuantity() || false === entry.isValidUom() ? 'line-through' : 'none',
                    }}
                >
                    {displayNumber(entry.expectedProductQty)}{' '}
                    {ProductProduct.quantityUnitAsString(entry.expectedProductUom)}
                </Text>
                {correctQty}
            </View>
        );
    }

    renderImageAttachments(): React.ReactElement {
        return (
            <FlatList
                scrollEnabled={false}
                // style={{ backgroundColor: 'white' }}
                data={this.state.sessionAttachments}
                keyExtractor={(item): string => {
                    return item.path ? item.path : '';
                }}
                renderItem={({ item }): React.ReactElement => {
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
        if (false === entry.isValidPackageQty() || false === entry.isValidProductQtyPackage()) {
            correctPackageQty = (
                <Text style={{ fontSize: 16 }}>
                    {entry.packageQty} colis de {entry.productQtyPackage} article(s)
                </Text>
            );
        }
        return (
            <View style={{ alignItems: 'flex-end' }}>
                <Text
                    style={{
                        fontSize:
                            false === entry.isValidPackageQty() || false === entry.isValidProductQtyPackage() ? 12 : 16,
                        textDecorationLine:
                            false === entry.isValidPackageQty() || false === entry.isValidProductQtyPackage()
                                ? 'line-through'
                                : 'none',
                    }}
                >
                    {entry.expectedPackageQty} colis de {entry.expectedProductQtyPackage} article
                    {entry.expectedProductQtyPackage && entry.expectedProductQtyPackage > 1 ? 's' : ''}
                </Text>
                {correctPackageQty}
            </View>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{ height: '100%' }}>
                <ThemeProvider theme={this.theme}>
                    <FlatList
                        keyboardShouldPersistTaps="always"
                        style={{ backgroundColor: 'white', height: '100%' }}
                        data={this.state.entriesToDisplay}
                        keyExtractor={(item): string => {
                            if (item.id && item.id.toString()) {
                                return item.id.toString();
                            }
                            return '';
                        }}
                        renderItem={({ item }): React.ReactElement => (
                            <ListItem
                                containerStyle={{ backgroundColor: this.itemBackgroundColor(item) }}
                                onPress={(): void => {
                                    this.openGoodsReceiptScan(item.productId);
                                }}
                                topDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>{item.productName}</ListItem.Title>
                                    <ListItem.Subtitle
                                        style={item.productBarcode ? undefined : { fontStyle: 'italic' }}
                                    >
                                        {item.productBarcode ? item.productBarcode.toString() : 'Pas de code barre'}
                                    </ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Content right>
                                    <ListItem.Title right>{this.renderEntryQty(item)}</ListItem.Title>
                                    <ListItem.Subtitle right>{this.renderPackageQty(item)}</ListItem.Subtitle>
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
