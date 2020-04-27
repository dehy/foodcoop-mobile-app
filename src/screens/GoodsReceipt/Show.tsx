import React from 'react';
import { View, Text, SafeAreaView, FlatList, ScrollView, Alert } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getRepository } from 'typeorm';
import { ListItem, ThemeProvider, SearchBar } from 'react-native-elements';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import moment from 'moment';
import { displayNumber } from '../../utils/helpers';

export interface GoodsReceiptShowProps {
    componentId: string;
    session: GoodsReceiptSession;
    arrayHolder: [];
}

interface GoodsReceiptShowState {
    session: GoodsReceiptSession;
    filter: string;
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

    arrayholder: GoodsReceiptEntry[] = [];

    constructor(props: GoodsReceiptShowProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            session: props.session,
            filter: '',
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('');
        const topBar = options.topBar ?? {};
        topBar.rightButtons = [
            {
                id: 'export',
                icon: require('../../../assets/icons/paper-plane-regular.png'),
            },
            {
                id: 'scan',
                icon: require('../../../assets/icons/barcode-read-regular.png'),
            },
            {
                id: 'add-extra',
                icon: require('../../../assets/icons/cart-plus-regular.png'),
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
                relations: ['goodsReceiptEntries'],
            })
            .then((session): void => {
                //console.log(session);
                if (!session) {
                    throw new Error('Session not found');
                }
                if (session.goodsReceiptEntries) {
                    this.arrayholder = session.goodsReceiptEntries;
                }
                this.setState({
                    session,
                });
            });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
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
                                session: this.state.session,
                            },
                        },
                    },
                ],
            },
        });
    };

    searchExtraItem(): void {
        Alert.alert('Développement en cours');
    }

    itemBackgroundColor(entry: GoodsReceiptEntry): string {
        if (true === entry.isValid()) {
            return '#5cb85c';
        }
        if (false === entry.isValid()) {
            return '#d9534f';
        }
        return 'transparent';
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

    searchFilterFunction(text: string): void {
        this.setState({
            filter: text,
        });

        const newData = this.arrayholder.filter(item => {
            const textData = text.toUpperCase();
            return item.productName ? item.productName.toUpperCase().indexOf(textData) > -1 : 0;
        });

        const newSession: GoodsReceiptSession = this.state.session;
        newSession.goodsReceiptEntries = newData;

        this.setState({
            session: newSession,
        });
    }

    renderHeader = (): React.ReactElement => {
        return (
            <SearchBar
                placeholder="Filter ici ..."
                lightTheme
                round
                onChangeText={(text: string): void => this.searchFilterFunction(text)}
                autoCorrect={false}
                value={this.state.filter}
            />
        );
    };

    renderEntryQty(entry: GoodsReceiptEntry): React.ReactElement {
        let correctQty;
        if (false === entry.isValid()) {
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
                        fontSize: false === entry.isValid() ? 12 : 16,
                        textDecorationLine: false === entry.isValid() ? 'line-through' : 'none',
                    }}
                >
                    {displayNumber(entry.expectedProductQty)}{' '}
                    {ProductProduct.quantityUnitAsString(entry.expectedProductUom)}
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
                            <Text style={{ fontSize: 15, margin: 5, fontStyle: 'italic' }}>
                                {this.props.session.poName} -{' '}
                                {moment(this.props.session.createdAt).format('DD MMMM YYYY')}
                            </Text>
                        </View>
                        <FlatList
                            scrollEnabled={false}
                            style={{ backgroundColor: 'white' }}
                            data={this.orderedReceiptEntries(this.state.session.goodsReceiptEntries)}
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
                                    subtitle={
                                        item.productBarcode ? item.productBarcode.toString() : 'Pas de code barre'
                                    }
                                    subtitleStyle={item.productBarcode ? undefined : { fontStyle: 'italic' }}
                                    rightElement={this.renderEntryQty(item)}
                                    onPress={(): void => {
                                        this.openGoodsReceiptScan(item.productId);
                                    }}
                                    topDivider
                                />
                            )}
                            ListHeaderComponent={this.renderHeader}
                        />
                    </ScrollView>
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
