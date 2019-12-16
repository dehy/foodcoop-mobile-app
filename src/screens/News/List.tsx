import React from 'react';
import { Text, View, SafeAreaView, TouchableHighlight, FlatList } from 'react-native';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import * as rssParser from 'react-native-rss-parser';
import styles from '../../styles/material';
import moment from 'moment';
import { NewsItem } from './Show';

export interface NewsListProps {
    componentId: string;
}

interface NewsListState {
    news: NewsItem[];
}

export default class NewsList extends React.Component<NewsListProps, NewsListState> {
    constructor(props: NewsListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            news: [],
        };
    }

    componentDidMount(): void {
        this.loadData();
    }

    loadData(): void {
        fetch('https://supercoop.fr/feed/')
            .then(response => response.text())
            .then(responseData => rssParser.parse(responseData))
            .then(rss => {
                const allTheNews: NewsItem[] = [];
                for (const i in rss.items) {
                    const news: NewsItem = {
                        key: i,
                        title: rss.items[i].title,
                        published: moment(rss.items[i].published),
                        url: rss.items[i].links[0].url,
                    };
                    allTheNews.push(news);
                }
                this.setState({
                    news: allTheNews,
                });
            });
    }

    static get options(): Options {
        return defaultScreenOptions('Actualités');
    }

    didTapNewsItem(newsItem: NewsItem): void {
        Navigation.push(this.props.componentId, {
            component: {
                name: 'News/Show',
                passProps: {
                    newsItem: newsItem,
                },
            },
        });
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    style={{ backgroundColor: 'white' }}
                    data={this.state.news}
                    renderItem={({ item }): React.ReactElement => (
                        <TouchableHighlight
                            onPress={(): void => {
                                this.didTapNewsItem(item);
                            }}
                            underlayColor="#BCBCBC"
                        >
                            <View style={styles.row}>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>{item.title}</Text>
                                    <Text style={styles.rowSubtitle}>
                                        publié le {item.published.format('DD MMMM YYYY')}
                                    </Text>
                                </View>
                            </View>
                        </TouchableHighlight>
                    )}
                />
            </SafeAreaView>
        );
    }
}
