import React from 'react';
import {EmitterSubscription, FlatList, Platform, SafeAreaView, Text, View} from 'react-native';
import {defaultScreenOptions} from '../../../utils/navigation';
import {Navigation, Options, OptionsModalPresentationStyle} from 'react-native-navigation';
import bootstrapStyle from '../../../styles/bootstrap';
import ActionSheet from 'react-native-action-sheet';
import {Button, Icon, ListItem} from 'react-native-elements';
import LabelList from '../../../entities/Lists/LabelList';
import LabelEntry from '../../../entities/Lists/LabelEntry';
import {Repository} from 'typeorm';
import {DateTime} from 'luxon';
import Database from '../../../utils/Database';

export interface Props {
    list: LabelList;
}

interface State {
    listEntries: LabelEntry[];
    refreshing: boolean;
}

interface LabelData {
    key: string;
    title?: string;
    subtitle?: string;
    image: {uri: string} | null;
    metadata: string;
    labelEntry: LabelEntry;
}

export default class ListsLabelShow extends React.Component<Props, State> {
    static screenName = 'Lists/Label/Show';

    modalDismissedListener?: EmitterSubscription;
    labelListRepository: Repository<LabelList>;
    labelEntryRepository: Repository<LabelEntry>;

    constructor(props: Props) {
        super(props);
        Navigation.events().bindComponent(this);
        this.labelListRepository = Database.sharedInstance().dataSource.getRepository(LabelList);
        this.labelEntryRepository = Database.sharedInstance().dataSource.getRepository(LabelEntry);

        this.state = {
            listEntries: [],
            refreshing: false,
        };
    }

    static options(): Options {
        return defaultScreenOptions('Liste');
    }

    componentDidMount(): void {
        this.modalDismissedListener = Navigation.events().registerModalDismissedListener(() => {
            this.loadLabelEntries();
        });

        this.loadLabelEntries();
    }

    componentWillUnmount(): void {
        if (this.modalDismissedListener) {
            this.modalDismissedListener.remove();
        }
    }

    componentDidAppear(): void {
        this.loadLabelEntries();
    }

    loadLabelEntries(): void {
        this.labelEntryRepository
            .find({
                where: {
                    list: {
                        id: this.props.list.id!,
                    },
                },
            })
            .then(entries => {
                this.setState({
                    listEntries: entries,
                });
            });
    }

    _handleRefresh = (): void => {
        this.setState(
            {
                refreshing: true,
            },
            () => {
                this.loadLabelEntries();
            },
        );
    };

    deleteLabelEntry(labelEntry: LabelEntry): void {
        if (!labelEntry.id) {
            return;
        }
        Database.sharedInstance()
            .dataSource.getRepository(LabelEntry)
            .delete(labelEntry.id)
            .then(() => {
                this.loadLabelEntries();
            });
    }

    computeEntriesData(): LabelData[] {
        // TODO: gérer les entrées multiples
        const listDatas = [];
        for (const k in this.state.listEntries) {
            const entry = this.state.listEntries[k];
            const data: LabelData = {
                key: 'label-entry-' + entry.id,
                title: entry.productName,
                subtitle: entry.productBarcode,
                image: null,
                metadata: '',
                labelEntry: entry,
            };
            listDatas.push(data);
        }
        return listDatas;
    }

