import React from 'react';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import { Moment } from 'moment';
import WebView from 'react-native-webview';

export interface NewsShowProps {
    componentId: string;
    newsItem: NewsItem;
}

interface NewsShowState {
    componentId: string;
}

export interface NewsItem {
    key: string;
    title: string;
    published: Moment;
    url: string;
}

export default class NewsShow extends React.Component<NewsShowProps, NewsShowState> {
    constructor(props: NewsShowProps) {
        super(props);
        Navigation.events().bindComponent(this);
        //console.debug(this.props.newsItem.url);
    }

    get options(): Options {
        return defaultScreenOptions(this.props.newsItem.title);
    }

    render(): React.ReactNode {
        return (
            <WebView
                source={{ uri: this.props.newsItem.url }}
                onLoadProgress={(e): void => console.debug(e.nativeEvent.progress)}
                injectedJavaScript={`
                        (function() {
                            if (document.getElementsByClassName("single-post").length > 0) {

                                document.getElementById("masthead").remove();

                                var container = document.getElementsByClassName("container")[0];
                                container.style.padding = 0;

                                var pageContent = document.getElementsByClassName("page-content")[0];
                                pageContent.style.margin = 0;

                                var article = document.getElementsByTagName("article")[0];
                                article.style.padding = 0;

                                document.getElementById("comments").remove();

                                document.getElementsByClassName("post-navigation")[0].remove();

                                var preFooter = document.getElementsByClassName("pre-footer")[0];
                                while (preFooter) {
                                    preFooter.remove();
                                    var preFooter = document.getElementsByClassName("pre-footer")[0];
                                }
                                document.getElementById("footer-area").remove();

                                var footer = document.getElementsByTagName("footer")[0];
                                while (footer) {
                                    footer.remove();
                                    footer = document.getElementsByTagName("footer")[0];
                                }

                                document.getElementsByClassName("the_champ_sharing_container")[0].remove();

                                document.getElementsByClassName("heateor_ss_mobile_footer")[0].remove();
                            }
                        })();

                        true;
                    `}
            />
        );
    }
}
