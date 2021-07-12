import React, { ReactText } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { ListItem, ThemeProvider } from 'react-native-elements';
import { Navigation, NavigationComponent, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { getConnection } from 'typeorm';
import BaseList from '../../entities/Lists/BaseList';
import InventoryList from '../../entities/Lists/InventoryList';

interface Props {
    componentId: string;
}
interface State {
    lists: BaseList[];
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
        const modalDismissedListener = Navigation.events().registerModalDismissedListener(
            ({ componentId, modalsDismissed }) => {
                this.loadData();
            },
        );
        this.state = {
            lists: [],
            refreshing: false,
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

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'list-new') {
            this.openListNewModal();
        }
    }

    openListNewModal = () => {
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
                console.log(lists);
                this.setState({
                    lists: lists,
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

    componentNameFromList = (list: BaseList): ReactText | undefined => {
        switch (list.constructor.name) {
            case InventoryList.name:
                return 'Lists/ShowInventory';

            default:
                return undefined;
        }
    };

    didTapList = (list: BaseList): void => {
        const listId = list.id;
        const componentName = this.componentNameFromList(list);

        if (undefined === componentName) {
            console.error('Undefined component name for list of type ' + list.constructor.name);
            return;
        }

        Navigation.push(this.props.componentId, {
            component: {
                name: componentName,
                passProps: {
                    listId: listId,
                },
            },
        });
    };

    renderEmptyList = (): React.ReactNode => {
        if (this.state.lists.length > 0) {
            return null;
        }
        return (
            <View style={{ margin: '3%', padding: 10, backgroundColor: '#EEEEEE', borderRadius: 10 }}>
                <Text style={{ color: '#333333' }}>
                    Uh Oh ? Il semble que tu n'aies encore fait aucune liste. Pour en démarrer une, tappes sur le bouton
                    en haut à droite !
                </Text>
            </View>
        );
    };

    _renderEntry(item: BaseList): React.ReactElement {
        console.log(item.constructor.name);
        return (
            <ListItem
                onPress={(): void => {
                    this.didTapList(item);
                }}
                bottomDivider
            >
                <ListItem.Content>
                    <ListItem.Title>{item.name}</ListItem.Title>
                    <ListItem.Subtitle>{item.typeLabel}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Content right>
                    <ListItem.Title right>{item.entries?.length ?? '0'}</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
            </ListItem>
        );
    }

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    {this.renderEmptyList()}
                    <FlatList
                        style={{ backgroundColor: 'white', height: '100%' }}
                        data={this.state.lists}
                        renderItem={({ item }): React.ReactElement => this._renderEntry(item)}
                        // ListHeaderComponent={this.renderHeader}
                        onRefresh={this._handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
