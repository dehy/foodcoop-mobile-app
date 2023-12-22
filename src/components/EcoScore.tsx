import React from 'react';
import {SvgProps} from 'react-native-svg';
import EcoScoreA from '../../assets/svg/Eco-score-A.svg';
import EcoScoreB from '../../assets/svg/Eco-score-B.svg';
import EcoScoreC from '../../assets/svg/Eco-score-C.svg';
import EcoScoreD from '../../assets/svg/Eco-score-D.svg';
import EcoScoreE from '../../assets/svg/Eco-score-E.svg';

export enum EcoScoreScore {
    unknown = 'unknown',
    a = 'a',
    b = 'b',
    c = 'c',
    d = 'd',
    e = 'e',
}

interface Props extends SvgProps {
    score: EcoScoreScore;
}

export default class EcoScore extends React.Component<Props> {
    render(): React.ReactNode {
        console.debug('EcoScore: ' + this.props.score);
        switch (this.props.score) {
            case EcoScoreScore.a:
                return <EcoScoreA width={this.props.width} height={this.props.height} />;
            case EcoScoreScore.b:
                return <EcoScoreB width={this.props.width} height={this.props.height} />;
            case EcoScoreScore.c:
                return <EcoScoreC width={this.props.width} height={this.props.height} />;
            case EcoScoreScore.d:
                return <EcoScoreD width={this.props.width} height={this.props.height} />;
            case EcoScoreScore.e:
                return <EcoScoreE width={this.props.width} height={this.props.height} />;
            case EcoScoreScore.unknown:
            default:
                return null;
        }
    }
}
