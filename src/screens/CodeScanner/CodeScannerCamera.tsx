import React, {useEffect, useState} from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {
    CameraHighlights,
    useBarcodeScanner,
  } from "@mgcrea/vision-camera-barcode-scanner";
import {Camera, useCameraDevices, useCameraFormat} from 'react-native-vision-camera';
import {useIsForeground} from '../../hooks/useIsForeground';
import CodeScannerCameraOptions from './CodeScannerCameraOptions';

type Props = {
    displayCamera: boolean;
    onBarcodeFound: (barcode: string) => void;
};

const CodeScannerCamera = ({displayCamera, onBarcodeFound}: Props) => {
    const WINDOW_HEIGHT = Dimensions.get('window').height;
    const WINDOW_WIDTH = Dimensions.get('window').width;

    const devices = useCameraDevices();
    const device = devices.find(({ position }) => position === "back");
    const format = useCameraFormat(device, [
        { videoResolution: { width: 1920, height: 1080 } },
    ]);
    const appIsForeground = useIsForeground();
    const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
    const [autoFocusEnabled, setAutoFocusEnabled] = useState<boolean>(true);

    const { props: cameraProps, highlights } = useBarcodeScanner({
        fps: 5,
        barcodeTypes: ["ean-8", "ean-13"], // optional
        onBarcodeScanned: (barcodes) => {
          "worklet";
          console.log(
            `Scanned ${barcodes.length} codes with values=${JSON.stringify(
              barcodes.map(({ value }) => value),
            )} !`,
          );
          if (barcodes.length >= 1 && barcodes[0].value) {
            onBarcodeFound(barcodes[0].value);
          }
        },
    });

    if (device == null) {
        return (
            <View>
                <Text>Chargement...</Text>
            </View>
        );
    }
    return (
        <>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={appIsForeground && displayCamera}
                torch={torchEnabled ? 'on' : 'off'}
                audio={false}
                {...cameraProps}
            />
            <CodeScannerCameraOptions
                onFlashToggle={setTorchEnabled}
                onAutofocusToggle={setAutoFocusEnabled}
                onTestButtonTrigger={() => {
                    onBarcodeFound('3478820030915');
                }}
            />
            <CameraHighlights highlights={highlights} color="peachpuff" />
        </>
    );
};

export default CodeScannerCamera;
