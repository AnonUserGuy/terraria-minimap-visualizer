export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public toString() {
        return `rgb(${this.r} ${this.g} ${this.b})`;
    }

    public copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    static get black() { return new Color(0, 0, 0) };
    static get white() { return new Color(255, 255, 255) };
    static get transparent() { return new Color(0, 0, 0, 0) };

    static readonly globalBlack = Color.black;
    static readonly globalWhite = Color.white;
}