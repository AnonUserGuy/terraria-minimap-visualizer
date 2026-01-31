import { Color } from "../net/color.js";
import { MapData } from "../data/map-data.js";
import { MapCell, MapCellGroup } from "./cell/map-cell.js";
import { MapCellPaintable } from "./cell/map-cell-paintable.js";
import { WorldMap } from "./world-map.js";

export class WorldMapCanvas extends WorldMap {

    public canvasLayers: OffscreenCanvas[];
    public canvasLighting: OffscreenCanvas;
    public canvasTilesPainted: OffscreenCanvas;
    public canvasTiles: OffscreenCanvas;
    public canvasWallsPainted: OffscreenCanvas;
    public canvasWalls: OffscreenCanvas;
    public canvasLiquids: OffscreenCanvas;
    public canvasAir: OffscreenCanvas;
    public canvasUnexplored: OffscreenCanvas;

    public canvasOutput: HTMLCanvasElement;

    private isDrawnAccurate: boolean;

    public static readonly layerNames = [
        "Lighting",
        "Tiles Painted",
        "Tiles",
        "Walls Painted",
        "Walls",
        "Liquids",
        "Air",
        "Unexplored/Explored"
    ]

    constructor(mapData: MapData | unknown, canvas: HTMLCanvasElement) {
        super(mapData, canvas.width, canvas.height);

        this.canvasOutput = canvas;
        this.isDrawnAccurate = false;

        this.canvasLayers = [];
        this.canvasLayers[0] = this.canvasLighting = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[1] = this.canvasTilesPainted = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[2] = this.canvasTiles = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[3] = this.canvasWallsPainted = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[4] = this.canvasWalls = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[5] = this.canvasLiquids = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[6] = this.canvasAir = new OffscreenCanvas(this._width, this._height);
        this.canvasLayers[7] = this.canvasUnexplored = new OffscreenCanvas(this._width, this._height);

        for (const canvas of this.canvasLayers) {
            canvas.getContext("2d")!.imageSmoothingEnabled = false;
        }
        this.canvasOutput.getContext("2d")!.imageSmoothingEnabled = false;
    }

    public updateDimensions() {
        super.updateDimensions();
        this.canvasLayers.forEach(canvas => {
            canvas.width = this._width;
            canvas.height = this._height;
        })
        this.canvasOutput.width = this._width;
        this.canvasOutput.height = this._height;
        this.isDrawnAccurate = false;
    }

    public async read(data: (Uint8Array | ArrayBuffer)) {
        await super.read(data);
        this.drawLayers();
    }

