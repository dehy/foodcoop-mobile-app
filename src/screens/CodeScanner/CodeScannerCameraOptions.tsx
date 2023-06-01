import {Button, Icon} from '@rneui/themed';
import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';

type Props = {
    onFlashToggle(on: boolean): void;
    onAutofocusToggle(on: boolean): void;
    onTestButtonTrigger?(): void;
};

const CodeScannerCameraOptions = ({onFlashToggle, onAutofocusToggle, onTestButtonTrigger}: Props) => {
    const [flash, setFlash] = useState<boolean>(false);
    const [autoFocus, setAutoFocus] = useState<boolean>(true);

    const styles = StyleSheet.create({
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
    });

    return (
        <View style={styles.actions}>
            <View style={styles.actionButton}>
                <Button
                    icon={<Icon type="font-awesome-5" name="bolt" color={flash ? 'yellow' : 'white'} solid />}
                    buttonStyle={{
                        backgroundColor: 'black',
                    }}
                    titleStyle={{
                        color: flash ? 'yellow' : 'white',
                    }}
                    onPress={() => {
                        const newFlash = !flash;
                        setFlash(newFlash);
                        onFlashToggle(newFlash);
                    }}
                    title=" Flash"
                />
            </View>
            <View style={styles.actionButton}>
                <Button
                    icon={<Icon type="font-awesome-5" name="expand" color={autoFocus ? 'green' : 'red'} solid />}
                    buttonStyle={{
                        backgroundColor: 'black',
                    }}
                    titleStyle={{
                        color: autoFocus ? 'green' : 'red',
                    }}
                    onPress={() => {
                        const newAutoFocus = !autoFocus;
                        setAutoFocus(newAutoFocus);
                        onAutofocusToggle(newAutoFocus);
                    }}
                    title=" Autofocus"
                />
            </View>
            {__DEV__ && <Button title="Test" onPress={onTestButtonTrigger} />}
        </View>
    );
};

export default CodeScannerCameraOptions;
