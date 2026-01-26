import { MapCell } from "./map-cell.js";
export class MapCellPaintable extends MapCell {
    constructor(light, group, id, option = 0, paint = 0) {
        super(light, group, id);
        this.option = option;
        this.paint = paint;
    }
    copyWithLight(light) {
        return new MapCellPaintable(light, this.group, this.id, this.option, this.paint);
    }
    equals(other) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id && this.option === other.option && this.paint === other.paint;
    }
    equalsWithoutLight(other) {
        return !!other && this.group === other.group && this.id === other.id && this.option === other.option && this.paint === other.paint;
    }
}
