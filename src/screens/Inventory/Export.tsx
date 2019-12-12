import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';
import CSVGenerator from '../../utils/CSVGenerator';
import Google, { MailAttachment } from '../../utils/Google';
import moment from 'moment';
import InventoryEntry from '../../entities/InventoryEntry';
import InventorySession from '../../entities/InventorySession';
import Icon from 'react-native-vector-icons/FontAwesome5';

export interface InventoryShowProps {
    componentId: string;
    inventory: InventorySession;
    inventoryEntries: Array<InventoryEntry>;
}

interface InventoryShowState {
    sendingMail: boolean;
    inventoryCheckPassed: boolean;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class InventoryShow extends React.Component<InventoryShowProps, InventoryShowState> {
    private inventoryEntries: Array<InventoryEntry> = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();
    private generatedCSV?: string;

    constructor(props: InventoryShowProps) {
        super(props);
        Navigation.events().bindComponent(this);

        this.state = {
            sendingMail: false,
            inventoryCheckPassed: false,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions("Envoi d'inventaire");
        options.topBar = {
            rightButtons: [
                {
                    id: 'cancel',
                    text: 'Fermer',
                },
            ],
        };

        return options;
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    componentDidMount(): void {
        this.checkInventory();
    }

    checkInventory(): void {
        InventoryEntryFactory.sharedInstance()
            .findForInventorySession(this.props.inventory)
            .then(inventoryEntries => {
                this.inventoryEntries = inventoryEntries;
                this.csvGenerator.exportInventorySession(this.props.inventory).then(csv => {
                    this.setState({
                        inventoryCheckPassed: true,
                    });
                    this.generatedCSV = csv;
                });
            });
    }

    sendInventory(): void {
        this.setState({
            sendingMail: true,
        });
        if (!this.props.inventory.lastModifiedAt) {
            throw new Error('Last Modified date unavailable');
        }
        const userFirstname = Google.getInstance().getFirstnameSlug();
        const zone = this.props.inventory.zone;
        const date = this.props.inventory.lastModifiedAt.format('DD/MM/YYYY');
        const time = this.props.inventory.lastModifiedAt.format('HH:mm:ss');

        const entriesCount = this.inventoryEntries.length;

        const notFoundInOdoo: Array<string> = [];
        this.inventoryEntries.forEach(inventoryEntry => {
            if (!inventoryEntry.isFetchedFromOdoo()) {
                notFoundInOdoo.push(`${inventoryEntry.articleBarcode} - ${inventoryEntry.articleName}`);
            }
        });
        const notFoundInOdooString = '- ' + notFoundInOdoo.join('\n- ');

        const to = 'inventaire@supercoop.fr';
        const subject = `[Zone ${zone}][${date}] Résultat d'inventaire`;
        let body = `Inventaire fait par ${userFirstname}, zone ${zone}, le ${date} à ${time}
${entriesCount} produits scannés`;

        if (notFoundInOdoo.length > 0) {
            body = body.concat(`
            
Attention, ces codes barre n'ont pas été trouvé dans Odoo:
${notFoundInOdooString}`);
        }

        const csvFilenameDateTime = this.props.inventory.lastModifiedAt.format('YYYYMMDDHHmmss');
        const csvFilename = `Zone${zone}_${userFirstname}-${csvFilenameDateTime}.csv`;
        const attachments: MailAttachment[] = [
            {
                filename: csvFilename,
                content: this.generatedCSV ? this.generatedCSV : 'Failed to generate CSV',
            },
        ];

        Google.getInstance()
            .sendEmail(to, subject, body, attachments)
            .then(() => {
                InventorySessionFactory.sharedInstance().updateLastSentAt(this.props.inventory, moment());
                Alert.alert('Envoyé', 'Le message est parti sur les Internets Mondialisés');
            })
            .catch((e: Error) => {
                if (__DEV__) {
                    console.error(e);
                }
                Alert.alert(
                    'ERREUR',
                    "Houston, quelchose s'est mal passé et le mail n'est pas parti... Mais on n'en sait pas plus :(",
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
        if (this.state.inventoryCheckPassed == null) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator size="small" color="#999999" style={{ paddingTop: 4, marginRight: 4 }} />
                    <Text>Création en cours</Text>
                </View>
            );
        }
        if (this.state.inventoryCheckPassed == true) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon name="check" color="green" style={{ paddingTop: 3, marginRight: 4 }} />
                    <Text style={{ color: 'green' }}>Prêt pour l&apos;envoi</Text>
                </View>
            );
        }
        if (this.state.inventoryCheckPassed == false) {
            inventoryCheck = (
                <View style={styles.checkResult}>
                    <Icon name="times" color="red" style={{ paddingTop: 3, marginRight: 4 }} />
                    <Text style={{ color: 'red' }}>Erreur !</Text>
                </View>
            );
        }

        return (
            <SafeAreaView style={{ backgroundColor: 'white', padding: 16 }}>
                <View>
                    <Text>
                        Tu es sur le point d&apos;envoyer ton inventaire du{' '}
                        {this.props.inventory.date && this.props.inventory.date.format('dddd DD MMMM YYYY')}, zone{' '}
                        {this.props.inventory.zone}. Il contient {this.props.inventoryEntries.length} article
                        {this.props.inventoryEntries.length > 1 ? 's' : ''}.
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text>État : </Text>
                        {inventoryCheck}
                    </View>
                    <Text>En tapant sur le bouton ci-dessous, il sera envoyé à l&apos;équipe inventaire :</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 16 }}>
                        <Button
                            onPress={(): void => this.sendInventory()}
                            title="Envoyer mon inventaire"
                            disabled={this.state.sendingMail || !this.state.inventoryCheckPassed}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
