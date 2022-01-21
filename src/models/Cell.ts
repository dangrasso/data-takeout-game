import { GridCoordinates, CanvasCoordinates, Direction } from './core';
import { Character } from "./Character";

export class Cell {
  type: CellType;
  gridCoordinates: GridCoordinates;
  size: number;
  origin: CanvasCoordinates;
  center: CanvasCoordinates;
  top: number;
  bottom: number;
  left: number;
  right: number;
  neighbours: NeighbourCells = {};
  allowedDirs: Direction[] = [];
  nextDecisionPoints: DecisionPoint[] = [];
  mazeDistanceMap: Map<Cell, number> = new Map();

  constructor(type: CellType, gridCoordinates: GridCoordinates, size: number) {
    this.type = type;
    this.gridCoordinates = gridCoordinates;
    this.size = size;

    this.origin = {
      x: gridCoordinates.x * this.size,
      y: gridCoordinates.y * this.size,
    };

    this.center = {
      x: (gridCoordinates.x + 0.5) * this.size,
      y: (gridCoordinates.y + 0.5) * this.size,
    };

    this.top = this.origin.y;
    this.right = this.origin.x + this.size;
    this.bottom = this.origin.y + this.size;
    this.left = this.origin.x;
  }

  toString(): string {
    return `[${this.gridCoordinates.x},${this.gridCoordinates.y}]`;
  }

  isWall() {
    return this.type === CellType.WALL;
  }
  isOpen() {
    return this.type === CellType.OPEN;
  }
  isFork() {
    return this.allowedDirs.length > 2;
  }
  isDeadEnd() {
    return this.allowedDirs.length < 2;
  }

  pixelDistance(destination: Cell | Character) {
    return Math.sqrt(
      Math.pow(this.center.x - destination.center.x, 2) +
      Math.pow(this.center.y - destination.center.y, 2)
    );
  }

  straightDistance(destination: Cell) {
    return Math.sqrt(
      Math.pow(this.gridCoordinates.x - destination.gridCoordinates.x, 2) +
      Math.pow(this.gridCoordinates.y - destination.gridCoordinates.y, 2)
    );
  }

  manhattanDistance(destination: Cell) {
    return (
      Math.abs(this.gridCoordinates.x - destination.gridCoordinates.x) +
      Math.abs(this.gridCoordinates.y - destination.gridCoordinates.y)
    );
  }

  mazeDistance(destination: Cell) {
    return this.mazeDistanceMap.get(destination) || NaN;
  }

  get width() {
    return this.size;
  }
  get height() {
    return this.size;
  }
}

export enum CellType {
  WALL,
  OPEN,
}

export type DecisionPoint = {
  cell: Cell;
  distance: number;
  direction: Direction;
};

export type NeighbourCells = {[D in Direction]?: Cell};
