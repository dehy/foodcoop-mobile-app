import React, {ReactNode} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import CodeScanner from '../../CodeScanner';
import {Navigation, Options} from 'react-native-navigation';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Divider} from 'react-native-elements';
import ProductProduct from '../../../entities/Odoo/ProductProduct';
import {getRepository} from 'typeorm';
import {Icon} from 'react-native-elements/dist/Icon';
import LabelEntry from '../../../entities/Lists/LabelEntry';
import LabelList from '../../../entities/Lists/LabelList';

export interface Props {
    componentId: string;
    list: LabelList;
}

interface State {}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
});

export default class ListsLabelScan extends React.Component<Props, State> {
    static screenName = 'Lists/Label/Scan';

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options(): Options {
        const options = defaultScreenOptions('Scan Étiquette');
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

    saveEntry(product: ProductProduct): void {
        const newEntry = new LabelEntry();
        newEntry.productId = product.id;
        newEntry.productBarcode = product.barcode;
        newEntry.productName = product.name;
        newEntry.list = this.props.list;
        newEntry.addedAt = new Date();

        getRepository(LabelEntry).save(newEntry);
    }

    renderAlert(_product: ProductProduct): ReactNode {
        return (
            <View>
                <Divider />
                <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 16}}>
                    Étiquette ajoutée à la liste
                </Text>
                <Icon name="check-circle" style={{marginTop: 8}} />
            </View>
        );
    }

    render(): React.ReactElement {
        return (
            <SafeAreaView style={styles.container}>
                <CodeScanner
                    extraInfoPanel={(product): ReactNode => {
                        return this.renderAlert(product);
                    }}
                    onProductFound={this.saveEntry}
                />
            </SafeAreaView>
        );
    }
}
