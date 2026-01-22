import { PaintID } from "../../id/paint-ids.js";
import { MapCell } from "./map-cell.js";
import { mapCellColors } from "../map-cell-colors.js";
export class MapCellPaintable extends MapCell {
    constructor(light, group, id, option = 0, paint = PaintID.None) {
        super(light, group, id);
        this.option = option;
        this.paint = paint;
    }
    getColorPainted() {
        return mapCellColors.applyPaint(this.group, this.getColor(), this.paint);
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
