import { Picker } from '@react-native-picker/picker';
import { DateTime } from 'luxon';
import React from 'react';
import { FlatList, SafeAreaView, ScrollView, SectionList, View } from 'react-native';
import { Button, Input, ListItem, Text, ThemeProvider } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import List, { ListType, ListTypeLabel } from '../../entities/List';
import { defaultScreenOptions } from '../../utils/navigation';
import InventoryIcon from '../../../assets/svg/017-inventory.svg';
import { getConnection } from 'typeorm';

type Props = {
    componentId: string;
};

type State = {};

export default class ListsNewStepInventory extends React.Component<Props, State> {
    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };
    zoneValue: number | undefined;
    dateValue: DateTime = DateTime.utc();

    submitButton: Button | undefined;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        return defaultScreenOptions('Nouvel Inventaire');
    }

    createListAndDismiss = (): void => {
        if (undefined !== this.submitButton) {
            console.log('TODO: disable button');
        }

        const list = new List();
        list.type = ListType.inventory;
        list.name = `Inventaire`;

        getConnection()
            .getRepository(List)
            .save(list)
            .then(() => {
                Navigation.dismissModal(this.props.componentId);
            });
    };

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <ScrollView>
                        <InventoryIcon height={120} width="100%" style={{ padding: 10 }} />
                        <ListItem>
                            <ListItem.Content>
                                <ListItem.Title>Zone</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <ListItem.Input
                                    placeholder="Zone"
                                    autoFocus={true}
                                    onChangeText={text => {
                                        this.zoneValue = parseInt(text);
                                    }}
                                    blurOnSubmit={true}
                                    onSubmitEditing={e => {}}
                                />
                            </ListItem.Content>
                        </ListItem>
                        <ListItem>
                            <ListItem.Content>
                                <ListItem.Title>Date</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <ListItem.Title style={{ width: '150%', textAlign: 'right' }}>
                                    {this.dateValue.setLocale('fr-fr').toLocaleString(DateTime.DATETIME_SHORT)}
                                </ListItem.Title>
                            </ListItem.Content>
                        </ListItem>
                        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                            <Button
                                title="Commencer l'inventaire"
                                style={{ margin: 20 }}
                                onPress={() => {
                                    this.createListAndDismiss();
                                }}
                                ref={ref => {
                                    this.submitButton = ref ?? undefined;
                                }}
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
