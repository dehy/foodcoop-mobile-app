import React from 'react'
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
    View
} from 'react-native'
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation } from 'react-native-navigation';
import { RNCamera } from 'react-native-camera';
import Odoo from '../utils/Odoo';
import OdooProduct from '../entities/OdooProduct';
import Icon from 'react-native-vector-icons/FontAwesome5';
import InventoryEntry from '../entities/InventoryEntry';
import InventoryEntryFactory from '../factories/InventoryEntryFactory';
import InventorySessionFactory from '../factories/InventorySessionFactory';
import moment from 'moment';
import DialogInput from 'react-native-dialog-input';
import Google from '../utils/Google';

export default class Scanner extends React.Component {

    static MODE_SCANNER = 1;
    static MODE_INVENTORY = 2;

    constructor(props) {
        super(props);

        // Navigation
        Navigation.events().bindComponent(this);

        // Sound
        var Sound = require('react-native-sound');
        Sound.setCategory('Ambient');
        this.beepSound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
        });
        this.beepSound.stop();

        this.camera = null;

        // Odoo
        this.odoo = Odoo.getInstance();
        this.lastScannedBarcode = null;

        // Inventory Mode
        this.textInput = null;
        this.articleQuantityValue = null;
        this.scannedAt = null;

        this.state = {
            displayCamera: false,
            flashStatus: RNCamera.Constants.FlashMode.off,
            odooProduct: null,
            showProductCard: false,
            showManualSearchView: false,
            showUnknownOdooProductNameView: false
        }
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        this.setState({
            displayCamera: true
        });
    }

    componentDidDisappear() {
        this.setState({
            displayCamera: false
        })
    }

    componentWillUnmount() {
        if (this.navigationEventListener) {
            this.navigationEventListener.remove();
        }
    }

    static options(passProps) {
        var options = defaultScreenOptions("Recherche...");
        if (passProps.inventory) {
            options.topBar.rightButtons = [
                {
                    id: 'close',
                    text: 'Fermer'
                }
            ];
        }

        return options;
    }

    navigationButtonPressed({ buttonId }) {
        if (buttonId === 'close') {
            this.blurInput();
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    reset() {
        this.updateNavigationTitle(null);
        this.blurInput();
        this.lastScannedBarcode = null;
        this.articleQuantityValue = null;
        this.scannedAt = null;
        this.resumeCamera();
        this.setState({
            odooProduct: null,
            showManualSearchView: false,
            showProductCard: false,
            showUnknownOdooProductNameView: false
        });
    }

    isInInventoryMode() {
        if (this.props.inventory) {
            return true;
        }
        return false;
    }

    focusOnQuantityInput() {
        this.textInput.clear();
        this.textInput.focus();
    }

    blurInput = () => {
        if (this.textInput) {
            this.textInput.blur();
        }
    }

    enableFlash = () => this.setState({ flashStatus: RNCamera.Constants.FlashMode.torch })
    disableFlash = () => this.setState({ flashStatus: RNCamera.Constants.FlashMode.off })
    toggleFlash = () => {
        if (this.state.flashStatus == RNCamera.Constants.FlashMode.off) {
            this.setState({ flashStatus: RNCamera.Constants.FlashMode.torch });
            return;
        }
        this.setState({ flashStatus: RNCamera.Constants.FlashMode.off });
    }

    showProductCard = () => this.setState({ showProductCard: true });
    hideProductCard = () => this.setState({ showProductCard: false });

    showManualSearchView = () => {
        this.hideProductCard();
        this.pauseCamera();
        this.setState({ showManualSearchView: true });
    }
    hideManualSearchView = () => this.setState({ showManualSearchView: false });

    showUnknownOdooProductNameView = () => this.setState({ showUnknownOdooProductNameView: true });
    hideUnknownOdooProductView = () => this.setState({ showUnknownOdooProductNameView: false });

    pauseCamera = () => this.setState({ displayCamera: false })
    resumeCamera = () => this.setState({ displayCamera: true })

    updateNavigationTitle(title) {
        Navigation.mergeOptions(this.props.componentId, {
            topBar: {
                title: {
                    text: title ? title : "Recherche..."
                }
            }
        });
    }

    didScanBarcode(type, barcode) {
        console.debug("didScanBarcode()", type, barcode);
        if ((type && type === RNCamera.Constants.BarCodeType.ean13) || (!type && barcode.length == 13)) {
            this.hideManualSearchView();
            this.lookupForBarcode(barcode);
            return;
        }
        Alert.alert("Code barre incompatible", "Ce code barre n'est pas utilisé par Odoo. Cherches un code barre à 13 chiffres.");
    }

    lookupForBarcode(barcode) {
        if (this.lastScannedBarcode === barcode) {
            return;
        }
        this.setState({ odooProduct: null });
        this.lastScannedBarcode = barcode;
        this.beepSound.play(() => {
            this.beepSound.stop(); // Resets file for immediate play availability
        });
        this.scannedAt = moment();
        if (this.isInInventoryMode()) {
            this.pauseCamera();
        }
        this.updateNavigationTitle(barcode);
        this.showProductCard();
        this.odoo.fetchProductFromBarcode(barcode).then((odooProduct) => {
            if (!odooProduct) {
                this.handleNotFoundOdooProduct(barcode);
                return;
            }
            this.handleFoundOdooProduct(odooProduct);
        }, (reason) => {
            Alert.alert("Erreur", `Une erreur est survenue ("${reason}"). Merci de réessayer.`);
            this.reset();
        });
    }

    handleNotFoundOdooProduct(barcode) {
        let notFoundInOdooString = `Le code barre ${barcode} est introuvable dans odoo.`;
        let alertButtons = [{
            text: "Annuler",
            onPress: () => {
                this.reset();
                return;
            },
            style: "cancel"
        }];
        const odooProduct = new OdooProduct();
        odooProduct.barcode = barcode;
        this.setState({ odooProduct: odooProduct });
        if (this.isInInventoryMode()) {
            notFoundInOdooString = notFoundInOdooString.concat(" L'utiliser quand même pour l'inventaire ?");
            alertButtons.push({
                text: "Utiliser",
                onPress: () => { this.askForUnknownOdooProductName() },
                style: "default"
            });
        } else {
            notFoundInOdooString = notFoundInOdooString.concat(" Le signaler en envoyant un email automatique ?");
            alertButtons.push({
                text: "Signaler",
                onPress: () => { this.askForUnknownOdooProductName() },
                style: "default"
            });
        }
        Alert.alert(
            "Code barre inconnu",
            notFoundInOdooString,
            alertButtons
        );
    }

    handleFoundOdooProduct(odooProduct) {
        this.setState({
            odooProduct: odooProduct
        })
        this.odoo.fetchImageForOdooProduct(odooProduct).then(image => {
            const odooProduct = this.state.odooProduct;
            odooProduct.image = OdooProduct.imageFromOdooBase64(image);
            this.setState({
                odooProduct: odooProduct
            })
        });
        if (this.isInInventoryMode()) {
            InventoryEntryFactory
                .sharedInstance()
                .findByInventorySessionIdAndBarcode(this.props.inventory.id, odooProduct.barcode)
                .then((foundInventoryEntries) => {
                    if (foundInventoryEntries.length > 0) {
                        const lastEntry = foundInventoryEntries[0];
                        const timeAgoString = lastEntry.scannedAt ? lastEntry.scannedAt.fromNow() : null;
                        Alert.alert(
                            "Déjà scanné",
                            `Ce produit a déjà été scanné ${timeAgoString}. Veux-tu le remplacer ou l'additionner dans l'inventaire ?`,
                            [{
                                text: "Annuler",
                                onPress: () => {
                                    this.reset();
                                },
                                style: "cancel"
                            }, {
                                text: "Remplacer",
                                onPress: () => {
                                    foundInventoryEntries
                                        .forEach((foundInventoryEntry) => {
                                            InventoryEntryFactory
                                            .sharedInstance()
                                            .delete(foundInventoryEntry);
                                    });
                                },
                                style: "destructive"
                            }, {
                                text: "Additionner",
                                onPress: () => {},
                                style: "default"
                            }]
                        );
                    }
                });
                this.focusOnQuantityInput();
        }
    }

    askForUnknownOdooProductName = () => this.setState({ showUnknownOdooProductNameView: true });
    hideUnknownOdooProductNameView = () => this.setState({ showUnknownOdooProductNameView: false });
    handleUnknownOdooProductName = (name) => {
        this.hideUnknownOdooProductNameView();
        this.state.odooProduct.name = name;

        if (this.isInInventoryMode()) {
            this.handleFoundOdooProduct(this.state.odooProduct);
        } else {
            this.reportUnknownOdooProductByMail(this.state.odooProduct);
        }
    }

    reportUnknownOdooProductByMail(odooProduct) {
        const to = "inventaire@supercoop.fr";
        const subject = `Code barre inconnu (${(odooProduct.barcode)})`;
        const body = `Le code barre ${(odooProduct.barcode)} est introuvable dans Odoo.
Il a été associé à un produit nommé "${(odooProduct.name)}"`;
        try {
            Google.getInstance().sendEmail(to, subject, body).then(() => {
                Alert.alert("Mail envoyé", "Merci pour le signalement ! 🎉");
            });
        } catch (e) {
            Alert.alert("Erreur", "Houston, une erreur est survenue lors de l'envoi du mail de signalement 😢");
        }
        this.reset();
    }


    inventoryDidTapSaveButton() {
        const unit = this.state.odooProduct.uom_id;
        let quantity;
        try {
            quantity = this.articleQuantityValue.toNumber();
        } catch (e) {
            Alert.alert("Valeur incorrecte", "Cela ne ressemble pas à un nombre.");
            return;
        }
        if (quantity >= 0) {
            if (unit === OdooProduct.UNIT_OF_MESUREMENT_UNITY && quantity.isInt() === false) { // Int only
                Alert.alert(
                    "Valeur incorrecte",
                    "Ce produit est compté en unité. Merci de ne pas entrer de nombre à virgule."
                );
                return;
            }
            if (unit === OdooProduct.UNIT_OF_MESUREMENT_KG) { // Float authorized

            }
        }

        const newEntry = new InventoryEntry();
        newEntry.inventoryId = this.props.inventory.id;
        newEntry.articleBarcode = this.state.odooProduct.barcode;
        newEntry.articleName = this.state.odooProduct.name;
        newEntry.articleUnit = this.state.odooProduct.uom_id;
        newEntry.articlePrice = this.state.odooProduct.lst_price;
        newEntry.scannedAt = this.scannedAt;
        newEntry.articleQuantity = quantity;
        newEntry.savedAt = moment();

        InventoryEntryFactory.sharedInstance().persist(newEntry).then(() => {
            InventorySessionFactory
                .sharedInstance()
                .updateLastModifiedAt(this.props.inventory, moment())
                .then(() => {
                    this.reset();
                    this.resumeCamera();
                })
        });
    }

    renderUnknownOdooProductView() {
        return (
            <DialogInput isDialogVisible={this.state.showUnknownOdooProductNameView}
            title={"Nom du produit"}
            message={"Quel est le nom du produit tel qu'affiché sur l'étiquette ?"}
            submitInput={name => this.handleUnknownOdooProductName(name)}
            closeDialog={() => {
                this.hideUnknownOdooProductView();
                this.reset();
            }}
            cancelText="Annuler"
            submitText="Enregistrer"
            />
        );
    }

    renderManualSearchView() {
        return (
            <DialogInput isDialogVisible={this.state.showManualSearchView}
                title={"Recherche manuelle"}
                message={"Entres le code barre du produit que tu cherches"}
                submitInput={(barcode) => { this.didScanBarcode(null, barcode) }}
                closeDialog={() => {
                    this.hideManualSearchView();
                    this.reset();
                }}
                textInputProps={{
                    keyboardType: 'number-pad'
                }}
                cancelText="Annuler"
                submitText="Chercher"
            />
        );
    }

    renderCameraView() {
        if (this.state.displayCamera) {
            return (<RNCamera
                ref={ref => {
                    this.camera = ref;
                }}
                captureAudio={false}
                style={styles.preview}
                type={RNCamera.Constants.Type.back}
                permissionDialogTitle={'Permission to use camera'}
                permissionDialogMessage={'We need your permission to use your camera phone'}
                autoFocus={RNCamera.Constants.AutoFocus.on}
                flashMode={this.state.flashStatus}
                onBarCodeRead={({ data, rawData, type, bounds }) => this.didScanBarcode(type, data)}
            >
                {({ camera, status, recordAudioPermissionStatus }) => {
                    if (status !== 'READY') {
                        return (
                            <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Chargement de la caméra...</Text>
                            </View>
                        );
                    }
                }}
            </RNCamera>);
        }
        if (!this.state.displayCamera) {
            return (
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Caméra en Pause</Text>
                </View>
            );
        }
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                {this.renderUnknownOdooProductView()}
                {this.renderManualSearchView()}
                {this.renderCameraView()}
                <View style={styles.actions}>
                    <View style={styles.actionButton}>
                        <Icon.Button
                            name="bolt"
                            backgroundColor={this.state.flashStatus == RNCamera.Constants.FlashMode.off ? "#000000" : "#FFFFFF"}
                            color={this.state.flashStatus == RNCamera.Constants.FlashMode.off ? "#FFFFFF" : "#000000"}
                            onPress={() => { this.toggleFlash() }}
                            solid
                        >
                            Flash
                            </Icon.Button>
                    </View>
                    <View style={styles.actionButton}>
                        <Icon.Button
                            name="keyboard"
                            backgroundColor="#000000"
                            onPress={this.showManualSearchView}
                            solid
                        >
                            Clavier
                        </Icon.Button>
                    </View>
                </View>
                {
                    this.state.showProductCard ? (
                        <View style={styles.information}>
                            <View style={{ flexDirection: 'row' }}>
                                {(this.state.odooProduct && this.state.odooProduct.image) ? (
                                    <Image
                                        source={{ uri: this.state.odooProduct.image }}
                                        style={styles.articleImage}
                                    />
                                ) : (
                                        <ActivityIndicator
                                            size="small"
                                            color="#999999"
                                            style={styles.articleImage}
                                        />
                                    )}
                                <Text
                                    ref={ref => this.articleTitle = ref}
                                    numberOfLines={2}
                                    style={styles.articleName}
                                >
                                    {this.state.odooProduct ? this.state.odooProduct.name : "Chargement..."}
                                </Text>
                            </View>
                            {this.props.inventory ? (
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                    <TextInput
                                        ref={ref => this.textInput = ref}
                                        onChangeText={value => this.articleQuantityValue = value}
                                        style={{ flex: 0, fontSize: 28, width: 80, borderWidth: 1, borderRadius: 8, marginRight: 8, textAlign: 'right', alignItems: 'center' }}
                                        keyboardType='decimal-pad'
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => {
                                            this.inventoryDidTapSaveButton();
                                        }}
                                    />
                                    <Text style={{ fontSize: 28, flex: 0 }}>{this.state.odooProduct ? this.state.odooProduct.unitAsString() : null}</Text>
                                    <Button
                                        style={{ flex: 1, marginLeft: 16 }}
                                        onPress={() => {
                                            this.inventoryDidTapSaveButton();
                                        }}
                                        title="Enregistrer"
                                    />
                                </View>
                            ) : (
                                    <View style={{ flex: 1, flexDirection: 'row', marginVertical: 8 }}>
                                        <View style={{ flex: 1, flexDirection: 'column' }}>
                                            <Text style={styles.detailTitle}>Prix</Text>
                                            <Text style={styles.detailValue}>{this.state.odooProduct ? Math.round(this.state.odooProduct.lst_price * 100) / 100 + ' €' : '-'}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailTitle}>Stock</Text>
                                            <Text style={[styles.detailValue, (this.state.odooProduct && this.state.odooProduct.quantityIsValid() === false ? styles.detailValueInvalid : null)]}>{this.state.odooProduct ? this.state.odooProduct.quantityAsString() : '-'}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailTitle}>Poid/Vol.</Text>
                                            <Text style={styles.detailValue}>{this.state.odooProduct ? this.state.odooProduct.packagingAsString() : '-'}</Text>
                                        </View>
                                    </View>
                                )}
                        </View>
                    ) : null
                }
            </SafeAreaView >
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
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
        marginLeft: 4
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
        padding: 16
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        height: '100%'
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
        marginBottom: 8
    },
    articleName: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold'
    },
    detailTitle: {
        flex: 1,
        textAlign: 'center'
    },
    detailValue: {
        flex: 2,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 24
    },
    detailValueInvalid: {
        color: 'red'
    }
});