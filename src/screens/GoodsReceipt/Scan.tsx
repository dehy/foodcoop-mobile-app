import React from 'react';
import { Image, SafeAreaView, Text, View, Button } from 'react-native';
import Scanner2 from '../Scanner2';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { Barcode } from 'react-native-camera/types';
import Odoo from '../../utils/Odoo';
import ProductProduct from '../../entities/Odoo/ProductProduct';
import { getConnection, getRepository } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import AppLogger from '../../utils/AppLogger';

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
        AppLogger.getLogger().debug(`Barcode '${barcode.data}' scanned`);
        Odoo.getInstance()
            .fetchProductFromBarcode(barcode.data)
            .then((product: ProductProduct | null) => {
                if (product === null) {
                    AppLogger.getLogger().debug(`Product with barcode '${barcode.data}' not found`);
                    return;
                }
                AppLogger.getLogger().debug(`Found Product '${barcode.data}' => '${product.name}'`);
                getConnection()
                    .getRepository(GoodsReceiptEntry)
                    .findOneOrFail({
                        where: {
                            barcode: product.barcode,
                        },
                    })
                    .then((entry: GoodsReceiptEntry) => {
                        AppLogger.getLogger().debug(
                            `GoodsReceipt Entry found for Product '${barcode.data}': ${entry.productName} (${entry.expectedProductQty})`,
                        );
                        this.setState({
                            product: product,
                            goodsReceiptEntry: entry,
                        });
                    });
            });
    }

    didTapValid(): void {
        AppLogger.getLogger().debug('Did tap valid');
        if (this.state.goodsReceiptEntry) {
            const goodsReceiptEntry = this.state.goodsReceiptEntry;
            goodsReceiptEntry.productQty = this.state.goodsReceiptEntry.expectedProductQty;
            getRepository(GoodsReceiptEntry)
                .save(goodsReceiptEntry)
                .then(() => {
                    this.setState({
                        product: undefined,
                        goodsReceiptEntry: undefined,
                    });
                });
        }
    }

    didTapInvalid(): void {
        AppLogger.getLogger().debug('Did tap invalid');
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
                    this.didScanBarcode(barcode);
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
