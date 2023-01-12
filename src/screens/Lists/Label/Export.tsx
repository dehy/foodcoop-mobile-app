import React from 'react';
import {ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {Button, Icon} from '@rneui/themed';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Navigation, Options} from 'react-native-navigation';
import CSVGenerator from '../../../utils/CSVGenerator';
import SupercoopSignIn from '../../../utils/SupercoopSignIn';
import Mailjet, {MailAttachment} from '../../../utils/Mailjet';
import merge from 'deepmerge';
import LabelList from '../../../entities/Lists/LabelList';
import LabelEntry from '../../../entities/Lists/LabelEntry';
import {DateTime} from 'luxon';
import Database from '../../../utils/Database';

export interface Props {
    componentId: string;
    label: LabelList;
    labelEntries: Array<LabelEntry>;
}

interface State {
    sendingMail: boolean;
    labelCheckPassed: boolean;
    filepath?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class ListsLabelExport extends React.Component<Props, State> {
    static screenName = 'Lists/Label/Export';

    private labelEntries: Array<LabelEntry> = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            sendingMail: false,
            labelCheckPassed: false,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Envoi');
        const buttons = {
            topBar: {
                leftButtons: [
                    {
                        id: 'cancel',
                        text: 'Annuler',
                    },
                ],
            },
        };

        return merge(options, buttons);
    }

    navigationButtonPressed({buttonId}: {buttonId: string}): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    componentDidMount(): void {
        this.checkLabel();
    }

    async checkLabel(): Promise<void> {
        this.labelEntries = this.props.labelEntries ?? [];
        const csvData: {[key: string]: string}[] = [];
        this.labelEntries.forEach(entry => {
            csvData.push({
                Nom: entry.productName ?? '',
                Barcode: entry.productBarcode ?? '',
            });
        });
        const filepath = await this.csvGenerator.generateCSVFile('etiquettes.csv', csvData);
        this.setState({
            filepath: filepath,
            labelCheckPassed: true,
        });
    }

    async sendMail(): Promise<void> {
        this.setState({
            sendingMail: true,
        });
        if (!this.props.label.lastModifiedAt) {
            throw new Error('Last Modified date unavailable');
        }
        if (!this.state.filepath) {
            throw new Error('File not generated');
        }
        const signInService = SupercoopSignIn.getInstance();
        const username = signInService.getName();
        const date = this.props.label.lastModifiedAt.toLocaleString(DateTime.DATE_SHORT);
        const time = this.props.label.lastModifiedAt.toLocaleString(DateTime.TIME_24_WITH_SECONDS);

        const entriesCount = this.labelEntries.length;

        const to = 'etiquette@supercoop.fr';
        const subject = (__DEV__ ? '[Test]' : '') + `[${date}] ${this.props.label.name}`;
        let body = `Liste effectuée par ${username}, le ${date} à ${time}
${entriesCount} étiquettes scannées`;

        const attachments: MailAttachment[] = [await Mailjet.filepathToAttachment(this.state.filepath)];

        Mailjet.getInstance()
            .sendEmail(to, '', subject, body, attachments)
            .then(() => {
                if (!this.props.label.id) {
                    return;
                }
                Database.sharedInstance()
                    .dataSource.getRepository(LabelList)
                    .update(this.props.label.id, {_lastSentAt: new Date()});
                Alert.alert('Envoyé', 'La liste a été envoyé !');
            })
            .catch((e: Error) => {
                if (__DEV__) {
                    console.error(e);
                }
                Alert.alert(
                    'ERREUR',
                    "Houston, quelque chose s'est mal passé et le mail n'est pas parti... Mais on n'en sait pas plus :(",
                );
            })
            .finally(() => {
                this.setState({
                    sendingMail: false,
                });
            });
    }

    render(): React.ReactNode {
        let labelCheck = null;
        if (this.state.labelCheckPassed === null) {
            labelCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator size="small" color="#999999" style={{paddingTop: 4, marginRight: 4}} />
                    <Text>Création en cours</Text>
                </View>
            );
        }
        if (this.state.labelCheckPassed === true) {
            labelCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="check" color="green" style={{paddingTop: 3, marginRight: 4}} />
                    <Text style={{color: 'green'}}>Prêt pour l&apos;envoi</Text>
                </View>
            );
        }
        if (this.state.labelCheckPassed === false) {
            labelCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="times" color="red" style={{paddingTop: 3, marginRight: 4}} />
                    <Text style={{color: 'red'}}>Erreur !</Text>
                </View>
            );
        }

        return (
            <SafeAreaView style={{backgroundColor: 'white'}}>
                <View style={{padding: 16}}>
                    <Text>
                        Tu es sur le point d&apos;envoyer la liste d'étiquettes du{' '}
                        {this.props.label.createdAt && this.props.label.createdAt.toLocaleString(DateTime.DATE_FULL)}.
                        Elle contient {this.props.labelEntries.length} étiquette
                        {this.props.labelEntries.length > 1 ? 's' : ''}.
                    </Text>
                    <View style={{flexDirection: 'row'}}>
                        <Text>État : </Text>
                        {labelCheck}
                    </View>
                    <Text>
                        En tapant sur le bouton ci-dessous, il sera envoyé à l&apos;adresse etiquette@supercoop.fr :
                    </Text>
                    <View style={{flexDirection: 'row', justifyContent: 'center', margin: 16}}>
                        <Button
                            onPress={(): void => {
                                this.sendMail();
                            }}
                            title="Envoyer la liste"
                            disabled={this.state.sendingMail || !this.state.labelCheckPassed}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