    openScannerModal(): void {
        console.debug(this.props.list);
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/Label/Scan',
                            passProps: {
                                list: this.props.list,
                            },
                            options: {
                                topBar: {},
                                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                            },
                        },
                    },
                ],
            },
        });
    }

    openExportModal(): void {
        Navigation.showModal({
            stack: {
                children: [
                    {
                        component: {
                            name: 'Lists/Label/Export',
                            passProps: {
                                label: this.props.list,
                                labelEntries: this.state.listEntries,
                            },
                            options: {
                                topBar: {},
                            },
                        },
                    },
                ],
            },
        });
    }

    didTapLabelEntry(labelEntry: LabelEntry): void {
        const title = labelEntry.productName;
        const buttonsIos = ['Supprimer', 'Annuler'];
        const buttonsAndroid = ['Supprimer'];
        const DESTRUCTIVE_INDEX = 0;
        const CANCEL_INDEX = 1;

        // TODO: rajouter une entrée "commentaire"

        ActionSheet.showActionSheetWithOptions(
            {
                title: title,
                options: Platform.OS === 'ios' ? buttonsIos : buttonsAndroid,
                cancelButtonIndex: CANCEL_INDEX,
                destructiveButtonIndex: DESTRUCTIVE_INDEX,
                tintColor: 'blue',
            },
            buttonIndex => {
                if (buttonIndex === DESTRUCTIVE_INDEX) {
                    this.deleteLabelEntry(labelEntry);
                }
            },
        );
    }

    renderAlerts(): React.ReactNode {
        const label = this.props.list;
        if (!label) {
            return null;
        }
        let lastSentAtInfo, wasModifiedWarning;
        if (label.lastSentAt != null) {
            lastSentAtInfo = (
                <View style={bootstrapStyle.infoView}>
                    <Text style={bootstrapStyle.infoText}>
                        Liste déjà envoyée le {label.lastSentAt.toLocaleString(DateTime.DATETIME_SHORT)}
                    </Text>
                </View>
            );
        }
        if (
            label.lastSentAt &&
            label.lastModifiedAt &&
            label.lastSentAt.toSeconds() < label.lastModifiedAt.toSeconds()
        ) {
            wasModifiedWarning = (
                <View style={bootstrapStyle.warningView}>
                    <Text style={bootstrapStyle.warningText}>Liste modifiée depuis le dernier envoi !</Text>
                </View>
            );
        }

        return (
            <View>
                {lastSentAtInfo}
                {wasModifiedWarning}
            </View>
        );
    }

    renderHeader(): React.ReactElement {
        return (
            <View style={{borderBottomWidth: 0.5, borderBottomColor: '#DDD'}}>
                {this.renderAlerts()}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        backgroundColor: 'white',
                        paddingVertical: 16,
                    }}>
                    <Button
                        onPress={(): void => {
                            this.openScannerModal();
                        }}
                        icon={<Icon type="font-awesome-5" name="barcode" color="white" solid />}
                        title=" Scanner"
                    />
                    <Button
                        onPress={(): void => {
                            this.openExportModal();
                        }}
                        icon={<Icon type="font-awesome-5" name="file-export" color="white" solid />}
                        title=" Envoyer"
                    />
                </View>
                {this.renderNoEntry()}
            </View>
        );
    }

    renderNoEntry(): React.ReactNode {
        if (this.state.listEntries.length > 0) {
            return null;
        }
        return (
            <View>
                <Text style={{fontSize: 25, textAlign: 'center', margin: 12}}>
                    Aucune étiquette pour le moment. Appuie sur le bouton &quot;Scanner&quot; pour démarrer !
                </Text>
            </View>
        );
    }

    render(): React.ReactNode {
        return (
            <SafeAreaView>
                <FlatList
                    scrollEnabled={true}
                    style={{backgroundColor: 'white', height: '100%'}}
                    data={this.computeEntriesData()}
                    ListHeaderComponent={this.renderHeader()}
                    renderItem={({item}): React.ReactElement => (
                        <ListItem
                            onPress={(): void => {
                                this.didTapLabelEntry(item.labelEntry);
                            }}
                            bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>{item.title}</ListItem.Title>
                                <ListItem.Subtitle>{item.subtitle}</ListItem.Subtitle>
                            </ListItem.Content>
                            <ListItem.Content right>
                                <Text style={{textAlign: 'right'}}>{item.metadata}</Text>
                            </ListItem.Content>
                        </ListItem>
                    )}
                />
            </SafeAreaView>
        );
    }
}
