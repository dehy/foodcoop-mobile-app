import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, SectionList, View } from 'react-native';
import { Button, Icon, Input, ListItem, Text, ThemeProvider } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import PurchaseOrder from '../../entities/Odoo/PurchaseOrder';
import Odoo from '../../utils/Odoo';
import moment from 'moment';
import styles from '../../styles/material';

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

interface PurchaseOrderList {
    title: string;
    data: PurchaseOrder[];
}

export default class ListsNewStepGoodsReceipt extends React.Component<Props, State> {
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
        let options = defaultScreenOptions('Nouvelle réception');
        let topBar = options.topBar ?? {};
        topBar.rightButtons = [{
            id: 'filter',
            text: 'Filtrer',
        }];
        options.topBar = topBar;

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

    _renderHeader = (): React.ReactElement | null => {
        return (
            <View>
                {/* <View style={{flexDirection: 'row', paddingVertical: 10}}>
                    <Button title="Trier" type="outline" />
                    <Button title="Filtrer" type="outline" />
                </View> */}
                {/* <DeliveryIcon height={200} width="100%" style={{ padding: 10 }} /> */}
                
            </View>
        );
    };

    _renderFooter = (): React.ReactElement | null => {
        if (!this.state.loadingMore) return null;

        return (
            <View style={{ padding: 8 }}>
                <ActivityIndicator animating size="large" />
            </View>
        );
    };

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
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
                                    //this.didTapPurchaseOrder({ item: item });
                                }}
                                bottomDivider
                            >
                                <Icon type="font-awesome-5" name="clipboard-list" />
                                <ListItem.Content>
                                    <ListItem.Title>
                                        {item.plannedDeliveryDate && moment(item.plannedDeliveryDate).format('DD MMMM')}{' '}
                                        - {item.name}
                                    </ListItem.Title>
                                    <ListItem.Subtitle>{item.partnerName}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            </ListItem>
                        )}
                        onEndReached={this._handleLoadMore}
                        onEndReachedThreshold={0.5}
                        initialNumToRender={10}
                        onRefresh={this._handleRefresh}
                        refreshing={this.state.refreshing}
                        ListHeaderComponent={this._renderHeader}
                        ListFooterComponent={this._renderFooter}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
