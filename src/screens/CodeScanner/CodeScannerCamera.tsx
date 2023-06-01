import React, {useEffect, useState} from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import Reanimated, {useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {BarcodeFormat, useScanBarcodes} from 'vision-camera-code-scanner';
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
    const device = devices.back;
    const appIsForeground = useIsForeground();
    const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
    const [autoFocusEnabled, setAutoFocusEnabled] = useState<boolean>(true);

    const barcodeBounds = useSharedValue({top: 0, left: 0, width: 0, height: 0});
    const [frameProcessor, barcodes, frameWidth, frameHeight] = useScanBarcodes([
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
    ]);
    useEffect(() => {
        if (barcodes.length > 0) {
            const rawBarcode = barcodes[0].rawValue;
            if (rawBarcode) {
                onBarcodeFound(rawBarcode);
            }
        }
    }, [barcodes, onBarcodeFound]);

    const boxOverlayStyle = useAnimatedStyle(
        () => ({
            position: 'absolute',
            borderWidth: 1,
            borderColor: 'red',
            ...barcodeBounds.value,
        }),
        [barcodeBounds],
    );

    const barcodeStyle = StyleSheet.create({
        barcodeText: {
            color: 'white',
            fontWeight: 'bold',
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
                frameProcessor={frameProcessor}
                frameProcessorFps={1}
                preset={'hd-1280x720'}
                torch={torchEnabled ? 'on' : 'off'}
                audio={false}
            />
            <CodeScannerCameraOptions
                onFlashToggle={setTorchEnabled}
                onAutofocusToggle={setAutoFocusEnabled}
                onTestButtonTrigger={() => {
                    onBarcodeFound('3478820030915');
                }}
            />
            {barcodes.map(barcode => {
                const xRatio = frameWidth / WINDOW_WIDTH;
                const yRatio = frameHeight / WINDOW_HEIGHT;

                if (barcode.boundingBox) {
                    //barcodeBounds.value = barcode.boundingBox;
                }
                if (barcode.cornerPoints) {
                    const cornerPoints = barcode.cornerPoints;
                    const xArray = cornerPoints.map(corner => corner.x);
                    const yArray = cornerPoints.map(corner => corner.y);
                    barcodeBounds.value = {
                        top: Math.min(...yArray) / yRatio,
                        left: Math.min(...xArray) / xRatio,
                        width: (Math.max(...xArray) - Math.min(...xArray)) / xRatio,
                        height: (Math.max(...yArray) - Math.min(...yArray)) / yRatio,
                    };
                }

                return (
                    <Reanimated.View style={boxOverlayStyle}>
                        <Text style={barcodeStyle.barcodeText}>{barcode.rawValue}</Text>
                    </Reanimated.View>
                );
            })}
        </>
    );
};

export default CodeScannerCamera;
