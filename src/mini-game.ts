import {LitElement, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';

const enum Direction {
  u = 'u',
  r = 'r',
  d = 'd',
  l = 'l',
}

enum CellType {
  WALL,
  OPEN,
}

enum GameScreen {
  LOADING,
  START,
  TUTORIAL,
  IN_GAME,
  PAUSE,
  VICTORY,
  GAME_OVER,
}

type CanvasCoordinates = { x: number; y: number };
type GridCoordinates = { x: number; y: number };
type DecisionPoint = {
  cell: Cell;
  distance: number;
  direction: Direction;
};

type NeighbourCells = { [D in Direction]?: Cell };

type DistanceTo = { distance: number, to: Cell }

type Sprite = {
  image: HTMLImageElement;
  frames: number;
  directional: boolean;
  pauseOnIdle: boolean;
};

const orientationToSpriteRow = {
  [Direction.u]: 0,
  [Direction.r]: 1,
  [Direction.d]: 2,
  [Direction.l]: 3,
};

const TICKS_PER_FRAME = 10;
const CELL_SIZE = 30;
const ASCII_MAZE_LAYOUT = `
+-------------------+
|                   |
| ##### ##### ##### |
|     # #   # #     |
| ### # # # # # ### |
|   #     #     #   |
|## # # ##### # # ##|
|     #       #     |
| # ### ## ## ### # |
| #   # #   # #   # |
| ###           ### |
|     # #   # #     |
| # ### ## ## ### # |
| #               # |
| #### ## # ## #### |
|       # # #       |
| # ### # # # ### # |
| #   #   #   #   # |
| ### # ##### # ### |
|                   |
+-------------------+
`;

let _debug = false;
function debugLog(msg: string, ...args: any) {
  if (_debug) {
    console.log(msg, ...args);
  }
}

function makeImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

async function promiseLoadedImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

class Cell {
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

class Maze {
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
    lines.forEach((line, y) =>
      line
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

        const cachedDistance = dest.mazeDistanceMap.get(src)
        if (cachedDistance) {
          src.mazeDistanceMap.set(dest, cachedDistance);
          return;
        }

        // TODO extract to own function
        // unknown? crawl to find shortest path (BFS)
        const queue: DistanceTo[] = [{ distance: 0, to: src }]
        const visited: Cell[] = [];
        let subpath = queue.shift();
        let found = false;

        while (subpath) {
          const target = subpath.to
          const distance = subpath.distance
          
          // done condition
          if (target === dest) {
            src.mazeDistanceMap.set(dest, distance);
            found = true;
            break;
          }

          target.allowedDirs.forEach((dir) => {
            const neighbour = target.neighbours[dir]
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
    return this.cells[Math.floor(canvasCoords.x / this.cellSize)][
      Math.floor(canvasCoords.y / this.cellSize)
    ];
  }

  forEachCell(fn: (c: Cell) => void) {
    this.cells.forEach((row) => row.forEach((cell) => fn(cell)));
  }
}

class Character {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velX: number = 0;
  velY: number = 0;
  speed: number;
  sprite: Sprite;
  spriteFrameIndex: number = 0;
  target?: Cell;
  targetDir: Direction | null = null;
  canFly: boolean;
  private _orientation: Direction = Direction.d;

  constructor(
    id: string,
    coords: CanvasCoordinates,
    sprite: Sprite,
    speed: number,
    width: number,
    height: number,
    canFly: boolean = false
  ) {
    this.id = id;
    this.x = coords.x;
    this.y = coords.y;
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.canFly = canFly;
  }

  get center(): CanvasCoordinates {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
  set center(coords: CanvasCoordinates) {
    this.x = coords.x - this.width / 2;
    this.y = coords.y - this.height / 2;
  }

  get top(): number {
    return this.y;
  }
  set top(y) {
    this.y = y;
  }

  get right(): number {
    return this.x + this.width;
  }
  set right(x) {
    this.x = x - this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }
  set bottom(y) {
    this.y = y - this.height;
  }

  get left(): number {
    return this.x;
  }
  set left(x) {
    this.x = x;
  }

  isMoving(): boolean {
    return !!this.velX || !!this.velY;
  }

  /**
   * Note: in case of perfect diagonal movement, this will pick the horizontal component
   * @returns {Direction}
   */
  get movingDirection(): Direction | null {
    if (!this.isMoving()) {
      return null;
    }
    if (Math.abs(this.velY) > Math.abs(this.velX)) {
      return this.velY > 0 ? Direction.d : Direction.u;
    } else {
      return this.velX > 0 ? Direction.r : Direction.l;
    }
  }

  collidesWith(other: Character | Cell) {
    return (
      Math.abs(this.center.x - other.center.x) < (this.width + other.width) / 2 &&
      Math.abs(this.center.y - other.center.y) < (this.height + other.height) / 2
    );
  }

  move(dir: Direction, speed: number = this.speed) {
    this.velX = dir === Direction.l ? -speed : dir === Direction.r ? speed : 0;
    this.velY = dir === Direction.u ? -speed : dir === Direction.d ? speed : 0;
  }

  get orientation() {
    this._orientation = this.movingDirection || this._orientation;
    return this._orientation;
  }
}

class Game {
  maze!: Maze;
  player!: Character;
  preys: Character[] = [];
  hunters: Character[] = [];
  totalPreys: number = 0;
  gamesPlayed: number = 0;

  // internal
  private canvas: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D;
  private _screen?: GameScreen;
  private keys: boolean[] = [];

  // images
  private startScreenImg!: HTMLImageElement;
  private tutorialScreenImg!: HTMLImageElement;
  private pauseScreenImg!: HTMLImageElement;
  private gameOverScreenImg!: HTMLImageElement;
  private victoryScreenImg!: HTMLImageElement;
  // TODO: also preload character sprites

  // hooks
  private onTick: (points: number, totalPoints: number, elapsedSeconds: number) => void;

  // game loop controls
  private initialized: boolean = false;
  private looping: boolean = true;
  private nextAnimationFrameRequest!: number;
  private tickSinceLastFrame!: number;
  private frameIndex!: number;
  private startedSince: number | null = null;
  private pausedSince: number | null = null;
  private overSince: number | null = null;
  private durationPaused: number = 0;

  constructor(canvas: HTMLCanvasElement, onTick: (points: number, totalPoints: number, elapsedSeconds: number) => void) {
    this.onTick = onTick;
    this.canvas = canvas;
  }

  get playTime() {
    if (!this.startedSince) {
      return 0
    }

    return (
      (this.overSince || this.pausedSince || Date.now()) - this.startedSince - this.durationPaused
    );
  }

  get screen(): GameScreen {
    return this._screen || GameScreen.LOADING;
  }
  set screen(newScreen: GameScreen) {
    if (newScreen === this.screen) {
      return; // do nothing if it didn't change
    }
    this._screen = newScreen;

    if ([GameScreen.LOADING, GameScreen.IN_GAME].includes(newScreen)) {
      return;
    } else if (newScreen === GameScreen.START) {
      this.ctx.drawImage(this.startScreenImg, 0, 0, this.maze.width, this.maze.height);
    } else if (newScreen === GameScreen.TUTORIAL) {
      this.ctx.drawImage(this.tutorialScreenImg, 0, 0, this.maze.width, this.maze.height);
    } else if (newScreen === GameScreen.PAUSE) {
      this.ctx.drawImage(this.pauseScreenImg, 0, 0, this.maze.width, this.maze.height);
    } else if (newScreen === GameScreen.GAME_OVER) {
      this.ctx.drawImage(this.gameOverScreenImg, 0, 0, this.maze.width, this.maze.height);
    } else if (newScreen === GameScreen.VICTORY) {
      this.ctx.drawImage(this.victoryScreenImg, 0, 0, this.maze.width, this.maze.height);
    }
  }

  async init() {
    this.maze = new Maze(ASCII_MAZE_LAYOUT, CELL_SIZE);
    this.keys = [];
    this.canvas.width = this.maze.width;
    this.canvas.height = this.maze.height;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    // this.ctx.fillStyle = '#f8ca35';
    // this.ctx.fillRect(0, 0, this.maze.width, this.maze.height);
    // this.ctx.strokeStyle = 'red'
    // this.ctx.strokeStyle
    // this.ctx.strokeText("Loading...", this.maze.width / 2, this.maze.height / 2)

    document.body.addEventListener('keydown', (e) => {
      if (e.repeat) {
        return;
      }
      if (
        ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'w', 'a', 's', 'd'].indexOf(e.key) > -1
      ) {
        this.keys[e.keyCode] = true;
      }
      // DEBUG (m)ode => activate
      if (e.key === 'm') {
        _debug = true
        console.log('DEBUG (m)ode: on')
        debugLog("Logger: that's right!")
      }
    });

    document.body.addEventListener('keyup', (e) => {
      this.keys[e.keyCode] = false;
      if (e.key === 'p') {
        this.togglePausedScreen();
      }
      if (e.key === 'r') {
        this.restart();
      }
      if (e.key === ' ') {
        this.nextScreen();
      }
      if (e.key === 'v') {
        this.gameWon();
      }

      // DEBUG (m)ode => deactivate
      if (e.key === 'm') {
        _debug = false
        console.log('DEBUG (m)ode: off')
      }
      // DEBUG print full game status
      if (e.key === 'g') {
        console.log('==========GAME STATUS==========', this);
        (window as any).gameStatus = this;
      }
    });

    
    // Preload all images for smoother transitions
    Promise.all([
      promiseLoadedImage('/img/screen-start.png'),
      promiseLoadedImage('/img/screen-tutorial.png'),
      promiseLoadedImage('/img/screen-pause.png'),
      promiseLoadedImage('/img/screen-game-over.png'),
      promiseLoadedImage('/img/screen-victory.png'),
    ]).then(([startImg, tutorialImg, pauseImg, gameOverImg, victoryImg]) => {
      this.startScreenImg = startImg;
      this.tutorialScreenImg = tutorialImg;
      this.pauseScreenImg = pauseImg;
      this.gameOverScreenImg = gameOverImg;
      this.victoryScreenImg = victoryImg;
      this.screen = GameScreen.START;
    });

    this.initialized = true;
  }

  nextScreen() {
    if (this.screen === GameScreen.START) {
      this.screen = GameScreen.TUTORIAL;
    } else if (this.screen === GameScreen.TUTORIAL) {
      this.start();
    } else if ([GameScreen.GAME_OVER, GameScreen.VICTORY].includes(this.screen)) {
      this.restart();
    }
  }

  start() {
    if (!this.initialized) {
      this.init();
    }
    this.screen = GameScreen.IN_GAME;
    this.gamesPlayed += 1;
    this.tickSinceLastFrame = 0;
    this.frameIndex = 0;

    const playerSpriteImg = makeImage('/img/privacy_dev_walking.png');
    const playerSprite: Sprite = {
      image: playerSpriteImg,
      frames: 4,
      directional: true,
      pauseOnIdle: true,
    };
    this.player = new Character(
      `g${this.gamesPlayed}-player`,
      this.maze.centerCell.origin,
      playerSprite,
      3,
      15,
      30
    );

    const preySpriteImg = makeImage('/img/data.png');
    const preySprite: Sprite = {
      image: preySpriteImg,
      frames: 7,
      directional: false,
      pauseOnIdle: false,
    };
    const preySize = this.maze.cellSize;

    const startingPositions = Array.from(this.maze.centerCell.mazeDistanceMap)
      .filter(([,distance]) => distance > 3)
      .map(([cell]) => cell);

    this.totalPreys = 12;
    this.preys = [];
    for (let i = 0; i < this.totalPreys; i++) {
      this.preys.push(
        new Character(
          `g${this.gamesPlayed}-prey-${i}`,
          startingPositions[Math.floor(Math.random() * startingPositions.length)].origin,
          preySprite,
          3,
          preySize,
          preySize
        )
      );
    }

    const hunterSpriteImg = makeImage('/img/authority.png');
    const hunterSprite: Sprite = {
      image: hunterSpriteImg,
      frames: 4,
      directional: true,
      pauseOnIdle: false,
    };
    const hunterSize = this.maze.cellSize * 2;

    this.hunters = [];
    for (let i = 0; i < 2; i++) {
      this.hunters.push(
        new Character(
          `g${this.gamesPlayed}-hunter-${i}`,
          startingPositions[Math.floor(Math.random() * startingPositions.length)].origin,
          hunterSprite,
          0.5,
          hunterSize,
          hunterSize,
          true
        )
      );
    }

    this.startedSince = Date.now();
    this.overSince = null;
    this.pausedSince = null;
    this.looping = true;
    this.durationPaused = 0;

    this.tick();
  }

  preventNextTick() {
    if (this.nextAnimationFrameRequest) {
      cancelAnimationFrame(this.nextAnimationFrameRequest);
    }
  }

  restart() {
    if (
      ![GameScreen.IN_GAME, GameScreen.PAUSE, GameScreen.GAME_OVER, GameScreen.VICTORY].includes(
        this.screen
      )
    ) {
      return;
    }
    this.preventNextTick();
    this.start();
  }

  togglePausedScreen() {
    if (this.screen === GameScreen.IN_GAME) {
      this.screen = GameScreen.PAUSE;
      this.looping = false;
      this.preventNextTick();
      this.pausedSince = Date.now();
    } else if (this.screen === GameScreen.PAUSE) {
      if (this.pausedSince) {
        this.durationPaused += Date.now() - this.pausedSince;
      }
      this.screen = GameScreen.IN_GAME;
      this.looping = true;
      this.pausedSince = null;
      this.tick();
    }
  }

  gameWon() {
    this.looping = false;
    this.overSince = Date.now();
    this.screen = GameScreen.VICTORY;
    this.preventNextTick();
  }

  gameLost() {
    this.looping = false;
    this.overSince = Date.now();
    this.screen = GameScreen.GAME_OVER;
    this.preventNextTick();
  }

  private tick() {
    if (!this.looping) {
      return;
    }
    this.nextAnimationFrameRequest = requestAnimationFrame(() => this.tick());

    this.tickSinceLastFrame += 1;
    if (this.tickSinceLastFrame > TICKS_PER_FRAME) {
      this.tickSinceLastFrame = 0;
      this.frameIndex += 1;
    }

    // Set player velocity
    this.setPlayerIntent(this.player);
    this.applyFriction(this.player);

    // Move preys
    this.preys.forEach(prey => {
      this.setPreyIntent(prey, this.player, this.maze);
      // this.applyFriction(prey);
      this.updatePosition(prey, this.maze);
    });

    // Move hunters
    this.hunters.forEach((hunter) => {
      this.setHunterIntent(hunter, this.player, this.maze);
      // this.applyFriction(hunter);
      this.updatePosition(hunter, this.maze);
    });

    // Move player
    this.updatePosition(this.player, this.maze);

    // Check for prey caught
    this.preys = this.preys.filter((prey) => !prey.collidesWith(this.player)); // adieu!

    // Draw current game frame
    this.draw(this.ctx, this.maze, this.player, this.preys, this.hunters);

    // Check for end game
    if (!this.preys.length) {
      this.gameWon();
    } else if (this.hunters.some((hunter) => hunter.collidesWith(this.player))) {
      this.gameLost();
    }

    // call hooks
    if (typeof this.onTick === 'function') {
      this.onTick.call(
        null,
        this.totalPreys - this.preys.length,
        this.totalPreys,
        Math.floor(this.playTime / 1000)
      );
    }
  }

  private draw(
    ctx: CanvasRenderingContext2D,
    maze: Maze,
    player: Character,
    preys: Character[],
    hunters: Character[]
  ) {
    ctx.clearRect(0, 0, maze.width, maze.height);

    // draw floor
    ctx.fillStyle = this.floorColor();
    ctx.fillRect(0, 0, maze.width, maze.height);
    const currentCell = maze.getCellAt(player.center);

    if (_debug) {
      // DEBUG: print next decision points from player
      ctx.fillStyle = 'darkorange';
      currentCell.nextDecisionPoints.forEach(decisionPoint => {
        ctx.fillRect(decisionPoint.cell.origin.x, decisionPoint.cell.origin.y, maze.cellSize, maze.cellSize);
      });
    }

    // draw walls
    ctx.fillStyle = this.wallColor();
    maze.forEachCell((cell) => {
      if (cell.isWall()) {
        ctx.fillRect(cell.origin.x, cell.origin.y, maze.cellSize, maze.cellSize);
      }

      if (_debug) {
        // DEBUG: print maze distance from player
        if (cell.isOpen()) {
          ctx.fillText(
            Math.floor(cell.mazeDistance(currentCell)).toString(),
            cell.origin.x,
            cell.center.y,
            cell.width,
          );
        }
      }
      
    });

    if (_debug) {
      // DEBUG: draw player neighbouring cells
      Object.values(currentCell.neighbours).forEach(n => {
        ctx.strokeStyle = n.isWall() ? 'red' : 'lime';
        ctx.strokeRect(n.origin.x, n.origin.y, maze.cellSize, maze.cellSize);
      });

      // DEBUG: draw player cell
      ctx.strokeStyle = 'orange';
      ctx.strokeRect(currentCell.origin.x, currentCell.origin.y, maze.cellSize, maze.cellSize);

      // DEBUG: draw player bounding box
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(player.x, player.y, player.width, player.height);
    }

    // draw sprites
    [player].concat(preys, hunters).forEach((character: Character) => {
      if (!character.sprite.pauseOnIdle || character.isMoving()) {
        character.spriteFrameIndex = this.frameIndex % character.sprite.frames;
      }

      const frameW = character.sprite.image.naturalWidth / character.sprite.frames;
      const frameH = character.sprite.directional
        ? character.sprite.image.naturalHeight / 4
        : character.sprite.image.naturalHeight;

      ctx.drawImage(
        character.sprite.image,
        frameW * character.spriteFrameIndex,
        !character.sprite.directional ? 0 : frameH * orientationToSpriteRow[character.orientation],
        frameW,
        frameH,
        character.center.x - frameW / 2,
        character.bottom - frameH,
        frameW,
        frameH
      );

      if (_debug) {
        // DEBUG draw character id
        ctx.strokeStyle = 'red';
        ctx.strokeText(character.id, character.left, character.top - 5);

        // DEBUG draw character distance from target
        if (character.target) {
          // ctx.strokeStyle = 'gray';
          // ctx.strokeText(`${Math.floor(character.target.pixelDistance(character))}` , character.right + 2, character.center.y, character.width);
          ctx.strokeStyle = 'gold';
          ctx.beginPath();
          ctx.moveTo(character.center.x, character.center.y);
          ctx.lineTo(character.target.center.x, character.target.center.y);
          ctx.stroke();
        }
      }
    });
  }

  private wallColor(): string | CanvasGradient | CanvasPattern {
    return _debug? 'gray' : '#b31d25';
  }

  private floorColor(): string | CanvasGradient | CanvasPattern {
    return _debug? 'white' : '#f8ca35';
  }

  /**
   * Checks collisions and sets new position and velocity accordingly
   * @param {Character} character
   * @param {Maze} maze
   */
  private updatePosition(character: Character, maze: Maze) {
    if (!character.isMoving() || !character.movingDirection) {
      return;
    }
    const previousCell = maze.getCellAt(character.center);
    character.x += character.velX;
    character.y += character.velY;

    if (character.canFly) {
      return;
    }

    const movingDirection = character.movingDirection;

    // if new cell is wall, block movement and bring back on the main axis
    if (maze.getCellAt(character.center).isWall()) {
      if (movingDirection === Direction.u) {
        character.top = previousCell.top;
        character.velY = 0;
      } else if (movingDirection === Direction.r) {
        character.right = previousCell.right;
        character.velX = 0;
      } else if (movingDirection === Direction.d) {
        character.bottom = previousCell.bottom;
        character.velY = 0;
      } else if (movingDirection === Direction.l) {
        character.left = previousCell.left;
        character.velX = 0;
      }
    }

    // even if not wall, if new position crosses a wall on any of the axes, align character
    const expectedCell = maze.getCellAt(character.center);
    Object.keys(expectedCell.neighbours)
      .map(dirStr => dirStr as Direction)
      .filter(
        (dir) => {
          const neighbour = expectedCell.neighbours[dir];
          return !neighbour || (neighbour.isWall() && character.collidesWith(neighbour));
        }
      )
      .forEach((dir) => {
        // -->| frontal intersection
        if (dir === movingDirection.toString()) {
          if (dir === Direction.u) {
            character.top = expectedCell.top;
            character.velY = 0;
          } else if (dir === Direction.r) {
            character.right = expectedCell.right;
            character.velX = 0;
          } else if (dir === Direction.d) {
            character.bottom = expectedCell.bottom;
            character.velY = 0;
          } else if (dir === Direction.l) {
            character.left = expectedCell.left;
            character.velX = 0;
          }
        }
        // -->= side intersection
        if (dir === Direction.u && [Direction.l, Direction.r].indexOf(movingDirection) > -1) {
          character.top = expectedCell.top;
          character.velY = 0;
        }
        if (dir === Direction.d && [Direction.l, Direction.r].indexOf(movingDirection) > -1) {
          character.bottom = expectedCell.bottom;
          character.velY = 0;
        }
        if (dir === Direction.r && [Direction.u, Direction.d].indexOf(movingDirection) > -1) {
          character.right = expectedCell.right;
          character.velX = 0;
        }
        if (dir === Direction.l && [Direction.u, Direction.d].indexOf(movingDirection) > -1) {
          character.left = expectedCell.left;
          character.velX = 0;
        }
      });
  }

  private applyFriction(character: Character, friction: number = 0.8, minSpeed: number = 0.1) {
    character.velX *= friction;
    character.velY *= friction;
    // stop if very slow
    if (Math.abs(character.velX) < minSpeed) {
      character.velX = 0;
    }
    if (Math.abs(character.velY) < minSpeed) {
      character.velY = 0;
    }
  }

  private setPlayerIntent(player: Character) {
    if (this.keys[38] || (this.keys[87] && player.velY > -player.speed)) {
      player.velY--;
    } // UP
    if (this.keys[40] || (this.keys[83] && player.velY < player.speed)) {
      player.velY++;
    } // DOWN
    if (this.keys[39] || (this.keys[68] && player.velX < player.speed)) {
      player.velX++;
    } // RIGHT
    if (this.keys[37] || (this.keys[65] && player.velX > -player.speed)) {
      player.velX--;
    } // LEFT
  }

  private setPreyIntent(prey: Character, player: Character, maze: Maze) {
    const preyCell = maze.getCellAt(prey.center);
    const playerCell = maze.getCellAt(player.center);
    const distanceFromPlayer = preyCell.straightDistance(playerCell);

    const reactivity = 0.02;
    const minDistance = 3;
    const percentScared =
      0.1 *
      Math.ceil(10 / (reactivity * Math.pow(Math.max(0, distanceFromPlayer - minDistance), 2) + 1));

    this.fleeSmartlyFrom(prey, playerCell, maze, percentScared * prey.speed);
  }

  private setHunterIntent(hunter: Character, player: Character, maze: Maze) {
    const playerCell = maze.getCellAt(player.center);
    hunter.target = playerCell;
    this.goStraightTowards(hunter, hunter.target, hunter.speed);
  }

  private fleeSmartlyFrom(character: Character, from: Cell, maze: Maze, speed: number) {
    const characterCell = maze.getCellAt(character.center);
    const reachedTarget =
      character.target === characterCell &&
      character.target.pixelDistance(character) < character.speed;

    if (character.target && !reachedTarget) {
      debugLog(`${character.id} At ${characterCell}, WAITING to reach target, going ${character.targetDir}`);
    } else {
      // choose next target
      const possibleTargets: Array<{ dir: Direction | null; cell: Cell; profit: number }> = [];
      characterCell.nextDecisionPoints.forEach((dp) => {
        const profit = dp.cell.mazeDistance(from) - dp.distance;
        if (profit >= 0) {
          possibleTargets.push({ dir: dp.direction, cell: dp.cell, profit });
        }
      });
      possibleTargets.push({
        dir: null,
        cell: characterCell,
        profit: characterCell.mazeDistance(from),
      });

      possibleTargets.sort((a, b) => b.profit - a.profit);
      let chosenTarget;

      if (possibleTargets[0].dir === null) {
        // if the best choice is not to move, don't move
        chosenTarget = possibleTargets[0];
        debugLog(`${character.id} At ${characterCell}, opt chosen: STAY(null) for ${chosenTarget.profit}, choices:`, possibleTargets.map(t => `${t.dir} -> ${t.cell} for ${t.profit}`));
      } else {
        const randomisedChoice =
          Math.random() > 0.7 ? Math.floor(Math.random() * possibleTargets.length) : 0;
        chosenTarget = possibleTargets[randomisedChoice];
        debugLog(`${character.id} At ${characterCell}, ${randomisedChoice === 0 ? 'opt' : `subopt(${randomisedChoice})`} chosen: ${chosenTarget.dir} -> ${chosenTarget.cell} for ${chosenTarget.profit}, choices:`, possibleTargets.map(t => `${t.dir} -> ${t.cell} for ${t.profit}`));
      }

      character.target = chosenTarget.cell;
      character.targetDir = chosenTarget.dir;
    }
    this.goStraightTowards(character, character.target, speed);
  }

  private goStraightTowards(character: Character, target: Cell, speed: number) {
    const dx = target.center.x - character.center.x;
    const dy = target.center.y - character.center.y;
    const norm = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    character.velX = (dx * speed) / norm;
    character.velY = (dy * speed) / norm;
  }
}

@customElement('mini-game')
export class MiniGame extends LitElement {
  @query('#game')
  $canvas!: HTMLCanvasElement;
  
  @state()
  gameDays: number = 0;
  @state()
  points: number = 0;
  @state()
  targetPoints: number = 0;

  override render() {
    return html`
      <canvas id='game' style='border: 1px solid #000; max-width: 100%; max-height: 100%;'></canvas>
      <div id='score' style='position: fixed; bottom: 0; padding: .5rem; background: #ffffff80'>
        <strong>Data gathered: </strong>
        <code id='score-points'>${this.points} / ${this.targetPoints}</code>
        <span> - </span>
        <strong>Days: </strong>
        <code id='score-time' style='color: ${this._daysToColor(this.gameDays)}; font-size: ${this._daysToFontSize(this.gameDays)}'>
          ${this.gameDays}
        </code>
      </div>
    `;
  }

  private _daysToColor(days: number) {
    return (
      days < 15 ? 'green' : 
      days < 30 ? 'darkorange' : 
      'red'
    );
  }

  private _daysToFontSize(days: number) {
    const sizeInPx = Math.max(10, Math.min(200, days))
    return `${sizeInPx}px`;
  }

  override firstUpdated(): void {
    const ontick = (points: number, targetPoints: number, elapsedSeconds: number) => {
      this.gameDays = Math.floor(elapsedSeconds);
      this.points = points;
      this.targetPoints = targetPoints;
    }
    const takeoutGame = new Game(this.$canvas, ontick);
    takeoutGame.init();
  }

}
