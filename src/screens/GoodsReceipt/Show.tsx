import React from 'react';
import { View, Text, SafeAreaView, FlatList, ScrollView } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getRepository } from 'typeorm';
import { Button, Icon, ListItem, ThemeProvider } from 'react-native-elements';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import moment from 'moment';

export interface GoodsReceiptShowProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptShowState {
    session: GoodsReceiptSession;
}

export default class GoodsReceiptShow extends React.Component<GoodsReceiptShowProps, GoodsReceiptShowState> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome',
        },
    };

    modalDismissedListener?: EventSubscription;

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
                relations: ['goodsReceiptEntries'],
            })
            .then((session): void => {
                //console.log(session);
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

    openGoodsReceiptScan(productBarcode?: string): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'GoodsReceipt/Scan',
                            passProps: {
                                preselectedProductBarcode: productBarcode,
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

    renderEntryQty(entry: GoodsReceiptEntry): React.ReactElement {
        let correctQty;
        if (false === entry.isValid()) {
            correctQty = (
                <Text>
                    {entry.productQty} {ProductProduct.quantityUnitAsString(entry.productUom)}
                </Text>
            );
        }
        return (
            <View>
                <Text style={{ textDecorationLine: false === entry.isValid() ? 'line-through' : 'none' }}>
                    {entry.expectedProductQty} {ProductProduct.quantityUnitAsString(entry.expectedProductUom)}
                </Text>
                {correctQty}
            </View>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{ height: '100%' }}>
                <ThemeProvider theme={this.theme}>
                    <ScrollView>
                        <View>
                            <Text style={{ fontSize: 25, margin: 5 }}>{this.props.session.partnerName}</Text>
                            <Text style={{ fontSize: 15, margin: 5 }}>
                                {this.props.session.poName} -{' '}
                                {moment(this.props.session.createdAt).format('DD MMMM YYYY')}
                            </Text>
                        </View>
                        <View
                            style={{
                                padding: 8,
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                                borderBottomWidth: 1,
                                borderBottomColor: '#CCCCCC',
                            }}
                        >
                            <Button
                                title=" Scanner"
                                onPress={(): void => {
                                    this.openGoodsReceiptScan();
                                }}
                                icon={<Icon name="barcode" color="white" />}
                            />
                            <Button
                                title=" Envoyer"
                                onPress={this.openGoodsReceiptExport}
                                icon={<Icon name="paper-plane" color="white" />}
                            />
                        </View>
                        <FlatList
                            scrollEnabled={false}
                            style={{ backgroundColor: 'white' }}
                            data={this.state.session.goodsReceiptEntries || []}
                            keyExtractor={(item): string => {
                                if (item.id && item.id.toString()) {
                                    return item.id.toString();
                                }
                                return '';
                            }}
                            renderItem={({ item }): React.ReactElement => (
                                <ListItem
                                    containerStyle={{ backgroundColor: this.itemBackgroundColor(item) }}
                                    title={item.productName}
                                    subtitle={item.productBarcode && item.productBarcode.toString()}
                                    rightElement={this.renderEntryQty(item)}
                                    onPress={(): void => {
                                        this.openGoodsReceiptScan(item.productBarcode);
                                    }}
                                    bottomDivider
                                />
                            )}
                        />
                    </ScrollView>
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
