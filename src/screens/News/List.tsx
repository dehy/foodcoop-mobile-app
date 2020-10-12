import React from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { Navigation, Options } from 'react-native-navigation';
import { defaultScreenOptions } from '../../utils/navigation';
import * as rssParser from 'react-native-rss-parser';
import moment from 'moment';
import { NewsItem } from './Show';
import { Icon, ListItem } from 'react-native-elements';

export interface NewsListProps {
    componentId: string;
}

interface NewsListState {
    news: NewsItem[];
    refreshing: boolean;
}

export default class NewsList extends React.Component<NewsListProps, NewsListState> {
    constructor(props: NewsListProps) {
        super(props);
        Navigation.events().bindComponent(this);
        this.state = {
            news: [],
            refreshing: true,
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
                    refreshing: false,
                });
            });
    }

    _handleRefresh = (): void => {
        this.setState(
            {
                refreshing: true,
            },
            () => {
                this.loadData();
            },
        );
    };

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
                        <ListItem
                            onPress={(): void => {
                                this.didTapNewsItem(item);
                            }}
                            bottomDivider
                        >
                            <ListItem.Content>
                                <ListItem.Title>{item.title}</ListItem.Title>
                                <ListItem.Subtitle>publié le {item.published.format('DD MMMM YYYY')}</ListItem.Subtitle>
                            </ListItem.Content>
                            <ListItem.Chevron type="font-awesome-5" name="chevron-right" />
                        </ListItem>
                    )}
                    onRefresh={this._handleRefresh}
                    refreshing={this.state.refreshing}
                />
            </SafeAreaView>
        );
    }
}
