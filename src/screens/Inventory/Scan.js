import React from 'react'
import {
    Alert,
    Button,
    Dimensions,
    Image,
    Keyboard,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation';
import { Navigation } from 'react-native-navigation';
import { RNCamera } from 'react-native-camera';
import Odoo from '../../utils/Odoo';
import Article from '../../entities/Article';
import InventoryEntry from '../../entities/InventoryEntry';
import moment from 'moment';
import InventoryEntryFactory from '../../factories/InventoryEntryFactory';

export default class InventoryScan extends React.Component {
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

        // Odoo
        this.odoo = new Odoo();

        this.state = {
            odooProduct: null,
            showArticle: false,
            articleQuantityValue: "",
        }
    }

    componentWillMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.beepSound.release();
    }

    _keyboardDidShow(e) {
        this.setState({
            keyboardHeight: e.endCoordinates.height,
            normalHeight: Dimensions.get('window').height,
            shortHeight: Dimensions.get('window').height - e.endCoordinates.height,
        });
    }

    _keyboardDidHide(e) {
        this.setState({
            keyboardHeight: e.endCoordinates.height,
            normalHeight: Dimensions.get('window').height,
            shortHeight: Dimensions.get('window').height,
        });
    }

    static options(passProps) {
        var options = defaultScreenOptions("Recherche...");
        return options;
    }

    closeModal() {
        this.beepSound.release();
        Navigation.dismissModal(this.props.componentId)
    }

    lookupForBarcode(camera, barcode) {
        camera.pausePreview();
        this.beepSound.play(() => {
            this.beepSound.stop();
        });
        Navigation.mergeOptions(this.props.componentId, {
            topBar: {
                title: {
                    text: barcode
                }
            }
        })
        this.odoo.fetchArticleFromBarcode(barcode).then((odooProduct) => {
            console.log(odooProduct);
            this.setState({
                showArticle: true
            })
            this.updateInformationView(odooProduct);
        }, (reason) => {
            console.error(reason);
        });
    }

    updateInformationView(odooProduct) {
        this.textInput.clear();
        this.textInput.focus();
        this.setState({
            odooProduct: odooProduct,
            showArticle: true
        })
    }

    unitAsString(unit) {
        var string = "";
        switch (unit) {
            case 1:
                string = "unités";
                break;
            case 3:
                string = "kg";
                break;
        }

        return string;
    }

    didTapSaveButton() {
        const unit = this.state.odooProduct.unit;
        var quantity;
        try {
            quantity = this.state.articleQuantityValue.toNumber();
        } catch(e) {
            Alert.alert("Valeur incorrecte", "Cela ne ressemble pas à un nombre.");
        }
        if (quantity >= 0) {
            if (unit === 1 && quantity.isInt() === false) { // Int only
                    Alert.alert(
                        "Valeur incorrecte",
                        "Ce produit est compté en unité. Merci de ne pas entrer de nombre à virgule."
                    );
            }
            if (unit === 2) { // Float authorized

            }
        }

        const newEntry = new InventoryEntry();
        newEntry.inventoryId = this.props.inventoryId;
        newEntry.articleBarcode = this.state.odooProduct.barcode;
        newEntry.articleName = this.state.odooProduct.name;
        newEntry.articleUnit = this.state.odooProduct.uom_id;
        newEntry.articlePrice = this.state.odooProduct.lst_price;
        newEntry.scannedAt = moment(this.scannedAt);
        newEntry.articleQuantity = quantity;
        newEntry.savedAt = moment();

        InventoryEntryFactory.sharedInstance().persist(newEntry).then(() => {
            this.setState({
                odooProduct: null,
                showArticle: false,
            })
            this.textInput.blur()
            this.camera.resumePreview();
        });
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    captureAudio={false}
                    style={styles.preview}
                    type={RNCamera.Constants.Type.back}
                    permissionDialogTitle={'Permission to use camera'}
                    permissionDialogMessage={'We need your permission to use your camera phone'}
                    onBarCodeRead={({ data, rawData, type, bounds }) => {
                        if (type === RNCamera.Constants.BarCodeType.ean13) {
                            this.lookupForBarcode(this.camera, data);
                        }
                    }}
                    barCodeTypes={[RNCamera.Constants.BarCodeType.ean13]}
                >
                    {({ camera, status, recordAudioPermissionStatus }) => {
                        if (status !== 'READY') {
                            return (
                                <View>
                                    <Text>Chargement...</Text>
                                </View>
                            );
                        }
                        return (
                            <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
                                <TouchableOpacity onPress={() => { this.closeModal(); }} style={styles.capture}>
                                    <Text style={{ fontSize: 14 }}> Fermer </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                </RNCamera>
                <View ref={ref => this.articleView = ref} style={[styles.information, { display: (this.state.showArticle ? 'flex' : 'none') }]}>
                    <View style={{ height: 92, flexDirection: 'row' }}>
                        <Image
                            source={{ uri: '' }}
                            style={styles.articleImage}
                        />
                        <Text
                            ref={ref => this.articleTitle = ref}
                            numberOfLines={2}
                            style={styles.articleName}
                        >
                            {this.state.odooProduct ? this.state.odooProduct.name : ""}
                        </Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-around' }}>
                        <View style={{ flex: 0, flexDirection: 'column', justifyContent: 'center' }}>
                            <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
                                <TextInput
                                    ref={ref => this.textInput = ref}
                                    onChangeText={articleQuantityValue => this.setState({articleQuantityValue})}
                                    style={styles.inputText}
                                    keyboardType='numeric'
                                />
                                <Text style={{ fontSize: 32, marginLeft: 8, marginTop: 40 }}>
                                    {this.unitAsString(this.state.odooProduct ? this.state.odooProduct.unit : null)}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 0, justifyContent: 'center' }}>
                            <Button
                                title="Enregister"
                                style={styles.saveButton}
                                onPress={this.didTapSaveButton.bind(this)}
                            />
                        </View>
                        <View style={{ flex: 0, height: this.state.keyboardHeight }}></View>
                    </View>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
    },
    information: {
        flexDirection: 'column',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        padding: 16
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
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
        marginRight: 16
    },
    articleName: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold'
    },

    inputText: {
        height: 96,
        width: 192,
        fontSize: 64,
        textAlign: 'right',
        paddingRight: 8,
        borderWidth: 1,
        borderRadius: 8
    },
    saveButton: {
        marginTop: 24,
        fontSize: 16
    }
});