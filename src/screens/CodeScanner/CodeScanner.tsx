import KeepAwake, {useKeepAwake} from '@sayem314/react-native-keep-awake';
import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import CodeScannerCamera from './CodeScannerCamera';
import InfoPanel from './InfoPanel';
import ManualSearchView from './ManualSearchView';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import Odoo from '../../utils/Odoo';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
    },
});

type Props = {
    displayCamera: boolean;
    onProductFound?: (product?: ProductProduct) => void;
    extraInfoPanel?: React.ReactNode | (() => React.ReactNode);
};

const CodeScanner = ({displayCamera, onProductFound, extraInfoPanel}: Props) => {
    useKeepAwake();

    const [barcode, setBarcode] = useState<string>();
    const [product, setProduct] = useState<ProductProduct | null>();

    useEffect(() => {
        if (barcode === undefined) {
            setProduct(null);
            return;
        }
        setProduct(undefined);
        Odoo.getInstance()
            .fetchProductFromBarcode(barcode)
            .then(setProduct)
            .catch(() => {
                setProduct(null);
            });
    }, [barcode]);

    useEffect(() => {
        if (onProductFound) {
            onProductFound(product);
        }
    }, [product, onProductFound]);

    return (
        <View style={styles.container}>
            <KeepAwake />
            <ManualSearchView />
            <CodeScannerCamera displayCamera={displayCamera} onBarcodeFound={setBarcode} />
            {barcode && (
                <InfoPanel
                    barcode={barcode}
                    product={product}
                    onClose={() => {
                        setBarcode(undefined);
                        setProduct(undefined);
                    }}>
                    {extraInfoPanel && typeof extraInfoPanel === 'function' && extraInfoPanel()}
                    {extraInfoPanel && React.isValidElement(extraInfoPanel) && extraInfoPanel}
                </InfoPanel>
            )}
        </View>
    );
};

export default CodeScanner;
