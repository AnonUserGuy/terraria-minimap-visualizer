import { MapCell, MapCellGroup } from "./map-cell.js";
export class MapLiquid extends MapCell {
    constructor(light, id) {
        super(light, MapCellGroup.Liquid, id);
    }
    copyWithLight(light) {
        return new MapLiquid(light, this.id);
    }
}
