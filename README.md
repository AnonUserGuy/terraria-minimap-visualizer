# terraria-minimap-visualizer
Typescript library for working with *Terraria* minimap (.map) files. Can read .map files then visualize them or convert them to [TEdit](https://github.com/TEdit/Terraria-Map-Editor) schematic files for importing into a proper Terraria world. Includes two primary classes: 
 - `WorldMap` - Base class. Reads .map files, then can serve basic information about the minimap or convert it to a TEdit schematic.
 - `WorldMapCanvas` - Derived class. Once .map file is read, can render the world map in an HTML canvas element with options for toggling layers (tiles, walls, liquids, air) and such.

## Installation
### npm (Bundlers / Node)
``` bash
npm install terraria-minimap-visualizer
```
Then import as such:
``` js
import { MapData, WorldMap, WorldMapCanvas } from "terraria-minimap-visualizer";
```
### Browsers 
#### Module
``` js
import { MapData, WorldMap, WorldMapCanvas } from "https://unpkg.com/terraria-minimap-visualizer@0.1.0/dist/browser/index.min.js";
```
#### Non-module Script Tag
``` html
<script src="https://unpkg.com/terraria-minimap-visualizer@0.1.0/dist/browser/global.min.js"></script>
```
Then initialize objects as such:
``` js
var worldMap = new terrariaMinimapVisualizer.WorldMap( /* ... */ );
```

## Usage 
### MapData
While not necessary to read the .map file, you will need to provide some external data in order to properly visualize it or convert it to a TEdit schematic. The `MapData` object contains all the colors for tiles, walls, liquids, and air, along with other important information needed to convert to a TEdit schematic. The relevant external data in JSON format can be produced using [terraria-minimap-data](https://github.com/AnonUserGuy/terraria-minimap-data).

With the JSON file parsed as `MapDataJSON`, a `MapData` object can be initialized as follows:
``` js
const mapData = new MapData(MapDataJSON);
const worldMap = new WorldMap(MapData);
```
`MapDataJSON` can also be passed to a `WorldMap` initializer directly, which will produce its own seperate `MapData` object internally. This is probably the prefered method to initialize a `WorldMap` object unless you have multiple `WorldMap` objects.
``` js
const worldMap = new WorldMap(MapDataJSON);
```
### WorldMap
The `WorldMap` object is used to read .map files, store information about the minimap from the .map file, and possibly convert said file to a TEdit schematic file. 

A `WorldMap` can be initialized with either a `MapData` object or the JSON parsed `MapDataJSON` object.
``` js
const worldMap = new WorldMap(MapDataJSON);
```
`read` is used to read the .map file. It accepts the file as an array buffer.
``` js
worldMap.read(mapFileBuffer);
```
With the map file read, some information about the minimap file can be accessed.
``` js
worldMap.width // width of world
worldMap.height // height of world

worldMap.worldName // name of world
worldMap.worldId // id of world
worldMap.release // release number of game the minimap was produced in
worldMap.version // human readable version string of game the minimap was produced in
worldMap.revision // file revision count, AKA how many times the file was saved
worldMap.isChinese // whether or not the file comes from a Chinese version of Terraria

worldMap.worldSurface // y-coordinate of where the surface layer ends and the underground layer begins
worldMap.worldSurfaceEstimated // boolean indicating if worldSurface had to be estimated
// worldSurface is important for rendering the map, but isn't directly stored in the map.
// Sometimes it can be determined by the geometry of the map cells. However, if not it must be
// estimated based on the height of the world.

worldMap.cavernLayer // y-coordinate of where the underground layer ends and the cavern layer begins
worldMap.cavernLayerEstimated // boolean indicating if cavernLayer had to be estimated
// cavernLayer is also important to rendering the map, but unlike worldSurface can never be
// determined just from the information in the map file. cavernLayerEstimated will always be
// true after using read.

worldMap.underworldLayer // y-coordinate of where the cavern layer ends and the underworld layer begins
// is also important for rendering the map. Doesn't need estimated as is always determined
// as a function of world height. As such, it cannot be reassigned.
```

The actual contents of the map, referred to here as cells, can be accessed using the `cell` function. A `MapCell` object is returned.
``` js
const mapCell = worldMap.cell(x, y);
```
The color of any cell can be obtained using `color`. A 3-element number array is returned containing the rgb color values ranging from 0-255.
``` js
const color = worldMap.color(x, y); // [0~255, 0~255, 0~255]
```
If a cell is a tile or wall and has been painted, the color of the cell painted can be obtained using `colorPainted`. Unpainted cells will return the same value as `color`.
``` js
const colorPainted = worldMap.colorPainted(x, y);
```
A text description of any cell can be obtained using `getString`.
``` js
console.log(worldMap.getString(x, y));
```

The minimap can be converted to a TEdit schematic using `writeSchematic`. It is provided as an array buffer that can then be written to a `.TEditSch` file for use in TEdit.
``` js
const schematicArrayBuffer = worldMap.writeSchematic();
```

### WorldMapCanvas
`WorldMapCanvas` is a subclass of `WorldMap`, and as such is capable of everything it can do while also providing functionality to render the minimap into an HTML canvas element.

A `WorldMapCanvas` object is also initialized with either a `MapData` object or the JSON parsed `MapDataJSON` object, plus with an `HTMLCanvasElement` to render into.
``` html
<canvas width="0px" height="0px" id="canvas"></canvas>
```
``` js
const canvas = document.getElementById("canvas");
const worldMapCanvas = new WorldMapCanvas(mapDataJSON, canvas);
```
Whenever the map is read, a handful of internal layers, seperated by cell type, are rendered. The layers contain the following:
<ol start="0">
 <li>Lighting</li>
 <li>Tiles (only painted)</li>
 <li>Tiles (unpainted + painted without paint)</li>
 <li>Walls (only painted)</li>
 <li>Walls (unpainted + painted without paint)</li>
 <li>Liquids</li>
 <li>Air</li>
 <li>Unexplored as black</li>
</ol>

The minimap can be rendered into the HTML canvas element with either `drawFast` or `drawAccurate`:
- `drawFast` uses some compositing techniques that cause a bit blur to occur in the output image.
- `drawAccurate` avoids said blur, but also takas a bit longer.

Both `drawFast` and `drawAccurate` take the same parameter, a boolean array indicating which layers to draw into the canvas. Empty regions will be made transparent.
``` js
worldMapCanvas.read(mapFileBuffer);
worldMapCanvas.drawFast([0, 1, 1, 1, 1, 1, 1, 0]); // renders fast all layers except lighting and unexplored
worldMapCanvas.drawAccurate([0, 1, 1, 0, 0, 0, 0, 0]); // renders accurate only tiles, unpainted and painted
```

The color of air depends on the values of `worldSurface` and `cavernLayer`. The air layer isn't automatically rerendered when these are reassigned. Instead, it must be done with `redrawAirLayer`. 
``` js
worldMapCanvas.read(mapFileBuffer);
worldMapCanvas.cavernLayer = 600;
worldMapCanvas.redrawAirLayer();
worldMapCanvas.drawFast([0, 0, 0, 0, 0, 0, 1, 0]); // render just the redrawn air layer
```

### MapCell
The world map is made up of a grid of `MapCell`s, obtained using `cell` on a `WorldMap` object. It has two derived classes: `MapCellPaintable` and `MapAir`.
``` js
const mapCell = worldMap.cell(x, y);
```
Every map cell contains the following properties:
``` js
mapCell.light // Light level for cell, ranging from 0~255
mapCell.group // Enum for what kind of cell it is. Can be 0 = empty, 1 = tile, 2 = wall, 3 = liquid, 4 = air
mapCell.id // Numeric ID for cell. For a tile/wall/liquid, this corresponds to the Terraria internal ID for the cell type
```

`copy` can be used to make a unique copy of the cell. 
``` js
const mapCellCopy = mapCell.copy();
```

`copyWithLight` can be used to make a unique copy of the cell, but with the new level having a different light level. 
``` js
const mapCellDark = mapCell.copyWithLight(0);
const mapCellBright = mapCell.copyWithLight(255);
```

`equals` can be used to test if two cells are identical (same group, light level, ID, etc.)
``` js
mapCell.equals(mapCellCopy); // true
mapCell.equals(mapCellDark); // false
```

`equalsWithoutLight` can be used to test if two cells are identical, disregarding their light levels
``` js
mapCell.equalsWithoutLight(mapCellCopy); // true
mapCell.equalsWithoutLight(mapCellDark); // true
```

`equalsAfterExport` can be used to test if two cells will be identical when exporting to a TEdit schematic. For most cell groups, this is the same as `equalsWithoutLight`.
``` js
mapCell.equalsWithoutLight(mapCellCopy); // true
mapCell.equalsWithoutLight(mapCellDark); // true
```

### MapCellPaintable
`MapCellPaintable` is a subclass of `MapCell`, describing specifically tiles and walls. Tiles and walls both have a `paint` property which describes what paint the cell has as a Terraria internal paint ID. 

They also have another property, `option`, which is a little more complicated. Some tiles/walls in Terraria with the same ID will take on different colors depending on various factors. Examples include:
- A sunflower's head is displayed as yellow but its stem is displayed as green.
- Chests will display a color depending on what type of chest they are. For example, wooden chests are brown but ice chests are bright blue.

 The `option` property is used to describe what color variation to use in these circumstances.

 ### MapAir
 `MapAir` is a subclass of `MapCell`, describing air on the map. Air within a proper Terraria .wld file doesn't have any sort of ID. However, within minimaps, it does have an ID used to describe what color underground air should be, which depends on what biome it appears in. Most underground air is brown/grey depending on depth, while underground air in the ice biome takes on a light blue tint.
 
 `MapAir` doesn't come with any new properties or methods, but the `equalsAfterExport` method is notably modified to ignore air's ID as that only affects minimap display.

 
## Building
### Prerequisites
- Node.js (v18+ recommended)
- npm

### Install dependencies
```bash
npm install
```
### Build typescript files
```bash
npm run build
``` 
Output module will be generated at `./dist/node/`.

## License
Licensed under the Microsoft Public License (MS-PL).

This project includes code derived from [TEdit](https://github.com/TEdit/Terraria-Map-Editor), licensed under the Microsoft Public License (MS-PL).
