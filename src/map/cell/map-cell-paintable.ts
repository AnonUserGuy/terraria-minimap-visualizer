import { MapCell, MapCellGroup } from "./map-cell.js";

export class MapCellPaintable extends MapCell {
    public option: number;
    public paint: number;
    
    constructor(light: number, group: MapCellGroup, id: number, option = 0, paint = 0) {
        super(light, group, id);
        this.option = option;
        this.paint = paint;
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