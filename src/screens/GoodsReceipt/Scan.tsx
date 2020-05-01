import React from 'react';
import { Image, Platform, SafeAreaView, Text, TextInput, View, Alert } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import Scanner2 from '../Scanner2';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { Barcode } from 'react-native-camera/types';
import Odoo from '../../utils/Odoo';
import ProductProduct, { UnitOfMesurement } from '../../entities/Odoo/ProductProduct';
import { getConnection, getRepository } from 'typeorm';
import GoodsReceiptEntry from '../../entities/GoodsReceiptEntry';
import AppLogger from '../../utils/AppLogger';
import { toNumber, displayNumber, isFloat } from '../../utils/helpers';
import { Button, Icon, Input, ListItem, ThemeProvider } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface GoodsReceiptScanProps {
    componentId: string;
    preselectedProductId?: number;
}

interface GoodsReceiptScanState {
    product?: ProductProduct;
    goodsReceiptEntry?: GoodsReceiptEntry;
    isValid?: boolean;
    commentInputHeight: number;
}

export default class GoodsReceiptScan extends React.Component<GoodsReceiptScanProps, GoodsReceiptScanState> {
    colorSuccess = '#5cb85c';
    colorSuccessDisabled = '#D6EDDB';
    colorDanger = '#DC3545';
    colorDangerDisabled = '#F7D8DB';
    uomList: { [k: string]: number } = {
        unités: UnitOfMesurement.unit,
        kg: UnitOfMesurement.kg,
        litre: UnitOfMesurement.litre,
    };

    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome',
        },
    };

    scanner?: Scanner2;
    receivedQuantityInput?: TextInput;

    state: GoodsReceiptScanState = {
        product: undefined,
        goodsReceiptEntry: undefined,
        isValid: undefined,
        commentInputHeight: 35,
    };

    constructor(props: GoodsReceiptScanProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    componentDidMount(): void {
        if (this.props.preselectedProductId) {
            // const barcode: Barcode = {
            //     data: this.props.preselectedProductBarcode,
            //     dataRaw: this.props.preselectedProductBarcode,
            //     type: 'PRODUCT',
            //     bounds: { size: { width: 0, height: 0 }, origin: { x: 0, y: 0 } },
            // };
            this.loadProductWithId(this.props.preselectedProductId);
            // this.didScanBarcode(barcode);
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

    loadProductWithId(id: number): void {
        AppLogger.getLogger().debug(`Loading product #'${id}'`);
        Odoo.getInstance()
            .fetchProductFromIds([id])
            .then((products: ProductProduct[] | undefined) => {
                if (products === undefined || products.length === 0) {
                    AppLogger.getLogger().debug(`Product with id '${id}' not found`);
                    alert(`Produit avec l'id' ${id} non trouvé`);
                    return;
                }
                const product = products[0];
                AppLogger.getLogger().debug(`Found Product #${id} => '${product.name}'`);
                getConnection()
                    .getRepository(GoodsReceiptEntry)
                    .findOneOrFail({
                        where: {
                            productId: id,
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
            goodsReceiptEntry.productUom = this.state.goodsReceiptEntry.expectedProductUom;
            getRepository(GoodsReceiptEntry)
                .save(goodsReceiptEntry)
                .then(() => {
                    if (this.props.preselectedProductId) {
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
        const goodsReceiptEntry = this.state.goodsReceiptEntry;
        if (goodsReceiptEntry) {
            goodsReceiptEntry.productUom = goodsReceiptEntry?.expectedProductUom;
            goodsReceiptEntry.productQty = undefined;
        }
        this.setState({
            isValid: false,
            goodsReceiptEntry: goodsReceiptEntry,
        });
    }

    didTapCancel(): void {
        if (this.props.preselectedProductId) {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
        this.setState({
            product: undefined,
            goodsReceiptEntry: undefined,
        });
    }

    chooseUom = (): void => {
        const uomsAndroid: string[] = Object.keys(this.uomList);
        const uomsIos: string[] = uomsAndroid;
        uomsIos.push('Annuler');

        ActionSheet.showActionSheetWithOptions(
            {
                options: Platform.OS == 'ios' ? uomsIos : uomsAndroid,
                cancelButtonIndex: uomsIos.length - 1,
            },
            buttonIndex => {
                AppLogger.getLogger().debug(`button clicked: ${buttonIndex}`);
                if (Platform.OS == 'ios' && buttonIndex == uomsIos.length - 1) {
                    return;
                }
                const receivedUom = Object.values(this.uomList)[buttonIndex];
                AppLogger.getLogger().debug(`receivedUom: ${receivedUom}`);
                const goodsReceiptEntry = this.state.goodsReceiptEntry;
                if (goodsReceiptEntry) {
                    goodsReceiptEntry.productUom = receivedUom;
                    this.setState({ goodsReceiptEntry });
                }
            },
        );
    };

    revisedGoodsReceiptEntryIsValid = (): boolean => {
        const goodsReceiptEntry = this.state.goodsReceiptEntry;
        if (goodsReceiptEntry == undefined) {
            return false;
        }
        const productQty = goodsReceiptEntry.productQty;
        if (productQty == undefined || productQty < 0) {
            Alert.alert('La quantité ne peut être inférieur à 0 !');
            return false;
        }
        const productUom = goodsReceiptEntry.productUom;
        const unitOfMesurements = [UnitOfMesurement.unit, UnitOfMesurement.kg, UnitOfMesurement.litre];
        if (productUom == undefined || !unitOfMesurements.includes(productUom)) {
            Alert.alert(`Unité de messure inconnue: ${productUom}`);
            return false;
        }
        if (productUom == UnitOfMesurement.unit && isFloat(productQty)) {
            Alert.alert('Impossible d\'avoir un nombre à virgule pour l\'unité de mesure "unités".');
            return false;
        }
        return true;
    };

    renderInvalid(): React.ReactNode {
        if (this.state.isValid === false) {
            return (
                <View style={{ height: '100%' }}>
                    <ListItem
                        title="Quantité reçue"
                        rightElement={
                            <TextInput
                                onChangeText={(receivedQtyStr: string): void => {
                                    let receivedQty: number | undefined;
                                    receivedQty = toNumber(receivedQtyStr);
                                    console.log(receivedQty);
                                    if (isNaN(receivedQty)) {
                                        receivedQty = undefined;
                                    }
                                    AppLogger.getLogger().debug(
                                        `New receivedQty: '${receivedQtyStr}' => ${receivedQty}`,
                                    );
                                    const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                    if (goodsReceiptEntry) {
                                        goodsReceiptEntry.productQty = receivedQty;
                                        this.setState({ goodsReceiptEntry });
                                    }
                                }}
                                placeholder="Inconnue"
                                keyboardType="decimal-pad"
                                ref={(input: TextInput): void => {
                                    this.receivedQuantityInput = input;
                                }}
                                autoFocus={true}
                            />
                        }
                        onPress={(): void => {
                            this.receivedQuantityInput?.focus();
                        }}
                        bottomDivider
                    />
                    <ListItem
                        title="Unité de mesure"
                        rightElement={
                            <Text>{ProductProduct.quantityUnitAsString(this.state.goodsReceiptEntry?.productUom)}</Text>
                        }
                        onPress={(): void => {
                            this.chooseUom();
                        }}
                        bottomDivider
                        chevron
                    />
                    <Input
                        placeholder="Commentaire (optionnel)"
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={(invalidReason: string): void => {
                            AppLogger.getLogger().debug(`New reason: '${invalidReason}'`);
                            const goodsReceiptEntry = this.state.goodsReceiptEntry;
                            if (goodsReceiptEntry) {
                                goodsReceiptEntry.comment = invalidReason;
                                this.setState({ goodsReceiptEntry });
                            }
                        }}
                        style={{ height: this.state.commentInputHeight }}
                        inputContainerStyle={{ borderBottomWidth: 0, marginTop: 5 }}
                        onContentSizeChange={(event): void => {
                            this.setState({ commentInputHeight: Math.max(35, event.nativeEvent.contentSize.height) });
                        }}
                    />
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                            title="Enregistrer"
                            onPress={(): void => {
                                if (this.revisedGoodsReceiptEntryIsValid()) {
                                    if (this.state.goodsReceiptEntry) {
                                        const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                        getRepository(GoodsReceiptEntry)
                                            .save(goodsReceiptEntry)
                                            .then(() => {
                                                if (this.props.preselectedProductId) {
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
                            }}
                            style={{ marginVertical: 16 }}
                            disabled={this.state.goodsReceiptEntry?.productQty == undefined}
                        />
                    </View>
                </View>
            );
        }
    }

    renderEntry(): React.ReactNode {
        return (
            <KeyboardAwareScrollView style={{ height: '100%' }}>
                <Image source={{ uri: this.state.product && this.state.product.image }} />
                <Text style={{ fontSize: 25, margin: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.productName}
                </Text>
                <Text style={{ fontSize: 45, margin: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && displayNumber(this.state.goodsReceiptEntry.expectedProductQty)}{' '}
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
            </KeyboardAwareScrollView>
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
                    {this.state.goodsReceiptEntry || this.props.preselectedProductId
                        ? this.renderEntry()
                        : this.renderCamera()}
                </ThemeProvider>
            </SafeAreaView>
        );
    }
}
