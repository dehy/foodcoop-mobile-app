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
import {DateTime} from 'luxon';

export interface Props {
    componentId: string;
    inventory: InventoryList;
}

enum SaveMode {
    replace = 'replace',
    add = 'add',
}

interface State {
    barcode?: Barcode;
    saveMode: SaveMode;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
});

export default class ListsInventoryScan extends React.Component<Props, State> {
    static screenName = 'Lists/Inventory/Scan';

    codeScanner?: CodeScanner;
    articleQuantityValue?: string;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            saveMode: SaveMode.replace,
        };
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

    checkForDuplicate(product: ProductProduct): void {
        console.debug(this.props.inventory.entries);
        if (this.props.inventory === undefined || this.props.inventory.entries === undefined || !product.barcode) {
            return;
        }
        const existingEntry: InventoryEntry | null = this.props.inventory.entryWithBarcode(
            product.barcode,
        ) as InventoryEntry;
        if (existingEntry === null) {
            return;
        }

        const timeAgo = DateTime.fromJSDate(existingEntry.lastModifiedAt ?? existingEntry.addedAt!).toRelative();
        Alert.alert('Déjà scanné', `Ce produit a déjà été scanné ${timeAgo}. Que souhaites-tu faire ?`, [
            {
                text: 'Remplacer',
                style: 'cancel',
                onPress: () => {
                    getRepository(InventoryEntry).delete(existingEntry.id!);
                    const indexInList = this.props.inventory.entries!.indexOf(existingEntry);
                    if (indexInList > -1) {
                        this.props.inventory.entries?.splice(indexInList, 1);
                    }
                    this.setState({
                        saveMode: SaveMode.replace,
                    });
                },
            },
            {
                text: 'Additionner',
                onPress: () => {
                    this.setState({
                        saveMode: SaveMode.add,
                    });
                },
            },
        ]);
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

        let newEntry: InventoryEntry | undefined | null;
        if (this.state.saveMode === 'add' && product.barcode) {
            newEntry = this.props.inventory.entryWithBarcode(product.barcode) as InventoryEntry;
            newEntry.quantity = newEntry.quantity! + quantity;
        } else {
            // replace or new element
            newEntry = InventoryEntry.createFromProductProduct(product);
            newEntry.list = this.props.inventory;
            newEntry.quantity = quantity;
            newEntry.addedAt = new Date();
            this.props.inventory.entries?.push(newEntry);
        }
        newEntry.scannedAt = new Date();

        console.debug(newEntry);
        getRepository(InventoryEntry)
            .save(newEntry)
            .then(() => {
                this.codeScanner?.reset();
                this.setState({
                    saveMode: SaveMode.replace,
                });
            });
    }

    renderInventoryInput(product: ProductProduct): ReactNode {
        let previousQuantity: ReactNode | undefined;
        if (this.state.saveMode === SaveMode.add && product.barcode) {
            previousQuantity = (
                <Text style={{fontSize: 28}}>
                    {this.props.inventory.entryWithBarcode(product.barcode)?.quantity} +{' '}
                </Text>
            );
        }
        return (
            <View>
                <Divider />
                <Text style={{fontWeight: 'bold', paddingTop: 8}}>Nouveau stock</Text>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 8}}>
                    {previousQuantity}
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
                        title={this.state.saveMode === SaveMode.add ? 'Ajouter' : 'Enregistrer'}
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
                    onProductFound={(product: ProductProduct): void => {
                        this.checkForDuplicate(product);
                    }}
                    extraInfoPanel={(product): ReactNode => {
                        return this.renderInventoryInput(product);
                    }}
                />
            </SafeAreaView>
        );
    }
}
