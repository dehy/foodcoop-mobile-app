import { TextInput } from 'react-native';
import { DialogInput } from 'react-native-dialog-input';

declare module 'react-native-dialog-input' {
    class DialogInput {
        isDialogVisible: boolean;
        title?: string;
        hintInput?: string;
        initValueTextInput: string;
        textInputProps?: {};
        modalStyle?: {};
        dialogStyle?: {};
        cancelText?: string;
        submitText?: string;
        submitInput?: TextInput;

        closeDialog?: () => void;
    }
}
