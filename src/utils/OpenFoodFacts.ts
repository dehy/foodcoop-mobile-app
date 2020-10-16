import DeviceInfo from 'react-native-device-info';
import AppLogger from './AppLogger';
import Odoo from './Odoo';

interface OFFResponse {
    status_verbose: string;
    product?: OFFProduct;
    status: number;
    code: string;
}

export interface OFFProduct {
    nutriscore_score?: 1 | 2 | 3 | 4 | 5;
    nova_group?: 1 | 2 | 3 | 4;
    categories_properties?: {
        'agribalyse_food_code:en'?: string;
    };
}

export default class OpenFoodFacts {
    private static instance: OpenFoodFacts;
    base = 'https://fr.openfoodfacts.org/api/v2';
    userAgent = `Supercoop - ${DeviceInfo.getSystemName()} - Version ${DeviceInfo.getVersion()} - www.supercoop.fr`;

    public static getInstance(): OpenFoodFacts {
        if (OpenFoodFacts.instance == undefined) {
            OpenFoodFacts.instance = new OpenFoodFacts();
        }

        return this.instance;
    }

    async fetchFromBarcode(barcode: string): Promise<OFFProduct | null> {
        if (!Odoo.barcodeIsValid(barcode)) {
            throw 'Invalid barcode provided';
        }
        const options: RequestInit = {
            headers: {
                method: 'GET',
                'User-Agent': this.userAgent,
            },
        };
        const parameters: { [key: string]: string | string[] } = {
            fields: [
                'nova_group',
                'nutriscore_score',
                'nutrition_grades_tags',
                'nutrition_grade_fr',
                'ingredients_text_with_allergens_fr',
                'categories_properties',
                'images',
                'product_name',
                'product_name_fr',
                'brands',
            ],
        };
        const parametersList = [];
        for (const key in parameters) {
            if (parameters.hasOwnProperty(key)) {
                let value = parameters[key];
                if (Array.isArray(value)) {
                    value = value.join(',');
                }
                parametersList.push(`${key}=${value}`);
            }
        }
        const parametersString = parametersList.join('&');

        const uri = `${this.base}/product/${barcode}.json?${parametersString}`;
        AppLogger.getLogger().debug(uri);
        const result = await fetch(uri, options);
        const response = ((await result.json()) as unknown) as OFFResponse;

        if (!response.product) {
            return null;
        }

        return response.product;
    }
}
