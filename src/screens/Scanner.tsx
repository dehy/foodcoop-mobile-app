import * as React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import OpenFoodFacts, {OFFProduct} from '../utils/OpenFoodFacts';
import CodeScanner from './CodeScanner/CodeScanner';
import {NavigationProvider} from 'react-native-navigation-hooks/dist';
import EcoScoreView from '../components/EcoScoreView';
import NovaGroupView from '../components/NovaGroupView';
import NutriScoreView from '../components/NutriScoreView';
import {useState} from 'react';
import ProductProduct from '../entities/Odoo/ProductProduct';

export interface Props {
    componentId: string;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
});

/*
OpenFoodFacts.getInstance()
    .fetchFromBarcode(product.barcode)
    .then(offProduct => {
        if (offProduct) {
            return (
                <View style={{flexDirection: 'row'}}>
                    <EcoScoreView score={offProduct.ecoscore_grade} />
                    <NutriScoreView score={offProduct.nutrition_grade_fr} />
                    <NovaGroupView group={offProduct.nova_group} />
                </View>
            );
        }
        return (
            <Text style={{textAlign: 'center'}}>
                Aucune information supplémentaire disponible.
            </Text>
        );
    });
    */

const Scanner = ({componentId}: Props) => {
    const [displayCamera, setDisplayCamera] = useState<boolean>(true);
    const [product, setProduct] = useState<ProductProduct | undefined>();
    const [openFoodFactInfos, setOpenFoodFactInfos] = useState<OFFProduct | null>();

    React.useEffect(() => {
        if (!product || (product && !product.barcode)) {
            setOpenFoodFactInfos(undefined);
            return;
        }
        OpenFoodFacts.getInstance()
            .fetchFromBarcode(product.barcode!)
            .then(offProduct => {
                setOpenFoodFactInfos(offProduct);
            });
    }, [product, product?.barcode]);

    return (
        <SafeAreaView style={styles.container}>
            {displayCamera ? (
                <NavigationProvider value={{componentId}}>
                    <CodeScanner
                        displayCamera={displayCamera}
                        onProductFound={setProduct}
                        extraInfoPanel={() => {
                            if (product === undefined || openFoodFactInfos === undefined) {
                                return <Text style={{textAlign: 'center'}}>Chargement en cours...</Text>;
                            }
                            if (product === null || openFoodFactInfos === null) {
                                return (
                                    <Text style={{textAlign: 'center'}}>
                                        Aucune information supplémentaire disponible.
                                    </Text>
                                );
                            }
                            return (
                                <View style={{flexDirection: 'row', height: 60}}>
                                    <EcoScoreView score={openFoodFactInfos.ecoscore_grade} />
                                    <NutriScoreView score={openFoodFactInfos.nutrition_grade_fr} />
                                    <NovaGroupView group={openFoodFactInfos.nova_group} />
                                </View>
                            );
                        }}
                    />
                </NavigationProvider>
            ) : (
                <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center'}}>
                    <Text style={{fontSize: 24, fontWeight: 'bold', textAlign: 'center'}}>Caméra en Pause</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

export default Scanner;
