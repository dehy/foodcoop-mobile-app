import * as React from 'react';
import {
    ActivityIndicator,
    Alert,
    AlertButton,
    Button,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
    EventSubscription,
} from 'react-native';
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';
import { RNCamera, FlashMode, AutoFocus, Barcode } from 'react-native-camera';
import DialogInput from 'react-native-dialog-input';
import Google from '../utils/Google';
import InventoryEntry from '../entities/InventoryEntry';
import InventoryEntryFactory from '../factories/InventoryEntryFactory';
import InventorySession from '../entities/InventorySession';
import InventorySessionFactory from '../factories/InventorySessionFactory';
import moment, { Moment } from 'moment';
import Odoo from '../utils/Odoo';
import ProductProduct, { UnitOfMesurement } from '../entities/Odoo/ProductProduct';
import { isInt } from '../utils/helpers';
import Scanner2 from './Scanner2';

export interface ScannerProps {
    componentId: string;
    inventory?: InventorySession;
}

interface ScannerState {
    displayCamera: boolean;
    flashStatus: keyof FlashMode;
    autoFocus: keyof AutoFocus;
    odooProductProduct?: ProductProduct;
    showProductCard: boolean;
    showUnknownProductProductNameView: boolean;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
    scanMode: {
        position: 'absolute',
        left: 0,
        top: 0,
        marginLeft: 8,
        marginTop: 8,
    },
    actions: {
        position: 'absolute',
        flexDirection: 'row',
        left: 0,
        bottom: 0,
        marginLeft: 8,
        marginBottom: 8,
    },
    actionButton: {
        marginRight: 4,
        marginLeft: 4,
    },
    information: {
        flexDirection: 'column',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '94%',
        margin: '3%',
        height: 160,
        borderRadius: 8,
        backgroundColor: 'white',
        padding: 16,
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    capture: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 16,
        paddingHorizontal: 24,
        alignSelf: 'center',
        margin: 24,
    },

    articleImage: {
        width: 64,
        height: 64,
        backgroundColor: 'white',
        marginRight: 16,
        marginBottom: 8,
    },
    articleName: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
    },
    detailTitle: {
        flex: 1,
        textAlign: 'center',
    },
    detailValue: {
        flex: 2,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 24,
    },
    detailValueInvalid: {
        color: 'red',
    },
});

export default class Scanner extends React.Component<ScannerProps, ScannerState> {
    static MODE_SCANNER = 1;
    static MODE_INVENTORY = 2;

    private odoo: Odoo;
    private lastScannedBarcode?: string;
    private camera?: RNCamera;
    private scanner?: Scanner2;

    private textInput?: TextInput | null;
    private articleQuantityValue?: string;
    private scannedAt?: Moment;
    private articleTitle?: Text | null;

    private navigationEventListener?: EventSubscription;

    constructor(props: ScannerProps) {
        super(props);

        // Navigation
        Navigation.events().bindComponent(this);

        // Odoo
        this.odoo = Odoo.getInstance();
        this.lastScannedBarcode = undefined;

        this.state = {
            displayCamera: false,
            flashStatus: RNCamera.Constants.FlashMode.off,
            autoFocus: RNCamera.Constants.AutoFocus.on,
            odooProductProduct: undefined,
            showProductCard: false,
            showUnknownProductProductNameView: false,
        };
    }

