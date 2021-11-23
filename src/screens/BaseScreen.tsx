import React from 'react';
import {defaultScreenOptions} from '../utils/navigation';
import {Navigation, Options} from 'react-native-navigation';

export interface Props {
    componentId: string;
}

export default class BaseScreen extends React.Component<Props> {
    static get options(): Options {
        return defaultScreenOptions('Home');
    }
    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
    }
}
