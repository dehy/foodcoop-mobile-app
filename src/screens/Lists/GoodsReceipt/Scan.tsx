import React from 'react';
import { Image, Platform, SafeAreaView, Text, TextInput, View, Alert } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import CodeScanner from '../../CodeScanner';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../../utils/navigation';
import Odoo from '../../../utils/Odoo';
import ProductProduct, { UnitOfMeasurement } from '../../../entities/Odoo/ProductProduct';
import { getConnection, getRepository } from 'typeorm';
import GoodsReceiptEntry, { EntryStatus } from '../../../entities/Lists/GoodsReceiptEntry';
import GoodsReceiptList from '../../../entities/Lists/GoodsReceiptList';
import AppLogger from '../../../utils/AppLogger';
import { toNumber, displayNumber, isFloat } from '../../../utils/helpers';
import { Button, Icon, Input, ListItem, ThemeProvider } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Props {
    componentId: string;
    list: GoodsReceiptList;
    preselectedProductId?: number;
}

interface State {
    product?: ProductProduct;
    goodsReceiptEntry?: GoodsReceiptEntry;
    isValid?: boolean;
    commentInputHeight: number;
}

export default class ListsGoodsReceiptScan extends React.Component<Props, State> {
    colorSuccess = '#5cb85c';
    colorSuccessDisabled = '#D6EDDB';
    colorDanger = '#DC3545';
    colorDangerDisabled = '#F7D8DB';
    uomList: { [k: string]: number } = {
        unités: UnitOfMeasurement.unit,
        kg: UnitOfMeasurement.kg,
        litre: UnitOfMeasurement.litre,
    };

    theme = {
        Button: {
            iconContainerStyle: { marginRight: 5 },
        },
        Icon: {
            type: 'font-awesome-5',
        },
    };

    scanner?: CodeScanner;
    receivedQuantityInput?: TextInput;
    receivedPackageQtyInput?: TextInput;
    receivedProductQtyPackageInput?: TextInput;

    state: State = {
        product: undefined,
        goodsReceiptEntry: undefined,
        isValid: undefined,
        commentInputHeight: 35,
    };

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    componentDidMount(): void {
        if (this.props.preselectedProductId) {
            // In manual selection, we load product with its productId because some products do not have barcodes.
            this.loadProductWithId(this.props.preselectedProductId);
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
        }
    }

    loadProductWithId(id: number): void {
        AppLogger.getLogger().debug(
            `Loading product #'${id}' from session #${this.props.list.id} (${this.props.list.purchaseOrderName})`,
        );
        Odoo.getInstance()
            .fetchProductFromIds([id])
            .then((products: ProductProduct[] | undefined) => {
                if (products === undefined || products.length === 0) {
                    AppLogger.getLogger().debug(`Product with id '${id}' not found`);
                    Alert.alert(`Produit avec l'id' ${id} non trouvé`);
                    return;
                }
                const product = products[0];
                AppLogger.getLogger().debug(`Found Product #${id} => '${product.name}'`);
                this.loadEntryFromProduct(product);
            });
    }

    loadEntryFromProduct(product: ProductProduct): void {
        getConnection()
            .getRepository(GoodsReceiptEntry)
            .findOneOrFail({
                where: {
                    productBarcode: product.barcode,
                    list: this.props.list,
                },
                relations: ['list'],
            })
            .then((entry: GoodsReceiptEntry) => {
                AppLogger.getLogger().debug(
                    `GoodsReceipt Entry found for Product '${entry.productBarcode}': ${entry.productName} (${
                        entry.expectedProductQty
                    } ${ProductProduct.quantityUnitAsString(entry.expectedProductUom)}) for session #${
                        entry.list ? entry.list.id : 'inconnue'
                    }`,
                );
                this.setState({
                    product: product,
                    goodsReceiptEntry: entry,
                    isValid: entry.isFilled() ? EntryStatus.VALID === entry.getStatus() : undefined,
                });
            })
            .catch(() => {
                Alert.alert(`Ce produit ne semble pas avoir été commandé. (TODO)`);
            });
    }

