import React, { ReactNode } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import Odoo from '../utils/Odoo';
import ProductProduct, { UnitOfMeasurement } from '../entities/Odoo/ProductProduct';

export interface Props {
    barcode?: string;
    extraPanel?: (product: ProductProduct) => void;
    productNotFoundCallback?: () => void;
    onClose?: () => void;
}

interface State {
    product?: ProductProduct | null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
    scanMode: {
        position: 'absolute',
        left: 0,
        top: 0,
        marginLeft: 8,
        marginTop: 8,
    },
    actions: {
        position: 'absolute',
        flexDirection: 'row',
        left: 0,
        bottom: 0,
        marginLeft: 8,
        marginBottom: 8,
    },
    actionButton: {
        marginRight: 4,
        marginLeft: 4,
    },
    information: {
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
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    capture: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 16,
        paddingHorizontal: 24,
        alignSelf: 'center',
        margin: 24,
    },

    articleImage: {
        width: 64,
        height: 64,
        //backgroundColor: 'white',
        marginRight: 16,
        marginBottom: 8,
    },
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
    closeIcon: {
        height: 44,
        width: 44,
        paddingTop: 8,
        paddingRight: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
});

export default class ScannerInfoPanel extends React.Component<Props, State> {
    odoo: Odoo;

    constructor(props: Props) {
        super(props);

        this.odoo = Odoo.getInstance();

        this.state = {
            product: undefined,
        };
    }

    componentDidMount(): void {
        console.debug('did mount');
        if (this.props.barcode) {
            this.fetchProduct(this.props.barcode);
        }
    }

    componentDidUpdate(_prevProps: Props): void {
        if (this.props.barcode && _prevProps.barcode !== this.props.barcode) {
            this.fetchProduct(this.props.barcode);
        }
    }

    // static getDerivedStateFromProps(nextProps: Props, prevState: State): State | null {
    //     if (nextProps.barcode !== prevState.barcode) {
    //         return { barcode: nextProps.barcode, product: undefined };
    //     }
    //     return null;
    // }

    fetchProduct(barcode: string): void {
        this.odoo.fetchProductFromBarcode(barcode).then(product => {
            this.setState({ product });
            if (!product) {
                return;
            }
            this.odoo.fetchImageForProductProduct(product).then(image => {
                if (!image) {
                    return;
                }
                product.image = ProductProduct.imageFromOdooBase64(image);
                this.setState({
                    product,
                });
            });
        });
    }

    close(): void {
        if (this.props.onClose) {
            this.props.onClose();
        }
        this.setState({ product: undefined });
    }

    renderLoading = (): React.ReactElement => {
        return (
            <View
                style={{
                    alignContent: 'center',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="barcode" type="font-awesome-5" style={{ paddingRight: 8 }} />
                    <Text style={{ fontSize: 18 }}>{this.props.barcode}</Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ActivityIndicator size="small" style={{ paddingRight: 10 }} />
                    <Text>Chargement des informations produit</Text>
                </View>
            </View>
        );
    };

    renderProductImage(): React.ReactNode {
        if (this.state.product?.image) {
            return (
                <Image
                    source={{ uri: this.state.product.image }}
                    style={[styles.articleImage]}
                    resizeMode={'contain'}
                    resizeMethod={'resize'}
                />
            );
        }
        if (null === this.state.product?.image) {
            return (
                <View style={[styles.articleImage, { backgroundColor: '#EEE', justifyContent: 'center' }]}>
                    <Icon name={'image'} type={'font-awesome-5'} color={'#999'} />
                </View>
            );
        }
        // undefined = not retrieved image
        return <ActivityIndicator size="small" color="#999999" style={styles.articleImage} />;
    }

    renderProductInfos(): React.ReactNode {
        if (!this.state.product) {
            return null;
        }
        return (
            <View>
                <View style={{ flexDirection: 'row' }}>
                    {this.renderProductImage()}
                    <Text numberOfLines={2} style={styles.articleName}>
                        {this.state.product.name}
                    </Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', marginVertical: 8 }}>
                    <View style={{ flex: 1, flexDirection: 'row', marginVertical: 8 }}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <Text style={styles.detailTitle}>Prix</Text>
                            <Text style={styles.detailValue}>
                                {undefined !== this.state.product.lstPrice
                                    ? (Math.round(this.state.product.lstPrice * 100) / 100).toFixed(2) + ' €'
                                    : '-'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailTitle}>
                                {UnitOfMeasurement.unit === this.state.product?.packagingUnit() ? 'Unité' : null}
                                {UnitOfMeasurement.kg === this.state.product?.packagingUnit() ? 'Poids' : null}
                                {UnitOfMeasurement.litre === this.state.product?.packagingUnit() ? 'Volume' : null}
                            </Text>
                            <Text style={styles.detailValue}>{this.state.product.packagingAsString()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailTitle}>Stock</Text>
                            <Text
                                style={[
                                    styles.detailValue,
                                    !this.state.product.quantityIsValid() ? styles.detailValueInvalid : undefined,
                                ]}
                            >
                                {this.state.product.quantityIsValid() ? this.state.product.quantityAsString() : '-'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    renderContent(): React.ReactNode {
        if (this.state.product) {
            return (
                <View>
                    {this.renderProductInfos()}
                    {this.props.extraPanel ? this.props.extraPanel(this.state.product) : null}
                </View>
            );
        }
        return this.renderLoading();
    }

    render(): ReactNode {
        if (!this.props.barcode) {
            return null;
        }
        return (
            <View style={[styles.information, { marginTop: 8 }]}>
                <TouchableOpacity style={{ position: 'absolute', right: 0, top: 0 }} onPress={(): void => this.close()}>
                    <Icon name="times-circle" type="font-awesome-5" color={'#999'} style={styles.closeIcon} />
                </TouchableOpacity>
                {this.renderContent()}
            </View>
        );
    }
}
