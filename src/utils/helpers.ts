'use strict';

import DeviceInfo from 'react-native-device-info';

export const readableVersion = (): string => {
    return DeviceInfo.getVersion() + '+' + DeviceInfo.getBuildNumber();
};
export const brand = DeviceInfo.getBrand();
export const deviceId = DeviceInfo.getDeviceId();
export const systemName = DeviceInfo.getSystemName();
export const systemVersion = DeviceInfo.getSystemVersion();
export const userAgent = `${DeviceInfo.getApplicationName()} - ${DeviceInfo.getSystemName()} - Version ${DeviceInfo.getVersion()} - www.supercoop.fr`;

// https://advancedweb.hu/how-to-use-async-functions-with-array-filter-in-javascript/
export const asyncFilter = async (
    arr: any[],
    predicate: (value: any, index?: number, array?: any[]) => unknown,
): Promise<any[]> => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

export function isInt(n: number): boolean {
    return n % 1 === 0;
}

export function isFloat(n: number): boolean {
    return n % 1 !== 0;
}

export function toNumber(value: string): number {
    return parseFloat(value.replace(',', '.'));
}

export function replaceStringAt(value: string, index: number, replacement: string): string {
    return value.substr(0, index) + replacement + value.substr(index + replacement.length);
}

export function displayNumber(value?: number): string {
    if (undefined == value) {
        return '';
    }
    return value.toString().replace('.', ',');
}

export function randomId(): string {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return Math.random()
        .toString(36)
        .substr(2, 9)
        .toString();
}

/**
 * Function to use with Array.filter() to get only unique values
 * https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
 */
export function filterUnique(value: any, index: number, self: any): boolean {
    return self.indexOf(value) === index;
}
