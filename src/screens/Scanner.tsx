import * as React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {defaultScreenOptions} from '../utils/navigation';
import {Navigation, Options, EventSubscription} from 'react-native-navigation';
import CodeScanner from './CodeScanner';
import OpenFoodFacts, {OFFProduct} from '../utils/OpenFoodFacts';
import EcoScore, {EcoScoreScore} from '../components/EcoScore';
import NutriScore, {NutriScoreScore} from '../components/NutriScore';
import NovaGroup, {NovaGroupGroups} from '../components/NovaGroup';

export interface Props {
    componentId: string;
}

interface State {
    displayCamera: boolean;
    offProduct?: OFFProduct | null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
});

export default class Scanner extends React.Component<Props, State> {
    static screenName = "Scanner";

    private scanner?: CodeScanner;

    private navigationEventListener?: EventSubscription;

    constructor(props: Props) {
        super(props);

        this.state = {
            displayCamera: true,
            offProduct: undefined,
        };

        // Navigation
        Navigation.events().bindComponent(this);
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

    static options(): Options {
        const options = defaultScreenOptions('Scannette');
        if (options && options.topBar) {
            options.topBar.visible = false;
        }

        return options;
    }

    fetchOpenFoodFacts(barcode: string): void {
        OpenFoodFacts.getInstance()
            .fetchFromBarcode(barcode)
            .then(offProduct => {
                this.setState({offProduct});
            });
    }

    renderEcoScore(score?: EcoScoreScore): React.ReactNode {
        let ecoScore;
        if (undefined !== score && EcoScoreScore.unknown !== score) {
            ecoScore = <EcoScore score={score} height={40} />;
        } else {
            ecoScore = (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>ECO-SCORE</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            );
        }
        return <View>{ecoScore}</View>;
    }

    renderNutriScore(score?: NutriScoreScore): React.ReactNode {
        let nutriScore;
        if (undefined !== score) {
            nutriScore = <NutriScore score={score} height={40} />;
        } else {
            nutriScore = (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>NUTRI-SCORE</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            );
        }
        return <View>{nutriScore}</View>;
    }

    renderNovaGroup(group?: NovaGroupGroups): React.ReactNode {
        let novaGroup;
        if (undefined !== group) {
            novaGroup = <NovaGroup group={group} height={40} />;
        } else {
            novaGroup = (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>GROUPE NOVA</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            );
        }
        return <View>{novaGroup}</View>;
    }

    renderCameraView(): React.ReactElement {
        if (!this.state.displayCamera) {
            return (
                <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center'}}>
                    <Text style={{fontSize: 24, fontWeight: 'bold', textAlign: 'center'}}>Caméra en Pause</Text>
                </View>
            );
        }

        return (
            <CodeScanner
                ref={(ref: CodeScanner): void => {
                    this.scanner = ref !== null ? ref : undefined;
                }}
                onProductFound={(product): void => {
                    if (product.barcode) {
                        this.fetchOpenFoodFacts(product.barcode);
                    }
                }}
                extraInfoPanel={(): React.ReactNode => {
                    if (this.state.offProduct) {
                        return (
                            <View style={{flexDirection: 'row'}}>
                                <View style={{flex: 1}}>
                                    {this.renderEcoScore(this.state.offProduct.ecoscore_grade)}
                                </View>
                                <View style={{flex: 1}}>
                                    {this.renderNutriScore(this.state.offProduct.nutrition_grade_fr)}
                                </View>
                                <View style={{flex: 1}}>
                                    {this.renderNovaGroup(this.state.offProduct.nova_group)}
                                </View>
                            </View>
                        );
                    }
                    if (null === this.state.offProduct) {
                        return null;
                    }
                    return (
                        <View>
                            <Text>Chargement des infos produit</Text>
                        </View>
                    );
                }}></CodeScanner>
        );
    }

    render(): React.ReactNode {
        return <SafeAreaView style={styles.container}>{this.renderCameraView()}</SafeAreaView>;
    }
}
