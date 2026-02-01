import { Color, Colors } from "../net/color.js";
import { BinaryReader } from "../net/binary-reader.js";
import { BinaryWriter } from "../net/binary-writer.js";
import { MapReader } from "./map-reader.js";
import { SchematicWriter } from "../tedit/schematic-writer.js";
import { MapData } from "../data/map-data.js";
import { MapCell, MapCellGroup } from "./cell/map-cell.js";
import { MapCellPaintable } from "./cell/map-cell-paintable.js";

export class WorldMap {

    protected _width: number;
    protected _height: number;

    public mapData: MapData;
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
    public rockLayerEstimated: boolean; // always estimated by program, only not estimated if assigned externally

    constructor(mapData?: MapData | unknown, width = 0, height = 0) {
        if (!mapData || !(mapData instanceof MapData)) {
            this.dataFromJson(mapData);
        } else {
            this.mapData = mapData;
        }
        this._width = width;
        this._height = height;
        this.cells = Array(this._height * this._width);
    }

    public dataFromJson(mapDataJSON?: unknown) {
        this.mapData = new MapData(mapDataJSON);
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

    public get underworldLayer() {
        return this._height - 200;
    }

    public setDimensions(w: number, h: number) {
        this._width = w;
        this._height = h;
        this.updateDimensions();
    }

    public updateDimensions() {
        this.cells = Array(this._height * this._width);
    }

    public setCell(x: number, y: number, cell: MapCell) {
        this.cells[y * this._width + x] = cell;
    }

    public cell(x: number, y: number) {
        return this.cells[y * this._width + x];
    }

    public color(x: number, y: number): Color {
        const cell = this.cell(x, y);
        if (!cell) {
            return Colors.black;
        }
        switch(cell.group) {
            case MapCellGroup.Air:
                if (y < this.worldSurface) {
                    return this.mapData.skyColor(y, this.worldSurface);
                } else if (y < this.rockLayer) {
                    return this.mapData.dirtColor(cell.id);
                } else if (y < this.underworldLayer) {
                    return this.mapData.rockColor(cell.id);
                } else {
                    return this.mapData.hellColor();
                }
            case MapCellGroup.Tile:
                return this.mapData.tileColor(cell as MapCellPaintable);
            case MapCellGroup.Wall:
                return this.mapData.wallColor(cell as MapCellPaintable);
            case MapCellGroup.Liquid:
                return this.mapData.liquidColor(cell.id);
        }
        return Colors.black;
    }

    public colorPainted(x: number, y: number) {
        const cell = this.cell(x, y);
        if (!cell) {
            return Colors.black;
        }
        if ((cell.group === MapCellGroup.Tile || cell.group === MapCellGroup.Wall) && (cell as MapCellPaintable).paint !== 0) {
            return this.mapData.applyPaint(cell.group, this.color(x, y), (cell as MapCellPaintable).paint);
        } else {
            return this.color(x, y);
        }
    }

    public getString(x: number, y: number) {
        let res = `(${x}, ${y}): `;
        const cell = this.cell(x, y);
        if (!cell) {
            return res + "Empty";
        }
        res += `Light ${cell.light}/255 - `
        switch(cell.group) {
            case MapCellGroup.Air:
                res += "Air - ";
                if (y < this.worldSurface) {
                    return res + `Surface Layer - Shade ${this.mapData.skyIndex(y, this.worldSurface)}`;
                } else if (y < this.rockLayer) {
                    return res + `Underground Layer - Shade ${this.mapData.dirtIndex(cell.id)}`;
                } else if (y < this.underworldLayer) {
                    return res + `Caverns Layer - Shade ${this.mapData.rockIndex(cell.id)}`;
                } else {
                    return res + "Underworld Layer";
                }
            case MapCellGroup.Tile:
                return res + this.mapData.tileString(cell as MapCellPaintable);
            case MapCellGroup.Wall:
                return res + this.mapData.wallString(cell as MapCellPaintable);
            case MapCellGroup.Liquid:
                return res + this.mapData.liquidString(cell.id);
        }
        return res + "Unknown";
    }

    public async read(data: (Uint8Array | ArrayBuffer)) {
        const reader = new BinaryReader(data);
        await MapReader.read(reader, this);
        this.version = this.mapData.getVersion(this.release);
    }
    
    public isReleaseSafe() {
        return this.release <= this.mapData.latestRelease();
    }

    public writeSchematic() {
        const writer = new BinaryWriter();
        SchematicWriter.writeSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
}