    public drawFast(layersActive: boolean[]) {
        const ctxOutput = this.canvasOutput.getContext("2d")!;
        ctxOutput.clearRect(0, 0, this._width, this._height);

        for (let i = this.canvasLayers.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                this.drawCanvasFast(ctxOutput, this.canvasLayers[i]);
            }
        }
        this.isDrawnAccurate = false;
    }

    private drawCanvasFast(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas) {
        try {
            ctx.drawImage(canvas, 0, 0);
        } catch (e: any) {
            if (e.message !== "CanvasRenderingContext2D.drawImage: Passed-in canvas is empty") {
                throw e;
            }
        }
    }

    public drawAccurate(layersActive: boolean[]) {
        if (this.isDrawnAccurate) return;

        const ctxOutput = this.canvasOutput.getContext("2d")!;
        ctxOutput.clearRect(0, 0, this._width, this._height);

        const layersOut: OffscreenCanvas[] = [];
        for (let i = this.canvasLayers.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                layersOut.push(this.canvasLayers[i]);
            }
        }
        
        this.drawCanvasesAccurate(ctxOutput, layersOut);
        this.isDrawnAccurate = true;
    }

    private drawCanvasesAccurate(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvases: OffscreenCanvas[]) {
        if (this._width <= 0 || this._height <= 0) return;

        const out = new ImageData(this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d")!;
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.blendImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }

    private drawLayers() {
        this.drawNormalLayers();
        this.drawLightingLayer();
        this.drawUnexploredLayer();
    }

    private drawNormalLayers() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width;) {
                const cell = this.cell(x, y);
                if (!cell) {
                    x++;
                    continue;
                }

                let x2 = x + 1;
                while (cell.equalsWithoutLight(this.cell(x2, y)) && x2 < this._width) {
                    x2++;
                }

                this.drawCells(x, y, x2 - x, 1, cell);
                x = x2;
            }
        }
    }

    public redrawAirLayer() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width;) {
                const cell = this.cell(x, y);
                if (!cell || cell.group !== MapCellGroup.Air) {
                    x++;
                    continue;
                }

                let x2 = x + 1;
                while (cell.equalsWithoutLight(this.cell(x2, y)) && x2 < this._width) {
                    x2++;
                }

                this.drawCells(x, y, x2 - x, 1, cell);
                x = x2;
            }
        }
    }

    private drawCells(x: number, y: number, width: number, height: number, cell: MapCell) {
        let color = this.color(x, y);
        let ctx: OffscreenCanvasRenderingContext2D;
        switch (cell.group) {
            case MapCellGroup.Air:
                ctx = this.canvasAir.getContext("2d")!;
                break;
            case MapCellGroup.Tile:
                ctx = this.canvasTiles.getContext("2d")!;
                if ((cell as MapCellPaintable).paint) {
                    const color2 = this.mapData.applyPaint(cell.group, color, (cell as MapCellPaintable).paint);
                    const ctx2 = this.canvasTilesPainted.getContext("2d")!;
                    this.drawColor(x, y, width, height, ctx2, color2);
                }
                break;
            case MapCellGroup.Wall:
                ctx = this.canvasWalls.getContext("2d")!;
                this.drawColor(x, y, width, height, ctx, color);
                if ((cell as MapCellPaintable).paint) {
                    const color2 = this.mapData.applyPaint(cell.group, color, (cell as MapCellPaintable).paint);
                    const ctx2 = this.canvasWallsPainted.getContext("2d")!;
                    this.drawColor(x, y, width, height, ctx2, color2);
                }
                break;
            case MapCellGroup.Liquid:
                ctx = this.canvasLiquids.getContext("2d")!;
                break;
        }
        this.drawColor(x, y, width, height, ctx, color);
    }

    private drawColor(x: number, y: number, width: number, height: number, ctx: OffscreenCanvasRenderingContext2D, color: Color) {
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, width, height);
    }

    private drawLightingLayer() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width;) {
                const cell = this.cell(x, y);
                if (!cell) {
                    x++;
                    continue;
                }

                let x2 = x + 1;
                let other = this.cell(x2, y);
                while (other && cell.light === other.light && x2 < this._width) {
                    x2++;
                    other = this.cell(x2, y);
                }

                this.drawLighting(x, y, x2 - x, 1, cell.light);
                x = x2;
            }
        }
    }

    private drawLighting(x: number, y: number, width: number, height: number, light: number) {
        const ctx3 = this.canvasLighting.getContext("2d")!;
        ctx3.globalAlpha = 1 - light / 255;
        ctx3.fillRect(x, y, width, height);
    }

    private drawUnexploredLayer() {
        const ctx = this.canvasUnexplored.getContext("2d")!;
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, this._width, this._height);

        const layersOpaque = [];
        for (let i = this.canvasLayers.length - 2; i >= 1; i--) {
            layersOpaque.push(this.canvasLayers[i]);
        }
        this.eraseCanvases(ctx, layersOpaque);

        ctx.globalCompositeOperation = "source-over";
    }

    private eraseCanvases(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvases: OffscreenCanvas[]) {
        const out = ctx.getImageData(0, 0, this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d")!;
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.eraseImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }

    private blendImageData(dst: ImageData, src: ImageData) {
        const d = dst.data;
        const s = src.data;

        for (let i = 0; i < d.length; i += 4) {
            const sa = s[i + 3];
            if (sa === 0) continue;

            const da = d[i + 3];

            const saNorm = sa / 255;
            const daNorm = da / 255;

            const outA = saNorm + daNorm * (1 - saNorm);

            if (outA === 0) {
                d[i + 3] = 0;
                continue;
            }

            const invOutA = 1 / outA;

            d[i] = ((s[i] * saNorm + d[i] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 1] = ((s[i + 1] * saNorm + d[i + 1] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 2] = ((s[i + 2] * saNorm + d[i + 2] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 3] = (outA * 255) | 0;
        }
    }

    private eraseImageData(dst: ImageData, src: ImageData) {
        const d = dst.data;
        const s = src.data;

        for (let i = 0; i < d.length; i += 4) {
            const sa = s[i + 3];
            if (sa !== 0) {
                d[i + 3] = 0;
            } 
        }
    }
}