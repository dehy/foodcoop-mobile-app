import React from 'react';
import { SvgProps } from 'react-native-svg';
import NutriScoreA from '../../assets/svg/Nutri-score-A.svg';
import NutriScoreB from '../../assets/svg/Nutri-score-B.svg';
import NutriScoreC from '../../assets/svg/Nutri-score-C.svg';
import NutriScoreD from '../../assets/svg/Nutri-score-D.svg';
import NutriScoreE from '../../assets/svg/Nutri-score-E.svg';

interface NutriScoreProps extends SvgProps {
    score: 1 | 2 | 3 | 4 | 5;
}

export default class NutriScore extends React.Component<NutriScoreProps> {
    render(): React.ReactNode {
        switch (this.props.score) {
            case 1:
                return <NutriScoreA width={this.props.width} height={this.props.height} />;
            case 2:
                return <NutriScoreB width={this.props.width} height={this.props.height} />;
            case 3:
                return <NutriScoreC width={this.props.width} height={this.props.height} />;
            case 4:
                return <NutriScoreD width={this.props.width} height={this.props.height} />;
            case 5:
                return <NutriScoreE width={this.props.width} height={this.props.height} />;
        }
    }
}
