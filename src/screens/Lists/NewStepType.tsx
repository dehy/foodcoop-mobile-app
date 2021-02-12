import React from 'react';
import { FlatList, SafeAreaView, View } from 'react-native';
import { Icon, ListItem, Text, ThemeProvider } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import InventoryList from '../../entities/Lists/InventoryList';
import BaseList from '../../entities/Lists/BaseList';
import { defaultScreenOptions } from '../../utils/navigation';

type Props = {
    componentId: string;
};

type State = {};

export const RegisteredListTypes = [
    InventoryList,
];

export default class ListsNewStepType extends React.Component<Props, State> {
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
    }

    static options(): Options {
        const options = defaultScreenOptions('Nouvelle liste');
        const topBar = options.topBar ?? {};
        topBar.leftButtons = [
            {
                id: 'cancel',
                text: 'Annuler',
            },
        ];
        options.topBar = topBar;

        return options;
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    didTapTypeItem = (listType: typeof BaseList): void => {
        let componentName: string | undefined = undefined;
        switch (listType) {
            case InventoryList:
                componentName = 'Lists/Inventory/New';
                break;
            default:
                break;
        }
        if (undefined === componentName) {
            throw Error('Empty component name');
        }
        Navigation.push(this.props.componentId, {
            component: {
                name: componentName,
            },
        });
    };

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <View style={{ padding: 10 }}>
                        <Text>
                            Pour quelle activité souhaites-tu créer une liste ? Cela va influer sur les outils mis à ta
                            disposition pour remplir cette liste.
                        </Text>
                    </View>
                    <FlatList
                        data={RegisteredListTypes.map((type) => {
                            return {
                                key: type.name,
                                listType: type,
                            }
                        })}
                        renderItem={({ item }) => (
                            <ListItem
                                onPress={() => {
                                    this.didTapTypeItem(item.listType);
                                }}
                            >
                                <Icon type='font-awesome-5' name={item.listType.icon} />
                                <ListItem.Content>
                                    <ListItem.Title>{item.listType.label}</ListItem.Title>
                                </ListItem.Content>
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            </ListItem>
                        )}
                    />
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
