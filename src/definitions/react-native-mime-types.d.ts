declare module 'react-native-mime-types' {
    function charset(type: string): boolean | string;
    function contentType(str: string): boolean | string;
    function extension(type: string): boolean | string;
    function lookup(path: string): boolean | string;
}
