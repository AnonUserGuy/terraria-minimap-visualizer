import { PaintID } from "../../id/paint-ids.js";
import { TileID } from "../../id/tile-ids.js";
import { WallID } from "../../id/wall-ids.js";
import { MapCell, MapCellGroup } from "./map-cell.js";
export declare class MapCellPaintable extends MapCell {
    id: TileID | WallID;
    option: number;
    paint: PaintID;
    constructor(light: number, group: MapCellGroup, id: TileID | WallID, option?: number, paint?: PaintID);
    getColorPainted(): import("../../net/color.js").Color;
    copyWithLight(light: number): MapCellPaintable;
    equals(other: MapCellPaintable): boolean;
    equalsWithoutLight(other: MapCellPaintable): boolean;
}
