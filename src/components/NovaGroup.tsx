import React from 'react';
import { SvgProps } from 'react-native-svg';
import NovaGroup1 from '../../assets/svg/nova-group-1.svg';
import NovaGroup2 from '../../assets/svg/nova-group-2.svg';
import NovaGroup3 from '../../assets/svg/nova-group-3.svg';
import NovaGroup4 from '../../assets/svg/nova-group-4.svg';

export enum NovaGroupGroups {
    one = 1,
    two = 2,
    three = 3,
    four = 4,
}

interface NovaGroupProps extends SvgProps {
    group: NovaGroupGroups;
}

export default class NovaGroup extends React.Component<NovaGroupProps> {
    render(): React.ReactNode {
        switch (this.props.group) {
            case NovaGroupGroups.one:
                return <NovaGroup1 width={this.props.width} height={this.props.height} />;
            case NovaGroupGroups.two:
                return <NovaGroup2 width={this.props.width} height={this.props.height} />;
            case NovaGroupGroups.three:
                return <NovaGroup3 width={this.props.width} height={this.props.height} />;
            case NovaGroupGroups.four:
                return <NovaGroup4 width={this.props.width} height={this.props.height} />;
        }
    }
}
