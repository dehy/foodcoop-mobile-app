import React from 'react';
import {SvgProps} from 'react-native-svg';
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

interface Props extends SvgProps {
    group: NovaGroupGroups;
}

const NovaGroup = ({group, width, height}: Props) => {
    switch (group) {
        case NovaGroupGroups.one:
            return <NovaGroup1 width={width} height={height} />;
        case NovaGroupGroups.two:
            return <NovaGroup2 width={width} height={height} />;
        case NovaGroupGroups.three:
            return <NovaGroup3 width={width} height={height} />;
        case NovaGroupGroups.four:
            return <NovaGroup4 width={width} height={height} />;
        default:
            return null;
        }
    }
};

export default NovaGroup;
