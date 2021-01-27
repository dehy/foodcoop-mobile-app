import React from 'react';
import { SafeAreaView, Text, View, SectionList, ActivityIndicator } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import Odoo from '../../utils/Odoo';
import PurchaseOrder from '../../entities/Odoo/PurchaseOrder';
import styles from '../../styles/material';
import moment from 'moment';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getRepository } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import { Icon, ListItem } from 'react-native-elements';
import { filterUnique } from '../../utils/helpers';

export interface GoodsReceiptNewProps {
    componentId: string;
}

interface PurchaseOrderList {
    title: string;
    data: PurchaseOrder[];
}

interface GoodsReceiptNewState {
    waitingPurchaseOrders: PurchaseOrderList[];
    showLoadingModal: boolean;
    page: number;
    loading: boolean;
    loadingMore: boolean;
    refreshing: boolean;
}

export default class GoodsReceiptNew extends React.Component<GoodsReceiptNewProps, GoodsReceiptNewState> {
    state: GoodsReceiptNewState = {
        waitingPurchaseOrders: [],
        showLoadingModal: false,
        page: 1,
        loading: true,
        loadingMore: false,
        refreshing: true,
    };

    constructor(props: GoodsReceiptNewProps) {
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

    _handleRefresh = () => {
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

    loadPurchaseOrdersFromOdoo(): void {
        Odoo.getInstance()
            .fetchWaitingPurchaseOrders(this.state.page)
            .then(purchaseOrders => {
                const purchaseOrderList: PurchaseOrderList[] = [];
                let previousTitle: string;
                let data: PurchaseOrder[];
                purchaseOrders.forEach((po, index, array) => {
                    const dateAsString = moment(po.plannedDeliveryDate!).format('dddd Do MMMM YYYY');
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
                        this.state.page === 1
                            ? purchaseOrderList
                            : [...this.state.waitingPurchaseOrders, ...purchaseOrderList],
                    loading: false,
                    refreshing: false,
                });
            });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    didTapPurchaseOrder = (props: { item: PurchaseOrder }): void => {
        this.setState({
            showLoadingModal: true,
        });
        const goodsReceiptSession = new GoodsReceiptSession();
        goodsReceiptSession.poId = props.item.id;
        goodsReceiptSession.poName = props.item.name;
        goodsReceiptSession.partnerId = props.item.partnerId;
        goodsReceiptSession.partnerName = props.item.partnerName;
        getRepository(GoodsReceiptSession)
            .save(goodsReceiptSession)
            .then(session => {
                console.log(`goodsReceiptSession saved with id ${session.id}`);
                Odoo.getInstance()
                    .fetchPurchaseOrderLinesForPurchaseOrder(props.item)
                    .then(purchaseOrderLines => {
                        const goodsReceiptEntries: GoodsReceiptEntry[] = [];
                        purchaseOrderLines.forEach(poLine => {
                            if (!poLine.productId) {
                                return;
                            }

                            const goodsReceiptEntry = new GoodsReceiptEntry();
                            goodsReceiptEntry.goodsReceiptSession = session;
                            goodsReceiptEntry.name = poLine.name;
                            goodsReceiptEntry.productId = poLine.productId;
                            goodsReceiptEntry.expectedPackageQty = poLine.packageQty;
                            goodsReceiptEntry.expectedProductQtyPackage = poLine.productQtyPackage;
                            goodsReceiptEntry.expectedProductQty = poLine.productQty;
                            goodsReceiptEntry.expectedProductUom = poLine.productUom;

                            goodsReceiptEntries.push(goodsReceiptEntry);
                        });
                        const productIds: number[] = goodsReceiptEntries
                            .map(entry => {
                                return entry.productId!;
                            })
                            .filter(filterUnique);
                        Odoo.getInstance()
                            .fetchProductFromIds(productIds)
                            .then(products => {
                                if (!products) {
                                    return;
                                }
                                products.forEach(product => {
                                    /**
                                     * We iterate on all entries instead of using productId because some lines can be the same product
                                     * exemple: Apples are the same for us (same productId) but different species (names) for the supplier
                                     */
                                    goodsReceiptEntries.forEach(entry => {
                                        if (product.id === entry.productId) {
                                            entry.productName = product.name;
                                            entry.productBarcode = product.barcode;
                                        }
                                    });
                                });

                                Odoo.getInstance()
                                    .fetchProductSupplierInfoFromProductTemplateIds(
                                        products.map(p => (p.templateId ? p.templateId : 0)),
                                        goodsReceiptSession.partnerId!,
                                    )
                                    .then(res => {
                                        if (res) {
                                            products.forEach(product => {
                                                // We can only iterate, see above comment
                                                goodsReceiptEntries.forEach(entry => {
                                                    if (product.id === entry.productId) {
                                                        entry.productSupplierCode = res[product.templateId!];
                                                    }
                                                });
                                            });
                                        }
                                        getRepository(GoodsReceiptEntry)
                                            .save(Object.values(goodsReceiptEntries))
                                            .then(() => {
                                                Navigation.dismissModal(this.props.componentId);
                                            });
                                    });
                            });
                    });
            });
    };

    renderLoadingModal(): React.ReactNode {
        if (this.state.showLoadingModal == true) {
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
        return;
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
                                    {item.plannedDeliveryDate && moment(item.plannedDeliveryDate).format('DD MMMM')} -{' '}
                                    {item.name}
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
