import { MapCell, MapCellGroup } from "./map-cell.js";

export class MapAir extends MapCell {

    constructor(light: number, id: number) {
        super(light, MapCellGroup.Air, id);
    }

    public copyWithLight(light: number) {
        return new MapAir(light, this.id);
    }

    public equals(other: MapAir) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id;
    }

    public equalsWithoutLight(other: MapAir) {
        return !!other && this.group === other.group && this.id === other.id;
    }

    public equalsAfterExport(other: MapAir) {
        return !!other && this.group === other.group; // ids just visual for air cells
    }
}