import React from 'react';
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation, Options } from 'react-native-navigation';

export interface BaseScreenProps {
    componentId: string;
}

export default class BaseScreen extends React.Component<BaseScreenProps> {
    static get options(): Options {
        return defaultScreenOptions('Home');
    }
    constructor(props: BaseScreenProps) {
        super(props);
        Navigation.events().bindComponent(this);
    }
}
