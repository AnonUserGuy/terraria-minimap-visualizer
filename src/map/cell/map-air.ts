import { MapCell, MapCellGroup } from "./map-cell";

export enum MapAirDepth {
    Sky,
    Dirt,
    Rock
}

export class MapAir extends MapCell {
    public depth: MapAirDepth;

    constructor(light: number, id: number, depth: MapAirDepth) {
        super(light, MapCellGroup.Air, id);
        this.depth = depth;
    }

    public copyWithLight(light: number) {
        return new MapAir(light, this.id, this.depth);
    }

    public equals(other: MapAir) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id && this.depth === other.depth;
    }

    public equalsWithoutLight(other: MapAir) {
        return !!other && this.group === other.group && this.id === other.id && this.depth === other.depth;
    }

    public equalsAfterExport(other: MapCell) {
        return !!other && this.group === other.group; // ids just visual for air cells
    }

    public toString() {
        return `${super.toString()} - Air`;
    }
}