import React from 'react';
import ActionSheet from 'react-native-action-sheet';
import {FlatList, Platform, SafeAreaView, Text, View} from 'react-native';
import {Icon, ListItem, ThemeProvider} from 'react-native-elements';
import {Navigation, NavigationComponent, Options} from 'react-native-navigation';
import {defaultScreenOptions} from '../../utils/navigation';
import BaseList from '../../entities/Lists/BaseList';
import InventoryList from '../../entities/Lists/InventoryList';
import GoodsReceiptList from '../../entities/Lists/GoodsReceiptList';
import LabelList from '../../entities/Lists/LabelList';
import Database from '../../utils/Database';

interface Props {
    componentId: string;
}
interface State {
    lists: BaseList[];
    refreshing: boolean;
    showHidden: boolean;
}

export default class ListsList extends NavigationComponent<Props, State> {
    static screenName = 'Lists/List';
    lists: Realm.Results<BaseList>;
    openedList: BaseList | undefined;

    theme = {
        Button: {
            iconContainerStyle: {marginRight: 5},
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        Navigation.events().registerModalDismissedListener(() => {
            this.loadData();
        });
        this.lists = Database.realm.objects<BaseList>('List');
        this.lists?.addListener(() => {
            console.log('database changed');
            this.setState(
                {
                    lists: [...this.lists],
                },
                () => {
                    if (this.openedList) {
                        Navigation.updateProps('INVENTORY_LIST_SHOW', {
                            list: this.openedList,
                        });
                    }
                },
            );
        });
        this.state = {
            lists: [...this.lists],
            refreshing: false,
            showHidden: false,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Listes');
        const topBar = options.topBar ?? {};
        topBar.rightButtons = [
            {
                id: 'list-new',
                text: 'Ajouter',
            },
        ];

        return options;
    }

    componentDidAppear(): void {
        this._handleRefresh();
        this.renderHideIcon();
    }

    componentWillUnmount(): void {
        this.lists?.removeAllListeners();
    }

    navigationButtonPressed({buttonId}: {buttonId: string}): void {
        if (buttonId === 'hide-toggle') {
            this.toggleHide();
        }
        if (buttonId === 'list-new') {
            this.openListNewModal();
        }
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

    openListNewModal = (): void => {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/NewStepType',
                        },
                    },
                ],
            },
        });
    };

    loadData(): void {
        this.setState({
            refreshing: false,
        });
    }

    deleteList(list: BaseList): void {
        Database.realm?.write(() => {
            Database.realm?.delete(list);
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

    componentNameFromList = (list: BaseList): string | undefined => {
        switch (list.constructor.name) {
            case InventoryList.name:
                return 'Lists/Inventory/Show';
            case GoodsReceiptList.name:
                return 'Lists/GoodsReceipt/Show';
            case LabelList.name:
                return 'Lists/Label/Show';

            default:
                return undefined;
        }
    };

    didTapList = (list: BaseList): void => {
        const componentName = this.componentNameFromList(list);

        if (undefined === componentName) {
            console.error('Undefined component name for list of type ' + list.constructor.name);
            return;
        }
        this.openedList = list;

        Navigation.push(this.props.componentId, {
            component: {
                name: componentName,
                id: 'INVENTORY_LIST_SHOW',
                passProps: {
                    list: list,
                },
            },
        });
    };

    didLongPressList = (list: BaseList): void => {
        const title = list.name;
        const buttonsIos = ['Supprimer', 'Annuler'];
        const buttonsAndroid = ['Supprimer'];
        const DESTRUCTIVE_INDEX = 0;
        const CANCEL_INDEX = 1;

        ActionSheet.showActionSheetWithOptions(
            {
                title: title,
                options: Platform.OS === 'ios' ? buttonsIos : buttonsAndroid,
                cancelButtonIndex: CANCEL_INDEX,
                destructiveButtonIndex: DESTRUCTIVE_INDEX,
                tintColor: 'blue',
            },
            buttonIndex => {
                if (buttonIndex === DESTRUCTIVE_INDEX) {
                    this.deleteList(list);
                }
            },
        );
    };

    renderHideIcon(): void {
        let icon;
        if (this.state.showHidden) {
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

    renderHiddenMessage(): React.ReactElement {
        if (!this.state.showHidden) {
            return (
                <View style={{padding: 10, margin: '3%', backgroundColor: '#17a2b8', borderRadius: 10}}>
                    <Text style={{color: 'white'}}>
                        Les réceptions déjà envoyées sont cachées. Pour les afficher, tapes l&apos;icône en forme
                        d&apos;œil en haut à gauche.
                    </Text>
                </View>
            );
        }
        return <View />;
    }

    renderEmptyList = (): React.ReactNode => {
        if (this.state.lists.length > 0) {
            return null;
        }
        return (
            <View style={{margin: '3%', padding: 10, backgroundColor: '#EEEEEE', borderRadius: 10}}>
                <Text style={{color: '#333333'}}>
                    Uh Oh ? Il semble que tu n&#39;aies encore fait aucune liste. Pour en démarrer une, tapes sur le
                    bouton en haut à droite !
                </Text>
            </View>
        );
    };

    _renderListItemSubtitle(list: BaseList): React.ReactElement | undefined {
        let subtitle: string;
        switch (list.constructor.name) {
            case InventoryList.name:
                subtitle = `Zone ${(list as InventoryList).zone}`;
                return <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>;
            default:
                return undefined;
        }
    }

    _renderEntry(list: BaseList): React.ReactElement {
        if (!list._id) {
            return <ListItem />;
        }
        return (
            <ListItem
                onPress={(): void => {
                    this.didTapList(list);
                }}
                onLongPress={(): void => {
                    this.didLongPressList(list);
                }}
                bottomDivider>
                <Icon type="font-awesome-5" name={list.icon()} />
                <ListItem.Content>
                    <ListItem.Title>{list.name}</ListItem.Title>
                    {this._renderListItemSubtitle(list)}
                </ListItem.Content>
                <ListItem.Content right>
                    <ListItem.Title right>{list.entries?.length}</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
            </ListItem>
        );
    }

    renderList(): React.ReactNode {
        if (this.state.lists.length === 0) {
            return this.renderEmptyList();
        }
        return (
            <FlatList
                style={{backgroundColor: 'white', height: '100%'}}
                data={this.state.lists.map(list => {
                    return {
                        key: list._id,
                        list: list,
                    };
                })}
                ListHeaderComponent={this.renderHiddenMessage()}
                renderItem={({item}): React.ReactElement => this._renderEntry(item.list)}
                // ListHeaderComponent={this.renderHeader}
                onRefresh={this._handleRefresh}
                refreshing={this.state.refreshing}
            />
        );
    }

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>{this.renderList()}</SafeAreaView>
            </ThemeProvider>
        );
    }
}
