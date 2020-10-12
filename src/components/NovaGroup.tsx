import React from 'react';
import { SvgProps } from 'react-native-svg';
import NovaGroup1 from '../../assets/svg/nova-group-1.svg';
import NovaGroup2 from '../../assets/svg/nova-group-2.svg';
import NovaGroup3 from '../../assets/svg/nova-group-3.svg';
import NovaGroup4 from '../../assets/svg/nova-group-4.svg';

interface NutriScoreProps extends SvgProps {
    group: 1 | 2 | 3 | 4;
}

export default class NovaGroup extends React.Component<NutriScoreProps> {
    render(): React.ReactNode {
        switch (this.props.group) {
            case 1:
                return <NovaGroup1 width={this.props.width} height={this.props.height} />;
            case 2:
                return <NovaGroup2 width={this.props.width} height={this.props.height} />;
            case 3:
                return <NovaGroup3 width={this.props.width} height={this.props.height} />;
            case 4:
                return <NovaGroup4 width={this.props.width} height={this.props.height} />;
        }
    }
}
