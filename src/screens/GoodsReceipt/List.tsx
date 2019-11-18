import React, { Props } from "react";
import {
  View,
  Text,
  Button,
  TouchableHighlight,
  SafeAreaView,
  SectionList
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import { defaultScreenOptions } from "../../utils/navigation";
import { Navigation } from "react-native-navigation";
import Icon from "react-native-vector-icons/FontAwesome5";
import styles from "../../styles/material";
import GoodsReceiptSession from "../../entities/GoodsReceiptSession";
import { getRepository, getConnection } from "typeorm";
import GoodsReceiptService from "../../services/GoodsReceiptService";
import PurchaseOrder from "../../entities/Odoo/PurchaseOrder";
import moment from "moment";

export interface GoodsReceiptListProps {
  componentId: string;
}

interface GoodsReceiptSessionsData {
  title: string,
  data: GoodsReceiptSession[]
}

interface GoodsReceiptListState {
  goodsReceiptsData: GoodsReceiptSessionsData[];
  todaysGoodsReceipts: PurchaseOrder[];
}

interface GoodsReceiptSessionTapProps {
  componentId: string;
  session: GoodsReceiptSession;
}

export default class GoodsReceiptList extends React.Component<
  GoodsReceiptListProps,
  GoodsReceiptListState
> {
  constructor(props: GoodsReceiptListProps) {
    super(props);
    Navigation.events().bindComponent(this);
    this.state = {
      goodsReceiptsData: [],
      todaysGoodsReceipts: []
    };
  }

  static options() {
    var options = defaultScreenOptions("Réceptions");
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
    this.loadTodaysGoodsReceipt();
  }

  componentDidMount() {
    // this.loadData();
  }

  loadTodaysGoodsReceipt() {
    GoodsReceiptService.getInstance()
      .getPurchaseOrdersPlannedTodays()
      .then(purchaseOrders =>
        this.setState({
          todaysGoodsReceipts: purchaseOrders
        })
      );
  }

  loadData() {
    const goodsReceiptSessionRepository = getConnection().getRepository(
      GoodsReceiptSession
    );
    goodsReceiptSessionRepository.find({
      order: {
        createdAt: "DESC"
      }
    }).then(goodsReceiptSessions => {
      let goodsReceiptSessionsData: GoodsReceiptSessionsData[] = []
      let title: string;
      let data: GoodsReceiptSession[];
      goodsReceiptSessions.forEach((session, index, array) => {
        let dateAsString = moment(session.createdAt!).format("Do MMMM YYYY");
        if (title == undefined) {
          title = dateAsString;
          data = [];
        }
        if (title != dateAsString) {
          goodsReceiptSessionsData.push({
            title: title,
            data: data
          });
          title = dateAsString;
          data = [];
        }
        data.push(session);
        if (array.length - 1 == index) {
          goodsReceiptSessionsData.push({
            title: title,
            data: data
          });
        }
      });
      console.log(goodsReceiptSessionsData);
      this.setState({
        goodsReceiptsData: goodsReceiptSessionsData
      });
    });
  }

  openNewGoodsReceiptSessionModal() {
    Navigation.showModal({
      stack: {
        children: [
          {
            component: {
              name: "GoodsReceipt/New"
            }
          }
        ]
      }
    });
  }

  navigationButtonPressed(buttonId: any) {
    if (buttonId === "receipt-new") {
      this.openNewGoodsReceiptSessionModal();
    }
  }

  didTapGoodsReceiptSessionItem = (props: GoodsReceiptSessionTapProps) => {
    console.log(props);
    Navigation.push(props.componentId, {
      component: {
        name: "GoodsReceipt/Show",
        passProps: {
          session: props.session
        }
      }
    });
  };

  renderTodaysGoodsReceipts() {
    if (this.state.todaysGoodsReceipts.length > 0) {
      return (
        <View style={{ padding: 8, margin: 8, backgroundColor: "#17a2b8" }}>
          <Text style={{ color: "white" }}>
            {this.state.todaysGoodsReceipts.length}{" "}
            {this.state.todaysGoodsReceipts.length > 1
              ? "réceptions sont prévues"
              : "réception est prévue"}{" "}
            aujourd'hui :{"\n"}
            {this.state.todaysGoodsReceipts.map(element => {
              return "-  " + element.partnerName + " (" + element.name + ")";
            }).join("\n")}
          </Text>
        </View>
      );
    }
  }

  render() {
    return (
      <SafeAreaView>
        {this.renderTodaysGoodsReceipts()}
        <View
          style={{ padding: 8, flexDirection: "row", justifyContent: "center" }}
        >
          <Icon.Button
            name="plus-circle"
            solid
            style={{}}
            onPress={this.openNewGoodsReceiptSessionModal}
          >
            Nouvelle réception
          </Icon.Button>
        </View>
        <SectionList
          style={{ backgroundColor: "white", height: "100%" }}
          sections={this.state.goodsReceiptsData}
          keyExtractor={item => item.id!.toString()!}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.listHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableHighlight
              onPress={() => {
                let inventorySessionTapProps: GoodsReceiptSessionTapProps = {
                  componentId: this.props.componentId,
                  session: item
                };
                this.didTapGoodsReceiptSessionItem(inventorySessionTapProps);
              }}
              underlayColor="#BCBCBC"
            >
              <View style={styles.row}>
                <Icon name={item.lastSentAt == undefined ? "clipboard-list" : "clipboard-check"} style={styles.rowIcon} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{item.poName}</Text>
                  <Text style={styles.rowSubtitle}>{item.partnerName}</Text>
                </View>
                <Text style={styles.rowDetailText}>{item.lastSentAt == undefined ? "En cours" : "Envoyé"}</Text>
              </View>
            </TouchableHighlight>
          )}
        />
      </SafeAreaView>
    );
  }
}
