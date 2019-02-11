import React from 'react'
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation } from 'react-native-navigation';
import { RNCamera } from 'react-native-camera';
import Odoo from '../utils/Odoo';
import OdooProduct from '../entities/OdooProduct';

export default class Scanner extends React.Component {
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
        this.odoo = new Odoo();
        this.lastScannedBarcode = null;

        this.state = {
            displayCamera: false,
            odooProduct: null,
            showProductCard: false,
        }
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        this.setState({
            displayCamera: true
        })
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
        return options;
    }

    lookupForBarcode(camera, barcode) {
        if (this.lastScannedBarcode === barcode) {
            return;
        }
        this.lastScannedBarcode = barcode;
        this.beepSound.play(() => {
            this.beepSound.stop(); // Resets file for immediate play availability
        });
        this.setState({
            odooProduct: null,
            showProductCard: true
        })
        this.odoo.fetchProductFromBarcode(barcode).then((odooProduct) => {
            this.setState({
                odooProduct: new OdooProduct(odooProduct)
            })
            this.odoo.fetchImageForOdooProduct(odooProduct).then(image => {
                const odooProduct = this.state.odooProduct;
                odooProduct.image = OdooProduct.imageFromOdooBase64(image);
                this.setState({
                    odooProduct: odooProduct
                })
            });
        }, (reason) => {
            console.error(reason);
        });
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                {this.state.displayCamera ? (
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
                                    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Chargement de la caméra...</Text>
                                    </View>
                                );
                            }
                        }}
                    </RNCamera>
                ) : (<View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Chargement de la caméra...</Text>
                </View>)}
                <View ref={ref => this.articleView = ref} style={[styles.information, { display: (this.state.showProductCard ? 'flex' : 'none') }]}>
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
                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 8, marginBottom: 8 }}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <Text style={styles.detailTitle}>Prix</Text>
                            <Text style={styles.detailValue}>{this.state.odooProduct ? Math.round(this.state.odooProduct.lst_price * 100) / 100 + ' €' : '...'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailTitle}>Stock</Text>
                            <Text style={[styles.detailValue, (this.state.odooProduct && this.state.odooProduct.quantityIsValid() === false ? styles.detailValueInvalid : null)]}>{this.state.odooProduct ? this.state.odooProduct.quantityAsString() : '...'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailTitle}>Poid/Vol.</Text>
                            <Text style={styles.detailValue}>{this.state.odooProduct ? this.state.odooProduct.packagingAsString() : '...'}</Text>
                        </View>
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
        position: 'relative',
        marginTop: 20,
        backgroundColor: 'black',
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