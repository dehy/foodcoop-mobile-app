declare module 'react-native-mime-types' {
    function charset(type: string): false | string;
    function contentType(str: string): false | string;
    function extension(type: string): false | string;
    function lookup(path: string): false | string;
}
