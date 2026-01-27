# terraria-minimap-visualizer
Typescript library for working with *Terraria* minimap (.map) files. Can read .map files then visualize them or convert them to [TEdit](https://github.com/TEdit/Terraria-Map-Editor) schematic files for importing into a proper Terraria world. Includes two primary classes: 
 - `WorldMap` - Base class. Reads .map files, then can serve basic information about the world or convert it to a TEdit schematic.
 - `WorldMapCanvas` - Derived class. Once .map file is read, can render the world map in an html canvas element with options for toggling layers (tiles, walls, liquids, air) and such.

## License
Licensed under the Microsoft Public License (MS-PL).

This project includes code derived from [TEdit](https://github.com/TEdit/Terraria-Map-Editor), licensed under the Microsoft Public License (MS-PL).
