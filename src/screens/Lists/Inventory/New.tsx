import {DateTime} from 'luxon';
import React, {ReactNode} from 'react';
import {Alert, SafeAreaView, ScrollView, View} from 'react-native';
import {Button, ListItem, ThemeProvider} from 'react-native-elements';
import {Navigation, Options} from 'react-native-navigation';
import {defaultScreenOptions} from '../../../utils/navigation';
import InventoryList from '../../../entities/Lists/InventoryList';
import Database from '../../../utils/Database';

type Props = {
    componentId: string;
};

type State = {};

export default class ListsInventoryNew extends React.Component<Props, State> {
    static screenName = 'Lists/Inventory/New';

    theme = {
        Button: {
            iconContainerStyle: {marginRight: 5},
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };
    zoneValue: string | undefined;
    dateValue: DateTime = DateTime.local();

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        return defaultScreenOptions('Nouvel Inventaire');
    }

    createListAndDismiss = (): void => {
        if (undefined === this.zoneValue) {
            Alert.alert('Le numéro de zone est manquante. Merci de le saisir.');
            return;
        }

        const name = `Inventaire du ${DateTime.local().toFormat('d LLLL')}`;

        const list = new InventoryList(name, this.zoneValue);
        console.debug(list);

        Database.realm?.write(() => {
            Database.realm?.create('List', list);
            Navigation.dismissModal(this.props.componentId);
        });
    };

    render(): ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <ScrollView>
                        <ListItem>
                            <ListItem.Content>
                                <ListItem.Title>Zone</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <ListItem.Input
                                    placeholder="Zone"
                                    autoFocus={true}
                                    onChangeText={(text): void => {
                                        this.zoneValue = text;
                                    }}
                                    blurOnSubmit={true}
                                    keyboardType="number-pad"
                                />
                            </ListItem.Content>
                        </ListItem>
                        <ListItem>
                            <ListItem.Content>
                                <ListItem.Title>Date</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <ListItem.Title style={{width: '150%', textAlign: 'right'}}>
                                    {this.dateValue.setLocale('fr-fr').toLocaleString(DateTime.DATETIME_SHORT)}
                                </ListItem.Title>
                            </ListItem.Content>
                        </ListItem>
                        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                            <Button
                                title="Commencer l'inventaire"
                                style={{margin: 20}}
                                onPress={(): void => {
                                    this.createListAndDismiss();
                                }}
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
