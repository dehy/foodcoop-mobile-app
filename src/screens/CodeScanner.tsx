/* eslint-disable no-console */
import React, {ReactNode} from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    GestureResponderEvent,
    Platform,
    Vibration,
    DeviceEventEmitter,
    Alert,
} from 'react-native';
import DialogInput from 'react-native-dialog-input';
import {
    RNCamera,
    Face,
    Barcode,
    TrackedTextFeature,
    Point,
    RecordOptions,
    FlashMode,
    WhiteBalance,
    AutoFocus,
    CameraType,
    BarCodeType,
    Size,
    BarcodeType,
} from 'react-native-camera';
import BarcodeMask from 'react-native-barcode-mask';
import Sound from 'react-native-sound';
import KeepAwake from '@sayem314/react-native-keep-awake';
import DataWedgeIntents from 'react-native-datawedge-intents';
import {deviceId} from '../utils/helpers';
import {Button, Icon} from 'react-native-elements';
import Odoo from '../utils/Odoo';
import ProductProduct from '../entities/Odoo/ProductProduct';
import Mailjet from '../utils/Mailjet';
import ScannerInfoPanel from './ScannerInfoPanel';

// const flashModeOrder: { [key: string]: keyof FlashMode } = {
//     off: RNCamera.Constants.FlashMode.on,
//     //   on: RNCamera.Constants.FlashMode.auto,
//     //   auto: RNCamera.Constants.FlashMode.torch,
//     torch: RNCamera.Constants.FlashMode.off,
// };

// const wbOrder: { [key: string]: keyof WhiteBalance } = {
//     auto: RNCamera.Constants.WhiteBalance.sunny,
//     sunny: RNCamera.Constants.WhiteBalance.cloudy,
//     cloudy: RNCamera.Constants.WhiteBalance.shadow,
//     shadow: RNCamera.Constants.WhiteBalance.fluorescent,
//     fluorescent: RNCamera.Constants.WhiteBalance.incandescent,
//     incandescent: RNCamera.Constants.WhiteBalance.auto,
// };

interface BarcodeReadEvent {
    data: string;
    rawData?: string;
    type: keyof BarCodeType;
    /**
     * @description For Android use `{ width: number, height: number, origin: Array<Point<string>> }`
     * @description For iOS use `{ origin: Point<string>, size: Size<string> }`
     */
    bounds: {width: number; height: number; origin: Array<Point<string>>} | {origin: Point<string>; size: Size<string>};
}

const landmarkSize = 2;

interface Props {
    ref?: (instance: CodeScanner) => void;
    extraInfoPanel?: (product: ProductProduct) => ReactNode;
    onProductFound?: (product: ProductProduct) => void;

    showInfoPanel?: boolean;
}

interface State {
    flash: keyof FlashMode;
    zoom: number;
    autoFocus?: keyof AutoFocus;
    autoFocusPoint: {
        normalized: {
            x: number;
            y: number;
        };
        drawRectPosition: {
            x: number;
            y: number;
        };
    };
    depth: number;
    type?: keyof CameraType;
    whiteBalance: keyof WhiteBalance;
    ratio?: string;
    recordOptions: RecordOptions;
    isRecording: boolean;
    canDetectFaces: boolean;
    canDetectText: boolean;
    canDetectBarcode: boolean;
    faces: Face[];
    textBlocks: TrackedTextFeature[];
    barcodes: Barcode[];

    barcode?: Barcode;
    product?: ProductProduct;
    previousBarcode?: Barcode;
    displayCamera: boolean;
    showManualSearchView: boolean;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
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
    flipButton: {
        flex: 0.3,
        height: 40,
        marginHorizontal: 2,
        marginBottom: 10,
        marginTop: 10,
        borderRadius: 8,
        borderColor: 'white',
        borderWidth: 1,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    autoFocusBox: {
        position: 'absolute',
        height: 64,
        width: 64,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
        opacity: 0.4,
    },
    flipText: {
        color: 'white',
        fontSize: 15,
    },
    zoomText: {
        position: 'absolute',
        bottom: 70,
        zIndex: 2,
        left: 2,
    },
    picButton: {
        backgroundColor: 'darkseagreen',
    },
    facesContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        top: 0,
    },
    face: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 2,
        position: 'absolute',
        borderColor: '#FFD700',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    landmark: {
        width: landmarkSize,
        height: landmarkSize,
        position: 'absolute',
        backgroundColor: 'red',
    },
    faceText: {
        color: '#FFD700',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 10,
        backgroundColor: 'transparent',
    },
    text: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 2,
        position: 'absolute',
        borderColor: '#F00',
        justifyContent: 'center',
    },
    textBlock: {
        color: '#F00',
        position: 'absolute',
        textAlign: 'center',
        backgroundColor: 'transparent',
        width: '100%',
    },
});

