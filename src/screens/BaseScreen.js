import React from 'react'
import { defaultScreenOptions } from '../utils/navigation'
import { Navigation } from 'react-native-navigation';
import Drawer from '../utils/Drawer';


export default class BaseScreen extends React.Component {
    static get options() {
        return defaultScreenOptions("Home");
    }
    constructor(props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
    navigationButtonPressed({ buttonId }) {
        if (buttonId == 'leftDrawerButton') {
            Drawer.open('left')
        }
    }
}