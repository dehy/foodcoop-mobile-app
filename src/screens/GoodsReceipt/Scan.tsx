import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import Scanner2 from '../Scanner2';
import { Navigation } from 'react-native-navigation';
import Scanner from '../Scanner';
import { defaultScreenOptions } from '../../utils/navigation';

interface GoodsReceiptScanProps {
    componentId: string;
}

interface GoodsReceiptScanState {
}

export default class GoodsReceiptScan extends React.Component<GoodsReceiptScanProps, GoodsReceiptScanState> {

    scanner?: Scanner2;

    constructor(props: GoodsReceiptScanProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }

    static options() {
        var options = defaultScreenOptions("Scan");
        options.topBar = {
          rightButtons: [
            {
              id: "close",
              text: "Fermer"
            }
          ]
        };
    
        return options;
      }

      navigationButtonPressed({ buttonId }: { buttonId: string }) {
        if (buttonId === "close") {
          Navigation.dismissModal(this.props.componentId);
          return;
        }
      }

    render() {
        return (
            <SafeAreaView
                style={{height: "100%"}}>
                <Scanner2
                    ref={(ref) => {
                        this.scanner = ref !== null ? ref : undefined
                    }}
                    onBarcodeRead={(barcode) => {
                        console.log(barcode.data);
                    }}
                >
                </Scanner2>
            </SafeAreaView>
        );
    }
}