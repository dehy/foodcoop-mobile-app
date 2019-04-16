export { }

declare global {
    interface Number {
        isInt(): boolean;
        isFloat(): boolean;
    }

    interface String {
        toNumber(): Number;
    }
}