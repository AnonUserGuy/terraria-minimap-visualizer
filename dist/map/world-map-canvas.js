import { MapCellGroup } from "./cell/map-cell.js";
import { WorldMap } from "./world-map.js";
export class WorldMapCanvas extends WorldMap {
    constructor(mapData, canvas) {
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
            canvas.getContext("2d").imageSmoothingEnabled = false;
        }
        this.canvasOutput.getContext("2d").imageSmoothingEnabled = false;
    }
    updateDimensions() {
        super.updateDimensions();
        this.canvasLayers.forEach(canvas => {
            canvas.width = this._width;
            canvas.height = this._height;
        });
        this.canvasOutput.width = this._width;
        this.canvasOutput.height = this._height;
        this.isDrawnAccurate = false;
    }
    async read(data) {
        await super.read(data);
        this.drawLayers();
    }
    drawFast(layersActive) {
        const ctxOutput = this.canvasOutput.getContext("2d");
        ctxOutput.clearRect(0, 0, this._width, this._height);
        for (let i = this.canvasLayers.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                this.drawCanvasFast(ctxOutput, this.canvasLayers[i]);
            }
        }
        this.isDrawnAccurate = false;
    }
    drawCanvasFast(ctx, canvas) {
        try {
            ctx.drawImage(canvas, 0, 0);
        }
        catch (e) {
            if (e.message !== "CanvasRenderingContext2D.drawImage: Passed-in canvas is empty") {
                throw e;
            }
        }
    }
    drawAccurate(layersActive) {
        if (this.isDrawnAccurate)
            return;
        const ctxOutput = this.canvasOutput.getContext("2d");
        ctxOutput.clearRect(0, 0, this._width, this._height);
        const layersOut = [];
        for (let i = this.canvasLayers.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                layersOut.push(this.canvasLayers[i]);
            }
        }
        this.drawCanvasesAccurate(ctxOutput, layersOut);
        this.isDrawnAccurate = true;
    }
    drawCanvasesAccurate(ctx, canvases) {
        if (this._width <= 0 || this._height <= 0)
            return;
        const out = new ImageData(this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d");
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.blendImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }
    drawLayers() {
        this.drawNormalLayers();
        this.drawLightingLayer();
        this.drawUnexploredLayer();
    }
    drawNormalLayers() {
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
    redrawAirLayer() {
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
    drawCells(x, y, width, height, cell) {
        let color = this.color(x, y);
        let ctx;
        switch (cell.group) {
            case MapCellGroup.Air:
                ctx = this.canvasAir.getContext("2d");
                break;
            case MapCellGroup.Tile:
                ctx = this.canvasTiles.getContext("2d");
                if (cell.paint) {
                    const color2 = this.mapData.applyPaint(cell.group, color, cell.paint);
                    const ctx2 = this.canvasTilesPainted.getContext("2d");
                    this.drawColor(x, y, width, height, ctx2, color2);
                }
                break;
            case MapCellGroup.Wall:
                ctx = this.canvasWalls.getContext("2d");
                this.drawColor(x, y, width, height, ctx, color);
                if (cell.paint) {
                    const color2 = this.mapData.applyPaint(cell.group, color, cell.paint);
                    const ctx2 = this.canvasWallsPainted.getContext("2d");
                    this.drawColor(x, y, width, height, ctx2, color2);
                }
                break;
            case MapCellGroup.Liquid:
                ctx = this.canvasLiquids.getContext("2d");
                break;
        }
        this.drawColor(x, y, width, height, ctx, color);
    }
    drawColor(x, y, width, height, ctx, color) {
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, width, height);
    }
    drawLightingLayer() {
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
    drawLighting(x, y, width, height, light) {
        const ctx3 = this.canvasLighting.getContext("2d");
        ctx3.globalAlpha = 1 - light / 255;
        ctx3.fillRect(x, y, width, height);
    }
    drawUnexploredLayer() {
        const ctx = this.canvasUnexplored.getContext("2d");
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, this._width, this._height);
        const layersOpaque = [];
        for (let i = this.canvasLayers.length - 2; i >= 1; i--) {
            layersOpaque.push(this.canvasLayers[i]);
        }
        this.eraseCanvases(ctx, layersOpaque);
        ctx.globalCompositeOperation = "source-over";
    }
    eraseCanvases(ctx, canvases) {
        const out = ctx.getImageData(0, 0, this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d");
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.eraseImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }
    blendImageData(dst, src) {
        const d = dst.data;
        const s = src.data;
        for (let i = 0; i < d.length; i += 4) {
            const sa = s[i + 3];
            if (sa === 0)
                continue;
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
    eraseImageData(dst, src) {
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
WorldMapCanvas.layerNames = [
    "Lighting",
    "Tiles Painted",
    "Tiles",
    "Walls Painted",
    "Walls",
    "Liquids",
    "Air",
    "Unexplored/Explored"
];
