import React, {ReactNode} from 'react';
import {Alert, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Barcode} from 'react-native-camera';
import CodeScanner from '../../CodeScanner';
import {Navigation, Options} from 'react-native-navigation';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Button, Divider} from 'react-native-elements';
import ProductProduct, {UnitOfMeasurement} from '../../../entities/Odoo/ProductProduct';
import {isInt} from '../../../utils/helpers';
import {getRepository} from 'typeorm';
import InventoryEntry from '../../../entities/Lists/InventoryEntry';
import InventoryList from '../../../entities/Lists/InventoryList';

export interface Props {
    componentId: string;
    inventory: InventoryList;
}

interface State {
    barcode?: Barcode;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
});

export default class ListsInventoryScan extends React.Component<Props, {}> {
    codeScanner?: CodeScanner;
    articleQuantityValue?: string;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        const options = defaultScreenOptions('Scan Inventaire');
        options.topBar = {
            rightButtons: [
                {
                    id: 'cancel',
                    text: 'Fermer',
                },
            ],
        };

        return options;
    }

    navigationButtonPressed({buttonId}: {buttonId: string}): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
        }
    }

    didTapSaveButton(product: ProductProduct): void {
        const unit = product.uomId;
        let quantity: number;
        try {
            if (!this.articleQuantityValue) {
                throw new Error();
            }
            quantity = parseFloat(this.articleQuantityValue.replace(',', '.'));
        } catch (e) {
            Alert.alert('Valeur incorrecte', 'Cela ne ressemble pas à un nombre.');
            return;
        }
        if (quantity >= 0) {
            if (unit === UnitOfMeasurement.unit && isInt(quantity) === false) {
                // Int only
                Alert.alert(
                    'Valeur incorrecte',
                    'Ce produit est compté en unité. Merci de ne pas entrer de nombre à virgule.',
                );
                return;
            }
            if (unit === UnitOfMeasurement.kg || UnitOfMeasurement.litre) {
                // Float authorized
            }
        }

        // TODO: Prendre en compte les doublons et demander si addition ou remplacement.

        const newEntry = InventoryEntry.createFromProductProduct(product);
        newEntry.list = this.props.inventory;
        newEntry.quantity = quantity;
        newEntry.addedAt = new Date();
        newEntry.scannedAt = new Date();

        console.log(newEntry);
        getRepository(InventoryEntry)
            .save(newEntry)
            .then(() => {
                this.codeScanner?.reset();
            });
    }

    renderInventoryInput(product: ProductProduct): ReactNode {
        return (
            <View>
                <Divider></Divider>
                <Text style={{fontWeight: 'bold', paddingTop: 8}}>Nouveau stock</Text>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 8}}>
                    <TextInput
                        onChangeText={(value): void => {
                            this.articleQuantityValue = value;
                        }}
                        style={{
                            flex: 0,
                            fontSize: 28,
                            width: 80,
                            borderWidth: 1,
                            borderRadius: 8,
                            marginRight: 8,
                            paddingRight: 5,
                            textAlign: 'right',
                            alignItems: 'center',
                        }}
                        keyboardType="decimal-pad"
                        blurOnSubmit={true}
                        onSubmitEditing={(): void => {
                            this.didTapSaveButton(product);
                        }}
                        autoFocus={true}
                    />
                    <Text style={{fontSize: 28, flex: 1}}>{product.unitAsString()}</Text>
                    <Button
                        onPress={(): void => {
                            this.didTapSaveButton(product);
                        }}
                        title="Enregistrer"
                    />
                </View>
            </View>
        );
    }

    render(): React.ReactElement {
        return (
            <SafeAreaView style={styles.container}>
                <CodeScanner
                    ref={(ref: CodeScanner): void => {
                        this.codeScanner = ref !== null ? ref : undefined;
                    }}
                    extraInfoPanel={(product): ReactNode => {
                        return this.renderInventoryInput(product);
                    }}></CodeScanner>
            </SafeAreaView>
        );
    }
}
