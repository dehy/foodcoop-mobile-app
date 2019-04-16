'use strict'

Number.prototype.isInt = function(): boolean {
    const n = Number(this);
    return n % 1 === 0;
}

Number.prototype.isFloat = function(): boolean {
    const n = Number(this);
    return n % 1 !== 0;
}

String.prototype.toNumber = function(): Number {
    const s = String(this);
    if (s === '') {
        throw new Error('String can\'t be empty');
    }
    const n = Number(s);
    if (n === NaN || String(n) !== s) {
        throw new Error('Can\'t convert to Number');
    }

    return n;
}