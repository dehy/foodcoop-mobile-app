import React, { ReactText } from 'react';
import ActionSheet from 'react-native-action-sheet';
import { FlatList, Platform, SafeAreaView, Text, View } from 'react-native';
import { Icon, ListItem, ThemeProvider } from 'react-native-elements';
import { Navigation, NavigationComponent, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { getConnection } from 'typeorm';
import BaseList from '../../entities/Lists/BaseList';
import InventoryList from '../../entities/Lists/InventoryList';
import GoodsReceiptList from '../../entities/Lists/GoodsReceiptList';
import BaseEntry from '../../entities/Lists/BaseEntry';

interface EntriesCountList {
    [listId: string]: number;
}

interface Props {
    componentId: string;
}
interface State {
    lists: BaseList[];
    listsEntriesCounts: EntriesCountList;
    refreshing: boolean;
}

export default class ListsList extends NavigationComponent<Props, State> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
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
        this.state = {
            lists: [],
            refreshing: false,
            listsEntriesCounts: {},
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

    componentDidMount(): void {
        this._handleRefresh();
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'list-new') {
            this.openListNewModal();
        }
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
        const listRepository = getConnection().getRepository(BaseList);
        const whereOptions = {};
        listRepository
            .find({
                order: {
                    _createdAt: 'DESC',
                },
                where: whereOptions,
            })
            .then(async lists => {
                const queryResult = await getConnection()
                    .getRepository(BaseEntry)
                    .createQueryBuilder('entries')
                    .select('listId, COUNT(id) as entries')
                    .groupBy('listId')
                    .getRawMany();
                const entriesCount: EntriesCountList = {};
                for (const result of queryResult) {
                    entriesCount[result['listId']] = result['entries'];
                }
                this.setState({
                    lists: lists,
                    refreshing: false,
                    listsEntriesCounts: entriesCount,
                });
            });
    }

    deleteGoodsReceiptList(list: BaseList): void {
        if (!list.id) {
            return;
        }
        getConnection()
            .getRepository(BaseList)
            .delete(list.id)
            .then(() => {
                this.loadData();
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

    componentNameFromList = (list: BaseList): ReactText | undefined => {
        switch (list.constructor.name) {
            case InventoryList.name:
                return 'Lists/Inventory/Show';
            case GoodsReceiptList.name:
                return 'Lists/GoodsReceipt/Show';

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

        Navigation.push(this.props.componentId, {
            component: {
                name: componentName,
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
                options: Platform.OS == 'ios' ? buttonsIos : buttonsAndroid,
                cancelButtonIndex: CANCEL_INDEX,
                destructiveButtonIndex: DESTRUCTIVE_INDEX,
                tintColor: 'blue',
            },
            buttonIndex => {
                if (buttonIndex == DESTRUCTIVE_INDEX) {
                    this.deleteGoodsReceiptList(list);
                }
            },
        );
    };

    renderEmptyList = (): React.ReactNode => {
        if (this.state.lists.length > 0) {
            return null;
        }
        return (
            <View style={{ margin: '3%', padding: 10, backgroundColor: '#EEEEEE', borderRadius: 10 }}>
                <Text style={{ color: '#333333' }}>
                    Uh Oh ? Il semble que tu n&#39;aies encore fait aucune liste. Pour en démarrer une, tapes sur le
                    bouton en haut à droite !
                </Text>
            </View>
        );
    };

    _renderEntry(item: BaseList): React.ReactElement {
        console.log(item.constructor.name);
        if (!item.id) {
            return <ListItem></ListItem>;
        }
        return (
            <ListItem
                onPress={(): void => {
                    this.didTapList(item);
                }}
                onLongPress={(): void => {
                    this.didLongPressList(item);
                }}
                bottomDivider
            >
                <Icon type="font-awesome-5" name={item.icon()} />
                <ListItem.Content>
                    <ListItem.Title>{item.name}</ListItem.Title>
                </ListItem.Content>
                <ListItem.Content right>
                    <ListItem.Title right>{this.state.listsEntriesCounts[item.id] ?? '0'}</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
            </ListItem>
        );
    }

    renderList(): React.ReactNode {
        if (this.state.lists.length <= 0) {
            return this.renderEmptyList();
        }
        return (
            <FlatList
                style={{ backgroundColor: 'white', height: '100%' }}
                data={this.state.lists.map(list => {
                    return {
                        key: list.id?.toString(),
                        list: list,
                    };
                })}
                renderItem={({ item }): React.ReactElement => this._renderEntry(item.list)}
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
