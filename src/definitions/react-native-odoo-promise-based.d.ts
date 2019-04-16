declare module 'react-native-odoo-promise-based';

interface OdooApiResponse {
    success: boolean;
    error?: any;
    data?: any;
}

interface OdooApiProductProduct {
    barcode?: string;
    name?: string;
    image?: string|null;
    qty_available?: number;
    uom_id?: number;
    lst_price?: number;
    weight_net?: number;
    volume?: number;
}

interface OdooApi {
    sid?: string;
    cookie?: string;
    session_id?: string;

    connect(): Promise<OdooApiResponse>;
    search(model: string, params: object, context?: object): Promise<OdooApiResponse>;
    search_read(model: string, params: object, context?: object): Promise<OdooApiResponse>;
    get(model: string, params: object, context?: object): Promise<OdooApiResponse>;
    read_group(model: string, params: object, context?: object): Promise<OdooApiResponse>;
    browse_by_id(model: string, params: object): Promise<OdooApiResponse>;
    create(model: string, params: object, context?: object): Promise<OdooApiResponse>;
    update(model: string, ids: number[], params: object, context?: object): Promise<OdooApiResponse>;
    delete(model: string, ids: number[], context?: object): Promise<OdooApiResponse>;
    rpc_call(endpoint: string, params: object): Promise<OdooApiResponse>;
    _request(path: string, params: object): Promise<OdooApiResponse>;
}