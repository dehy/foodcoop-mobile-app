import React from 'react';
import {SvgProps} from 'react-native-svg';
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

interface Props extends SvgProps {
    score: NutriScoreScore;
}

const NutriScore = ({score, width, height}: Props) => {
    switch (score) {
        case NutriScoreScore.a:
            return <NutriScoreA width={width} height={height} preserveAspectRatio={'XminYmin meet'} />;
        case NutriScoreScore.b:
            return <NutriScoreB width={width} height={height} preserveAspectRatio={'XminYmin meet'} />;
        case NutriScoreScore.c:
            return <NutriScoreC width={width} height={height} preserveAspectRatio={'XminYmin meet'} />;
        case NutriScoreScore.d:
            return <NutriScoreD width={width} height={height} preserveAspectRatio={'XminYmin meet'} />;
        case NutriScoreScore.e:
            return <NutriScoreE width={width} height={height} preserveAspectRatio={'XminYmin meet'} />;
        default:
            return null;
        }
    }
};

export default NutriScore;
