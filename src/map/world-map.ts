import { MapCell, MapCellGroup } from "./cell/map-cell.js";
import { MapReader } from "./map-reader.js";
import { SchematicWriter } from "../tedit/schematic-writer.js";
import { BinaryReader } from "../net/binary-reader.js";
import { BinaryWriter } from "../net/binary-writer.js";
import { mapCellColors } from "./map-cell-colors.js";
import { MapAir, MapAirDepth } from "./cell/map-air.js";
import { VersionData } from "../data/version-data.js";

export class WorldMap {

    protected _width: number;
    protected _height: number;

    private skyDepths: number[];
    private sky: MapCell[];
    public cells: MapCell[];

    public worldName: string;
    public worldId: number;
    public release: number;
    public version: string;
    public revision: number;
    public isChinese: boolean;

    public worldSurface: number;
    public worldSurfaceEstimated: boolean;
    public rockLayer: number;

    constructor(width = 0, height = 0) {
        this._width = width;
        this._height = height;
        this.skyDepths = [];
        this.sky = [];
        this.cells = [];
    }

    public get width() {
        return this._width;
    }
    public set width(val: number) {
        this._width = val;
        this.updateDimensions();
    }

    public get height() {
        return this._height;
    }
    public set height(val: number) {
        this._height = val;
        this.updateDimensions();
    }

    public setDimensions(w: number, h: number) {
        this._width = w;
        this._height = h;
        this.updateDimensions();
    }

    public updateDimensions() {
        this.cells = Array(this._height * this._width);
    }

    public setCell(x: number, y: number, tile: MapCell) {
        if (tile.group === MapCellGroup.Air && (tile as MapAir).depth === MapAirDepth.Sky && tile !== this.sky[this.sky.length - 1]) {
            this.sky.push(tile);
            this.skyDepths.push(y);
        }
        this.cells[y * this._width + x] = tile;
    }

    public cell(x: number, y: number) {
        return this.cells[y * this._width + x];
    }

    private fixSky() {
        for (let i = 0; i < this.sky.length; i++) {
            const tile = this.sky[i];
            const y = this.skyDepths[i];
            tile.id = mapCellColors.getSkyId(y, this.worldSurface);
        }
        this.sky = [];
        this.skyDepths = [];
    }

    public async read(data: (Uint8Array | ArrayBuffer)) {
        const reader = new BinaryReader(data);
        await MapReader.read(reader, this);
        this.fixSky();
        this.version = VersionData.getVersionString(this.release);
    }

    public isReleaseSafe() {
        return this.release <= VersionData.latestRelease;
    }

    public writeSchematic() {
        const writer = new BinaryWriter();
        SchematicWriter.writeSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
}