import React from 'react';
import {ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {Button, Icon} from 'react-native-elements';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Navigation, Options} from 'react-native-navigation';
import CSVGenerator from '../../../utils/CSVGenerator';
import SupercoopSignIn from '../../../utils/SupercoopSignIn';
import Mailjet, {MailAttachment} from '../../../utils/Mailjet';
import merge from 'deepmerge';
import InventoryList from '../../../entities/Lists/InventoryList';
import InventoryEntry from '../../../entities/Lists/InventoryEntry';
import {DateTime} from 'luxon';
import Database from '../../../utils/Database';

export interface Props {
    componentId: string;
    inventory: InventoryList;
}

interface State {
    sendingMail: boolean;
    inventoryCheckPassed: boolean | undefined;
    filepath?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class ListsInventoryExport extends React.Component<Props, State> {
    static screenName = 'Lists/Inventory/Export';

    private inventoryEntries: InventoryEntry[] = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            sendingMail: false,
            inventoryCheckPassed: undefined,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions("Envoi d'inventaire");
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
        this.checkInventory();
    }

    async checkInventory(): Promise<void> {
        const filepath = await this.csvGenerator.exportInventoryList(this.props.inventory);
        this.setState({
            filepath: filepath,
            inventoryCheckPassed: true,
        });
    }

    async sendInventory(): Promise<void> {
        this.setState({
            sendingMail: true,
        });
        if (!this.props.inventory.lastModifiedAt) {
            throw new Error('Last Modified date unavailable');
        }
        const lastModifiedAt = DateTime.fromJSDate(this.props.inventory.lastModifiedAt);
        if (!this.state.filepath) {
            throw new Error('File not generated');
        }
        const signInService = SupercoopSignIn.getInstance();
        const username = signInService.getName();
        const zone = this.props.inventory.zone;
        const date = lastModifiedAt.toLocaleString(DateTime.DATE_SHORT);
        const time = lastModifiedAt.toLocaleString(DateTime.TIME_24_WITH_SECONDS);

        const entriesCount = this.inventoryEntries.length;

        const notFoundInOdoo: Array<string> = [];
        this.inventoryEntries.forEach(inventoryEntry => {
            if (!inventoryEntry.barcodeFoundInOdoo()) {
                notFoundInOdoo.push(`${inventoryEntry.barcode} - ${inventoryEntry.name}`);
            }
        });
        const notFoundInOdooString = '- ' + notFoundInOdoo.join('\n- ');

        const to = 'inventaire@supercoop.fr';
        const subject = (__DEV__ ? '[Test]' : '') + `[Zone ${zone}][${date}] Résultat d'inventaire`;
        let body = `Inventaire fait par ${username}, zone ${zone}, le ${date} à ${time}
${entriesCount} produits scannés`;

        if (notFoundInOdoo.length > 0) {
            body = body.concat(`
            
Attention, ces codes barre n'ont pas été trouvé dans Odoo:
${notFoundInOdooString}`);
        }

        const attachments: MailAttachment[] = [await Mailjet.filepathToAttachment(this.state.filepath)];

        Mailjet.getInstance()
            .sendEmail(to, '', subject, body, attachments)
            .then(() => {
                if (!this.props.inventory._id) {
                    return;
                }
                Database.realm.write(() => {
                    this.props.inventory.lastSentAt = new Date();
                    Alert.alert('Envoyé', 'Le message est parti sur les Internets Mondialisés');

                    this.setState({
                        sendingMail: false,
                    });
                });
            })
            .catch((e: Error) => {
                if (__DEV__) {
                    console.error(e);
                }
                Alert.alert(
                    'ERREUR',
                    "Houston, quelque chose s'est mal passé et le mail n'est pas parti... Mais on n'en sait pas plus :(",
                );
            });
    }

    render(): React.ReactNode {
        let inventoryCheck = null;
        if (this.state.inventoryCheckPassed === null) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator size="small" color="#999999" style={{paddingTop: 4, marginRight: 4}} />
                    <Text>Création en cours</Text>
                </View>
            );
        }
        if (this.state.inventoryCheckPassed === true) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="check" color="green" style={{paddingTop: 3, marginRight: 4}} />
                    <Text style={{color: 'green'}}>Prêt pour l&apos;envoi</Text>
                </View>
            );
        }
        if (this.state.inventoryCheckPassed === false) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="times" color="red" style={{paddingTop: 3, marginRight: 4}} />
                    <Text style={{color: 'red'}}>Erreur !</Text>
                </View>
            );
        }
        const createdAt = DateTime.fromJSDate(this.props.inventory.createdAt);

        return (
            <SafeAreaView style={{backgroundColor: 'white'}}>
                <View style={{padding: 16}}>
                    <Text>
                        Tu es sur le point d&apos;envoyer ton inventaire du{' '}
                        {createdAt.toLocaleString(DateTime.DATE_FULL)}, zone {this.props.inventory.zone}. Il contient{' '}
                        {this.props.inventory.entries?.length} article
                        {this.props.inventory.entries?.length ?? 0 > 1 ? 's' : ''}.
                    </Text>
                    <View style={{flexDirection: 'row'}}>
                        <Text>État : </Text>
                        {inventoryCheck}
                    </View>
                    <Text>En tapant sur le bouton ci-dessous, il sera envoyé à l&apos;équipe inventaire :</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'center', margin: 16}}>
                        <Button
                            onPress={(): void => {
                                this.sendInventory();
                            }}
                            title="Envoyer mon inventaire"
                            disabled={this.state.sendingMail || !this.state.inventoryCheckPassed}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
