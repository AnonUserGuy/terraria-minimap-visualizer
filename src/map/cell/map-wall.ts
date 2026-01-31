import { MapCellGroup } from "./map-cell.js";
import { MapCellPaintable } from "./map-cell-paintable.js";

export class MapWall extends MapCellPaintable {

    constructor(light: number, id: number, option = 0, paint = 0) {
        super(light, MapCellGroup.Wall, id, option, paint);
    }

    public copyWithLight(light: number) {
        return new MapWall(light, this.id, this.option, this.paint);
    }
}