export default class CodeScanner extends React.Component<Props, State> {
    private camera: RNCamera | null = null;
    private beepSound: Sound;
    private scannerMode: 'camera' | 'dataWedge';
    /* DataWedge */
    private sendCommandResult: 'true' | 'false' = 'false';
    private broadcastReceiverHandler?: (intent: any) => void;
    /* End DataWedge */

    state: State = {
        flash: RNCamera.Constants.FlashMode.off,
        zoom: 0,
        autoFocus: RNCamera.Constants.AutoFocus.on,
        autoFocusPoint: {
            normalized: {x: 0.5, y: 0.5}, // normalized values required for autoFocusPointOfInterest
            drawRectPosition: {
                x: Dimensions.get('window').width * 0.5,
                y: Dimensions.get('window').height * 0.5 - 64,
            },
        },
        depth: 0,
        type: RNCamera.Constants.Type.back,
        whiteBalance: RNCamera.Constants.WhiteBalance.auto,
        ratio: undefined,
        recordOptions: {
            mute: false,
            maxDuration: 5,
            quality: RNCamera.Constants.VideoQuality['288p'],
        },
        isRecording: false,
        canDetectFaces: false,
        canDetectText: false,
        canDetectBarcode: true,
        faces: [],
        textBlocks: [],
        barcodes: [],

        barcode: undefined,
        product: undefined,
        previousBarcode: undefined,
        displayCamera: true,
        showManualSearchView: false,
    };

    constructor(props: Props) {
        super(props);
        this.state.canDetectBarcode = true;
        this.scannerMode = 'camera';

        // Sound
        Sound.setCategory('Ambient', true);
        this.beepSound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, error => {
            if (error) {
                console.log('failed to load the sound', error);
            }
        });
        this.beepSound.stop();

