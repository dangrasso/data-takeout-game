import { Cell, CellType, NeighbourCells } from './Cell';
import { Direction, GridCoordinates, CanvasCoordinates } from './core';

export class Maze {
  width: number;
  height: number;
  cellSize: number;
  cells: Cell[][] = [];

  constructor(layout: string, cellSize: number) {
    this.cellSize = cellSize;
    const lines = layout.split('\n').filter((line) => line);
    const rowsNum = lines.length;
    const colsNum = lines.length && lines[0].split('').filter((char) => char).length;

    this.height = rowsNum * this.cellSize;
    this.width = colsNum * this.cellSize;

    // build grid from layout
    lines.forEach((line, y) => line
      .split('')
      .filter((char) => char)
      .forEach((char, x) => {
        this.cells[x] = this.cells[x] || [];
        this.cells[x][y] = new Cell(
          char === ' ' ? CellType.OPEN : CellType.WALL,
          { x, y },
          this.cellSize
        );
      })
    );

    // set allowed directions
    this.forEachCell((cell) => {
      cell.neighbours = this.getNeighbours(cell.gridCoordinates);
      if (cell.neighbours.u && cell.neighbours.u.isOpen()) {
        cell.allowedDirs.push(Direction.u);
      }
      if (cell.neighbours.r && cell.neighbours.r.isOpen()) {
        cell.allowedDirs.push(Direction.r);
      }
      if (cell.neighbours.d && cell.neighbours.d.isOpen()) {
        cell.allowedDirs.push(Direction.d);
      }
      if (cell.neighbours.l && cell.neighbours.l.isOpen()) {
        cell.allowedDirs.push(Direction.l);
      }
    });

    // set next decision points
    this.forEachCell((cell) => {
      cell.nextDecisionPoints = [];
      cell.allowedDirs.forEach((dir) => {
        let scannedDistance = 1;
        let scannedCell = cell.neighbours[dir];
        let nextCell = scannedCell?.neighbours[dir];

        // straight to wall or fork
        while (nextCell?.isOpen()) {
          if (scannedCell?.isFork()) {
            break;
          }
          scannedDistance += 1;
          scannedCell = nextCell;
          nextCell = scannedCell.neighbours[dir];
        }

        if (!scannedCell || scannedCell.isDeadEnd()) {
          return;
        }

        cell.nextDecisionPoints.push({
          cell: scannedCell,
          distance: scannedDistance,
          direction: dir,
        });
      });
    });

    // calculate all maze distances between cells
    const openCells: Cell[] = [];
    this.forEachCell((cell) => {
      if (cell.isOpen()) {
        openCells.push(cell);
      }
    });
    openCells.forEach((src) => {
      openCells.forEach((dest) => {
        if (src === dest) {
          src.mazeDistanceMap.set(dest, 0);
          return;
        }

        const cachedDistance = dest.mazeDistanceMap.get(src);
        if (cachedDistance) {
          src.mazeDistanceMap.set(dest, cachedDistance);
          return;
        }

        // TODO extract to own function
        // unknown? crawl to find shortest path (BFS)
        const queue: DistanceTo[] = [{ distance: 0, to: src }];
        const visited: Cell[] = [];
        let subpath = queue.shift();
        let found = false;

        while (subpath) {
          const target = subpath.to;
          const distance = subpath.distance;

          // done condition
          if (target === dest) {
            src.mazeDistanceMap.set(dest, distance);
            found = true;
            break;
          }

          target.allowedDirs.forEach((dir) => {
            const neighbour = target.neighbours[dir];
            if (neighbour && !visited.includes(neighbour)) {
              queue.push({ distance: distance + 1, to: neighbour });
            }
          });

          visited.push(target);
          subpath = queue.shift();
        }

        if (!found) {
          src.mazeDistanceMap.set(dest, Infinity);
        }
      });
    });
  }

  get rows() {
    return this.height / this.cellSize;
  }

  get columns() {
    return this.width / this.cellSize;
  }

  get centerCell() {
    return this.getCellAt({ x: this.width / 2, y: this.height / 2 });
  }

  getNeighbours(gridCoordinates: GridCoordinates) {
    const neighbours: NeighbourCells = {};
    const maxCellX = this.columns - 1;
    const maxCellY = this.rows - 1;

    if (gridCoordinates.y > 0) {
      neighbours[Direction.u] = this.cells[gridCoordinates.x][gridCoordinates.y - 1];
    }
    if (gridCoordinates.x < maxCellX) {
      neighbours[Direction.r] = this.cells[gridCoordinates.x + 1][gridCoordinates.y];
    }
    if (gridCoordinates.y < maxCellY) {
      neighbours[Direction.d] = this.cells[gridCoordinates.x][gridCoordinates.y + 1];
    }
    if (gridCoordinates.x > 0) {
      neighbours[Direction.l] = this.cells[gridCoordinates.x - 1][gridCoordinates.y];
    }
    return neighbours;
  }

  getCellAt(canvasCoords: CanvasCoordinates) {
    return this.cells[Math.floor(canvasCoords.x / this.cellSize)][Math.floor(canvasCoords.y / this.cellSize)];
  }

  forEachCell(fn: (c: Cell) => void) {
    this.cells.forEach((row) => row.forEach((cell) => fn(cell)));
  }
}

export type DistanceTo = {distance: number; to: Cell};
