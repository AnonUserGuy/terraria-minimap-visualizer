import { PaintID } from "../../id/paint-ids";
import { TileID } from "../../id/tile-ids.js";
import { MapCellPaintable } from "./map-cell-paintable.js";
export declare class MapTile extends MapCellPaintable {
    id: TileID;
    static shadowDirt: MapTile;
    constructor(light: number, id: TileID, option?: number, paint?: PaintID);
    getColorInternal(): import("../../net/color").Color;
    copyWithLight(light: number): MapTile;
    toString(): string;
}
