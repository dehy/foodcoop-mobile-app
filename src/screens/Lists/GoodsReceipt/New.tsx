import React from 'react';
import { ActivityIndicator, SafeAreaView, SectionList, Text, View } from 'react-native';
import { DateTime } from 'luxon';
import { defaultScreenOptions } from '../../../utils/navigation';
import { filterUnique } from '../../../utils/helpers';
import { getRepository } from 'typeorm';
import { Icon, ListItem } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import GoodsReceiptEntry from '../../../entities/Lists/GoodsReceiptEntry';
import GoodsReceiptList from '../../../entities/Lists/GoodsReceiptList';
import Odoo from '../../../utils/Odoo';
import PurchaseOrder from '../../../entities/Odoo/PurchaseOrder';
import styles from '../../../styles/material';

interface PurchaseOrderList {
    title: string;
    data: PurchaseOrder[];
}

type Props = {
    componentId: string;
};

type State = {
    waitingPurchaseOrders: PurchaseOrderList[];
    showLoadingModal: boolean;
    page: number;
    loading: boolean;
    loadingMore: boolean;
    refreshing: boolean;
};

export default class ListsGoodsReceiptNew extends React.Component<Props, State> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };
    state: State = {
        waitingPurchaseOrders: [],
        showLoadingModal: false,
        page: 1,
        loading: true,
        loadingMore: false,
        refreshing: true,
    };

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        const options = defaultScreenOptions('Nouvelle réception');
        options.topBar = {
            rightButtons: [
                {
                    id: 'cancel',
                    text: 'Annuler',
                },
            ],
        };

        return options;
    }

    componentDidMount(): void {
        this.loadPurchaseOrdersFromOdoo();
    }

    _handleLoadMore = (): void => {
        this.setState(
            prevState => ({
                page: prevState.page + 1,
                loadingMore: true,
            }),
            () => {
                this.loadPurchaseOrdersFromOdoo();
            },
        );
    };

    _handleRefresh = (): void => {
        this.setState(
            {
                page: 1,
                refreshing: true,
            },
            () => {
                this.loadPurchaseOrdersFromOdoo();
            },
        );
    };

    async loadPurchaseOrdersFromOdoo(): Promise<void> {
        const purchaseOrders = await Odoo.getInstance().fetchWaitingPurchaseOrders(this.state.page);
        const purchaseOrderList: PurchaseOrderList[] = [];
        let previousTitle: string;
        let data: PurchaseOrder[];
        purchaseOrders.forEach((po, index, array) => {
            const dateAsString = DateTime.fromJSDate(po.plannedDeliveryDate!).toFormat('cccc dd MMMM');
            if (previousTitle != dateAsString) {
                if (previousTitle != undefined) {
                    purchaseOrderList.push({
                        title: previousTitle,
                        data: data,
                    });
                }
                previousTitle = dateAsString;
                data = [];
            }
            data.push(po);
            if (index == array.length - 1) {
                purchaseOrderList.push({
                    title: previousTitle,
                    data: data,
                });
            }
        });
        this.setState({
            waitingPurchaseOrders:
                this.state.page === 1 ? purchaseOrderList : [...this.state.waitingPurchaseOrders, ...purchaseOrderList],
            loading: false,
            refreshing: false,
        });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    didTapPurchaseOrder = async (props: { item: PurchaseOrder }): Promise<void> => {
        this.setState({
            showLoadingModal: true,
        });

        // Enregistrement de la liste en bdd locale
        const goodsReceiptList = new GoodsReceiptList();
        goodsReceiptList.name = `Réception ${props.item.partnerName} du ${DateTime.local().toLocaleString(
            DateTime.DATE_FULL,
        )}`;
        goodsReceiptList.purchaseOrderId = props.item.id ?? 0;
        goodsReceiptList.purchaseOrderName = props.item.name ?? 'Inconnu';
        goodsReceiptList.partnerId = props.item.partnerId ?? 0;
        goodsReceiptList.partnerName = props.item.partnerName ?? 'Inconnu';
        const savedList = await getRepository(GoodsReceiptList).save(goodsReceiptList);
        console.log(`goodsReceiptList saved with id ${savedList.id}`);

        // Récupération des détails de chaque ligne du bon de commande via Odoo
        const purchaseOrderLines = await Odoo.getInstance().fetchPurchaseOrderLinesForPurchaseOrder(props.item);
        const goodsReceiptEntries: GoodsReceiptEntry[] = [];
        purchaseOrderLines.forEach(poLine => {
            if (undefined === poLine.productId) {
                return;
            }

            const goodsReceiptEntry = new GoodsReceiptEntry();
            goodsReceiptEntry.list = savedList;
            goodsReceiptEntry.productName = poLine.name;
            goodsReceiptEntry.productId = poLine.productId;
            goodsReceiptEntry.packageQty = null;
            goodsReceiptEntry.productQtyPackage = null;
            goodsReceiptEntry.expectedPackageQty = poLine.packageQty ?? 0;
            goodsReceiptEntry.expectedProductQtyPackage = poLine.productQtyPackage ?? 0;
            goodsReceiptEntry.expectedProductQty = poLine.productQty ?? 0;
            goodsReceiptEntry.expectedProductUom = poLine.productUom ?? 0;

            goodsReceiptEntries.push(goodsReceiptEntry);
        });

        // Récupération des détails produit (name et barcode)
        const productIds: number[] = goodsReceiptEntries
            .map(entry => {
                return entry.productId!;
            })
            .filter(filterUnique);
        const odooProducts = await Odoo.getInstance().fetchProductFromIds(productIds);
        if (!odooProducts) {
            return;
        }

        // Récupération du supplierCode pour chaque produit
        const supplierInfos = await Odoo.getInstance().fetchProductSupplierInfoFromProductTemplateIds(
            odooProducts.map(p => (p.templateId ? p.templateId : 0)),
            goodsReceiptList.partnerId,
        );
        if (!supplierInfos) {
            return;
        }

        // Ajout des détails produits (nom, barcode, supplierCode) dans chaque Entry
        odooProducts.forEach(product => {
            /**
             * We iterate on all entries instead of using productId because some lines can be the same product
             * exemple: Apples are the same for us (same productId) but different species (names) for the supplier
             */
            goodsReceiptEntries.forEach(entry => {
                if (product.id === entry.productId) {
                    entry.productName = product.name;
                    entry.productBarcode = product.barcode;

                    if (product.templateId) {
                        const supplierCode = supplierInfos[product.templateId];
                        entry.productSupplierCode = '' === supplierCode ? supplierCode : null;
                    }
                }
            });
        });

        // Sauvegarde en bdd de chaque Entry
        await getRepository(GoodsReceiptEntry).save(Object.values(goodsReceiptEntries));

        Navigation.dismissModal(this.props.componentId);
    };

    renderLoadingModal(): React.ReactNode {
        if (this.state.showLoadingModal) {
            return (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        alignContent: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(52, 52, 52, 0.7)',
                    }}
                >
                    <View>
                        <ActivityIndicator size="large" />
                        <Text style={{ color: 'white', textAlign: 'center', marginTop: 8 }}>
                            Enregistrement du PO...
                        </Text>
                    </View>
                </View>
            );
        }
    }

    _renderFooter = (): React.ReactElement | null => {
        if (!this.state.loadingMore) return null;

        return (
            <View style={{ padding: 8 }}>
                <ActivityIndicator animating size="large" />
            </View>
        );
    };

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{ padding: 16 }}>
                <SectionList
                    style={{ backgroundColor: 'white' }}
                    sections={this.state.waitingPurchaseOrders}
                    keyExtractor={(item): string => {
                        if (item.id && item.id.toString()) {
                            return item.id.toString();
                        }
                        return '';
                    }}
                    renderSectionHeader={({ section: { title } }): React.ReactElement => (
                        <Text style={styles.listHeader}>{title}</Text>
                    )}
                    renderItem={({ item }): React.ReactElement => (
                        <ListItem
                            onPress={(): void => {
                                this.didTapPurchaseOrder({ item: item });
                            }}
                            bottomDivider
                        >
                            <Icon type="font-awesome-5" name="clipboard-list" />
                            <ListItem.Content>
                                <ListItem.Title>
                                    {item.plannedDeliveryDate &&
                                        DateTime.fromJSDate(item.plannedDeliveryDate).toFormat('dd MMMM')}{' '}
                                    - {item.name}
                                </ListItem.Title>
                                <ListItem.Subtitle>{item.partnerName}</ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    onEndReached={this._handleLoadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={10}
                    onRefresh={this._handleRefresh}
                    refreshing={this.state.refreshing}
                    ListFooterComponent={this._renderFooter}
                />
                {this.renderLoadingModal()}
            </SafeAreaView>
        );
    }
}
