import { PaintID } from "../../id/paint-ids";
import { TileID } from "../../id/tile-ids.js";
import { mapCellColors } from "../map-cell-colors";
import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";
export class MapTile extends MapCellPaintable {
    constructor(light, id, option = 0, paint = PaintID.None) {
        super(light, MapCellGroup.Tile, id, option, paint);
    }
    getColorInternal() {
        return (mapCellColors.tileColors[this.id] || [])[this.option];
    }
    copyWithLight(light) {
        return new MapTile(light, this.id, this.option, this.paint);
    }
    toString() {
        return `${super.toString()} - ${TileID[this.id]} (${this.id}) - option ${this.option} - paint ${this.paint} (${this.paint})`;
    }
}
MapTile.shadowDirt = new MapTile(0, TileID.Dirt, 0, PaintID.ShadowPaint);