        /* DataWedge */
        if ('MC40' == deviceId) {
            this.scannerMode = 'dataWedge';
            this.sendCommandResult = 'false';
            this.broadcastReceiverHandler = (intent): void => {
                this.broadcastReceiver(intent);
            };
            DeviceEventEmitter.addListener('datawedge_broadcast_intent', this.broadcastReceiverHandler);
            this.registerBroadcastReceiver();
            this.determineVersion();
        }
        /* End DataWedge */
    }

    componentWillUnmount(): void {
        if (this.broadcastReceiverHandler) {
            DeviceEventEmitter.removeListener('datawedge_broadcast_intent', this.broadcastReceiverHandler);
        }
    }

    /* DataWedge */
    determineVersion(): void {
        this.sendCommand('com.symbol.datawedge.api.GET_VERSION_INFO', '');
    }

    sendCommand(extraName: string, extraValue: any): void {
        console.log('Sending Command: ' + extraName + ', ' + JSON.stringify(extraValue));
        const broadcastExtras: {[x: string]: string} = {};
        broadcastExtras[extraName] = extraValue;
        broadcastExtras['SEND_RESULT'] = this.sendCommandResult;
        DataWedgeIntents.sendBroadcastWithExtras({
            action: 'com.symbol.datawedge.api.ACTION',
            extras: broadcastExtras,
        });
    }

    registerBroadcastReceiver(): void {
        DataWedgeIntents.registerBroadcastReceiver({
            filterActions: ['fr.supercoop.app_android.ACTION', 'com.symbol.datawedge.api.RESULT_ACTION'],
            filterCategories: ['android.intent.category.DEFAULT'],
        });
    }

    broadcastReceiver(intent: {[x: string]: string}): void {
        //  Broadcast received
        console.log('Received Intent: ' + JSON.stringify(intent));
        if (intent.hasOwnProperty('RESULT_INFO')) {
            const commandResult =
                intent.RESULT +
                ' (' +
                intent.COMMAND.substring(intent.COMMAND.lastIndexOf('.') + 1, intent.COMMAND.length) +
                ')'; // + JSON.stringify(intent.RESULT_INFO);
            this.commandReceived(commandResult.toLowerCase());
        }

        if (intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_VERSION_INFO')) {
            //  The version has been returned (DW 6.3 or higher).  Includes the DW version along with other subsystem versions e.g MX
            const versionInfo: any = intent['com.symbol.datawedge.api.RESULT_GET_VERSION_INFO'];
            console.log('Version Info: ' + JSON.stringify(versionInfo));
            const datawedgeVersion = versionInfo['DATAWEDGE'];
            console.log('Datawedge version: ' + datawedgeVersion);

            //  Fire events sequentially so the application can gracefully degrade the functionality available on earlier DW versions
            if (datawedgeVersion >= '6.3') this.datawedge63();
            if (datawedgeVersion >= '6.4') this.datawedge64();
            if (datawedgeVersion >= '6.5') this.datawedge65();
        } else if (intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS')) {
            //  Return from our request to enumerate the available scanners
            const enumeratedScannersObj = intent['com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS'];
            this.enumerateScanners(enumeratedScannersObj);
        } else if (intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE')) {
            //  Return from our request to obtain the active profile
            const activeProfileObj = intent['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
            this.activeProfile(activeProfileObj);
        } else if (!intent.hasOwnProperty('RESULT_INFO')) {
            //  A barcode has been scanned
            this.dataWedgeBarcodeScanned(intent, new Date().toLocaleString());
        }
    }

    datawedge63(): void {
        console.log('Datawedge 6.3 APIs are available');
        //  Create a profile for our application
        this.sendCommand('com.symbol.datawedge.api.CREATE_PROFILE', 'Supercoop');

        //  Although we created the profile we can only configure it with DW 6.4.
        this.sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');

        //  Enumerate the available scanners on the device
        this.sendCommand('com.symbol.datawedge.api.ENUMERATE_SCANNERS', '');
    }

    datawedge64(): void {
        console.log('Datawedge 6.4 APIs are available');

        //  Documentation states the ability to set a profile config is only available from DW 6.4.
        //  For our purposes, this includes setting the decoders and configuring the associated app / output params of the profile.
        //this.state.dwVersionText = '6.4.';
        //this.state.dwVersionTextStyle = styles.itemText;
        //document.getElementById('info_datawedgeVersion').classList.remove("attention");

        //  Decoders are now available
        //this.state.checkBoxesDisabled = false;

        //  Configure the created profile (associated app and keyboard plugin)
        const profileConfig = {
            PROFILE_NAME: 'Supercoop',
            PROFILE_ENABLED: 'true',
            CONFIG_MODE: 'UPDATE',
            PLUGIN_CONFIG: {
                PLUGIN_NAME: 'BARCODE',
                RESET_CONFIG: 'true',
                PARAM_LIST: {},
            },
            APP_LIST: [
                {
                    PACKAGE_NAME: 'fr.supercoop.app_android',
                    ACTIVITY_LIST: ['fr.supercoop.app_android.MainActivity'],
                },
            ],
        };
        this.sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig);

        //  Configure the created profile (intent plugin)
        const profileConfig2 = {
            PROFILE_NAME: 'Supercoop',
            PROFILE_ENABLED: 'true',
            CONFIG_MODE: 'UPDATE',
            PLUGIN_CONFIG: {
                PLUGIN_NAME: 'INTENT',
                RESET_CONFIG: 'true',
                PARAM_LIST: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    intent_output_enabled: 'true',
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    intent_action: 'fr.supercoop.app_android.ACTION',
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    intent_delivery: '2',
                },
            },
        };
        this.sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig2);

        //  Give some time for the profile to settle then query its value
        setTimeout(() => {
            this.sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');
        }, 1000);
    }

    datawedge65(): void {
        console.log('Datawedge 6.5 APIs are available');

        //  Instruct the API to send
        this.sendCommandResult = 'true';
    }

    commandReceived(commandText: string): void {
        console.log('lastApiText: ' + commandText);
    }

    enumerateScanners(enumeratedScanners: any): void {
        console.log(enumeratedScanners);
        let humanReadableScannerList = '';
        for (let i = 0; i < enumeratedScanners.length; i++) {
            console.log(
                'Scanner found: name= ' +
                    enumeratedScanners[i].SCANNER_NAME +
                    ', id=' +
                    enumeratedScanners[i].SCANNER_INDEX +
                    ', connected=' +
                    enumeratedScanners[i].SCANNER_CONNECTION_STATE,
            );
            humanReadableScannerList += enumeratedScanners[i].SCANNER_NAME;
            if (i < enumeratedScanners.length - 1) humanReadableScannerList += ', ';
        }
        console.info(humanReadableScannerList);
    }

    activeProfile(theActiveProfile: string): void {
        console.log('Active Profile: ' + theActiveProfile);
    }

    dataWedgeBarcodeScanned(scanData: {[x: string]: any}, timeOfScan: string): void {
        let scannedData = scanData['com.symbol.datawedge.data_string'];
        const scannedType = scanData['com.symbol.datawedge.label_type'];
        if ('LABEL-TYPE-UPCA' === scannedType) {
            scannedData = `0${scannedData}`;
        }
        const scan = {data: scannedData, decoder: scannedType, timeAtDecode: timeOfScan};
        console.log(scan);
        const barcodeEvent: BarcodeReadEvent = {
            data: scannedData,
            rawData: undefined,
            type: scannedType,
            bounds: {
                width: 0,
                height: 0,
                origin: [{x: '0', y: '0'}],
            },
        };
        this.setState({
            displayCamera: false,
        });
        this.barcodeRecognized(barcodeEvent);
    }
    /* End DataWedge */

    findBestRatio = async (): Promise<void> => {
        if (Platform.OS === 'android' && this.camera) {
            const ratios = await this.camera.getSupportedRatiosAsync();

            // Usually the last element of "ratios" is the maximum supported ratio
            let ratio = ratios.find(ratioElement => ratioElement === '16:9');
            if (ratio === undefined) {
                ratio = ratios.find(ratioElement => ratioElement === '4:3');
            }

            this.setState({
                ratio,
            });
        }
    };

    reset = (): void => {
        this.setState({
            barcodes: [],
            displayCamera: true,
            showManualSearchView: false,
        });
    };

    showManualSearchView = (): void => {
        this.pauseCamera();
        this.setState({showManualSearchView: true});
    };
    hideManualSearchView = (): void => this.setState({showManualSearchView: false});

    pauseCamera = (): void => this.setState({displayCamera: false});
    resumeCamera = (): void => this.setState({displayCamera: true});

    setFlash = (flash: keyof FlashMode): void => {
        this.setState({flash});
    };
    toggleFlash = (): void => {
        if (this.state.flash == RNCamera.Constants.FlashMode.off) {
            this.setFlash(RNCamera.Constants.FlashMode.torch);
            return;
        }
        this.setFlash(RNCamera.Constants.FlashMode.off);
    };

    setAutofocus = (autoFocus: keyof AutoFocus): void => {
        this.setState({autoFocus});
    };
    toggleFocus = (): void => {
        this.setState(previousState => ({
            autoFocus:
                previousState.autoFocus === RNCamera.Constants.AutoFocus.on
                    ? RNCamera.Constants.AutoFocus.off
                    : RNCamera.Constants.AutoFocus.on,
        }));
    };

    touchToFocus = (event: GestureResponderEvent) => (): void => {
        const {pageX, pageY} = event.nativeEvent;
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const isPortrait = screenHeight > screenWidth;

        let x = pageX / screenWidth;
        let y = pageY / screenHeight;
        // Coordinate transform for portrait. See autoFocusPointOfInterest in docs for more info
        if (isPortrait) {
            x = pageY / screenHeight;
            y = -(pageX / screenWidth) + 1;
        }

        this.setState({
            autoFocusPoint: {
                normalized: {x, y},
                drawRectPosition: {x: pageX, y: pageY},
            },
        });
    };

    legacyBarcodeToBarcode = (legacy: BarcodeReadEvent): Barcode => {
        let width = 0;
        let height = 0;
        let x = 0;
        let y = 0;
        if (Platform.OS === 'ios' && 'size' in legacy.bounds) {
            width = parseFloat(legacy.bounds.size.width);
            height = parseFloat(legacy.bounds.size.height);
            x = parseFloat(legacy.bounds.origin.x);
            y = parseFloat(legacy.bounds.origin.y);
        }
        if (Platform.OS === 'android' && 'width' in legacy.bounds) {
            width = legacy.bounds.width;
            height = legacy.bounds.height;
            x = parseFloat(legacy.bounds.origin[0].x);
            y = parseFloat(legacy.bounds.origin[0].y);
        }

        const barcode: Barcode = {
            data: legacy.data,
            dataRaw: legacy.rawData ? legacy.rawData : '',
            bounds: {
                size: {width: width, height: height},
                origin: {x: x, y: y},
            },
            type: this.legacyBarcodeTypeToBarcodeType(legacy.type),
        };

        return barcode;
    };

    legacyBarcodeTypeToBarcodeType = (legacyType: keyof BarCodeType): BarcodeType => {
        let type: BarcodeType;
        switch (legacyType) {
            case RNCamera.Constants.BarCodeType.ean8:
            case RNCamera.Constants.BarCodeType.ean13:
            default:
                type = 'PRODUCT';
        }

        return type;
    };

    barcodeRecognized = (event: BarcodeReadEvent): void => {
        console.debug(event);
        const barcode = this.legacyBarcodeToBarcode(event);
        const previousBarcode: Barcode | undefined = this.state.barcodes[0] ? this.state.barcodes[0] : undefined;
        this.setState({barcodes: [barcode]});
        if (undefined === previousBarcode || (previousBarcode && previousBarcode.data !== barcode.data)) {
            if ('camera' === this.scannerMode) {
                Vibration.vibrate(500, false);
                this.beepSound.play(() => {
                    this.beepSound.stop(); // Resets file for immediate play availability
                });
            }
        }
    };

    lookupForBarcode(barcode: Barcode): void {
        Odoo.getInstance()
            .fetchProductFromBarcode(barcode.data)
            .then(
                odooProductProduct => {
                    if (!odooProductProduct) {
                        this.handleNotFoundProductProduct(barcode);
                        return;
                    }
                    if (this.props.onProductFound !== undefined) {
                        this.props.onProductFound(odooProductProduct);
                    }
                },
                reason => {
                    Alert.alert('Erreur', `Une erreur est survenue ("${reason}"). Merci de réessayer.`);
                    this.reset();
                },
            );
    }

    handleNotFoundProductProduct(barcode: Barcode): void {
        // TODO: Alert avec option de fermer ou de signaler avec reportUnknownProductProductByMail()
    }

    reportUnknownProductProductByMail(odooProductProduct: ProductProduct): void {
        const to = 'inventaire@supercoop.fr';
        const subject = `Code barre inconnu (${odooProductProduct.barcode})`;
        const body = `Le code barre ${odooProductProduct.barcode} est introuvable dans Odoo.
Il a été associé à un produit nommé "${odooProductProduct.name}"`;
        try {
            Mailjet.getInstance()
                .sendEmail(to, '', subject, body)
                .then(() => {
                    Alert.alert('Mail envoyé', 'Merci pour le signalement ! 🎉');
                });
        } catch (e) {
            Alert.alert('Erreur', "Houston, une erreur est survenue lors de l'envoi du mail de signalement 😢");
        }
        this.reset();
    }

    renderBarcodes = (): React.ReactElement => (
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.barcodes.map(this.renderBarcode)}
        </View>
    );

    renderBarcode = ({bounds, data}: Barcode): React.ReactFragment => (
        <React.Fragment key={data + bounds.origin.x}>
            <View
                style={[
                    styles.text,
                    {
                        ...bounds.size,
                        left: bounds.origin.x,
                        top: bounds.origin.y,
                    },
                ]}>
                <Text style={[styles.textBlock]} numberOfLines={1}>{`${data}`}</Text>
            </View>
        </React.Fragment>
    );

    renderManualSearchView(): React.ReactElement {
        return (
            <DialogInput
                isDialogVisible={this.state.showManualSearchView}
                title={'Recherche manuelle'}
                message={'Entres le code barre du produit que tu cherches'}
                submitInput={(barcodeData: string): void => {
                    let type = RNCamera.Constants.BarCodeType.ean13;
                    if (barcodeData.length === 8) {
                        type = RNCamera.Constants.BarCodeType.ean8;
                    }
                    const barcode: BarcodeReadEvent = {
                        data: barcodeData,
                        type: type,
                        bounds: {origin: {x: '0', y: '0'}, size: {width: '0', height: '0'}},
                    };
                    this.hideManualSearchView();
                    this.barcodeRecognized(barcode);
                }}
                closeDialog={(): void => {
                    this.reset();
                }}
                textInputProps={{
                    keyboardType: 'number-pad',
                    returnKeyLabel: 'done',
                    returnKeyType: 'done',
                }}
                cancelText="Annuler"
                submitText="Chercher"
            />
        );
    }

    renderCamera = (): React.ReactElement => {
        const {canDetectBarcode} = this.state;
        return (
            <RNCamera
                ref={(ref): void => {
                    this.camera = ref;
                }}
                style={{
                    flex: 1,
                    justifyContent: 'space-between',
                }}
                type={this.state.type}
                flashMode={this.state.flash}
                autoFocus={this.state.autoFocus}
                autoFocusPointOfInterest={this.state.autoFocusPoint.normalized}
                zoom={this.state.zoom}
                whiteBalance={this.state.whiteBalance}
                ratio={this.state.ratio}
                focusDepth={this.state.depth}
                androidCameraPermissionOptions={{
                    title: 'Permission to use camera',
                    message: 'We need your permission to use your camera',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                }}
                onMountError={(error: {message: string}): void => {
                    console.error(error.message);
                }}
                onCameraReady={this.findBestRatio}
                // faceDetectionLandmarks={
                //     RNCamera.Constants.FaceDetection.Landmarks
                //         ? RNCamera.Constants.FaceDetection.Landmarks.all
                //         : undefined
                // }
                captureAudio={false}
                // onFacesDetected={canDetectFaces ? this.facesDetected : undefined}
                // onTextRecognized={canDetectText ? this.textRecognized : undefined}
                onBarCodeRead={canDetectBarcode ? this.barcodeRecognized : undefined}
                //onGoogleVisionBarcodesDetected={canDetectBarcode ? this.barcodeRecognized : undefined}
            >
                <BarcodeMask width={300} height={100} showAnimatedLine={false} />
                <View style={styles.actions}>
                    <View style={styles.actionButton}>
                        <Button
                            icon={
                                <Icon
                                    type="font-awesome-5"
                                    name="bolt"
                                    color={this.state.flash == RNCamera.Constants.FlashMode.torch ? 'yellow' : 'white'}
                                    solid
                                />
                            }
                            buttonStyle={{
                                backgroundColor: 'black',
                            }}
                            titleStyle={{
                                color: this.state.flash == RNCamera.Constants.FlashMode.torch ? 'yellow' : 'white',
                            }}
                            onPress={this.toggleFlash}
                            title=" Flash"
                        />
                    </View>
                    <View style={styles.actionButton}>
                        <Button
                            icon={
                                <Icon
                                    type="font-awesome-5"
                                    name="expand"
                                    color={this.state.autoFocus === RNCamera.Constants.AutoFocus.on ? 'green' : 'red'}
                                    solid
                                />
                            }
                            buttonStyle={{
                                backgroundColor: 'black',
                            }}
                            titleStyle={{
                                color: this.state.autoFocus === RNCamera.Constants.AutoFocus.on ? 'green' : 'red',
                            }}
                            onPress={this.toggleFocus}
                            title=" Autofocus"
                        />
                    </View>
                    <View style={styles.actionButton}>
                        <Button
                            icon={<Icon type="font-awesome-5" name="keyboard" color="white" solid />}
                            buttonStyle={{backgroundColor: 'black'}}
                            onPress={this.showManualSearchView}
                            title=" Clavier"
                        />
                    </View>
                    {__DEV__ ? (
                        <Button
                            title="test"
                            onPress={(): void => {
                                const barcodeEvent: BarcodeReadEvent = {
                                    data: '3478820030915',
                                    type: 'ean13',
                                    bounds: {
                                        origin: {x: '30', y: '60'},
                                        size: {width: '320', height: '240'},
                                    },
                                };
                                this.barcodeRecognized(barcodeEvent);
                            }}
                        />
                    ) : null}
                </View>
                {!!canDetectBarcode && this.renderBarcodes()}
            </RNCamera>
        );
    };

    renderDataWedgeInstruction = (): React.ReactElement => {
        return (
            <View style={{backgroundColor: 'white', height: '100%'}}>
                <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 8}}>
                    <Icon
                        type="font-awesome-5"
                        name="arrow-up"
                        size={20}
                        style={{textAlignVertical: 'center', marginRight: 8}}
                    />
                    <Text style={{fontSize: 20}}>Laser</Text>
                    <Icon
                        type="font-awesome-5"
                        name="exclamation-triangle"
                        size={20}
                        color="red"
                        style={{textAlignVertical: 'center', marginLeft: 8}}
                    />
                </View>
                <View
                    style={{
                        marginTop: 83,
                        marginBottom: 60,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}>
                    <View
                        style={{
                            width: 10,
                            height: 85,
                            backgroundColor: 'black',
                            borderBottomRightRadius: 30,
                            borderTopRightRadius: 30,
                        }}></View>
                    <Icon
                        type="font-awesome-5"
                        name="arrow-left"
                        size={30}
                        style={{marginTop: 25, textAlignVertical: 'center'}}
                    />
                    <Text style={{width: '50%', textAlign: 'center', textAlignVertical: 'center'}}>
                        Reste appuyé sur un des boutons latéraux pour activer le scanner laser.
                    </Text>
                    <Icon
                        type="font-awesome-5"
                        name="arrow-right"
                        size={30}
                        style={{marginTop: 25, textAlignVertical: 'center'}}
                    />
                    <View
                        style={{
                            width: 10,
                            height: 85,
                            backgroundColor: 'black',
                            borderBottomLeftRadius: 30,
                            borderTopLeftRadius: 30,
                        }}></View>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                    <Icon type="font-awesome-5" name="exclamation-triangle" solid size={30} color="red" />
                    <Icon type="font-awesome-5" name="eye" solid size={30} color="red" />
                </View>
                <Text style={{textAlign: 'center', fontSize: 24}}>Attention aux yeux.</Text>
                <Text style={{textAlign: 'center'}}>Ne pas pointer le laser vers un visage !</Text>
            </View>
        );
    };

    renderInfoPanel(): React.ReactNode {
        let extraPanel: ReactNode = null;
        if (this.state.product && this.props.extraInfoPanel) {
            extraPanel = <View>{this.props.extraInfoPanel(this.state.product)}</View>;
        }
        return (
            <ScannerInfoPanel
                barcode={this.state.barcodes.length > 0 ? this.state.barcodes[0].data : undefined}
                extraPanel={this.props.extraInfoPanel}
                productNotFoundCallback={(): void => {
                    console.error('Product not found');
                    this.handleNotFoundProductProduct(this.state.barcodes[0]);
                }}
                productFoundCallback={(product): void => {
                    if (this.props.onProductFound) {
                        this.props.onProductFound(product);
                    }
                }}
                onClose={(): void => {
                    this.setState({barcodes: []});
                }}>
                {extraPanel}
            </ScannerInfoPanel>
        );
    }

    render(): React.ReactNode {
        let mainView;
        if ('dataWedge' === this.scannerMode) {
            mainView = this.state.displayCamera ? this.renderDataWedgeInstruction() : undefined;
        }
        if ('camera' === this.scannerMode) {
            mainView = this.state.displayCamera ? this.renderCamera() : undefined;
        }
        return (
            <View style={styles.container}>
                <KeepAwake />
                {this.renderManualSearchView()}
                {mainView}
                {this.renderInfoPanel()}
            </View>
        );
    }
}
