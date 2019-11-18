import React, { Props } from "react";
import {
  View,
  Text,
  Button,
  TouchableHighlight,
  SafeAreaView,
  FlatList
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { defaultScreenOptions } from "../../utils/navigation";
import { Navigation } from "react-native-navigation";
import Icon from "react-native-vector-icons/FontAwesome5";
import styles from "../../styles/material";
import GoodsReceiptEntry from "../../entities/GoodsReceiptEntry"
import GoodsReceiptSession from "../../entities/GoodsReceiptSession";
import { getRepository, getConnection } from "typeorm";
import GoodsReceiptService from "../../services/GoodsReceiptService";
import PurchaseOrder from "../../entities/Odoo/PurchaseOrder";

export interface GoodsReceiptShowProps {
  componentId: string;
  session: GoodsReceiptSession;
}

interface GoodsReceiptShowState {
    entries: GoodsReceiptEntry[];
}

export default class GoodsReceiptShow extends React.Component<
  GoodsReceiptShowProps,
  GoodsReceiptShowState
> {
  constructor(props: GoodsReceiptShowProps) {
    super(props);
    Navigation.events().bindComponent(this);
    this.state = {
        entries: []
    };
  }

  static options() {
    var options = defaultScreenOptions("");
    // options.topBar.rightButtons = [
    //     {
    //         id: 'inventory-new',
    //         text: 'Nouveau'
    //     }
    // ]

    return options;
  }

  componentDidAppear() {
    this.loadData();
  }

  componentDidMount() {
    // this.loadData();
  }

  loadData() {
    const goodsReceiptEntryRepository = getConnection().getRepository(
      GoodsReceiptEntry
    );
    goodsReceiptEntryRepository
        .createQueryBuilder("entry")
        .where("entry.goodsReceiptSession = :session", { session: this.props.session.id})
        .getMany()
        .then(goodsReceiptEntries => {
            console.log(goodsReceiptEntries);
            this.setState({
                entries: goodsReceiptEntries
            });
        });
  }

  navigationButtonPressed({ buttonId }: {buttonId: string}) {
    // if (buttonId === "receipt-new") {
    //   this.openNewGoodsReceiptSessionModal();
    // }
  }

//   didTapGoodsReceiptSessionItem = (props: GoodsReceiptSessionTapProps) => {
//     Navigation.push(props.componentId, {
//       component: {
//         name: "GoodsReceipt/Show",
//         passProps: {
//           inventorySessionId: props.item.id
//         }
//       }
//     });
//   };

  openGoodsReceiptScan() {
    Navigation.showModal({
        stack: {
          children: [
            {
              component: {
                name: "GoodsReceipt/Scan"
              }
            }
          ]
        }
      });
  }

  render() {
    return (
      <SafeAreaView>
        <View
          style={{ padding: 8, flexDirection: "row", justifyContent: "center" }}
        >
            <Icon.Button
            name="barcode"
            solid
            style={{}}
            onPress={this.openGoodsReceiptScan}
          >
            Démarrer le comptage
          </Icon.Button>
        </View>
        <FlatList
          style={{ backgroundColor: "white", height: "100%" }}
          data={this.state.entries}
          keyExtractor={(item, index) => item.id!.toString()!}
          renderItem={({item}: {item: GoodsReceiptEntry}) => (
            <TouchableHighlight
              onPress={() => {
                // let inventorySessionTapProps: GoodsReceiptSessionTapProps = {
                //   componentId: this.props.componentId,
                //   item: item
                // };
                // this.didTapGoodsReceiptSessionItem(inventorySessionTapProps);
              }}
              underlayColor="#BCBCBC"
            >
              <View style={styles.row}>
                {/* <Icon name={item.lastSentAt == undefined ? "clipboard-list" : "clipboard-check"} style={styles.rowIcon} /> */}
                <Text style={styles.rowIcon}>{item.expectedProductQty}</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{item.productName}</Text>
                  <Text style={styles.rowSubtitle}>{item.productBarcode!.toString()}</Text>
                </View>
                {/* <Text style={styles.rowDetailText}>{item.expectedProductQty} {item.productUom}</Text> */}
              </View>
            </TouchableHighlight>
          )}
        />
      </SafeAreaView>
    );
  }
}