    componentDidMount(): void {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear(): void {
        this.setState({
            displayCamera: true,
        });
    }

    componentDidDisappear(): void {
        this.setState({
            displayCamera: false,
        });
    }

    componentWillUnmount(): void {
        if (this.navigationEventListener) {
            this.navigationEventListener.remove();
        }
    }

    static options(passProps: ScannerProps): Options {
        const options = defaultScreenOptions('Recherche...');
        if (passProps.inventory && options && options.topBar) {
            options.topBar.rightButtons = [
                {
                    id: 'close',
                    text: 'Fermer',
                },
            ];
        }

        return options;
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'close') {
            this.blurInput();
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    reset(): void {
        this.updateNavigationTitle(undefined);
        this.blurInput();
        this.lastScannedBarcode = undefined;
        this.articleQuantityValue = undefined;
        this.scannedAt = undefined;
        this.setState({
            odooProductProduct: undefined,
            showProductCard: false,
            showUnknownProductProductNameView: false,
        });
        this.scanner ? this.scanner.reset() : undefined;
    }

    isInInventoryMode(): boolean {
        if (this.props.inventory) {
            return true;
        }
        return false;
    }

    focusOnQuantityInput(): void {
        if (this.textInput) {
            this.textInput.clear();
            this.textInput.focus();
        }
    }

    blurInput = (): void => {
        if (this.textInput) {
            this.textInput.blur();
        }
    };

    enableFlash = (): void => {
        this.setState({
            flashStatus: RNCamera.Constants.FlashMode.torch,
        });
    };
    disableFlash = (): void => {
        this.setState({
            flashStatus: RNCamera.Constants.FlashMode.off,
        });
    };
    toggleFlash = (): void => {
        if (this.state.flashStatus == RNCamera.Constants.FlashMode.off) {
            this.enableFlash();
            return;
        }
        this.disableFlash();
    };

    toggleAutoFocus = (): void => {
        if (this.state.autoFocus == RNCamera.Constants.AutoFocus.off) {
            this.setState({ autoFocus: RNCamera.Constants.AutoFocus.on });
        } else {
            this.setState({ autoFocus: RNCamera.Constants.AutoFocus.off });
        }
    };

    showProductCard = (): void => this.setState({ showProductCard: true });
    hideProductCard = (): void => this.setState({ showProductCard: false });

    showUnknownProductProductNameView = (): void => this.setState({ showUnknownProductProductNameView: true });
    hideUnknownProductProductView = (): void => this.setState({ showUnknownProductProductNameView: false });

    updateNavigationTitle(title?: string): void {
        Navigation.mergeOptions(this.props.componentId, {
            topBar: {
                title: {
                    text: title ? title : 'Recherche...',
                },
            },
        });
    }

    didScanBarcode(barcode: Barcode): void {
        // console.debug('didScanBarcode()', barcode.data, barcode.type);
        if (barcode.type !== 'PRODUCT' || !(barcode.data.length !== 13)) {
            this.lookupForBarcode(barcode.data);
            return;
        }
        Alert.alert(
            'Code barre incompatible',
            "Ce code barre n'est pas utilisé par Odoo. Cherches un code barre à 13 chiffres.",
            [{ text: 'OK', onPress: (): void => this.reset() }],
        );
    }

    lookupForBarcode(barcode: string): void {
        if (this.lastScannedBarcode === barcode) {
            return;
        }
        this.setState({ odooProductProduct: undefined });
        this.lastScannedBarcode = barcode;
        this.scannedAt = moment();
        this.updateNavigationTitle(barcode);
        this.showProductCard();
        this.odoo.fetchProductFromBarcode(barcode).then(
            odooProductProduct => {
                if (!odooProductProduct) {
                    this.handleNotFoundProductProduct(barcode);
                    return;
                }
                this.handleFoundProductProduct(odooProductProduct);
            },
            reason => {
                Alert.alert('Erreur', `Une erreur est survenue ("${reason}"). Merci de réessayer.`);
                this.reset();
            },
        );
    }

    handleNotFoundProductProduct(barcode: string): void {
        let notFoundInOdooString = `Le code barre ${barcode} est introuvable dans odoo.`;
        const alertButtons: AlertButton[] = [
            {
                text: 'Annuler',
                onPress: (): void => {
                    this.reset();
                    return;
                },
                style: 'cancel',
            },
        ];
        const odooProductProduct = new ProductProduct();
        odooProductProduct.barcode = barcode;
        this.setState({ odooProductProduct: odooProductProduct });
        if (this.isInInventoryMode()) {
            notFoundInOdooString = notFoundInOdooString.concat(" L'utiliser quand même pour l'inventaire ?");
            alertButtons.push({
                text: 'Utiliser',
                onPress: () => {
                    this.askForUnknownProductProductName();
                },
                style: 'default',
            });
        } else {
            notFoundInOdooString = notFoundInOdooString.concat(' Le signaler en envoyant un email automatique ?');
            alertButtons.push({
                text: 'Signaler',
                onPress: () => {
                    this.askForUnknownProductProductName();
                },
                style: 'default',
            });
        }
        Alert.alert('Code barre inconnu', notFoundInOdooString, alertButtons);
    }

    handleFoundProductProduct(odooProductProduct: ProductProduct): void {
        this.setState({
            odooProductProduct: odooProductProduct,
        });
        this.odoo.fetchImageForProductProduct(odooProductProduct).then(image => {
            const odooProductProduct = this.state.odooProductProduct;
            if (odooProductProduct && image != null) {
                odooProductProduct.image = ProductProduct.imageFromOdooBase64(image);
                this.setState({
                    odooProductProduct: odooProductProduct,
                });
            }
        });
        if (this.isInInventoryMode() && this.props.inventory) {
            InventoryEntryFactory.sharedInstance()
                .findByInventorySessionAndProductProduct(this.props.inventory, odooProductProduct)
                .then((foundInventoryEntries: InventoryEntry[]) => {
                    if (foundInventoryEntries.length > 0) {
                        const lastEntry = foundInventoryEntries[0];
                        const timeAgoString = lastEntry.scannedAt ? lastEntry.scannedAt.fromNow() : null;
                        Alert.alert(
                            'Déjà scanné',
                            `Ce produit a déjà été scanné ${timeAgoString}. Veux-tu le remplacer ou l'additionner dans l'inventaire ?`,
                            [
                                {
                                    text: 'Annuler',
                                    onPress: (): void => {
                                        this.reset();
                                    },
                                    style: 'cancel',
                                },
                                {
                                    text: 'Remplacer',
                                    onPress: (): void => {
                                        foundInventoryEntries.forEach(foundInventoryEntry => {
                                            InventoryEntryFactory.sharedInstance().delete(foundInventoryEntry);
                                        });
                                    },
                                    style: 'destructive',
                                },
                                {
                                    text: 'Additionner',
                                    onPress: (): void => {
                                        alert('Pas encore fonctionnel');
                                    },
                                    style: 'default',
                                },
                            ],
                        );
                    }
                });
            this.focusOnQuantityInput();
        }
    }

    askForUnknownProductProductName = (): void => this.setState({ showUnknownProductProductNameView: true });
    hideUnknownProductProductNameView = (): void => this.setState({ showUnknownProductProductNameView: false });
    handleUnknownProductProductName = (name: string): void => {
        this.hideUnknownProductProductNameView();
        if (!this.state.odooProductProduct) {
            throw new Error('No Odoo Product set');
        }
        const odooProductProduct = this.state.odooProductProduct;
        odooProductProduct.name = name;
        this.setState({
            odooProductProduct,
        });

        if (this.isInInventoryMode()) {
            this.handleFoundProductProduct(this.state.odooProductProduct);
        } else {
            this.reportUnknownProductProductByMail(this.state.odooProductProduct);
        }
    };

    reportUnknownProductProductByMail(odooProductProduct: ProductProduct): void {
        const to = 'inventaire@supercoop.fr';
        const subject = `Code barre inconnu (${odooProductProduct.barcode})`;
        const body = `Le code barre ${odooProductProduct.barcode} est introuvable dans Odoo.
Il a été associé à un produit nommé "${odooProductProduct.name}"`;
        try {
            Google.getInstance()
                .sendEmail(to, subject, body)
                .then(() => {
                    Alert.alert('Mail envoyé', 'Merci pour le signalement ! 🎉');
                });
        } catch (e) {
            Alert.alert('Erreur', "Houston, une erreur est survenue lors de l'envoi du mail de signalement 😢");
        }
        this.reset();
    }

    inventoryDidTapSaveButton(): void {
        if (!this.state.odooProductProduct) {
            throw new Error('No Odoo Product set');
        }
        if (!this.props.inventory) {
            throw new Error('No Inventory set');
        }
        const unit = this.state.odooProductProduct.uom_id;
        let quantity: number;
        try {
            if (!this.articleQuantityValue) {
                throw new Error();
            }
            quantity = parseFloat(this.articleQuantityValue.replace(',', '.'));
        } catch (e) {
            Alert.alert('Valeur incorrecte', 'Cela ne ressemble pas à un nombre.');
            return;
        }
        if (quantity >= 0) {
            if (unit === UnitOfMesurement.unit && isInt(quantity) === false) {
                // Int only
                Alert.alert(
                    'Valeur incorrecte',
                    'Ce produit est compté en unité. Merci de ne pas entrer de nombre à virgule.',
                );
                return;
            }
            if (unit === UnitOfMesurement.kg) {
                // Float authorized
            }
        }

        const newEntry = InventoryEntry.createFromProductProduct(this.state.odooProductProduct);
        newEntry.inventoryId = this.props.inventory.id;
        newEntry.scannedAt = this.scannedAt;
        newEntry.articleQuantity = quantity;
        newEntry.savedAt = moment();

        InventoryEntryFactory.sharedInstance()
            .persist(newEntry)
            .then(() => {
                if (!this.props.inventory) {
                    throw new Error('Inventory not set');
                }
                InventorySessionFactory.sharedInstance()
                    .updateLastModifiedAt(this.props.inventory, moment())
                    .then(() => {
                        this.reset();
                    });
            });
    }

    renderUnknownProductProductView(): React.ReactElement {
        return (
            <DialogInput
                isDialogVisible={this.state.showUnknownProductProductNameView}
                title={'Nom du produit'}
                message={"Quel est le nom du produit tel qu'affiché sur l'étiquette ?"}
                submitInput={(name: string): void => this.handleUnknownProductProductName(name)}
                closeDialog={(): void => {
                    this.hideUnknownProductProductView();
                    this.reset();
                }}
                cancelText="Annuler"
                submitText="Enregistrer"
            />
        );
    }

    renderCameraView(): React.ReactElement {
        if (this.state.displayCamera) {
            return (
                <Scanner2
                    ref={(ref): void => {
                        this.scanner = ref !== null ? ref : undefined;
                    }}
                    onBarcodeRead={(barcode): void => {
                        this.didScanBarcode(barcode);
                    }}
                ></Scanner2>
            );
        } else {
            return (
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Caméra en Pause</Text>
                </View>
            );
        }
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={styles.container}>
                {this.renderUnknownProductProductView()}
                {this.renderCameraView()}
                {this.state.showProductCard ? (
                    <View style={styles.information}>
                        <View style={{ flexDirection: 'row' }}>
                            {this.state.odooProductProduct && this.state.odooProductProduct.image ? (
                                <Image
                                    source={{ uri: this.state.odooProductProduct.image }}
                                    style={styles.articleImage}
                                />
                            ) : (
                                <ActivityIndicator size="small" color="#999999" style={styles.articleImage} />
                            )}
                            <Text
                                ref={(ref): void => {
                                    this.articleTitle = ref;
                                }}
                                numberOfLines={2}
                                style={styles.articleName}
                            >
                                {this.state.odooProductProduct ? this.state.odooProductProduct.name : 'Chargement...'}
                            </Text>
                        </View>
                        {this.props.inventory ? (
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                <TextInput
                                    ref={(ref): void => {
                                        this.textInput = ref;
                                    }}
                                    onChangeText={(value): void => {
                                        this.articleQuantityValue = value;
                                    }}
                                    style={{
                                        flex: 0,
                                        fontSize: 28,
                                        width: 80,
                                        borderWidth: 1,
                                        borderRadius: 8,
                                        marginRight: 8,
                                        textAlign: 'right',
                                        alignItems: 'center',
                                    }}
                                    keyboardType="decimal-pad"
                                    blurOnSubmit={false}
                                    onSubmitEditing={(): void => {
                                        this.inventoryDidTapSaveButton();
                                    }}
                                />
                                <Text style={{ fontSize: 28, flex: 0 }}>
                                    {this.state.odooProductProduct
                                        ? this.state.odooProductProduct.unitAsString()
                                        : null}
                                </Text>
                                <Button
                                    // style={{ flex: 1, marginLeft: 16 }}
                                    onPress={(): void => {
                                        this.inventoryDidTapSaveButton();
                                    }}
                                    title="Enregistrer"
                                />
                            </View>
                        ) : (
                            <View style={{ flex: 1, flexDirection: 'row', marginVertical: 8 }}>
                                <View style={{ flex: 1, flexDirection: 'column' }}>
                                    <Text style={styles.detailTitle}>Prix</Text>
                                    <Text style={styles.detailValue}>
                                        {this.state.odooProductProduct && this.state.odooProductProduct.lst_price
                                            ? Math.round(this.state.odooProductProduct.lst_price * 100) / 100 + ' €'
                                            : '-'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailTitle}>Stock</Text>
                                    <Text
                                        style={[
                                            styles.detailValue,
                                            this.state.odooProductProduct &&
                                            !this.state.odooProductProduct.quantityIsValid()
                                                ? styles.detailValueInvalid
                                                : undefined,
                                        ]}
                                    >
                                        {this.state.odooProductProduct &&
                                        this.state.odooProductProduct.quantityIsValid()
                                            ? this.state.odooProductProduct.quantityAsString()
                                            : '-'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailTitle}>Poid/Vol.</Text>
                                    <Text style={styles.detailValue}>
                                        {this.state.odooProductProduct
                                            ? this.state.odooProductProduct.packagingAsString()
                                            : '-'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                ) : null}
            </SafeAreaView>
        );
    }
}
