import React from 'react'
import {
    View,
    Text,
    Button,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList
} from 'react-native'
import { defaultScreenOptions } from '../../utils/navigation';
import { RNCamera } from 'react-native-camera';

export default class InventoryList extends React.Component {
    static get options() {
        return defaultScreenOptions("Inventaire");
    }
    render() {
        return (
            <SafeAreaView>
                <FlatList
                    data={[
                        { key: 'inventory-xxxxxx', title: 'Inventaire du xx/xx/xxxx' },
                        { key: 'inventory-yyyyyy', title: 'Inventaire du yy/yy/yyyy' }
                    ]}
                    renderItem={({ item }) => <Text>{item.title}</Text>}
                />
            </SafeAreaView>
            // <View style={styles.container}>
            //     <RNCamera
            //         ref={ref => {
            //             this.camera = ref;
            //         }}
            //         style={styles.preview}
            //         type={RNCamera.Constants.Type.back}
            //         flashMode={RNCamera.Constants.FlashMode.on}
            //         captureAudio={false}
            //         permissionDialogTitle={'Permission to use camera'}
            //         permissionDialogMessage={'We need your permission to use your camera phone'}
            //         onGoogleVisionBarcodesDetected={({ barcodes }) => {
            //             console.log(barcodes);
            //         }}
            //     />
            //     <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
            //         <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
            //             <Text style={{ fontSize: 14 }}> SNAP </Text>
            //         </TouchableOpacity>
            //     </View>
            // </View>
        )
    }

    takePicture = async function () {
        if (this.camera) {
            const options = { quality: 0.5, base64: true };
            const data = await this.camera.takePictureAsync(options);
            console.log(data.uri);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
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
        padding: 15,
        paddingHorizontal: 20,
        alignSelf: 'center',
        margin: 20,
    },
});