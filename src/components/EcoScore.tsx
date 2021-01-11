import React from 'react';
import { SvgProps } from 'react-native-svg';
import EcoScoreA from '../../assets/svg/Eco-score-A.svg';
import EcoScoreB from '../../assets/svg/Eco-score-B.svg';
import EcoScoreC from '../../assets/svg/Eco-score-C.svg';
import EcoScoreD from '../../assets/svg/Eco-score-D.svg';
import EcoScoreE from '../../assets/svg/Eco-score-E.svg';

interface EcoScoreProps extends SvgProps {
    score: 'a' | 'b' | 'c' | 'd' | 'e';
}

export default class EcoScore extends React.Component<EcoScoreProps> {
    render(): React.ReactNode {
        switch (this.props.score) {
            case 'a':
                return <EcoScoreA width={this.props.width} height={this.props.height} />;
            case 'b':
                return <EcoScoreB width={this.props.width} height={this.props.height} />;
            case 'c':
                return <EcoScoreC width={this.props.width} height={this.props.height} />;
            case 'd':
                return <EcoScoreD width={this.props.width} height={this.props.height} />;
            case 'e':
                return <EcoScoreE width={this.props.width} height={this.props.height} />;
        }
        return null;
    }
}
