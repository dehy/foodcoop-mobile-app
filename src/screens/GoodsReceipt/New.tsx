import React from 'react';
import { SafeAreaView, Text, View, SectionList, TouchableHighlight } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import Odoo from '../../utils/Odoo';
import PurchaseOrder from '../../entities/Odoo/PurchaseOrder';
import styles from '../../styles/material';
import moment from 'moment';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getRepository } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import Icon from 'react-native-vector-icons/FontAwesome5';

export interface GoodsReceiptNewProps {
    componentId: string;
}

interface PurchaseOrderList {
    title: string;
    data: PurchaseOrder[];
}

interface GoodsReceiptNewState {
    waitingPurchaseOrders: PurchaseOrderList[];
}

export default class GoodsReceiptNew extends React.Component<GoodsReceiptNewProps, GoodsReceiptNewState> {
    state: GoodsReceiptNewState = {
        waitingPurchaseOrders: [],
    };

    constructor(props: GoodsReceiptNewProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        const options = defaultScreenOptions('Nouvelle réception de marchandises');
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

    loadPurchaseOrdersFromOdoo(): void {
        Odoo.getInstance()
            .fetchWaitingPurchaseOrders()
            .then(purchaseOrders => {
                const purchaseOrderList: PurchaseOrderList[] = [];
                let previousTitle: string;
                let data: PurchaseOrder[];
                purchaseOrders.forEach((po, index) => {
                    const dateAsString = moment(po.plannedDeliveryDate!).format('Do MMMM YYYY');
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
                });
                this.setState({
                    waitingPurchaseOrders: purchaseOrderList,
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
                        const goodsReceiptEntries: { [id: number]: GoodsReceiptEntry } = {};
                        purchaseOrderLines.forEach(poLine => {
                            if (!poLine.productId) {
                                return;
                            }

                            const goodsReceiptEntry = new GoodsReceiptEntry();
                            goodsReceiptEntry.goodsReceiptSession = session;
                            goodsReceiptEntry.name = poLine.name;
                            goodsReceiptEntry.productId = poLine.productId;
                            goodsReceiptEntry.productUom = poLine.productUom;
                            goodsReceiptEntry.packageQty = poLine.packageQty;
                            goodsReceiptEntry.productQtyPackage = poLine.productQtyPackage;
                            goodsReceiptEntry.expectedProductQty = poLine.productQty;

                            goodsReceiptEntries[goodsReceiptEntry.productId] = goodsReceiptEntry;
                        });
                        const productIds: number[] = Object.keys(goodsReceiptEntries).map(value => {
                            return parseInt(value, 10)!;
                        });
                        Odoo.getInstance()
                            .fetchProductFromIds(productIds)
                            .then(products => {
                                if (!products) {
                                    return;
                                }
                                products.forEach(product => {
                                    console.log(product);
                                    const entry = goodsReceiptEntries[product.id!];
                                    entry.productName = product.name;
                                    entry.productBarcode = product.barcode;
                                });
                                console.log(goodsReceiptEntries);
                                getRepository(GoodsReceiptEntry)
                                    .save(Object.values(goodsReceiptEntries))
                                    .then(() => {
                                        Navigation.dismissModal(this.props.componentId);
                                    });
                            });
                    });
            });
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
                        <TouchableHighlight
                            onPress={(): void => {
                                this.didTapPurchaseOrder({ item: item });
                            }}
                            underlayColor="#FFFFFF"
                        >
                            <View style={styles.row}>
                                <Icon name="clipboard-list" style={styles.rowIcon} />
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>
                                        {item.plannedDeliveryDate && moment(item.plannedDeliveryDate).format('DD MMMM')}{' '}
                                        - {item.name}
                                    </Text>
                                    <Text style={styles.rowSubtitle}>{item.partnerName}</Text>
                                </View>
                                {/* <Text style={styles.rowDetailText}>{item.detailText}</Text> */}
                                <Icon name="info-circle" style={styles.rowActionIcon} />
                            </View>
                        </TouchableHighlight>
                    )}
                />
            </SafeAreaView>
        );
    }
}
