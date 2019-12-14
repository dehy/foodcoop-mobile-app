import React from 'react';
import { WebView } from 'react-native-webview';
import { defaultScreenOptions } from '../utils/navigation';
import { Options } from 'react-native-navigation';

export interface NewsProps {
    componentId: string;
}

export default class News extends React.Component<NewsProps> {
    static get options(): Options {
        return defaultScreenOptions('News');
    }

    render(): React.ReactNode {
        // if (__DEV__) {
        //     return <View></View>;
        // }
        return (
            <WebView
                source={{ uri: 'https://supercoop.fr/blog/' }}
                style={{ marginTop: 0 }}
                onLoadProgress={(e): void => console.debug(e.nativeEvent.progress)}
            />
        );
    }
}
