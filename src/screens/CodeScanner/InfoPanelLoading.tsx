import React from 'react';
import {Icon} from '@rneui/themed';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

type Props = {
    barcode: string;
};

const InfoPanelLoading = ({barcode}: Props) => {
    const styles = StyleSheet.create({
        wrapper: {
            alignContent: 'center',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
        },
        barcodeView: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingView: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
    });

    return (
        <View style={styles.wrapper}>
            <View style={styles.barcodeView}>
                <Icon name="barcode" type="font-awesome-5" style={{paddingRight: 8}} />
                <Text style={{fontSize: 18}}>{barcode}</Text>
            </View>
            <View style={styles.loadingView}>
                <ActivityIndicator size="small" style={{paddingRight: 10}} />
                <Text>Chargement des informations produit</Text>
            </View>
        </View>
    );
};

export default InfoPanelLoading;
