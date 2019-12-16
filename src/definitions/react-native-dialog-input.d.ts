declare module 'react-native-dialog-input';
{
    interface DialogInputProps {
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
    }
}
