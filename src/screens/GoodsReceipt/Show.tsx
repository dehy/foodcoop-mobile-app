import React from 'react';
import { View, Text, TouchableWithoutFeedback, SafeAreaView, FlatList } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import styles from '../../styles/material';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getRepository } from 'typeorm';
import Icon from 'react-native-vector-icons/FontAwesome5';
import ProductProduct from '../../entities/Odoo/ProductProduct';

export interface GoodsReceiptShowProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptShowState {
    session: GoodsReceiptSession;
}

export default class GoodsReceiptShow extends React.Component<GoodsReceiptShowProps, GoodsReceiptShowState> {
    constructor(props: GoodsReceiptShowProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            session: props.session,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('');
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
        this.loadData();
    }

    loadData(): void {
        getRepository(GoodsReceiptSession)
            .findOne(this.props.session.id, {
                relations: ['goodsReceiptEntries'],
            })
            .then((session): void => {
                console.log(session);
                if (!session) {
                    throw new Error('Session not found');
                }
                this.setState({
                    session,
                });
            });
    }

    // navigationButtonPressed({ buttonId }: { buttonId: string }): void {
    //     if (buttonId === "receipt-new") {
    //       this.openNewGoodsReceiptSessionModal();
    //     }
    // }

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

    openGoodsReceiptScan(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'GoodsReceipt/Scan',
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
                            name: 'GoodsReceipt/Export',
                            passProps: {
                                session: this.state.session,
                            },
                        },
                    },
                ],
            },
        });
    };

    itemBackgroundColor(entry: GoodsReceiptEntry): string {
        if (true === entry.isValid()) {
            return '#5cb85c';
        }
        if (false === entry.isValid()) {
            return '#d9534f';
        }
        return 'transparent';
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{ height: '100%' }}>
                <View>
                    <Text>{this.props.session.partnerName}</Text>
                </View>
                <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'space-around' }}>
                    <Icon.Button name="barcode" solid style={{}} onPress={this.openGoodsReceiptScan}>
                        Scanner
                    </Icon.Button>
                    <Icon.Button name="file-export" solid style={{}} onPress={this.openGoodsReceiptExport}>
                        Envoyer
                    </Icon.Button>
                </View>
                <FlatList
                    style={{ backgroundColor: 'white' }}
                    data={this.state.session.goodsReceiptEntries || []}
                    keyExtractor={(item): string => {
                        if (item.id && item.id.toString()) {
                            return item.id.toString();
                        }
                        return '';
                    }}
                    renderItem={({ item }): React.ReactElement => (
                        <TouchableWithoutFeedback
                            onPress={(): void => {
                                // let inventorySessionTapProps: GoodsReceiptSessionTapProps = {
                                //   componentId: this.props.componentId,
                                //   item: item
                                // };
                                // this.didTapGoodsReceiptSessionItem(inventorySessionTapProps);
                            }}
                        >
                            <View style={[styles.row, { backgroundColor: this.itemBackgroundColor(item) }]}>
                                {/* <Icon name={item.lastSentAt == undefined ? "clipboard-list" : "clipboard-check"} style={styles.rowIcon} /> */}
                                {/* <Text style={styles.rowIcon}>{item.expectedProductQty}</Text> */}
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>{item.productName}</Text>
                                    <Text style={styles.rowSubtitle}>
                                        {item.productBarcode && item.productBarcode.toString()}
                                    </Text>
                                </View>
                                <Text style={styles.rowDetailText}>
                                    {item.expectedProductQty} {ProductProduct.quantityUnitAsString(item.productUom)}
                                </Text>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                />
            </SafeAreaView>
        );
    }
}
