export enum MapCellGroup {
    Empty,
    Tile,
    Wall,
    Liquid,
    Air,
}

export class MapCell {
    public group: MapCellGroup;
    public id: number;
    public light: number;

    constructor(light: number, group: MapCellGroup, id: number) {
        this.group = group;
        this.id = id;
        this.light = light;
    }

    public copy() {
        return this.copyWithLight(this.light);
    }

    public copyWithLight(light: number) {
        return new MapCell(light, this.group, this.id);
    }

    public equals(other: MapCell) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id;
    }

    public equalsWithoutLight(other: MapCell) {
        return !!other && this.group === other.group && this.id === other.id;
    }

    public equalsAfterExport(other: MapCell) {
        return this.equalsWithoutLight(other);
    }
}
