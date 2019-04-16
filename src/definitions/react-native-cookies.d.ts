declare module 'react-native-cookies' {
    function set(cookie: Cookie): Promise<void>;
    function setFromResponse(url: string, value: string): Promise<void>;
    function getFromResponse(url: string): Promise<Cookie[]>;
    function get(url: string): Promise<Cookie>;
    function getAll(): Promise<Cookie[]>;
    function clearAll(): Promise<void>;
    function clearByName(): Promise<void>;
}

interface Cookie {
    name: string,
    domain: string,
    value: string,
    origin: string,
    path: string,
    version: string,
    expiration: Date
}