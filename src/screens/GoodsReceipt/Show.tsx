import React from 'react';
import { View, Text, TouchableHighlight, SafeAreaView, FlatList } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import styles from '../../styles/material';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getConnection } from 'typeorm';
import Icon from 'react-native-vector-icons/FontAwesome5';

export interface GoodsReceiptShowProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptShowState {
    entries: GoodsReceiptEntry[];
}

export default class GoodsReceiptShow extends React.Component<GoodsReceiptShowProps, GoodsReceiptShowState> {
    constructor(props: GoodsReceiptShowProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            entries: [],
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
        // this.loadData();
    }

    loadData(): void {
        const goodsReceiptEntryRepository = getConnection().getRepository(GoodsReceiptEntry);
        goodsReceiptEntryRepository
            .createQueryBuilder('entry')
            .where('entry.goodsReceiptSession = :session', { session: this.props.session.id })
            .getMany()
            .then(goodsReceiptEntries => {
                console.log(goodsReceiptEntries);
                this.setState({
                    entries: goodsReceiptEntries,
                });
            });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        // if (buttonId === "receipt-new") {
        //   this.openNewGoodsReceiptSessionModal();
        // }
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

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'center' }}>
                    <Icon.Button name="barcode" solid style={{}} onPress={this.openGoodsReceiptScan}>
                        Démarrer le comptage
                    </Icon.Button>
                </View>
                <FlatList
                    style={{ backgroundColor: 'white', height: '100%' }}
                    data={this.state.entries}
                    keyExtractor={(item): string => {
                        if (item.id && item.id.toString()) {
                            return item.id.toString();
                        }
                        return '';
                    }}
                    renderItem={({ item }) => (
                        <TouchableHighlight
                            onPress={(): void => {
                                // let inventorySessionTapProps: GoodsReceiptSessionTapProps = {
                                //   componentId: this.props.componentId,
                                //   item: item
                                // };
                                // this.didTapGoodsReceiptSessionItem(inventorySessionTapProps);
                            }}
                            underlayColor="#BCBCBC"
                        >
                            <View style={styles.row}>
                                {/* <Icon name={item.lastSentAt == undefined ? "clipboard-list" : "clipboard-check"} style={styles.rowIcon} /> */}
                                <Text style={styles.rowIcon}>{item.expectedProductQty}</Text>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>{item.productName}</Text>
                                    <Text style={styles.rowSubtitle}>
                                        {item.productBarcode && item.productBarcode.toString()}
                                    </Text>
                                </View>
                                {/* <Text style={styles.rowDetailText}>{item.expectedProductQty} {item.productUom}</Text> */}
                            </View>
                        </TouchableHighlight>
                    )}
                />
            </SafeAreaView>
        );
    }
}
