import React from 'react';
import {Text, View} from 'react-native';
import EcoScore, {EcoScoreScore} from './EcoScore';

type Props = {
    score?: EcoScoreScore;
};

const EcoScoreView = ({score}: Props) => {
    return (
        <View style={{flex: 1, alignItems: 'center', alignSelf: 'center'}}>
            {undefined !== score && EcoScoreScore.unknown !== score ? (
                <EcoScore score={score} width={'80%'} height={'80%'} />
            ) : (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>ECO-SCORE</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            )}
        </View>
    );
};

export default EcoScoreView;
