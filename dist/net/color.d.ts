export declare class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a?: number);
    toString(): string;
    copy(): Color;
    static get black(): Color;
    static get white(): Color;
    static get transparent(): Color;
    static readonly globalBlack: Color;
    static readonly globalWhite: Color;
}