    didTapValid(): void {
        AppLogger.getLogger().debug('Did tap valid');
        this.setState({
            isValid: true,
        });
        if (this.state.goodsReceiptEntry) {
            const goodsReceiptEntry = this.state.goodsReceiptEntry;
            goodsReceiptEntry.quantity = this.state.goodsReceiptEntry.expectedProductQty;
            goodsReceiptEntry.unit = this.state.goodsReceiptEntry.expectedProductUom;
            goodsReceiptEntry.packageQty = this.state.goodsReceiptEntry.expectedPackageQty;
            goodsReceiptEntry.productQtyPackage = this.state.goodsReceiptEntry.expectedProductQtyPackage;

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
            goodsReceiptEntry.unit = goodsReceiptEntry?.expectedProductUom;
            goodsReceiptEntry.quantity = undefined;
            goodsReceiptEntry.packageQty = null;
            goodsReceiptEntry.productQtyPackage = null;
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
                    goodsReceiptEntry.unit = receivedUom;
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
        const quantity = goodsReceiptEntry.quantity;
        if (quantity == undefined || quantity < 0) {
            Alert.alert('La quantité ne peut être inférieur à 0 !');
            return false;
        }
        const packageQty = goodsReceiptEntry.packageQty;
        if (packageQty == undefined || packageQty < 0) {
            Alert.alert('Le nombre de colis ne peut être inférieur à 0 !');
            return false;
        }
        const quantityPackage = goodsReceiptEntry.productQtyPackage;
        if (quantityPackage == undefined || quantityPackage < 0) {
            Alert.alert('Le nombre de produits par colis ne peut être inférieur à 0 !');
            return false;
        }
        const unit = goodsReceiptEntry.unit;
        const UnitOfMeasurements = [UnitOfMeasurement.unit, UnitOfMeasurement.kg, UnitOfMeasurement.litre];
        if (unit == undefined || !UnitOfMeasurements.includes(unit)) {
            Alert.alert(`Unité de mesure inconnue: ${unit}`);
            return false;
        }
        if (unit == UnitOfMeasurement.unit && isFloat(quantity)) {
            Alert.alert('Impossible d\'avoir un nombre à virgule pour l\'unité de mesure "unités".');
            return false;
        }
        return true;
    };

    renderInvalid(): React.ReactNode {
        if (this.state.isValid !== false) {
            return null;
        }
        return (
            <View style={{ height: '100%' }}>
                <ListItem
                    onPress={(): void => {
                        this.receivedQuantityInput?.focus();
                    }}
                    bottomDivider
                >
                    <ListItem.Content>
                        <ListItem.Title>Quantité reçue</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <TextInput
                            onChangeText={(receivedQtyStr: string): void => {
                                let receivedQty: number | undefined;
                                receivedQty = toNumber(receivedQtyStr);
                                console.log(receivedQty);
                                if (isNaN(receivedQty)) {
                                    receivedQty = undefined;
                                }
                                AppLogger.getLogger().debug(`New receivedQty: '${receivedQtyStr}' => ${receivedQty}`);
                                const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                if (goodsReceiptEntry) {
                                    goodsReceiptEntry.quantity = receivedQty;
                                    this.setState({ goodsReceiptEntry });
                                }
                            }}
                            placeholder="Inconnue"
                            keyboardType="decimal-pad"
                            ref={(input: TextInput): void => {
                                this.receivedQuantityInput = input;
                            }}
                            value={this.state.goodsReceiptEntry?.quantity?.toString()}
                            autoFocus={true}
                        />
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    onPress={(): void => {
                        this.receivedPackageQtyInput?.focus();
                    }}
                    bottomDivider
                >
                    <ListItem.Content>
                        <ListItem.Title>Nombre de colis reçu</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <TextInput
                            onChangeText={(receivedProductQtyPackageStr: string): void => {
                                let receivedProductQtyPackage: number | null;
                                receivedProductQtyPackage = toNumber(receivedProductQtyPackageStr);
                                console.log(receivedProductQtyPackage);
                                if (isNaN(receivedProductQtyPackage)) {
                                    receivedProductQtyPackage = null;
                                }
                                AppLogger.getLogger().debug(
                                    `New receivedQty: '${receivedProductQtyPackageStr}' => ${receivedProductQtyPackage}`,
                                );
                                const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                if (goodsReceiptEntry) {
                                    goodsReceiptEntry.productQtyPackage = receivedProductQtyPackage;
                                    this.setState({ goodsReceiptEntry });
                                }
                            }}
                            placeholder="Inconnue"
                            keyboardType="decimal-pad"
                            ref={(input: TextInput): void => {
                                this.receivedProductQtyPackageInput = input;
                            }}
                            value={this.state.goodsReceiptEntry?.productQtyPackage?.toString()}
                        />
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    onPress={(): void => {
                        this.receivedPackageQtyInput?.focus();
                    }}
                    bottomDivider
                >
                    <ListItem.Content>
                        <ListItem.Title>Nombre d&quot;articles par colis</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <TextInput
                            onChangeText={(receivedPackageQtyStr: string): void => {
                                let receivedPackageQty: number | null;
                                receivedPackageQty = toNumber(receivedPackageQtyStr);
                                console.log(receivedPackageQty);
                                if (isNaN(receivedPackageQty)) {
                                    receivedPackageQty = null;
                                }
                                AppLogger.getLogger().debug(
                                    `New receivedQty: '${receivedPackageQtyStr}' => ${receivedPackageQty}`,
                                );
                                const goodsReceiptEntry = this.state.goodsReceiptEntry;
                                if (goodsReceiptEntry) {
                                    goodsReceiptEntry.packageQty = receivedPackageQty;
                                    this.setState({ goodsReceiptEntry });
                                }
                            }}
                            placeholder="Inconnue"
                            keyboardType="decimal-pad"
                            ref={(input: TextInput): void => {
                                this.receivedPackageQtyInput = input;
                            }}
                            value={this.state.goodsReceiptEntry?.packageQty?.toString()}
                        />
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    onPress={(): void => {
                        this.chooseUom();
                    }}
                    bottomDivider
                >
                    <ListItem.Content>
                        <ListItem.Title>Unité de mesure</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <Text>{ProductProduct.quantityUnitAsString(this.state.goodsReceiptEntry?.unit)}</Text>
                    </ListItem.Content>
                    <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                </ListItem>
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
                    value={this.state.goodsReceiptEntry?.comment}
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
                                        .then((): void => {
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
                        disabled={this.state.goodsReceiptEntry?.quantity == undefined}
                    />
                </View>
            </View>
        );
    }

    renderEntry(): React.ReactNode {
        let image: string | undefined = undefined;
        if (this.state.product && null !== this.state.product.image) {
            image = this.state.product.image;
        }
        return (
            <KeyboardAwareScrollView style={{ height: '100%' }} keyboardShouldPersistTaps="always">
                <Image source={{ uri: image }} />
                <Text style={{ fontSize: 25, margin: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.productName}
                </Text>
                <Text style={{ fontSize: 45, marginTop: 5, textAlign: 'center' }}>
                    {this.state.goodsReceiptEntry && displayNumber(this.state.goodsReceiptEntry.expectedProductQty)}{' '}
                    {ProductProduct.quantityUnitAsString(
                        this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedProductUom,
                    )}
                </Text>
                <Text style={{ fontSize: 25, marginBottom: 5, textAlign: 'center' }}>
                    en {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedProductQtyPackage} colis de{' '}
                    {this.state.goodsReceiptEntry && this.state.goodsReceiptEntry.expectedPackageQty}{' '}
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
                        icon={<Icon type="font-awesome-5" name="check" color="white" />}
                    />
                    <Button
                        title=" Erreur"
                        onPress={(): void => this.didTapInvalid()}
                        buttonStyle={{
                            backgroundColor: this.state.isValid === true ? this.colorDangerDisabled : this.colorDanger,
                        }}
                        icon={<Icon type="font-awesome-5" name="times" color="white" />}
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
            <CodeScanner
                ref={(ref: CodeScanner): void => {
                    this.scanner = ref !== null ? ref : undefined;
                }}
                showInfoPanel={false}
                onProductFound={(product): void => {
                    this.loadEntryFromProduct(product);
                }}
            ></CodeScanner>
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
