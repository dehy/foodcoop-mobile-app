import React from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Button, ThemeProvider, ListItem } from 'react-native-elements';
import AlertAsync from 'react-native-alert-async';
import { Navigation, Options } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';
import Dialog from 'react-native-dialog';
import ActionSheet from 'react-native-action-sheet';
import { getRepository } from 'typeorm';
import { defaultScreenOptions } from '../../utils/navigation';
import CSVGenerator, { CSVData } from '../../utils/CSVGenerator';
import Mailjet, { MailAttachment } from '../../utils/Mailjet';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import Attachment from '../../entities/Attachment';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';
import SupercoopSignIn from '../../utils/SupercoopSignIn';
import { asyncFilter } from '../../utils/helpers';

export interface GoodsReceiptExportProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptExportState {
    isSendingMail: boolean;
    filePath?: string | false;
    selectedGamme?: string;
    senderNameDialogVisible: boolean;
    senderName?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class GoodsReceiptExport extends React.Component<GoodsReceiptExportProps, GoodsReceiptExportState> {
    private receiptEntries: Array<GoodsReceiptEntry> = [];
    private images: Array<Attachment> = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();
    private senderNameInput?: string;

    private gammes: { [k: string]: string } = {
        'Groupe Achats': 'achats@supercoop.fr',
        'Gamme Boisson': 'gamme-boisson@supercoop.fr',
        'Gamme Droguerie': 'gamme-droguerie@supercoop.fr',
        'Gamme Épicerie': 'gamme-epicerie@supercoop.fr',
        'Gamme Frais': 'gamme-frais@supercoop.fr',
        'Gamme Fruits et Légumes': 'gamme-fruits-et-legumes@supercoop.fr',
        'Gamme Viandes et Poissons': 'gamme-viandes-et-poissons@supercoop.fr',
    };

    constructor(props: GoodsReceiptExportProps) {
        super(props);
        Navigation.events().bindComponent(this);

        this.receiptEntries = props.session.goodsReceiptEntries || [];
        this.images = props.session.attachments || [];

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

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    componentDidMount(): void {
        getRepository(GoodsReceiptSession)
            .findOne(this.props.session.id, {
                relations: ['goodsReceiptEntries', 'attachments'],
            })
            .then((session): void => {
                //console.log(session);
                if (!session) {
                    throw new Error('Session not found');
                }
                this.receiptEntries = session.goodsReceiptEntries ?? [];
                this.images = session.attachments ?? [];

                this.generateCSVFile().then(filePath => {
                    // console.log(filePath);
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
                options: Platform.OS == 'ios' ? recipientsIos : recipientsAndroid,
                cancelButtonIndex: recipientsIos.length - 1,
            },
            buttonIndex => {
                //console.log('button clicked :', buttonIndex);
                this.setState({
                    selectedGamme: Object.keys(this.gammes)[buttonIndex],
                });
            },
        );
    };

    async generateCSVFile(): Promise<string> {
        const sessionData: CSVData[] = [];
        this.receiptEntries?.forEach(entry => {
            if (!entry.productBarcode || entry.expectedProductQty == undefined || !entry.productName) {
                throw new Error('Missing mandatory entry parameters');
            }
            const entryData: CSVData = {
                status: entry.getStatus().toString(),
                product: entry.productName,
                supplierCode: entry.productSupplierCode,
                expectedQty: entry.expectedProductQty,
                receivedQty: entry.productQty,
                expectedUom: entry.expectedProductUom,
                receivedUom: entry.productUom,
                expectedPackageQty: entry.expectedPackageQty, // Colisage (nombre de produits par colis)
                receivedPackageQty: entry.packageQty,
                expectedProductQtyPackage: entry.expectedProductQtyPackage, // Nombre de colis
                receivedProductQtyPackage: entry.productQtyPackage,
                comment: entry.comment,
                barcode: entry.productBarcode,
            };
            sessionData.push(entryData);
        });

        const csvFilenameDateTime = moment(this.props.session.updatedAt).format('YYYYMMDDHHmmss');
        const csvFilename = `reception-${this.props.session.poName}-${csvFilenameDateTime}.csv`;
        const filepath = await this.csvGenerator.generateCSVFile(csvFilename, sessionData);

        return filepath;
    }

    async sendReceipt(): Promise<void> {
        this.setState({
            isSendingMail: true,
        });
        if (!this.props.session.updatedAt) {
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
        const poName = this.props.session.poName;
        const partnerName = this.props.session.partnerName;
        const date = moment(this.props.session.updatedAt).format('DD/MM/YYYY');
        const time = moment(this.props.session.updatedAt).format('HH:mm:ss');

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
                this.props.session.lastSentAt = moment().toDate();
                this.props.session.hidden = true;
                await getRepository(GoodsReceiptSession).save(this.props.session);
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
                    "Houston, quelchose s'est mal passé et le mail n'est pas parti... Mais on n'en sait pas plus :(",
                );
            })
            .finally(() => {
                this.setState({
                    isSendingMail: false,
                });
            });
    }

    getMailAttachments = async (): Promise<MailAttachment[]> => {
        const csvFilenameDateTime = moment(this.props.session.updatedAt).format('YYYYMMDDHHmmss');
        const csvFilename = `reception-${this.props.session.poName}-${csvFilenameDateTime}.csv`;

        const attachments: MailAttachment[] = await asyncFilter(this.images, async (image: Attachment) => {
            if (image.path && image.name) {
                return await Mailjet.filepathToAttachment(image.path, image.name);
            }
        });

        if (this.state.filePath) {
            attachments.push(await Mailjet.filepathToAttachment(this.state.filePath, csvFilename));
        }

        return attachments;
    };

    buttonTitle = (): string => {
        if (this.state.isSendingMail) {
            return 'Envoi en cours ... Merci de patienter, l\'envoi peut être long en fonction du nombre de pièces jointes';
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
        if (this.props.session.lastSentAt) {
            return (
                <View style={{ padding: 8, margin: 8, backgroundColor: '#17a2b8' }}>
                    <Text style={{ color: 'white' }}>
                        Cette réception a déjà été envoyée le {this.props.session.lastSentAt?.toLocaleString()}
                    </Text>
                </View>
            );
        }
    }

    render(): React.ReactNode {
        let ReceiptCheck: React.ReactElement | undefined = undefined;

        if (this.state.filePath == undefined) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <ActivityIndicator size="small" color="#999999" style={{ paddingTop: 4, marginRight: 4 }} />
                    <Text>Création en cours</Text>
                </View>
            );
        }
        if (this.state.filePath) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <Icon name="check" color="green" style={{ paddingTop: 3, marginRight: 4 }} />
                    <Text style={{ color: 'green' }}>Prêt pour l&apos;envoi</Text>
                </View>
            );
        }
        if (this.state.filePath === false) {
            ReceiptCheck = (
                <View style={styles.checkResult}>
                    <Icon name="times" color="red" style={{ paddingTop: 3, marginRight: 4 }} />
                    <Text style={{ color: 'red' }}>Erreur !</Text>
                </View>
            );
        }

