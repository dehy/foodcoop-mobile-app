import React from 'react';
import { SvgProps } from 'react-native-svg';
import NutriScoreA from '../../assets/svg/Nutri-score-A.svg';
import NutriScoreB from '../../assets/svg/Nutri-score-B.svg';
import NutriScoreC from '../../assets/svg/Nutri-score-C.svg';
import NutriScoreD from '../../assets/svg/Nutri-score-D.svg';
import NutriScoreE from '../../assets/svg/Nutri-score-E.svg';

export enum NutriScoreScore {
    a = 'a',
    b = 'b',
    c = 'c',
    d = 'd',
    e = 'e',
}

interface NutriScoreProps extends SvgProps {
    score: NutriScoreScore;
}

export default class NutriScore extends React.Component<NutriScoreProps> {
    render(): React.ReactNode {
        console.debug(this.props.score);
        switch (this.props.score) {
            case NutriScoreScore.a:
                return <NutriScoreA width={this.props.width} height={this.props.height} />;
            case NutriScoreScore.b:
                return <NutriScoreB width={this.props.width} height={this.props.height} />;
            case NutriScoreScore.c:
                return <NutriScoreC width={this.props.width} height={this.props.height} />;
            case NutriScoreScore.d:
                return <NutriScoreD width={this.props.width} height={this.props.height} />;
            case NutriScoreScore.e:
                return <NutriScoreE width={this.props.width} height={this.props.height} />;
        }
        return null;
    }
}
