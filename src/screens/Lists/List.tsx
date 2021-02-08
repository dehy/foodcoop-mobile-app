import React from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { ListItem, ThemeProvider } from 'react-native-elements';
import { Navigation, NavigationComponent, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { getConnection } from 'typeorm';
import List from '../../entities/List';

interface Props {
    componentId: string;
}
interface State {
    ListsData: List[];
    refreshing: boolean;
}

interface ListTapProps {
    componentId: string;
    list: List;
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
        const modalDismissedListener = Navigation.events().registerModalDismissedListener(({ componentId, modalsDismissed }) => {
            console.log(componentId, modalsDismissed);
        });
        this.state = {
            ListsData: [],
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
    }

    loadData(): void {
        console.debug('loadData()');
        const listRepository = getConnection().getRepository(List);
        const whereOptions = {}
        listRepository
            .find({
                order: {
                    createdAt: 'DESC',
                },
                where: whereOptions,
            })
            .then(async lists => {
                this.setState({
                    ListsData: lists,
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

    renderEmptyList = (): React.ReactNode => {
        if (this.state.ListsData.length > 0) {
            return null;
        }
        return (
            <View style={{margin: '3%', padding: 10, backgroundColor: '#EEEEEE', borderRadius: 10}}>
                <Text style={{color: '#333333'}}>Uh Oh ? Il semble que tu n'aies encore fait aucune liste. Pour en démarrer une,
                tappes sur le bouton en haut à droite !</Text>
            </View>
        );
    }

    render(): React.ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    {this.renderEmptyList()}
                    <FlatList
                        style={{ backgroundColor: 'white', height: '100%' }}
                        data={this.state.ListsData}
                        renderItem={({ item }): React.ReactElement => (
                            <ListItem
                                onPress={(): void => {
                                    const ListTapProps: ListTapProps = {
                                        componentId: this.props.componentId,
                                        list: item,
                                    };
                                    //this.didTapList(ListTapProps);
                                }}
                                bottomDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>{item.name}</ListItem.Title>
                                    <ListItem.Subtitle>{item.type}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Content right>
                                    <ListItem.Title right>{item.listEntries?.length ?? '0'}</ListItem.Title>
                                </ListItem.Content>
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            </ListItem>
                        )}
                        // ListHeaderComponent={this.renderHeader}
                        onRefresh={this._handleRefresh}
                        refreshing={this.state.refreshing}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}