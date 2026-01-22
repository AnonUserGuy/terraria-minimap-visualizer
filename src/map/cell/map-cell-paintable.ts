import { PaintID } from "../../id/paint-ids.js";
import { TileID } from "../../id/tile-ids.js";
import { WallID } from "../../id/wall-ids.js";
import { MapCell, MapCellGroup } from "./map-cell.js";
import { mapCellColors } from "../map-cell-colors.js";

export class MapCellPaintable extends MapCell {
    public id: TileID | WallID;
    public option: number;
    public paint: PaintID;
    
    constructor(light: number, group: MapCellGroup, id: TileID | WallID, option = 0, paint = PaintID.None) {
        super(light, group, id);
        this.option = option;
        this.paint = paint;
    }

    public getColorPainted() {
        return mapCellColors.applyPaint(this.group, this.getColor(), this.paint);
    }

    public copyWithLight(light: number) {
        return new MapCellPaintable(light, this.group, this.id, this.option, this.paint);
    }

    public equals(other: MapCellPaintable) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id && this.option === other.option && this.paint === other.paint;
    }

    public equalsWithoutLight(other: MapCellPaintable) {
        return !!other && this.group === other.group && this.id === other.id && this.option === other.option && this.paint === other.paint;
    }
}