import React from 'react';
import { View, Text, SafeAreaView, SectionList, EmitterSubscription, ScrollView } from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getConnection } from 'typeorm';
import GoodsReceiptService from '../../services/GoodsReceiptService';
import PurchaseOrder from '../../entities/Odoo/PurchaseOrder';
import moment from 'moment';
import styles from '../../styles/material';
import { ThemeProvider, ListItem, Button, Icon } from 'react-native-elements';

export interface GoodsReceiptListProps {
    componentId: string;
}

interface GoodsReceiptSessionsData {
    title: string;
    data: GoodsReceiptSession[];
}

interface GoodsReceiptListState {
    goodsReceiptsData: GoodsReceiptSessionsData[];
    todaysGoodsReceipts: PurchaseOrder[];
}

interface GoodsReceiptSessionTapProps {
    componentId: string;
    session: GoodsReceiptSession;
}

export default class GoodsReceiptList extends React.Component<GoodsReceiptListProps, GoodsReceiptListState> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome',
        },
    };

    modalDismissedListener?: EmitterSubscription;

    constructor(props: GoodsReceiptListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            goodsReceiptsData: [],
            todaysGoodsReceipts: [],
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Réceptions');
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
        this.loadTodaysGoodsReceipt();
    }

    componentDidMount(): void {
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadData();
        });

        this.loadData();
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
    }

    loadTodaysGoodsReceipt(): void {
        GoodsReceiptService.getInstance()
            .getPurchaseOrdersPlannedTodays()
            .then(purchaseOrders =>
                this.setState({
                    todaysGoodsReceipts: purchaseOrders,
                }),
            );
    }

    loadData(): void {
        const goodsReceiptSessionRepository = getConnection().getRepository(GoodsReceiptSession);
        goodsReceiptSessionRepository
            .find({
                order: {
                    createdAt: 'DESC',
                },
            })
            .then(goodsReceiptSessions => {
                const goodsReceiptSessionsData: GoodsReceiptSessionsData[] = [];
                let title: string;
                let data: GoodsReceiptSession[];
                goodsReceiptSessions.forEach((session, index, array) => {
                    if (!session.createdAt) {
                        return;
                    }
                    const dateAsString = moment(session.createdAt).format('Do MMMM YYYY');
                    if (title == undefined) {
                        title = dateAsString;
                        data = [];
                    }
                    if (title != dateAsString) {
                        goodsReceiptSessionsData.push({
                            title: title,
                            data: data,
                        });
                        title = dateAsString;
                        data = [];
                    }
                    data.push(session);
                    if (array.length - 1 == index) {
                        goodsReceiptSessionsData.push({
                            title: title,
                            data: data,
                        });
                    }
                });
                //console.log(goodsReceiptSessionsData);
                this.setState({
                    goodsReceiptsData: goodsReceiptSessionsData,
                });
            });
    }

    openNewGoodsReceiptSessionModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'GoodsReceipt/New',
                        },
                    },
                ],
            },
        });
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'receipt-new') {
            this.openNewGoodsReceiptSessionModal();
        }
    }

    didTapGoodsReceiptSessionItem = (props: GoodsReceiptSessionTapProps): void => {
        //console.log(props);
        Navigation.push(props.componentId, {
            component: {
                name: 'GoodsReceipt/Show',
                passProps: {
                    session: props.session,
                },
            },
        });
    };

    renderTodaysGoodsReceipts(): React.ReactNode {
        if (this.state.todaysGoodsReceipts.length > 0) {
            return (
                <View style={{ padding: 8, margin: 8, backgroundColor: '#17a2b8' }}>
                    <Text style={{ color: 'white' }}>
                        {this.state.todaysGoodsReceipts.length}{' '}
                        {this.state.todaysGoodsReceipts.length > 1 ? 'réceptions sont prévues' : 'réception est prévue'}{' '}
                        aujourd&apos;hui :{'\n'}
                        {this.state.todaysGoodsReceipts
                            .map(element => {
                                return '-  ' + element.partnerName + ' (' + element.name + ')';
                            })
                            .join('\n')}
                    </Text>
                </View>
            );
        }
    }

    renderItem = ({ item }: { item: GoodsReceiptSession }): React.ReactElement => {
        return (
            <ListItem
                onPress={(): void => {
                    const inventorySessionTapProps: GoodsReceiptSessionTapProps = {
                        componentId: this.props.componentId,
                        session: item,
                    };
                    this.didTapGoodsReceiptSessionItem(inventorySessionTapProps);
                }}
                title={item.poName}
                subtitle={item.partnerName}
                rightTitle={item.lastSentAt == undefined ? 'En cours' : 'Envoyé'}
                rightTitleStyle={{ color: item.lastSentAt == undefined ? 'black' : 'green' }}
                bottomDivider
                chevron
            />
        );
    };

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView style={{ height: '100%' }}>
                    <ScrollView>
                        {this.renderTodaysGoodsReceipts()}
                        <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'center' }}>
                            <Button
                                title=" Nouvelle réception"
                                icon={<Icon name="plus-circle" color="white" />}
                                onPress={this.openNewGoodsReceiptSessionModal}
                            />
                        </View>
                        <SectionList
                            scrollEnabled={false}
                            style={{ backgroundColor: 'white', height: '100%' }}
                            sections={this.state.goodsReceiptsData}
                            keyExtractor={(item): string => {
                                if (item.id && item.id.toString()) {
                                    return item.id.toString();
                                }
                                return '';
                            }}
                            renderSectionHeader={({ section: { title } }): React.ReactElement => (
                                <Text style={styles.listHeader}>{title}</Text>
                            )}
                            renderItem={this.renderItem}
                        />
                    </ScrollView>
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
