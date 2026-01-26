import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";
export class MapTile extends MapCellPaintable {
    constructor(light, id, option = 0, paint = 0) {
        super(light, MapCellGroup.Tile, id, option, paint);
    }
    copyWithLight(light) {
        return new MapTile(light, this.id, this.option, this.paint);
    }
}
