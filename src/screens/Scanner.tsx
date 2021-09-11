import * as React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import ScannerCamera from './ScannerCamera';

export interface Props {
    componentId: string;
}

interface State {
    displayCamera: boolean;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'black',
    },
    scanMode: {
        position: 'absolute',
        left: 0,
        top: 0,
        marginLeft: 8,
        marginTop: 8,
    },
    actions: {
        position: 'absolute',
        flexDirection: 'row',
        left: 0,
        bottom: 0,
        marginLeft: 8,
        marginBottom: 8,
    },
    actionButton: {
        marginRight: 4,
        marginLeft: 4,
    },
    information: {
        flexDirection: 'column',
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        margin: 8,
        borderRadius: 8,
        backgroundColor: 'white',
        padding: 16,
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    capture: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 16,
        paddingHorizontal: 24,
        alignSelf: 'center',
        margin: 24,
    },

    articleImage: {
        width: 64,
        height: 64,
        backgroundColor: 'white',
        marginRight: 16,
        marginBottom: 8,
    },
    articleName: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
    },
    detailTitle: {
        flex: 1,
        textAlign: 'center',
    },
    detailValue: {
        flex: 2,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 24,
    },
    detailValueInvalid: {
        color: 'red',
    },
});

export default class Scanner extends React.Component<Props, State> {
    private scanner?: ScannerCamera;

    private navigationEventListener?: EventSubscription;

    constructor(props: Props) {
        super(props);

        this.state = {
            displayCamera: true,
        };

        // Navigation
        Navigation.events().bindComponent(this);
    }

    componentDidMount(): void {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear(): void {
        this.setState({
            displayCamera: true,
        });
    }

    componentDidDisappear(): void {
        StatusBar.setBarStyle('dark-content');
        this.setState({
            displayCamera: false,
        });
    }

    componentWillUnmount(): void {
        if (this.navigationEventListener) {
            this.navigationEventListener.remove();
        }
    }

    static options(): Options {
        const options = defaultScreenOptions('Scannette');
        if (options && options.topBar) {
            options.topBar.visible = false;
        }

        return options;
    }

    renderCameraView(): React.ReactElement {
        if (!this.state.displayCamera) {
            return (
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Caméra en Pause</Text>
                </View>
            );
        }

        return (
            <ScannerCamera
                ref={(ref: ScannerCamera): void => {
                    this.scanner = ref !== null ? ref : undefined;
                }}
            ></ScannerCamera>
        );
    }

    render(): React.ReactNode {
        return <SafeAreaView style={styles.container}>{this.renderCameraView()}</SafeAreaView>;
    }
}
