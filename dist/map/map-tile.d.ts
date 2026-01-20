export declare enum TileGroup {
    Empty = 0,
    Tile = 1,
    Wall = 2,
    Water = 3,
    Lava = 4,
    Honey = 5,
    Air = 6,
    DirtRock = 7
}
export declare class MapTile {
    type: number;
    light: number;
    private _extraData;
    group: number;
    id: number | undefined;
    option: number | undefined;
    static air: MapTile;
    static shadowDirt: MapTile;
    static anyWall: MapTile;
    constructor(type: number, light: number, extraData: number, group: number, id: number | undefined, option: number | undefined);
    get color(): number;
    set color(value: number);
    getXnaColor(): import("../net/xna-color.js").Color;
    withLight(light: number): MapTile;
    static create(type: number, light: number, color: number, group: number, id?: number | undefined, option?: number | undefined): MapTile;
    equals(other: MapTile): boolean;
    equalsAfterExport(other: MapTile): boolean;
    equalsWithoutLight(other: MapTile): boolean;
    toString(): any;
}
