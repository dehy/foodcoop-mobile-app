'use strict';

import { string } from 'prop-types';
import DeviceInfo from 'react-native-device-info';

export const readableVersion = (): string => {
    return DeviceInfo.getVersion() + '+' + DeviceInfo.getBuildNumber();
};
export const systemName = DeviceInfo.getSystemName();

export function isInt(n: number): boolean {
    return n % 1 === 0;
}

export function isFloat(n: number): boolean {
    return n % 1 !== 0;
}

export function toNumber(value: string): number {
    return parseFloat(value.replace(',', '.'));
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
