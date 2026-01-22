import { PaintID } from "../../id/paint-ids";
import { TileID } from "../../id/tile-ids.js";
import { mapCellColors } from "../map-cell-colors";
import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";

export class MapTile extends MapCellPaintable {
    public id: TileID;

    public static shadowDirt = new MapTile(0, TileID.Dirt, 0, PaintID.ShadowPaint);

    constructor(light: number, id: TileID, option = 0, paint = PaintID.None) {
        super(light, MapCellGroup.Tile, id, option, paint);
    }

    public getColorInternal() {
        return (mapCellColors.tileColors[this.id] || [])[this.option];
    }

    public copyWithLight(light: number) {
        return new MapTile(light, this.id, this.option, this.paint);
    }

    public toString() {
        return `${super.toString()} - ${TileID[this.id]} (${this.id}) - option ${this.option} - paint ${this.paint} (${this.paint})`;
    }
}