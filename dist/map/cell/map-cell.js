export var MapCellGroup;
(function (MapCellGroup) {
    MapCellGroup[MapCellGroup["Empty"] = 0] = "Empty";
    MapCellGroup[MapCellGroup["Tile"] = 1] = "Tile";
    MapCellGroup[MapCellGroup["Wall"] = 2] = "Wall";
    MapCellGroup[MapCellGroup["Liquid"] = 3] = "Liquid";
    MapCellGroup[MapCellGroup["Air"] = 4] = "Air";
})(MapCellGroup || (MapCellGroup = {}));
export class MapCell {
    constructor(light, group, id) {
        this.group = group;
        this.id = id;
        this.light = light;
    }
    copy() {
        return this.copyWithLight(this.light);
    }
    copyWithLight(light) {
        return new MapCell(light, this.group, this.id);
    }
    equals(other) {
        return !!other && this.light === other.light && this.group === other.group && this.id === other.id;
    }
    equalsWithoutLight(other) {
        return !!other && this.group === other.group && this.id === other.id;
    }
    equalsAfterExport(other) {
        return this.equalsWithoutLight(other);
    }
}
