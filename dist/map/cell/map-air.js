import { MapCell, MapCellGroup } from "./map-cell.js";
export class MapAir extends MapCell {
    constructor(light, id) {
        super(light, MapCellGroup.Air, id);
    }
    copyWithLight(light) {
        return new MapAir(light, this.id);
    }
    equals(other) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id;
    }
    equalsWithoutLight(other) {
        return !!other && this.group === other.group && this.id === other.id;
    }
    equalsAfterExport(other) {
        return !!other && this.group === other.group; // ids just visual for air cells
    }
}
