import DeviceInfo from 'react-native-device-info';
import { EcoScoreScore } from '../components/EcoScore';
import { NovaGroupGroups } from '../components/NovaGroup';
import { NutriScoreScore } from '../components/NutriScore';
import AppLogger from './AppLogger';
import Odoo from './Odoo';

interface OFFResponse {
    status_verbose: string;
    product?: OFFProduct;
    status: number;
    code: string;
}

export interface OFFProduct {
    nutrition_grade_fr?: NutriScoreScore;
    ecoscore_grade?: EcoScoreScore;
    nova_group?: NovaGroupGroups;
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
            throw new Error('Invalid barcode provided');
        }
        const options: RequestInit = {
            headers: {
                method: 'GET',
                'User-Agent': this.userAgent,
            },
        };
        const parameters: {[key: string]: string | string[]} = {
            fields: [
                'nova_group',
                'ecoscore_grade',
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
        AppLogger.getLogger().debug(JSON.stringify(response));

        if (!response.product) {
            return null;
        }

        return response.product;
    }
}
