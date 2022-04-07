import React from 'react';
import {ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, View, ScrollView} from 'react-native';
import {Button, ThemeProvider, ListItem, Icon} from 'react-native-elements';
import AlertAsync from 'react-native-alert-async';
import {Navigation, Options} from 'react-native-navigation';
import moment from 'moment';
import Dialog from 'react-native-dialog';
import ActionSheet from 'react-native-action-sheet';
import {defaultScreenOptions} from '../../../utils/navigation';
import CSVGenerator, {CSVData} from '../../../utils/CSVGenerator';
import Mailjet, {MailAttachment} from '../../../utils/Mailjet';
import GoodsReceiptEntry from '../../../entities/Lists/GoodsReceiptEntry';
import ListAttachment from '../../../entities/Lists/ListAttachment';
import GoodsReceiptList from '../../../entities/Lists/GoodsReceiptList';
import SupercoopSignIn from '../../../utils/SupercoopSignIn';
import {asyncFilter} from '../../../utils/helpers';
import {DateTime} from 'luxon';
import Database from '../../../utils/Database';

export interface Props {
    componentId: string;
    list: GoodsReceiptList;
}

interface State {
    isSendingMail: boolean;
    filePath?: string | false;
    selectedGamme?: string;
    senderNameDialogVisible: boolean;
    senderName?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default class ListsGoodsReceiptExport extends React.Component<Props, State> {
    static screenName = 'Lists/GoodsReceipt/Export';

    private receiptEntries: GoodsReceiptEntry[] = [];
    private images: ListAttachment[] = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();
    private senderNameInput?: string;

    private gammes: {[k: string]: string} = {
        'Groupe Achats': 'achats@supercoop.fr',
        'Gamme Boisson': 'gamme-boisson@supercoop.fr',
        'Gamme Droguerie': 'gamme-droguerie@supercoop.fr',
        'Gamme Épicerie': 'gamme-epicerie@supercoop.fr',
        'Gamme Frais': 'gamme-frais@supercoop.fr',
        'Gamme Fruits et Légumes': 'gamme-fruits-et-legumes@supercoop.fr',
        'Gamme Viandes et Poissons': 'gamme-viandes-et-poissons@supercoop.fr',
    };

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);

        this.receiptEntries = (props.list.entries as GoodsReceiptEntry[]) || [];
        this.images = props.list.attachments || [];

