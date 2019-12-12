import React from 'react';
import { Image, SafeAreaView, Text, View, Button } from 'react-native';
import Scanner2 from '../Scanner2';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { Barcode } from 'react-native-camera/types';
import Odoo from '../../utils/Odoo';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import { getConnection } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';

interface GoodsReceiptScanProps {
    componentId: string;
}

interface GoodsReceiptScanState {
    product?: ProductProduct;
    goodsReceiptEntry?: GoodsReceiptEntry;
}

export default class GoodsReceiptScan extends React.Component<GoodsReceiptScanProps, GoodsReceiptScanState> {
    scanner?: Scanner2;
    state: GoodsReceiptScanState = {
        product: undefined,
        goodsReceiptEntry: undefined,
    };

    constructor(props: GoodsReceiptScanProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        const options = defaultScreenOptions('Scan');
        options.topBar = {
            rightButtons: [
                {
                    id: 'close',
                    text: 'Fermer',
                },
            ],
        };

        return options;
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'close') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    didScanBarcode(barcode: Barcode): void {
        Odoo.getInstance()
            .fetchProductFromBarcode(barcode.data)
            .then((product: ProductProduct | null) => {
                if (product === null) {
                    return;
                }
                getConnection()
                    .getRepository(GoodsReceiptEntry)
                    .findOneOrFail({
                        where: {
                            barcode: product.barcode,
                        },
                    })
                    .then((entry: GoodsReceiptEntry) => {
                        this.setState({
                            product: product,
                            goodsReceiptEntry: entry,
                        });
                    });
            });
    }

    didTapValid(): void {
        console.debug('Did tap valid');
    }

    didTapInvalid(): void {
        console.debug('Did tap invalid');
    }

    renderEntry(): React.ReactNode {
        return (
            <View>
                <Image source={{ uri: this.state.product && this.state.product.image }} />
                <Text>{this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.productName}</Text>
                <Text>
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedProductQty}
                    {ProductProduct.quantityUnitAsString(
                        this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.productUom,
                    )}
                </Text>
                <View>
                    <Button title="Correct" onPress={(): void => this.didTapValid()} />
                    <Button title="Erreur" onPress={(): void => this.didTapInvalid()} />
                </View>
            </View>
        );
    }

    renderCamera(): React.ReactNode {
        return (
            <Scanner2
                ref={(ref): void => {
                    this.scanner = ref !== null ? ref : undefined;
                }}
                onBarcodeRead={(barcode): void => {
                    console.log(barcode.data);
                }}
            ></Scanner2>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={{ height: '100%' }}>
                {this.state.goodsReceiptEntry ? this.renderEntry() : this.renderCamera()}
            </SafeAreaView>
        );
    }
}
