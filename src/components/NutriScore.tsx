import React from 'react';
import { SvgProps } from 'react-native-svg';
import NutriScoreA from '../../assets/svg/Nutri-score-A.svg';
import NutriScoreB from '../../assets/svg/Nutri-score-B.svg';
import NutriScoreC from '../../assets/svg/Nutri-score-C.svg';
import NutriScoreD from '../../assets/svg/Nutri-score-D.svg';
import NutriScoreE from '../../assets/svg/Nutri-score-E.svg';

interface NutriScoreProps extends SvgProps {
    score: 'a' | 'b' | 'c' | 'd' | 'e';
}

export default class NutriScore extends React.Component<NutriScoreProps> {
    render(): React.ReactNode {
        console.log(this.props.score);
        switch (this.props.score) {
            case 'a':
                return <NutriScoreA width={this.props.width} height={this.props.height} />;
            case 'b':
                return <NutriScoreB width={this.props.width} height={this.props.height} />;
            case 'c':
                return <NutriScoreC width={this.props.width} height={this.props.height} />;
            case 'd':
                return <NutriScoreD width={this.props.width} height={this.props.height} />;
            case 'e':
                return <NutriScoreE width={this.props.width} height={this.props.height} />;
        }
        return null;
    }
}
