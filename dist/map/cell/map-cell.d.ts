import { Color } from "../../net/color";
export declare enum MapCellGroup {
    Empty = 0,
    Tile = 1,
    Wall = 2,
    Liquid = 3,
    Air = 4
}
export declare class MapCell {
    group: MapCellGroup;
    id: number;
    light: number;
    constructor(light: number, group: MapCellGroup, id: number);
    getColor(): Color;
    getColorInternal(): Color;
    getColorPainted(): Color;
    copy(): MapCell;
    copyWithLight(light: number): MapCell;
    equals(other: MapCell): boolean;
    equalsWithoutLight(other: MapCell): boolean;
    equalsAfterExport(other: MapCell): boolean;
    toString(): string;
}
