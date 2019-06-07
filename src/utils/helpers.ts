'use strict'

export function isInt(n: number) {
    return n % 1 === 0;
}

export function isFloat(n: number) {
    return n % 1 !== 0;
}

export function toNumber(value: string) {
    return parseFloat(value);
}