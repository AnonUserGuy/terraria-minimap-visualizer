import { MapCellGroup } from "./map-cell";
import { MapCellPaintable } from "./map-cell-paintable.js";
export class MapWall extends MapCellPaintable {
    constructor(light, id, option = 0, paint = 0) {
        super(light, MapCellGroup.Wall, id, option, paint);
    }
    copyWithLight(light) {
        return new MapWall(light, this.id, this.option, this.paint);
    }
}
