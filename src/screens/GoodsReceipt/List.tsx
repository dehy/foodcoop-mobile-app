import React from 'react';
import { View, Text, SafeAreaView, SectionList, EmitterSubscription, Platform, Alert } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import { getConnection } from 'typeorm';
import GoodsReceiptService from '../../services/GoodsReceiptService';
import PurchaseOrder from '../../entities/Odoo/PurchaseOrder';
import moment from 'moment';
import styles from '../../styles/material';
import { Icon, ThemeProvider, ListItem } from 'react-native-elements';
import AppLogger from '../../utils/AppLogger';

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
    showHidden: boolean;
    refreshing: boolean;
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
            type: 'font-awesome-5',
        },
    };

    modalDismissedListener?: EmitterSubscription;

    constructor(props: GoodsReceiptListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            goodsReceiptsData: [],
            todaysGoodsReceipts: [],
            showHidden: false,
            refreshing: true,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Mes réceptions');
        const topBar = options.topBar ?? {};
        topBar.rightButtons = [
            {
                id: 'goodsreceipt-new',
                text: 'Commencer',
            },
        ];

        return options;
    }

    componentDidAppear(): void {
        this.loadData();
        this.renderHideIcon();
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
        const whereOptions = this.state.showHidden ? {} : { hidden: false };
        goodsReceiptSessionRepository
            .find({
                order: {
                    createdAt: 'DESC',
                },
                where: whereOptions,
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
                    refreshing: false,
                });
            });
    }

    _handleRefresh = (): void => {
        this.setState(
            {
                refreshing: true,
            },
            () => {
                this.loadData();
            },
        );
    };

    renderHideIcon(): void {
        const showHidden = this.state.showHidden;
        let icon;
        if (showHidden === true) {
            icon = require('../../../assets/icons/eye-slash-regular.png');
        } else {
            icon = require('../../../assets/icons/eye-regular.png');
        }
        Navigation.mergeOptions(this.props.componentId, {
            topBar: {
                leftButtons: [
                    {
                        id: 'hide-toggle',
                        icon: icon,
                    },
                ],
            },
        });
    }

    toggleHide(): void {
        const showHidden = !this.state.showHidden;
        this.setState(
            {
                showHidden: showHidden,
            },
            () => {
                this.loadData();
                this.renderHideIcon();
            },
        );
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
        if (buttonId === 'hide-toggle') {
            this.toggleHide();
        }
        if (buttonId === 'goodsreceipt-new') {
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

    renderHiddenMessage(): React.ReactNode {
        return (
            <View style={{ padding: 8, margin: 8, backgroundColor: '#17a2b8' }}>
                <Text style={{ color: 'white' }}>
                    Des réceptions sont peut être cachées. Pour les afficher, taper l&apos;icone en forme d&apos;oeil en
                    haut à gauche.
                </Text>
            </View>
        );
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
                onLongPress={(): void => {
                    const optionsAndroid: string[] = [item.hidden ? 'Rétablir' : 'Cacher', 'Supprimer'];
                    const optionsIos: string[] = optionsAndroid;
                    optionsIos.push('Annuler');

                    ActionSheet.showActionSheetWithOptions(
                        {
                            options: Platform.OS == 'ios' ? optionsIos : optionsAndroid,
                            cancelButtonIndex: optionsIos.length - 1,
                        },
                        buttonIndex => {
                            AppLogger.getLogger().debug(`button clicked: ${buttonIndex}`);
                            if (Platform.OS == 'ios' && buttonIndex == optionsIos.length - 1) {
                                return;
                            }
                            const goodsReceiptSessionRepository = getConnection().getRepository(GoodsReceiptSession);
                            if (buttonIndex == 0) {
                                const hiddenStatus = !item.hidden;
                                item.hidden = hiddenStatus;
                                goodsReceiptSessionRepository.save(item).then(() => {
                                    this.loadData();
                                });
                            }
                            if (buttonIndex == 1) {
                                Alert.alert(
                                    "Suppression d'une réception",
                                    `Es-tu vraiment sûr(e) de vouloir supprimer la réception de ${item.partnerName} (${item.poName}) ?`,
                                    [
                                        { text: 'Non' },
                                        {
                                            text: 'Oui, supprimer',
                                            onPress: (): void => {
                                                GoodsReceiptService.getInstance()
                                                    .deleteSession(item)
                                                    .then(() => {
                                                        this.loadData();
                                                    });
                                            },
                                        },
                                    ],
                                );
                            }
                        },
                    );
                }}
                bottomDivider
            >
                <ListItem.Content>
                    {item.hidden ? <Icon type="font-awesome-5" name="eye-slash" /> : null}
                    <ListItem.Title>{item.poName}</ListItem.Title>
                    <ListItem.Subtitle>{item.partnerName}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Content right>
                    <ListItem.Title right style={{ color: item.lastSentAt == undefined ? 'black' : 'green' }}>
                        {item.lastSentAt == undefined ? 'En cours' : 'Envoyé'}
                    </ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
            </ListItem>
        );
    };

    renderHeader = (): React.ReactElement => {
        return (
            <View>
                {this.renderTodaysGoodsReceipts()}
                {this.renderHiddenMessage()}
            </View>
        );
    };

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView style={{ height: '100%' }}>
                    <SectionList
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
                        ListHeaderComponent={this.renderHeader}
                        onRefresh={this._handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
