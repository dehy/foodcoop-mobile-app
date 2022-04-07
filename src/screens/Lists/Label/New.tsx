import {DateTime} from 'luxon';
import React, {ReactNode} from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {Button, Input, ThemeProvider} from 'react-native-elements';
import {Navigation, Options} from 'react-native-navigation';
import {defaultScreenOptions} from '../../../utils/navigation';
import LabelList from '../../../entities/Lists/LabelList';
import Database from '../../../utils/Database';

type Props = {
    componentId: string;
};

type State = {
    listTitle: string;
};

export default class ListsLabelNew extends React.Component<Props, State> {
    static screenName = 'Lists/Label/New';

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
        this.state = {
            listTitle: `Étiquettes du ${DateTime.local().toFormat('d LLLL')}`,
        };
    }

    static options(): Options {
        return defaultScreenOptions("Liste d'étiquettes");
    }

    updateLabelListTitle = (newTitle: string): void => {
        this.setState({
            listTitle: newTitle,
        });
    };

    createListAndDismiss = (): void => {
        const list = new LabelList();
        list.name = this.state.listTitle;

        Database.sharedInstance()
            .dataSource.getRepository(LabelList)
            .save(list)
            .then(savedList => {
                console.log(savedList);
                Navigation.dismissModal(this.props.componentId);
            });
    };

    render(): ReactNode {
        return (
            <ThemeProvider theme={this.theme}>
                <SafeAreaView>
                    <Text style={{margin: 12}}>
                        Une liste d'étiquettes permet de lister des étiquettes à imprimer ou réimprimer en scannant les
                        produits directement. Il est ainsi plus facile ensuite de faire des copier/coller depuis le PC.
                    </Text>
                    <Input
                        label="Nom de la liste"
                        value={this.state.listTitle}
                        onChangeText={this.updateLabelListTitle}
                    />
                    <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                        <Button
                            title="Commencer la liste"
                            style={{margin: 20}}
                            onPress={(): void => {
                                this.createListAndDismiss();
                            }}
                        />
                    </View>
                </SafeAreaView>
            </ThemeProvider>
        );
    }
}
