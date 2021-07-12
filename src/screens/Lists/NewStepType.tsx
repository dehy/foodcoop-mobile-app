import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { FlatList, GestureResponderEvent, SafeAreaView, SectionList, View } from 'react-native';
import { Icon, ListItem, Text, ThemeProvider } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import { ListType, ListTypeIcon, ListTypeLabel } from '../../entities/Lists/BaseList';
import { defaultScreenOptions } from '../../utils/navigation';

type Props = {
    componentId: string;
}

type State = {

}

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

    didTapTypeItem = (type: ListType): void => {
        let componentName: string | undefined = undefined;
        switch (type) {
            case ListType.inventory:
                componentName = 'Lists/NewStepInventory';
                break;
            case ListType.goodsReceipt:
                componentName = 'Lists/NewStepGoodsReceipt';
                break;
            default:
                break;
        }
        if (undefined === componentName) {
            throw Error("Empty component name");
        }
        Navigation.push(this.props.componentId, {
            component: {
                name: componentName,
            },
        });
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <View style={{padding: 10}}>
                        <Text>Pour quelle activité souhaites-tu créer une liste ?
                            Cela va influer sur les outils mis à ta disposition pour
                            remplir cette liste.</Text>
                    </View>
                    <FlatList
                        data={Object.values(ListType).map((type: ListType) => {
                            return {
                                id: type,
                                title: ListTypeLabel.get(type),
                                icon: ListTypeIcon.get(type),
                            }
                        })}
                        renderItem={({item}) => (
                            <ListItem onPress={(e) => {
                                this.didTapTypeItem(item.id)
                            }}>
                                { item.icon ? (<Icon name={item.icon} style={{width: 28}}/>) : null }
                                <ListItem.Content>
                                    <ListItem.Title>{ item.title }</ListItem.Title>
                                </ListItem.Content>
                                <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                            </ListItem>
                        )}
                    />
                </SafeAreaView>
            </ThemeProvider>
        )
    }
}