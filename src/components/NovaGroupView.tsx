import React from 'react';
import {Text, View} from 'react-native';
import NovaGroup, {NovaGroupGroups} from './NovaGroup';

type Props = {
    group?: NovaGroupGroups;
};

const NovaGroupView = ({group}: Props) => {
    return (
        <View style={{flex: 1, alignItems: 'center', alignSelf: 'center'}}>
            {undefined !== group ? (
                <NovaGroup group={group} width={'28%'} height={'100%'} />
            ) : (
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', fontSize: 11, color: 'grey'}}>GROUPE NOVA</Text>
                    <Text style={{marginTop: 12}}>non disponible</Text>
                </View>
            )}
        </View>
    );
};

export default NovaGroupView;
