declare module 'react-native-dialog-input';
type DialogInputProps = {
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
};
