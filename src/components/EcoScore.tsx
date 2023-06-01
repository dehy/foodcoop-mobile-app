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

const EcoScore = ({score, width, height}: Props) => {
    switch (score) {
        case EcoScoreScore.a:
            return <EcoScoreA width={width} height={height} />;
        case EcoScoreScore.b:
            return <EcoScoreB width={width} height={height} />;
        case EcoScoreScore.c:
            return <EcoScoreC width={width} height={height} />;
        case EcoScoreScore.d:
            return <EcoScoreD width={width} height={height} />;
        case EcoScoreScore.e:
            return <EcoScoreE width={width} height={height} />;
        case EcoScoreScore.unknown:
        default:
            return null;
    }
};

export default EcoScore;
