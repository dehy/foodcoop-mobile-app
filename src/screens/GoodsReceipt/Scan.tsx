import React from 'react';
import { Image, SafeAreaView, Text, View, Picker, ScrollView } from 'react-native';
import Scanner2 from '../Scanner2';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { Barcode, BarcodeType } from 'react-native-camera/types';
import Odoo from '../../utils/Odoo';
import ProductProduct, { UnitOfMesurement } from '../../entities/Odoo/ProductProduct';
import { getConnection, getRepository } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import AppLogger from '../../utils/AppLogger';
import { toNumber } from '../../utils/helpers';
import { Input } from 'react-native-elements';
import { Button, Icon, ThemeProvider } from 'react-native-elements';

interface GoodsReceiptScanProps {
    componentId: string;
    preselectedProductBarcode?: string;
}

interface GoodsReceiptScanState {
    product?: ProductProduct;
    goodsReceiptEntry?: GoodsReceiptEntry;
    isValid?: boolean;
}

export default class GoodsReceiptScan extends React.Component<GoodsReceiptScanProps, GoodsReceiptScanState> {
    colorSuccess = '#5cb85c';
    colorSuccessDisabled = '#78C589';
    colorDanger = '#DC3545';
    colorDangerDisabled = '#E77D89';

    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome',
        },
    };

    scanner?: Scanner2;
    state: GoodsReceiptScanState = {
        product: undefined,
        goodsReceiptEntry: undefined,
        isValid: undefined,
    };

    constructor(props: GoodsReceiptScanProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    componentDidMount(): void {
        if (this.props.preselectedProductBarcode) {
            const barcode: Barcode = {
                data: this.props.preselectedProductBarcode,
                dataRaw: this.props.preselectedProductBarcode,
                type: 'PRODUCT',
                bounds: { size: { width: 0, height: 0 }, origin: { x: 0, y: 0 } },
            };
            this.didScanBarcode(barcode);
        }
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
                    alert(`Produit avec le code barre ${barcode.data} non trouvé`);
                    return;
                }
                AppLogger.getLogger().debug(`Found Product '${product.barcode}' => '${product.name}'`);
                getConnection()
                    .getRepository(GoodsReceiptEntry)
                    .findOneOrFail({
                        where: {
                            productBarcode: product.barcode,
                        },
                    })
                    .then((entry: GoodsReceiptEntry) => {
                        AppLogger.getLogger().debug(
                            `GoodsReceipt Entry found for Product '${entry.productBarcode}': ${entry.productName} (${
                                entry.expectedProductQty
                            } ${ProductProduct.quantityUnitAsString(entry.expectedProductUom)})`,
                        );
                        this.setState({
                            product: product,
                            goodsReceiptEntry: entry,
                        });
                    })
                    .catch(() => {
                        alert(`Ce produit ne semble pas avoir été commandé. (TODO)`);
                    });
            });
    }

    didTapValid(): void {
        AppLogger.getLogger().debug('Did tap valid');
        this.setState({
            isValid: true,
        });
        if (this.state.goodsReceiptEntry) {
            const goodsReceiptEntry = this.state.goodsReceiptEntry;
            goodsReceiptEntry.productQty = this.state.goodsReceiptEntry.expectedProductQty;
            getRepository(GoodsReceiptEntry)
                .save(goodsReceiptEntry)
                .then(() => {
                    if (this.props.preselectedProductBarcode) {
                        Navigation.dismissModal(this.props.componentId);
                        return;
                    }
                    this.setState({
                        product: undefined,
                        goodsReceiptEntry: undefined,
                        isValid: undefined,
                    });
                });
        }
    }

    didTapInvalid(): void {
        AppLogger.getLogger().debug('Did tap invalid');
        this.setState({
            isValid: false,
        });
    }

    didTapCancel(): void {
        if (this.props.preselectedProductBarcode) {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
        this.setState({
            product: undefined,
            goodsReceiptEntry: undefined,
        });
    }

    renderInvalid(): React.ReactNode {
        if (this.state.isValid === false) {
            return (
                <ScrollView style={{ height: '100%' }}>
                    <Input
                        placeholder="Quantité reçue"
                        onChangeText={(receivedQtyStr): void => {
                            const receivedQty = toNumber(receivedQtyStr);
                            AppLogger.getLogger().debug(`New receivedQty: ${receivedQtyStr} => ${receivedQty}`);
                            const goodsReceiptEntry = this.state.goodsReceiptEntry;
                            if (goodsReceiptEntry) {
                                goodsReceiptEntry.productQty = receivedQty;
                                this.setState({ goodsReceiptEntry });
                            }
                        }}
                    />
                    <Picker
                        onValueChange={(receivedUomStr: string): void => {
                            const receivedUom = toNumber(receivedUomStr);
                            AppLogger.getLogger().debug(
                                `New receivedUom: ${ProductProduct.quantityUnitAsString(receivedUom)}`,
                            );
                            const goodsReceiptEntry = this.state.goodsReceiptEntry;
                            if (goodsReceiptEntry) {
                                goodsReceiptEntry.productUom = receivedUom;
                                this.setState({ goodsReceiptEntry });
                            }
                        }}
                        selectedValue={this.state.goodsReceiptEntry?.productUom}
                    >
                        <Picker.Item
                            label={ProductProduct.quantityUnitAsString(UnitOfMesurement.unit)}
                            value={UnitOfMesurement.unit}
                        />
                        <Picker.Item
                            label={ProductProduct.quantityUnitAsString(UnitOfMesurement.kg)}
                            value={UnitOfMesurement.kg}
                        />
                    </Picker>
                    <Input
                        placeholder="Commentaire (optionnel)"
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={(invalidReason): void => {
                            AppLogger.getLogger().debug(`New reason: ${invalidReason}`);
                            const goodsReceiptEntry = this.state.goodsReceiptEntry;
                            if (goodsReceiptEntry) {
                                goodsReceiptEntry.comment = invalidReason;
                                this.setState({ goodsReceiptEntry });
                            }
                        }}
                    />
                    <Button
                        title="Valider"
                        onPress={(): void => {
                            if (this.state.goodsReceiptEntry) {
                                const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                getRepository(GoodsReceiptEntry)
                                    .save(goodsReceiptEntry)
                                    .then(() => {
                                        if (this.props.preselectedProductBarcode) {
                                            Navigation.dismissModal(this.props.componentId);
                                            return;
                                        }
                                        this.setState({
                                            product: undefined,
                                            goodsReceiptEntry: undefined,
                                            isValid: undefined,
                                        });
                                    });
                            }
                        }}
                    />
                </ScrollView>
            );
        }
    }

    renderEntry(): React.ReactNode {
        return (
            <View>
                <Image source={{ uri: this.state.product && this.state.product.image }} />
                <Text style={{ fontSize: 25, margin: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.productName}
                </Text>
                <Text style={{ fontSize: 45, margin: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedProductQty}{' '}
                    {ProductProduct.quantityUnitAsString(
                        this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedProductUom,
                    )}
                </Text>
                <View
                    style={{
                        padding: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        borderBottomWidth: 1,
                        borderBottomColor: '#CCCCCC',
                    }}
                >
                    <Button
                        title=" Correct"
                        onPress={(): void => this.didTapValid()}
                        buttonStyle={{
                            backgroundColor:
                                this.state.isValid === false ? this.colorSuccessDisabled : this.colorSuccess,
                        }}
                        icon={<Icon name="check" color="white" />}
                    />
                    <Button
                        title=" Erreur"
                        onPress={(): void => this.didTapInvalid()}
                        buttonStyle={{
                            backgroundColor: this.state.isValid === true ? this.colorDangerDisabled : this.colorDanger,
                        }}
                        icon={<Icon name="times" color="white" />}
                    />
                    <Button
                        title="Annuler"
                        onPress={(): void => {
                            this.didTapCancel();
                        }}
                        buttonStyle={{
                            backgroundColor: 'grey',
                        }}
                    />
                </View>
                {this.renderInvalid()}
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
                <ThemeProvider theme={this.theme}>
                    {this.state.goodsReceiptEntry ? this.renderEntry() : this.renderCamera()}
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
