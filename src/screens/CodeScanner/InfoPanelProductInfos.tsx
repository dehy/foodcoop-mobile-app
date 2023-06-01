import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ProductProduct, {UnitOfMeasurement} from '../../entities/Odoo/ProductProduct';
import InfoPanelProductImage from './InfoPanelProductImage';

type Props = {
    product: ProductProduct;
};

const InfoPanelProductInfos = ({product}: Props) => {
    const styles = StyleSheet.create({
        articleName: {
            flex: 1,
            fontSize: 24,
            fontWeight: 'bold',
        },
        detailTitle: {
            flex: 1,
            textAlign: 'center',
        },
        detailValue: {
            flex: 2,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 24,
        },
        detailValueInvalid: {
            color: 'red',
        },
    });

    return (
        <View>
            <View style={{flexDirection: 'row'}}>
                <InfoPanelProductImage url={product.image} />
                <Text numberOfLines={2} style={styles.articleName}>
                    {product.name}
                </Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row', marginVertical: 8}}>
                <View style={{flex: 1, flexDirection: 'row', marginVertical: 8}}>
                    <View style={{flex: 1, flexDirection: 'column'}}>
                        <Text style={styles.detailTitle}>Prix</Text>
                        <Text style={styles.detailValue}>
                            {undefined !== product.lstPrice
                                ? (Math.round(product.lstPrice * 100) / 100).toFixed(2) + ' €'
                                : '-'}
                        </Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.detailTitle}>
                            {UnitOfMeasurement.unit === product?.packagingUnit() && 'Unité'}
                            {UnitOfMeasurement.kg === product?.packagingUnit() && 'Poids'}
                            {UnitOfMeasurement.litre === product?.packagingUnit() && 'Volume'}
                        </Text>
                        <Text style={styles.detailValue}>{product.packagingAsString()}</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.detailTitle}>Stock</Text>
                        <Text
                            style={[
                                styles.detailValue,
                                !product.quantityIsValid() ? styles.detailValueInvalid : undefined,
                            ]}>
                            {product.quantityIsValid() ? product.quantityAsString() : '-'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default InfoPanelProductInfos;
