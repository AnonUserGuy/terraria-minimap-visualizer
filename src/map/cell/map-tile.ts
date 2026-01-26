import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";

export class MapTile extends MapCellPaintable {

    constructor(light: number, id: number, option = 0, paint = 0) {
        super(light, MapCellGroup.Tile, id, option, paint);
    }

    public copyWithLight(light: number) {
        return new MapTile(light, this.id, this.option, this.paint);
    }
}