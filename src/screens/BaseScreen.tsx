import React, { Props } from 'react'
import { defaultScreenOptions } from '../utils/navigation'
import { Navigation } from 'react-native-navigation';

export interface BaseScreenProps {

}

export default class BaseScreen extends React.Component<BaseScreenProps> {
    static get options() {
        return defaultScreenOptions("Home");
    }
    constructor(props: BaseScreenProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }
}