import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Barcode } from 'react-native-camera';
import ScannerCamera from '../../ScannerCamera';
import SlidingUpPanel from 'rn-sliding-up-panel';
import { Button } from 'react-native-elements';
import ScannerInfoPanel from '../../ScannerInfoPanel';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../../utils/navigation';

export interface Props {
    componentId: string;
    listId: number;
}

interface State {
    barcode?: Barcode;
}

export default class ListsInventoryScan extends React.Component<Props, State> {
    scanner?: ScannerCamera;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            barcode: undefined,
        }
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

    navigationButtonPressed({ buttonId }: { buttonId: string }): void {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    _didScanBarcode = (barcode: Barcode) => {
        this.setState({barcode})
    };

    render(): React.ReactElement {
        return (
            <SafeAreaView>
                <ScannerCamera
                    ref={(ref): void => {
                        this.scanner = ref !== null ? ref : undefined;
                    }}
                    onBarcodeRead={(barcode): void => {
                        this._didScanBarcode(barcode);
                    }}
                >
                </ScannerCamera>
                { this.state.barcode != undefined ? (
                <View>
                    <ScannerInfoPanel
                        barcode={this.state.barcode?.data}>

                        </ScannerInfoPanel>
                </View>) : null }
            </SafeAreaView>
        );
    }
}
