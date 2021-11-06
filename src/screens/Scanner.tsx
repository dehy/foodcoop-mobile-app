import * as React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { defaultScreenOptions } from '../utils/navigation';
import { Navigation, Options, EventSubscription } from 'react-native-navigation';
import CodeScanner from './CodeScanner';

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
});

export default class Scanner extends React.Component<Props, State> {
    private scanner?: CodeScanner;

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
            <CodeScanner
                ref={(ref: CodeScanner): void => {
                    this.scanner = ref !== null ? ref : undefined;
                }}
            ></CodeScanner>
        );
    }

    render(): React.ReactNode {
        return <SafeAreaView style={styles.container}>{this.renderCameraView()}</SafeAreaView>;
    }
}