        this.state = {
            isSendingMail: false,
            senderName: SupercoopSignIn.getInstance().getName(),
            senderNameDialogVisible: false,
        };
    }

    static options(): Options {
        const options = defaultScreenOptions('Envoi');
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

    navigationButtonPressed({buttonId}: {buttonId: string}): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    componentDidMount(): void {
        Database.sharedInstance()
            .dataSource.getRepository(GoodsReceiptList)
            .findOne({
                where: {
                    id: this.props.list.id,
                },
                relations: {
                    entries: true,
                    attachments: true,
                },
            })
            .then((session): void => {
                if (!session) {
                    throw new Error('Session not found');
                }
                this.receiptEntries = (session.entries as GoodsReceiptEntry[]) ?? [];
                this.images = session.attachments ?? [];

                this.generateCSVFile().then(filePath => {
                    this.setState({
                        filePath,
                    });
                });
            });
    }

    chooseRecipient = (): void => {
        const recipientsAndroid: string[] = Object.keys(this.gammes);
        const recipientsIos: string[] = recipientsAndroid;
        recipientsIos.push('Cancel');

        ActionSheet.showActionSheetWithOptions(
            {
                options: Platform.OS === 'ios' ? recipientsIos : recipientsAndroid,
                cancelButtonIndex: recipientsIos.length - 1,
            },
            buttonIndex => {
                this.setState({
                    selectedGamme: Object.keys(this.gammes)[buttonIndex],
                });
            },
        );
    };

    async generateCSVFile(): Promise<string> {
        const sessionData: CSVData[] = [];
        this.receiptEntries?.forEach(entry => {
            if (!entry.productBarcode || entry.expectedProductQty === undefined || !entry.productName) {
                throw new Error('Missing mandatory entry parameters');
            }
            const entryData: CSVData = {
                status: entry.getStatus().toString(),
                product: entry.productName,
                supplierCode: entry.productSupplierCode,
                expectedQty: entry.expectedProductQty,
                receivedQty: entry.quantity,
                expectedUom: entry.expectedProductUom,
                receivedUom: entry.unit,
                expectedPackageQty: entry.expectedPackageQty, // Colisage (nombre de produits par colis)
                receivedPackageQty: entry.packageQty,
                expectedProductQtyPackage: entry.expectedProductQtyPackage, // Nombre de colis
                receivedProductQtyPackage: entry.productQtyPackage,
                comment: entry.comment,
                barcode: entry.productBarcode,
            };
            sessionData.push(entryData);
        });

        const csvFilenameDateTime = this.props.list.lastModifiedAt?.toFormat('YYYYMMDDHHmmss');
        const csvFilename = `reception-${this.props.list.purchaseOrderName}-${csvFilenameDateTime}.csv`;
        return this.csvGenerator.generateCSVFile(csvFilename, sessionData);
    }

    async sendReceipt(): Promise<void> {
        this.setState({
            isSendingMail: true,
        });
        if (!this.props.list.lastModifiedAt) {
            throw new Error('Last Modified date unavailable');
        }
        if (!this.state.selectedGamme) {
            throw new Error('Recipient Gamme has not been selected');
        }
        if (!this.state.filePath) {
            throw new Error('File is not available !');
        }
        const userEmail = SupercoopSignIn.getInstance().getEmail();
        const userName = this.state.senderName;
        const poName = this.props.list.purchaseOrderName;
        const partnerName = this.props.list.partnerName;
        const date = this.props.list.lastModifiedAt.toLocaleString(DateTime.DATE_SHORT);
        const time = this.props.list.lastModifiedAt.toLocaleString(DateTime.TIME_24_WITH_SECONDS);

        const entriesCount = this.receiptEntries.length;

        const to = this.gammes[this.state.selectedGamme];
        const cc = 'stockin@supercoop.fr';
        const subject = `[${poName}][${partnerName}] Rapport de livraison`;
        const body = `Réception de livraison faite par ${userName} <${userEmail}>.

PO: ${poName}
Fournisseur: ${partnerName}
Réception effectuée le: ${date} à ${time}
${entriesCount} produits traités`;

        Mailjet.getInstance()
            .sendEmail(to, cc, subject, body, await this.getMailAttachments())
            .then(async () => {
                this.props.list.lastSentAt = DateTime.local();
                await Database.sharedInstance().dataSource.getRepository(GoodsReceiptList).save(this.props.list);
                AlertAsync('Envoyé', 'Ton compte-rendu a bien été envoyé. Merci !').then(() => {
                    Navigation.dismissModal(this.props.componentId);
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
            })
            .finally(() => {
                this.setState({
                    isSendingMail: false,
                });
            });
    }

    getMailAttachments = async (): Promise<MailAttachment[]> => {
        // TODO pourquoi la génération du nom du fichier est dupliqué ? Voir ligne 153
        const csvFilenameDateTime = this.props.list.lastModifiedAt?.toFormat('YYYYMMDDHHmmss');
        const csvFilename = `reception-${this.props.list.purchaseOrderName}-${csvFilenameDateTime}.csv`;

        const attachments: MailAttachment[] = await asyncFilter(this.images, async (image: ListAttachment) => {
            if (image.path && image.name) {
                return Mailjet.filepathToAttachment(image.path, image.name);
            }
        });

        if (this.state.filePath) {
            attachments.push(await Mailjet.filepathToAttachment(this.state.filePath, csvFilename));
        }

        return attachments;
    };

    buttonTitle = (): string => {
        if (this.state.isSendingMail) {
            return "Envoi en cours ... Merci de patienter, l'envoi peut être long en fonction du nombre de pièces jointes";
        }
        return 'Envoyer maintenant';
    };

    isReady = (): boolean => {
        if (this.state.filePath && this.state.selectedGamme) {
            return true;
        }
        return false;
    };

    renderAlreadySent(): React.ReactNode {
        if (this.props.list.lastSentAt) {
            return (
                <View style={{padding: 8, margin: 8, marginBottom: 0, backgroundColor: '#17a2b8'}}>
                    <Text style={{color: 'white'}}>
                        Cette réception a déjà été envoyée le {this.props.list.lastSentAt?.toLocaleString()}
                    </Text>
                </View>
            );
        }
    }

    render(): React.ReactNode {
        let ReceiptCheck: React.ReactElement | undefined;

        if (this.state.filePath === undefined) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator size="small" color="#999999" style={{marginRight: 4}} />
                    <Text>Création en cours</Text>
                </View>
            );
        }
        if (this.state.filePath) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="check" color="green" style={{marginRight: 4}} />
                    <Text style={{color: 'green'}}>Prêt pour l&apos;envoi</Text>
                </View>
            );
        }
        if (this.state.filePath === false) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <Icon type="font-awesome-5" name="times" color="red" style={{marginRight: 4}} />
                    <Text style={{color: 'red'}}>Erreur !</Text>
                </View>
            );
        }

        return (
            <SafeAreaView style={{backgroundColor: 'white', height: '100%'}}>
                <ThemeProvider>
                    <ScrollView>
                        {this.renderAlreadySent()}
                        <Text style={{fontSize: 16, margin: 16}}>
                            Tu es sur le point d&apos;envoyer ta réception du{' '}
                            {this.props.list.createdAt && moment(this.props.list.createdAt).format('dddd DD MMMM YYYY')}
                            , PO {this.props.list.purchaseOrderName}, de {this.props.list.partnerName}. Elle contient{' '}
                            {this.receiptEntries.length} produit
                            {this.receiptEntries.length > 1 ? 's' : ''} et {this.images.length} image
                            {this.images.length > 1 ? 's' : ''}.
                        </Text>
                        <ListItem
                            onPress={(): void => {
                                this.senderNameInput = this.state.senderName;
                                this.setState({senderNameDialogVisible: true});
                            }}
                            topDivider
                            bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>Réceptionneur</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <Text>{this.state.senderName}</Text>
                            </ListItem.Content>
                            <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                        </ListItem>
                        <ListItem bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>État</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>{ReceiptCheck}</ListItem.Content>
                        </ListItem>
                        <ListItem
                            onPress={(): void => {
                                this.chooseRecipient();
                            }}
                            disabled={this.state.isSendingMail}
                            bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>Destinataire</ListItem.Title>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <Text style={{color: this.state.selectedGamme ? 'black' : 'red'}}>
                                    {this.state.selectedGamme || 'À Choisir'}
                                </Text>
                            </ListItem.Content>
                            <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                        </ListItem>
                        <View style={{flexDirection: 'row', justifyContent: 'center', margin: 16}}>
                            <Button
                                onPress={(): void => {
                                    this.sendReceipt();
                                }}
                                title={this.buttonTitle()}
                                disabled={this.state.isSendingMail || !this.isReady()}
                            />
                        </View>
                    </ScrollView>
                    <Dialog.Container visible={this.state.senderNameDialogVisible}>
                        <Dialog.Title>Nom du réceptionneur</Dialog.Title>
                        <Dialog.Input
                            onChangeText={(text): void => {
                                this.senderNameInput = text;
                            }}>
                            {this.state.senderName}
                        </Dialog.Input>
                        <Dialog.Button
                            label="Annuler"
                            onPress={(): void => {
                                this.senderNameInput = this.state.senderName;
                                this.setState({senderNameDialogVisible: false});
                            }}
                        />
                        <Dialog.Button
                            label="OK"
                            onPress={(): void => {
                                this.setState({
                                    senderName: this.senderNameInput,
                                    senderNameDialogVisible: false,
                                });
                            }}
                        />
                    </Dialog.Container>
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
