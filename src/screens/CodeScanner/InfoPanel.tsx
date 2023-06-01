import React, {PropsWithChildren, useEffect, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Icon} from '@rneui/themed';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import Odoo from '../../utils/Odoo';
import InfoPanelLoading from './InfoPanelLoading';
import InfoPanelProductInfos from './InfoPanelProductInfos';

type Props = {
    barcode: string;
    product?: ProductProduct | null; // undefined = not searched yet (loading), null = no product found
    onClose: () => void;
};

const InfoPanel = ({barcode, onClose, children}: PropsWithChildren<Props>) => {
    const styles = StyleSheet.create({
        infoPanel: {
            flexDirection: 'column',
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            margin: 8,
            borderRadius: 8,
            backgroundColor: 'white',
            padding: 16,
            minHeight: 170,
        },
        closeButton: {
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 10,
        },
        closeIcon: {
            height: 44,
            width: 44,
            paddingTop: 8,
            paddingRight: 8,
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
        },
    });

    const [product, setProduct] = useState<ProductProduct | null>();

    /*useEffect(() => {
        if (product && product.barcode) {
            OpenFoodFacts.getInstance()
                .fetchFromBarcode(product.barcode)
                .then(offProduct => {
                    product.openFoodFacts = offProduct;
                });
        }
    }, [product]);*/

    useEffect(() => {
        setProduct(undefined);
        Odoo.getInstance()
            .fetchProductFromBarcode(barcode)
            .then(setProduct)
            .catch(() => {
                setProduct(null);
            });
    }, [barcode]);

    const close = () => {
        onClose();
        setProduct(undefined);
    };

    return (
        <View style={styles.infoPanel}>
            <TouchableOpacity style={styles.closeButton} onPress={(): void => close()}>
                <Icon name="times-circle" type="font-awesome-5" color={'#999'} style={styles.closeIcon} />
            </TouchableOpacity>
            {product ? <InfoPanelProductInfos product={product} /> : <InfoPanelLoading barcode={barcode} />}
            {children}
        </View>
    );
};

export default InfoPanel;
