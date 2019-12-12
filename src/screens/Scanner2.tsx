/* eslint-disable no-console */
import React from 'react';
import { StyleSheet, Text, View, Dimensions, GestureResponderEvent, Platform } from 'react-native';
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
import Icon from 'react-native-vector-icons/FontAwesome5';
import Sound from 'react-native-sound';

const flashModeOrder: { [key: string]: keyof FlashMode } = {
    off: RNCamera.Constants.FlashMode.on,
    //   on: RNCamera.Constants.FlashMode.auto,
    //   auto: RNCamera.Constants.FlashMode.torch,
    torch: RNCamera.Constants.FlashMode.off,
};

const wbOrder: { [key: string]: keyof WhiteBalance } = {
    auto: RNCamera.Constants.WhiteBalance.sunny,
    sunny: RNCamera.Constants.WhiteBalance.cloudy,
    cloudy: RNCamera.Constants.WhiteBalance.shadow,
    shadow: RNCamera.Constants.WhiteBalance.fluorescent,
    fluorescent: RNCamera.Constants.WhiteBalance.incandescent,
    incandescent: RNCamera.Constants.WhiteBalance.auto,
};

interface LegacyBarcode {
    data: string;
    rawData?: string;
    type: keyof BarCodeType;
    /**
     * @description For Android use `[Point<string>, Point<string>]`
     * @description For iOS use `{ origin: Point<string>, size: Size<string> }`
     */
    bounds: [Point<string>, Point<string>] | { origin: Point<string>; size: Size<string> };
}

const landmarkSize = 2;

interface Scanner2Props {
    ref?: (instance: Scanner2) => void;
    onBarcodeRead?: (barcode: Barcode) => void;
}

interface Scanner2State {
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
    ratio: string;
    recordOptions: RecordOptions;
    isRecording: boolean;
    canDetectFaces: boolean;
    canDetectText: boolean;
    canDetectBarcode: boolean;
    faces: Face[];
    textBlocks: TrackedTextFeature[];
    barcodes: Barcode[];

    previousBarcode?: Barcode;
    displayCamera: boolean;
    showManualSearchView: boolean;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
        backgroundColor: '#000',
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
    },
});

export default class Scanner2 extends React.Component<Scanner2Props, Scanner2State> {
    private camera: RNCamera | null = null;
    private beepSound: Sound;

    state = {
        flash: RNCamera.Constants.FlashMode.off,
        zoom: 0,
        autoFocus: RNCamera.Constants.AutoFocus.on,
        autoFocusPoint: {
            normalized: { x: 0.5, y: 0.5 }, // normalized values required for autoFocusPointOfInterest
            drawRectPosition: {
                x: Dimensions.get('window').width * 0.5,
                y: Dimensions.get('window').height * 0.5 - 64,
            },
        },
        depth: 0,
        type: RNCamera.Constants.Type.back,
        whiteBalance: RNCamera.Constants.WhiteBalance.auto,
        ratio: '16:9',
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

        previousBarcode: undefined,
        displayCamera: true,
        showManualSearchView: false,
    };

