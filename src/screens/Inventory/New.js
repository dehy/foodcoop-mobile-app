import React from 'react'
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    View
} from 'react-native';
import { defaultScreenOptions } from '../../utils/navigation';
import { Button, Input } from 'react-native-elements';
import { Navigation } from 'react-native-navigation';
import DateTimePicker from 'react-native-modal-datetime-picker';
import InventorySession from '../../entities/InventorySession';
import InventorySessionFactory from '../../factories/InventorySessionFactory';
import moment from 'moment';

export default class InventoryNew extends React.Component {

    state = {
        submitButtonEnabled: true,
        isDateTimePickerVisible: false,
        date: moment(),
        zone: null
    };
    dateInput = null;
    zoneInput = null;

    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
        console.debug("DateInputFormat", moment().format("DD MMMM YYYY"));
    }

    static options(passProps) {
        var options = defaultScreenOptions("Nouvel inventaire");
        options.topBar.rightButtons = [
            {
                id: 'cancel',
                text: 'Annuler'
            }
        ];

        return options;
    }

    componentDidAppear() {
        this.zoneInput.focus();
    }

    componentDidDisappear() {
        this.zoneInput.blur();
        this.hideDateTimePicker();
    }

    disableSubmitButton = () => this.setState({ submitButtonEnabled: false });
    enableSubmitButton = () => this.setState({ submitButtonEnabled: true });

    showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });
    hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

    handleDatePicked = (date) => {
        console.debug('A date has been picked: ', date);
        this.state.date = moment(date);
        this.updateDateInput();
        this.hideDateTimePicker();
        this.dateInput.blur();
    };

    updateDateInput = () => {
        console.debug(this.state.date.format("DD MMMM YYYY"));
        this.setState({
            dateInputValue: this.state.date.format("DD MMMM YYYY")
        });
    }

    navigationButtonPressed({ buttonId }) {
        if (buttonId === 'cancel') {
            Navigation.dismissModal(this.props.componentId);
            return;
        }
    }

    didTapSubmitButton() {
        try {
            const zoneNumber = this.state.zone.toNumber();
            if (!zoneNumber.isInt()) {
                throw new Error("Zone number is not an Int");
            }
        } catch (e) {
            Alert.alert("Erreur de saisie", "Le numéro de zone est incorrect");
            return;
        }
        console.debug("Form values:");
        console.debug(this.state.date.unix());
        console.debug(this.state.zone);

        const inventorySession = new InventorySession();
        inventorySession.date = this.state.date;
        inventorySession.zone = this.state.zone;

        InventorySessionFactory.sharedInstance().persist(inventorySession).then(() => {
            Navigation.dismissModal(this.props.componentId);
        });

    }

    render() {
        return (
            <SafeAreaView style={{ padding: 16 }}>
                <View style={{ marginBottom: 8, flexDirection: 'row' }}>
                    <Input
                        containerStyle={{ flex: 9 }}
                        ref={(ref) => { this.dateInput = ref }}
                        leftIcon={{ type: 'font-awesome', name: 'calendar' }}
                        leftIconContainerStyle={{ marginRight: 8 }}
                        label="Date"
                        inputContainerStyle={styles.input}
                        keyboardType="number-pad"
                        onFocus={this.showDateTimePicker}
                        value={this.state.date.format("DD MMMM YYYY")}
                    />
                    <Input
                        containerStyle={{ flex: 3 }}
                        ref={(ref) => { this.zoneInput = ref }}
                        leftIcon={{ type: 'font-awesome', name: 'map-marker' }}
                        leftIconContainerStyle={{ marginRight: 8 }}
                        label="Zone"
                        inputContainerStyle={styles.input}
                        keyboardType="number-pad"
                        value={this.state.zone}
                        onChangeText={value => this.setState({ zone: value })}
                    />
                </View>
                <Button
                    disabled={!this.state.submitButtonEnabled}
                    onPress={() => {
                        this.didTapSubmitButton();
                    }}
                    title={this.state.submitButtonEnabled ? "Enregistrer" : "Enregistrement..."}
                />
                <DateTimePicker
                    isVisible={this.state.isDateTimePickerVisible}
                    onConfirm={this.handleDatePicked}
                    onCancel={this.hideDateTimePicker}
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    spinnerText: {
        color: '#FFF'
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        marginVertical: 8
    }
});