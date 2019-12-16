import React from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import CSVGenerator, { CSVData } from '../../utils/CSVGenerator';
import Google, { MailAttachment } from '../../utils/Google';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome5';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import { getRepository } from 'typeorm';
import ActionSheet from 'react-native-action-sheet';
import GoodsReceiptSession from '../../entities/GoodsReceiptSession';

export interface GoodsReceiptExportProps {
    componentId: string;
    session: GoodsReceiptSession;
}

interface GoodsReceiptExportState {
    isSendingMail: boolean;
    filePath?: string | false;
    selectedGamme?: string;
}

const styles = StyleSheet.create({
    checkResult: {
        flexDirection: 'row',
    },
});

export default class GoodsReceiptExport extends React.Component<GoodsReceiptExportProps, GoodsReceiptExportState> {
    private receiptEntries: Array<GoodsReceiptEntry> = [];
    private csvGenerator: CSVGenerator = new CSVGenerator();

    private gammes: { [k: string]: string } = {
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

        this.state = {
            isSendingMail: false,
        };

        this.generateCSVFile().then(filePath => {
            console.log(filePath);
            this.setState({
                filePath,
            });
        });
    }

    static options(): Options {
        const options = defaultScreenOptions('Envoi de réception');
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
        //
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
                console.log('button clicked :', buttonIndex);
                this.setState({
                    selectedGamme: Object.keys(this.gammes)[buttonIndex],
                });
            },
        );
    };

    async generateCSVFile(): Promise<string> {
        const sessionData: CSVData[] = [];
        this.receiptEntries?.forEach(entry => {
            if (!entry.productBarcode || !entry.expectedProductQty || !entry.productName) {
                throw new Error('Missing mandatory entry parameters');
            }
            const entryData: CSVData = {
                barcode: entry.productBarcode,
                expectedQty: entry.expectedProductQty,
                receivedQty: entry.productQty,
                product: entry.productName,
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
        const userFirstname = Google.getInstance().getFirstnameSlug();
        const poName = this.props.session.poName;
        const partnerName = this.props.session.partnerName;
        const date = moment(this.props.session.updatedAt).format('DD/MM/YYYY');
        const time = moment(this.props.session.updatedAt).format('HH:mm:ss');

        const entriesCount = this.receiptEntries.length;

        const to = this.gammes[this.state.selectedGamme];
        const subject = `[${poName}][${partnerName}] Rapport de livraison`;
        const body = `Réception de livraison faite par ${userFirstname}.

PO: ${poName}
Fournisseur: ${partnerName}
Réception effectuée le: ${date} à ${time}
${entriesCount} produits traités`;

        const csvFilenameDateTime = moment(this.props.session.updatedAt).format('YYYYMMDDHHmmss');
        const csvFilename = `reception-${poName}-${csvFilenameDateTime}.csv`;
        const attachments: MailAttachment[] = [
            {
                filename: csvFilename,
                filepath: this.state.filePath,
            },
        ];

        Google.getInstance()
            .sendEmail(to, subject, body, attachments)
            .then(async () => {
                this.props.session.lastSentAt = moment().toDate();
                await getRepository(GoodsReceiptSession).save(this.props.session);
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
                    isSendingMail: false,
                });
            });
    }

    render(): React.ReactNode {
        let ReceiptCheck = null;
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
        if (this.state.filePath == false) {
            ReceiptCheck = (
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
                        Tu es sur le point d&apos;envoyer ta réception du{' '}
                        {this.props.session.createdAt &&
                            moment(this.props.session.createdAt).format('dddd DD MMMM YYYY')}
                        , PO {this.props.session.poName}, de {this.props.session.partnerName}. Elle contient{' '}
                        {this.receiptEntries.length} produit
                        {this.receiptEntries.length > 1 ? 's' : ''}.
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text>État : {ReceiptCheck}</Text>
                    </View>
                    <View>
                        <Text>Envoyer à :</Text>
                        <Button
                            onPress={(): void => {
                                this.chooseRecipient();
                            }}
                            title={this.state.selectedGamme || 'Choisir Gamme'}
                            disabled={this.state.isSendingMail}
                        ></Button>
                    </View>
                    <Text>En tapant sur le bouton ci-dessous, il sera envoyé à {this.state.selectedGamme} :</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 16 }}>
                        <Button
                            onPress={(): void => {
                                this.sendReceipt();
                            }}
                            title="Envoyer maintenant"
                            disabled={this.state.isSendingMail || !this.state.filePath}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}
