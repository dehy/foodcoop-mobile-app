import React from 'react';
import {Text, View} from 'react-native';
import NutriScore, {NutriScoreScore} from './NutriScore';

type Props = {
    score?: NutriScoreScore;
};

const NutriScoreView = ({score}: Props) => {
    return (
        <View style={{flex: 1, alignItems: 'center', alignSelf: 'center'}}>
            {undefined !== score ? (
                <NutriScore score={score} width={'100%'} height={'100%'} />
            ) : (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>NUTRI-SCORE</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            )}
        </View>
    );
};

export default NutriScoreView;
