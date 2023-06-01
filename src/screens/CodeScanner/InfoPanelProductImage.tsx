import React from 'react';
import {Icon, Image} from '@rneui/themed';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

type Props = {
    url: string | null | undefined;
};

const InfoPanelProductImage = ({url}: Props) => {
    const styles = StyleSheet.create({
        articleImage: {
            width: 64,
            height: 64,
            //backgroundColor: 'white',
            marginRight: 16,
            marginBottom: 8,
        },
    });

    console.debug('Image URL:', url);
    if (url === undefined) {
        // undefined = not retrieved image
        return <ActivityIndicator size="small" color="#999999" style={styles.articleImage} />;
    }
    if (url === null) {
        return (
            <View style={[styles.articleImage, {backgroundColor: '#EEE', justifyContent: 'center'}]}>
                <Icon name={'image'} type={'font-awesome-5'} color={'#999'} />
            </View>
        );
    }
    return <Image source={{uri: url}} style={[styles.articleImage]} resizeMode={'contain'} resizeMethod={'resize'} />;
};

export default InfoPanelProductImage;
