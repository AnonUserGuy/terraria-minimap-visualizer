import { PaintID } from "../../id/paint-ids";
import { WallID } from "../../id/wall-ids";
import { mapCellColors } from "../map-cell-colors";
import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";
export class MapWall extends MapCellPaintable {
    constructor(light, id, option = 0, paint = PaintID.None) {
        super(light, MapCellGroup.Wall, id, option, paint);
    }
    getColorInternal() {
        return (mapCellColors.wallColors[this.id] || [])[this.option];
    }
    copyWithLight(light) {
        return new MapWall(light, this.id, this.option, this.paint);
    }
    toString() {
        return `${super.toString()} - ${WallID[this.id]} (${this.id}) - option ${this.option} - paint ${this.paint} (${this.paint})`;
    }
}
MapWall.anyWall = new MapWall(255, WallID.DirtUnsafe);