    constructor(props: Scanner2Props) {
        super(props);
        this.state.canDetectBarcode = true;

        // Sound
        Sound.setCategory('Ambient', true);
        this.beepSound = new Sound('beep.mp3', Sound.MAIN_BUNDLE, error => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
        });
        this.beepSound.stop();
    }

    reset = (): void => {
        this.setState({
            barcodes: [],
            previousBarcode: undefined,
            displayCamera: true,
            showManualSearchView: false,
        });
    };

    showManualSearchView = (): void => {
        this.pauseCamera();
        this.setState({ showManualSearchView: true });
    };
    hideManualSearchView = (): void => this.setState({ showManualSearchView: false });

    pauseCamera = (): void => this.setState({ displayCamera: false });
    resumeCamera = (): void => this.setState({ displayCamera: true });

    toggleFacing = (): void => {
        this.setState(previousState => ({
            type:
                previousState.type === RNCamera.Constants.Type.back
                    ? RNCamera.Constants.Type.front
                    : RNCamera.Constants.Type.back,
        }));
    };

    setFlash = (flash: keyof FlashMode): void => {
        this.setState({ flash });
    };
    toggleFlash = (): void => {
        if (this.state.flash == RNCamera.Constants.FlashMode.off) {
            this.setFlash(RNCamera.Constants.FlashMode.torch);
            return;
        }
        this.setFlash(RNCamera.Constants.FlashMode.off);
    };

    toggleWB = (): void => {
        this.setState(previousState => ({
            whiteBalance: wbOrder[previousState.whiteBalance],
        }));
    };

    setAutofocus = (autoFocus: keyof AutoFocus): void => {
        this.setState({ autoFocus });
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
        const { pageX, pageY } = event.nativeEvent;
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
                normalized: { x, y },
                drawRectPosition: { x: pageX, y: pageY },
            },
        });
    };

    zoomOut = (): void => {
        this.setState(previousState => ({
            zoom: previousState.zoom - 0.1 < 0 ? 0 : previousState.zoom - 0.1,
        }));
    };

    zoomIn = (): void => {
        this.setState(previousState => ({
            zoom: previousState.zoom + 0.1 > 1 ? 1 : previousState.zoom + 0.1,
        }));
    };

    setFocusDepth = (depth: number) => (): void => {
        this.setState({
            depth,
        });
    };

    takePicture = async (): Promise<void> => {
        if (this.camera) {
            const data = await this.camera.takePictureAsync();
            console.warn('takePicture ', data);
        }
    };

    takeVideo = async (): Promise<void> => {
        if (this.camera) {
            try {
                const promise = this.camera.recordAsync(this.state.recordOptions);

                if (promise) {
                    this.setState({ isRecording: true });
                    const data = await promise;
                    this.setState({ isRecording: false });
                    console.warn('takeVideo', data);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    toggle = (value: 'canDetectFaces' | 'canDetectText' | 'canDetectBarcode'): void => {
        const oldValue = this.state[value] as boolean;
        if (value == 'canDetectFaces') {
            this.setState({ canDetectFaces: !oldValue });
        }
        if (value == 'canDetectText') {
            this.setState({ canDetectText: !oldValue });
        }
        if (value == 'canDetectBarcode') {
            this.setState({ canDetectBarcode: !oldValue });
        }
    };

    facesDetected = (response: { faces: Face[] }): void => this.setState({ faces: response.faces });

    renderFace = ({ bounds, faceID, rollAngle, yawAngle }: Face): React.ReactElement => (
        <View
            key={faceID}
            // transform={[
            //   { perspective: 600 },
            //   { rotateZ: `${rollAngle!.toFixed(0)}deg` },
            //   { rotateY: `${yawAngle!.toFixed(0)}deg` },
            // ]}
            style={[
                styles.face,
                {
                    ...bounds.size,
                    left: bounds.origin.x,
                    top: bounds.origin.y,
                },
            ]}
        >
            <Text style={styles.faceText}>ID: {faceID}</Text>
            <Text style={styles.faceText}>rollAngle: {rollAngle && rollAngle.toFixed(0)}</Text>
            <Text style={styles.faceText}>yawAngle: {yawAngle && yawAngle.toFixed(0)}</Text>
        </View>
    );

    renderLandmarksOfFace = (face: Face): React.ReactElement => {
        const renderLandmark = (position?: Point<number>): React.ReactElement | undefined =>
            position && (
                <View
                    style={[
                        styles.landmark,
                        {
                            left: position.x - landmarkSize / 2,
                            top: position.y - landmarkSize / 2,
                        },
                    ]}
                />
            );
        return (
            <View key={`landmarks-${face.faceID}`}>
                {renderLandmark(face.leftEyePosition)}
                {renderLandmark(face.rightEyePosition)}
                {renderLandmark(face.leftEarPosition)}
                {renderLandmark(face.rightEarPosition)}
                {renderLandmark(face.leftCheekPosition)}
                {renderLandmark(face.rightCheekPosition)}
                {renderLandmark(face.leftMouthPosition)}
                {renderLandmark(face.mouthPosition)}
                {renderLandmark(face.rightMouthPosition)}
                {renderLandmark(face.noseBasePosition)}
                {renderLandmark(face.bottomMouthPosition)}
            </View>
        );
    };

    renderFaces = (): React.ReactElement => (
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.faces.map(this.renderFace)}
        </View>
    );

    renderLandmarks = (): React.ReactElement => (
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.faces.map(this.renderLandmarksOfFace)}
        </View>
    );

    renderTextBlocks = (): React.ReactElement => (
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.textBlocks.map(this.renderTextBlock)}
        </View>
    );

    renderTextBlock = ({ bounds, value }: TrackedTextFeature): React.ReactElement => (
        <React.Fragment key={value + bounds.origin.x}>
            <Text style={[styles.textBlock, { left: bounds.origin.x, top: bounds.origin.y }]}>{value}</Text>
            <View
                style={[
                    styles.text,
                    {
                        ...bounds.size,
                        left: bounds.origin.x,
                        top: bounds.origin.y,
                    },
                ]}
            />
        </React.Fragment>
    );

    textRecognized = (response: { textBlocks: TrackedTextFeature[] }): void => {
        const { textBlocks } = response;
        this.setState({ textBlocks });
    };

    legacyBarcodeToBarcode = (legacy: LegacyBarcode): Barcode => {
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
        if (Platform.OS === 'android' && '0' in legacy.bounds) {
            width = parseFloat(legacy.bounds[0].x);
            height = parseFloat(legacy.bounds[0].y);
            x = parseFloat(legacy.bounds[1].x);
            y = parseFloat(legacy.bounds[1].y);
        }

        const barcode: Barcode = {
            data: legacy.data,
            dataRaw: legacy.rawData ? legacy.rawData : '',
            bounds: {
                size: { width: width, height: height },
                origin: { x: x, y: y },
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

    barcodeRecognized = (event: LegacyBarcode): void => {
        const barcode = this.legacyBarcodeToBarcode(event);
        const previousBarcode: Barcode | undefined =
            this.state.barcodes.length > 0 ? this.state.barcodes[0] : undefined;
        this.setState({ barcodes: [barcode] });
        if (!previousBarcode || (previousBarcode && previousBarcode.data !== barcode.data)) {
            this.beepSound.play(() => {
                this.beepSound.stop(); // Resets file for immediate play availability
            });
            if (this.props.onBarcodeRead !== undefined) {
                this.props.onBarcodeRead(barcode);
                return;
            }
        }
    };

    renderBarcodes = (): React.ReactElement => (
        <View style={styles.facesContainer} pointerEvents="none">
            {this.state.barcodes.map(this.renderBarcode)}
        </View>
    );

    renderBarcode = ({ bounds, data }: Barcode): React.ReactElement => (
        <React.Fragment key={data + bounds.origin.x}>
            <View
                style={[
                    styles.text,
                    {
                        ...bounds.size,
                        left: bounds.origin.x,
                        top: bounds.origin.y,
                    },
                ]}
            >
                <Text style={[styles.textBlock]}>{`${data}`}</Text>
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
                    const barcode: LegacyBarcode = {
                        data: barcodeData,
                        type: RNCamera.Constants.BarCodeType.ean13,
                        bounds: { origin: { x: '0', y: '0' }, size: { width: '0', height: '0' } },
                    };
                    this.barcodeRecognized(barcode);
                }}
                closeDialog={(): void => {
                    this.reset();
                }}
                textInputProps={{
                    keyboardType: 'number-pad',
                }}
                cancelText="Annuler"
                submitText="Chercher"
            />
        );
    }

    renderCamera = (): React.ReactElement => {
        const { canDetectFaces, canDetectText, canDetectBarcode } = this.state;
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
                faceDetectionLandmarks={
                    RNCamera.Constants.FaceDetection.Landmarks
                        ? RNCamera.Constants.FaceDetection.Landmarks.all
                        : undefined
                }
                onFacesDetected={canDetectFaces ? this.facesDetected : undefined}
                onTextRecognized={canDetectText ? this.textRecognized : undefined}
                onBarCodeRead={canDetectBarcode ? this.barcodeRecognized : undefined}
                //onGoogleVisionBarcodesDetected={canDetectBarcode ? this.barcodeRecognized : undefined}
            >
                <BarcodeMask width={300} height={100} showAnimatedLine={false} />
                {/* <View
          style={{
            flex: 0.5,
            height: 72,
            backgroundColor: 'transparent',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <View
            style={{
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <TouchableOpacity style={styles.flipButton} onPress={this.toggleFacing}>
              <Text style={styles.flipText}> FLIP </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flipButton} onPress={this.toggleFlash}>
              <Text style={styles.flipText}> FLASH: {this.state.flash} </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flipButton} onPress={this.toggleWB}>
              <Text style={styles.flipText}> WB: {this.state.whiteBalance} </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <TouchableOpacity onPress={() => {this.toggle('canDetectFaces')}} style={styles.flipButton}>
              <Text style={styles.flipText}>
                {!canDetectFaces ? 'Detect Faces' : 'Detecting Faces'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {this.toggle('canDetectText')}} style={styles.flipButton}>
              <Text style={styles.flipText}>
                {!canDetectText ? 'Detect Text' : 'Detecting Text'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {this.toggle('canDetectBarcode')}} style={styles.flipButton}>
              <Text style={styles.flipText}>
                {!canDetectBarcode ? 'Detect Barcode' : 'Detecting Barcode'}
              </Text>
            </TouchableOpacity>
          </View>
        </View> */}
                {/* <View style={{ bottom: 0 }}>
          <View
            style={{
              height: 20,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              alignSelf: 'flex-end',
            }}
          >
            <Slider
              style={{ width: 150, marginTop: 15, alignSelf: 'flex-end' }}
              onValueChange={this.setFocusDepth}
              step={0.1}
              disabled={this.state.autoFocus === 'on'}
            />
          </View>
          <View
            style={{
              height: 56,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              alignSelf: 'flex-end',
            }}
          >
            <TouchableOpacity
              style={[
                styles.flipButton,
                {
                  flex: 0.3,
                  alignSelf: 'flex-end',
                  backgroundColor: this.state.isRecording ? 'white' : 'darkred',
                },
              ]}
              onPress={this.state.isRecording ? () => {} : this.takeVideo}
            >
              {this.state.isRecording ? (
                <Text style={styles.flipText}> ☕ </Text>
              ) : (
                <Text style={styles.flipText}> REC </Text>
              )}
            </TouchableOpacity>
          </View>
          {this.state.zoom !== 0 && (
            <Text style={[styles.flipText, styles.zoomText]}>Zoom: {this.state.zoom}</Text>
          )}
          <View
            style={{
              height: 56,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              alignSelf: 'flex-end',
            }}
          >
            <TouchableOpacity
              style={[styles.flipButton, { flex: 0.1, alignSelf: 'flex-end' }]}
              onPress={this.zoomIn}
            >
              <Text style={styles.flipText}> + </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flipButton, { flex: 0.1, alignSelf: 'flex-end' }]}
              onPress={this.zoomOut}
            >
              <Text style={styles.flipText}> - </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flipButton, { flex: 0.25, alignSelf: 'flex-end' }]}
              onPress={this.toggleFocus}
            >
              <Text style={styles.flipText}> AF : {this.state.autoFocus} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flipButton, styles.picButton, { flex: 0.3, alignSelf: 'flex-end' }]}
              onPress={this.takePicture}
            >
              <Text style={styles.flipText}> SNAP </Text>
            </TouchableOpacity>
          </View>
        </View> */}
                <View style={styles.actions}>
                    <View style={styles.actionButton}>
                        <Icon.Button
                            name="bolt"
                            backgroundColor="#000000"
                            color={this.state.flash == RNCamera.Constants.FlashMode.torch ? '#00FF00' : '#FFFFFF'}
                            onPress={this.toggleFlash}
                            solid
                        >
                            Flash
                        </Icon.Button>
                    </View>
                    <View style={styles.actionButton}>
                        <Icon.Button
                            name="expand"
                            color={this.state.autoFocus === RNCamera.Constants.AutoFocus.on ? '#00FF00' : '#FF0000'}
                            backgroundColor="#000000"
                            onPress={this.toggleFocus}
                            solid
                        >
                            Autofocus
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
                {!!canDetectFaces && this.renderFaces()}
                {!!canDetectFaces && this.renderLandmarks()}
                {!!canDetectText && this.renderTextBlocks()}
                {!!canDetectBarcode && this.renderBarcodes()}
            </RNCamera>
        );
    };

    render(): React.ReactNode {
        return (
            <View style={styles.container}>
                {this.renderManualSearchView()}
                {this.state.displayCamera ? this.renderCamera() : undefined}
            </View>
        );
    }
}
