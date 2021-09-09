import * as React from 'react';
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import { Barcode } from 'react-native-camera';
import moment, { Moment } from 'moment';
import Odoo from '../utils/Odoo';
import ProductProduct from '../entities/Odoo/ProductProduct';
import ScannerCamera from './ScannerCamera';
import Mailjet from '../utils/Mailjet';
import OpenFoodFacts, { OFFProduct } from '../utils/OpenFoodFacts';
import NutriScore from '../components/NutriScore';
import NovaGroup from '../components/NovaGroup';
import ScannerInfoPanel from './ScannerInfoPanel';

export interface Props {
    componentId: string;
}

interface State {
    displayCamera: boolean;
    barcode?: Barcode;
    odooProductProduct?: ProductProduct;
    offProduct?: OFFProduct;
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
        backgroundColor: 'white',
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
});

export default class Scanner extends React.Component<Props, State> {
    private odoo: Odoo;
    private lastScannedBarcode?: string;
    private scanner?: ScannerCamera;

    private navigationEventListener?: EventSubscription;

    constructor(props: Props) {
        super(props);

        // Navigation
        Navigation.events().bindComponent(this);

        // Odoo
        this.odoo = Odoo.getInstance();
        this.lastScannedBarcode = undefined;

        this.state = {
            displayCamera: false,
            barcode: undefined,
            odooProductProduct: undefined,
            offProduct: undefined,
        };
    }

    componentDidMount(): void {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear(): void {
        this.setState({
            displayCamera: true,
        });
    }

    componentDidDisappear(): void {
        StatusBar.setBarStyle('dark-content');
        this.setState({
            displayCamera: false,
        });
    }

    componentWillUnmount(): void {
        if (this.navigationEventListener) {
            this.navigationEventListener.remove();
        }
    }

    static options(passProps: Props): Options {
        const options = defaultScreenOptions('Scannette');
        if (options && options.topBar) {
            options.topBar.visible = false;
        }

        return options;
    }

    reset(): void {
        this.lastScannedBarcode = undefined;
        this.setState({
            barcode: undefined,
            odooProductProduct: undefined,
        });
        if (this.scanner) {
            this.scanner.reset();
        }
    }

    didScanBarcode(barcode: Barcode): void {
        //console.debug('didScanBarcode()', barcode.data, barcode.type);
        this.setState({
            odooProductProduct: undefined,
            offProduct: undefined,
        });
        this.lookupForBarcode(barcode.data);
        return;
    }

    lookupForBarcode(barcode: string): void {
        if (this.lastScannedBarcode === barcode) {
            return;
        }
        this.setState({ odooProductProduct: undefined });
        this.lastScannedBarcode = barcode;
        OpenFoodFacts.getInstance()
            .fetchFromBarcode(barcode)
            .then(product => {
                if (null === product) {
                    return;
                }
                this.setState({
                    offProduct: product,
                });
            });
        this.odoo.fetchProductFromBarcode(barcode).then(
            odooProductProduct => {
                if (!odooProductProduct) {
                    //this.handleNotFoundProductProduct(barcode);
                    return;
                }
                this.handleFoundProductProduct(odooProductProduct);
            },
            reason => {
                Alert.alert('Erreur', `Une erreur est survenue ("${reason}"). Merci de réessayer.`);
                this.reset();
            },
        );
    }

    handleFoundProductProduct(odooProductProduct: ProductProduct): void {
        this.setState({
            odooProductProduct: odooProductProduct,
        });
        this.odoo.fetchImageForProductProduct(odooProductProduct).then(image => {
            const odooProductProduct = this.state.odooProductProduct;
            if (odooProductProduct && image != null) {
                odooProductProduct.image = ProductProduct.imageFromOdooBase64(image);
                this.setState({
                    odooProductProduct: odooProductProduct,
                });
            }
        });
    }

    reportUnknownProductProductByMail(odooProductProduct: ProductProduct): void {
        const to = 'inventaire@supercoop.fr';
        const subject = `Code barre inconnu (${odooProductProduct.barcode})`;
        const body = `Le code barre ${odooProductProduct.barcode} est introuvable dans Odoo.
Il a été associé à un produit nommé "${odooProductProduct.name}"`;
        try {
            Mailjet.getInstance()
                .sendEmail(to, '', subject, body)
                .then(() => {
                    Alert.alert('Mail envoyé', 'Merci pour le signalement ! 🎉');
                });
        } catch (e) {
            Alert.alert('Erreur', "Houston, une erreur est survenue lors de l'envoi du mail de signalement 😢");
        }
        this.reset();
    }

    renderCameraView(): React.ReactElement {
        if (this.state.displayCamera) {
            return (
                <ScannerCamera
                    ref={(ref: ScannerCamera): void => {
                        this.scanner = ref !== null ? ref : undefined;
                    }}
                    onBarcodeRead={(barcode): React.ReactNode | null => {
                        console.debug('onBarcodeRead callback');
                        //this.didScanBarcode(barcode);
                        return null;
                    }}
                ></ScannerCamera>
            );
        } else {
            return (
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Caméra en Pause</Text>
                </View>
            );
        }
    }

    renderOpenFoodFactsProperties(): React.ReactNode | void {
        const iconHeight = 60;
        const questionIconHeight = 14;
        console.debug(this.state.offProduct);
        return (
            <View style={{ flexDirection: 'row' }}>
                {this.state.offProduct?.nutrition_grade_fr ? (
                    <TouchableWithoutFeedback
                        style={{ flex: 1, marginHorizontal: 8 }}
                        onPress={(): void => {
                            Alert.alert(
                                'Nutri-Score',
                                `Le Nutri-Score est un logo qui indique la qualité nutritionnelle des aliments avec des notes allant de A à E. Avec le NutriScore, les produits peuvent être facilement et rapidement comparés.`,
                            );
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            {/* <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
                                <Text>Nutri-Score </Text>
                                <Icon type="font-awesome-5" name="question-circle" size={questionIconHeight} />
                            </View> */}
                            <NutriScore score={this.state.offProduct.nutrition_grade_fr} height={iconHeight} />
                        </View>
                    </TouchableWithoutFeedback>
                ) : null}
                {this.state.offProduct?.nova_group ? (
                    <TouchableWithoutFeedback
                        style={{ flex: 1, marginHorizontal: 8 }}
                        onPress={(): void => {
                            Alert.alert(
                                'NOVA',
                                `La classification NOVA assigne un groupe aux produits alimentaires en fonction du degré de transformation qu'ils ont subi:

Groupe 1
Aliments non transformés ou transformés minimalement
Groupe 2
Ingrédients culinaires transformés
Groupe 3
Aliments transformés
Groupe 4
Produits alimentaires et boissons ultra-transformés`,
                            );
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            {/* <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
                                <Text>NOVA </Text>
                                <Icon type="font-awesome-5" name="question-circle" size={questionIconHeight} />
                            </View> */}
                            <NovaGroup
                                group={this.state.offProduct.nova_group}
                                height={iconHeight}
                                style={{ marginTop: 8 }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                ) : null}
            </View>
        );
    }

    renderInfoPanel(): React.ReactNode | void {
        if (this.state.barcode) {
            return <ScannerInfoPanel barcode={this.state.barcode.data}></ScannerInfoPanel>;
        }
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView style={styles.container}>
                {this.renderCameraView()}
                {this.renderInfoPanel()}
            </SafeAreaView>
        );
    }
}
