import { PaintID } from "../id/paint-ids.js";
import { TileID } from "../id/tile-ids.js";
import { WallID } from "../id/wall-ids.js";
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
    paint: PaintID;
    group: number;
    id: TileID | WallID | undefined;
    option: number | undefined;
    static air: MapTile;
    static shadowDirt: MapTile;
    static anyWall: MapTile;
    constructor(type: number, light: number, paint: number, group: number, id?: number | undefined, option?: number | undefined);
    getColor(): import("../net/color.js").Color;
    getColorPainted(): import("../net/color.js").Color;
    copyWithLight(light: number): MapTile;
    equals(other: MapTile): boolean;
    equalsAfterExport(other: MapTile): boolean;
    equalsWithoutLight(other: MapTile): boolean;
    toString(): any;
}
