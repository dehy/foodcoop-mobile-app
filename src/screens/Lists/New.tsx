import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { FlatList, SafeAreaView, SectionList } from 'react-native';
import { Icon, ListItem, Text, ThemeProvider } from 'react-native-elements';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';

type Props = {
    componentId: string;
}

type State = {

}

export default class ListsNew extends React.Component<Props, State> {
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
        topBar.rightButtons = [
            {
                id: 'create',
                text: 'Créer',
            },
        ];

        return options;
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <ListItem>
                        <ListItem.Content>
                            <ListItem.Title>Nom</ListItem.Title>
                        </ListItem.Content>
                        <ListItem.Content right>
                            <ListItem.Input placeholder="Nom"></ListItem.Input>
                        </ListItem.Content>
                    </ListItem>
                    <ListItem>
                        <ListItem.Content>
                            <ListItem.Title>Type</ListItem.Title>
                        </ListItem.Content>
                        <ListItem.Content right>
                            <ListItem.Subtitle>Libre</ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Chevron type="font-awesome-5" name="chevron-right"/>
                    </ListItem>
                </SafeAreaView>
            </ThemeProvider>
        )
    }
}