        return (
            <SafeAreaView style={{ backgroundColor: 'white', height: '100%' }}>
                <ThemeProvider>
                    <ScrollView>
                        {this.renderAlreadySent()}
                        <Text style={{ fontSize: 16, margin: 16 }}>
                            Tu es sur le point d&apos;envoyer ta réception du{' '}
                            {this.props.session.createdAt &&
                                moment(this.props.session.createdAt).format('dddd DD MMMM YYYY')}
                            , PO {this.props.session.poName}, de {this.props.session.partnerName}. Elle contient{' '}
                            {this.receiptEntries.length} produit
                            {this.receiptEntries.length > 1 ? 's' : ''} et {this.images.length} image
                            {this.images.length > 1 ? 's' : ''}.
                        </Text>
                        <ListItem
                            title="Réceptionneur"
                            rightElement={<Text>{this.state.senderName}</Text>}
                            onPress={(): void => {
                                this.senderNameInput = this.state.senderName;
                                this.setState({ senderNameDialogVisible: true });
                            }}
                            topDivider
                            bottomDivider
                            chevron
                        />
                        <ListItem title="État" rightElement={ReceiptCheck} bottomDivider />
                        <ListItem
                            title="Destinataire"
                            rightElement={
                                <Text style={{ color: this.state.selectedGamme ? 'black' : 'red' }}>
                                    {this.state.selectedGamme || 'À Choisir'}
                                </Text>
                            }
                            onPress={(): void => {
                                this.chooseRecipient();
                            }}
                            disabled={this.state.isSendingMail}
                            bottomDivider
                            chevron
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 16 }}>
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
                            }}
                        >
                            {this.state.senderName}
                        </Dialog.Input>
                        <Dialog.Button
                            label="Annuler"
                            onPress={(): void => {
                                this.senderNameInput = this.state.senderName;
                                this.setState({ senderNameDialogVisible: false });
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
