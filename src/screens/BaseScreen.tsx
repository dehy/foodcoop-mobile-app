import React, { Props } from 'react'
import { defaultScreenOptions } from '../utils/navigation'
import { Navigation } from 'react-native-navigation';

export default class BaseScreen extends React.Component<any, any> {
    static get options() {
        return defaultScreenOptions("Home");
    }
    constructor(props: any[]) {
        super(props);
        Navigation.events().bindComponent(this);
    }
}