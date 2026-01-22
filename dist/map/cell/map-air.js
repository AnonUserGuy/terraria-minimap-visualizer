import { MapCell, MapCellGroup } from "./map-cell";
export var MapAirDepth;
(function (MapAirDepth) {
    MapAirDepth[MapAirDepth["Sky"] = 0] = "Sky";
    MapAirDepth[MapAirDepth["Dirt"] = 1] = "Dirt";
    MapAirDepth[MapAirDepth["Rock"] = 2] = "Rock";
})(MapAirDepth || (MapAirDepth = {}));
export class MapAir extends MapCell {
    constructor(light, id, depth) {
        super(light, MapCellGroup.Air, id);
        this.depth = depth;
    }
    copyWithLight(light) {
        return new MapAir(light, this.id, this.depth);
    }
    equals(other) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id && this.depth === other.depth;
    }
    equalsWithoutLight(other) {
        return !!other && this.group === other.group && this.id === other.id && this.depth === other.depth;
    }
    equalsAfterExport(other) {
        return !!other && this.group === other.group; // ids just visual for air cells
    }
    toString() {
        return `${super.toString()} - Air`;
    }
}
