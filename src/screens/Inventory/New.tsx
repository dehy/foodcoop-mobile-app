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
import moment, { Moment } from 'moment';
import { number } from 'prop-types';
import { toNumber, isInt } from '../../utils/helpers';

export interface InventoryNewProps {
    componentId: string
}

interface InventoryNewState {
    submitButtonEnabled: boolean,
    isDateTimePickerVisible: boolean,
    date: Moment,
    zone?: number,
    dateInputValue?: string
}

export default class InventoryNew extends React.Component<InventoryNewProps, InventoryNewState> {

    state: InventoryNewState = {
        submitButtonEnabled: true,
        isDateTimePickerVisible: false,
        date: moment(),
        zone: undefined
    };
    dateInput?: Input;
    zoneInput?: Input;

    constructor(props: InventoryNewProps) {
        super(props);
        Navigation.events().bindComponent(this);
        console.debug("DateInputFormat", moment().format("DD MMMM YYYY"));
    }

    static options() {
        var options = defaultScreenOptions("Nouvel inventaire");
        options.topBar = {
            rightButtons: [
                {
                    id: 'cancel',
                    text: 'Annuler'
                }
            ]
        };

        return options;
    }

    componentDidAppear() {
        if (this.zoneInput) {
            this.zoneInput.focus();
        }
    }

    componentDidDisappear() {
        if (this.zoneInput) {
            this.zoneInput.blur();
        }
        this.hideDateTimePicker();
    }

    disableSubmitButton = () => this.setState({ submitButtonEnabled: false });
    enableSubmitButton = () => this.setState({ submitButtonEnabled: true });

    showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });
    hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

    handleDatePicked = (date: Date) => {
        console.debug('A date has been picked: ', date);
        this.state.date = moment(date);
        this.updateDateInput();
        this.hideDateTimePicker();
        if (this.dateInput) {
            this.dateInput.blur();
        }
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
            if (!this.state.zone || !isInt(this.state.zone)) {
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
                        ref={(ref) => { this.dateInput = ref !== null ? ref : undefined }}
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
                        ref={(ref) => { this.zoneInput = ref !== null ? ref : undefined }}
                        leftIcon={{ type: 'font-awesome', name: 'map-marker' }}
                        leftIconContainerStyle={{ marginRight: 8 }}
                        label="Zone"
                        inputContainerStyle={styles.input}
                        keyboardType="number-pad"
                        value={this.state.zone?this.state.zone.toString():undefined}
                        onChangeText={value => this.setState({ zone: toNumber(value) })}
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