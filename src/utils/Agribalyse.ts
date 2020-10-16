import AppLogger from './AppLogger';
import { userAgent } from './helpers';

interface AGBResponse {
    total: number;
    results: AGBProduct[];
}

export interface AGBProduct {
    'Utilisation_du_sol_(Pt/kg_de_produit)': number;
    Code_AGB: string;
    "Sous-groupe_d'aliment": string;
    'Eutrophisation_terreste_(mol_N_eq/kg_de_produit)': number;
    "Formation_photochimique_d'ozone_(E-03_kg_NMVOC_eq/kg_de_produit)": number;
    Code_CIQUAL: number;
    LCI_Name: string;
    'Acidification_terrestre_et_eaux_douces_(mol_H+_eq/kg_de_produit)': number;
    Nom_du_Produit_en_Français: string;
    'Score_unique_EF_(mPt/kg_de_produit)': number;
    "Matériau_d'emballage": string;
    'Épuisement_des_ressources_minéraux_(E-06_kg_Sb_eq/kg_de_produit)': number;
    'Particules_(E-06_disease_inc_/kg_de_produit)': number;
    "Appauvrissement_de_la_couche_d'ozone_(E-06_kg_CVC11_eq/kg_de_produit)": number;
    'Eutrophisation_marine_(E-03_kg_N_eq/kg_de_produit)': number;
    _i: number;
    Livraison: string;
    Préparation: string;
    Saisonnalité: string;
    'Épuisement_des_ressources_eau_(m3_depriv_/kg_de_produit)': number;
    _rand: number;
    "Groupe_d'aliment": string;
    'DQR_-_Note_de_qualité_de_la_donnée_(1_excellente___5_très_faible)': number;
    "Écotoxicité_pour_écosystèmes_aquatiques_d'eau_douce_(CTUe/kg_de_produit)": number;
    'Transport_par_avion_(1___par_avion)': false;
    'Changement_climatique_(kg_CO2_eq/kg_de_produit)': number;
    'Épuisement_des_ressources_énergétiques_(MJ/kg_de_produit)': number;
    'Rayonnements_ionisants_(kBq_U-235_eq/kg_de_produit)': number;
    'Eutrophisation_eaux_douces_(E-03_kg_P_eq/kg_de_produit)': number;
    _score: number;
    _id: string;
}

export default class Agribalyse {
    private static instance: Agribalyse;
    apiEndpoint = 'https://koumoul.com/s/data-fair/api/v1/datasets/agribalyse-synthese';

    public static getInstance(): Agribalyse {
        if (Agribalyse.instance == undefined) {
            Agribalyse.instance = new Agribalyse();
        }

        return this.instance;
    }

    async fetchFromBarcode(AGBCode: string): Promise<AGBProduct | null> {
        const options: RequestInit = {
            headers: {
                method: 'GET',
                'User-Agent': userAgent,
            },
        };
        const parameters: { [key: string]: string | string[] } = {
            // eslint-disable-next-line @typescript-eslint/camelcase
            Code_AGB_in: AGBCode,
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

        const uri = `${this.apiEndpoint}/lines?${parametersString}`;
        AppLogger.getLogger().debug(uri);
        const result = await fetch(uri, options);
        const response = ((await result.json()) as unknown) as AGBResponse;
        AppLogger.getLogger().debug(JSON.stringify(response));

        if (0 === response.total) {
            return null;
        }
        if (response.total > 1) {
            throw '[Agribalyse] more than 1 result';
        }

        return response.results[0];
    }
}
