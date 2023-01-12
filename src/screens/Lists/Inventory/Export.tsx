import React from 'react';
import {ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {Button, Icon} from '@rneui/themed';
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
    inventoryEntries: Array<InventoryEntry>;
}

interface State {
    sendingMail: boolean;
    inventoryCheckPassed: boolean | null;
    filepath?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class ListsInventoryExport extends React.Component<Props, State> {
    static screenName = 'Lists/Inventory/Export';

    private inventoryEntries: Array<InventoryEntry> = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            sendingMail: false,
            inventoryCheckPassed: null,
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
        this.inventoryEntries = this.props.inventoryEntries ?? [];
        const filepath = await this.csvGenerator.exportInventoryList(this.props.inventory, this.props.inventoryEntries);
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
        if (!this.state.filepath) {
            throw new Error('File not generated');
        }
        const signInService = SupercoopSignIn.getInstance();
        const username = signInService.getName();
        const zone = this.props.inventory.zone;
        const date = this.props.inventory.lastModifiedAt.toLocaleString(DateTime.DATE_SHORT);
        const time = this.props.inventory.lastModifiedAt.toLocaleString(DateTime.TIME_24_WITH_SECONDS);

        const entriesCount = this.inventoryEntries.length;

        const notFoundInOdoo: Array<string> = [];
        this.inventoryEntries.forEach(inventoryEntry => {
            if (!inventoryEntry.barcodeFoundInOdoo()) {
                notFoundInOdoo.push(`${inventoryEntry.productBarcode} - ${inventoryEntry.productName}`);
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
                if (!this.props.inventory.id) {
                    return;
                }
                Database.sharedInstance()
                    .dataSource.getRepository(InventoryList)
                    .update(this.props.inventory.id, {_lastSentAt: new Date()});
                Alert.alert('Envoyé', 'Le message est parti sur les Internets Mondialisés');
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

        return (
            <SafeAreaView style={{backgroundColor: 'white'}}>
                <View style={{padding: 16}}>
                    <Text>
                        Tu es sur le point d&apos;envoyer ton inventaire du{' '}
                        {this.props.inventory.createdAt &&
                            this.props.inventory.createdAt.toLocaleString(DateTime.DATE_FULL)}
                        , zone {this.props.inventory.zone}. Il contient {this.props.inventoryEntries.length} article
                        {this.props.inventoryEntries.length > 1 ? 's' : ''}.
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
