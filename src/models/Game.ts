import { ASCII_MAZE_LAYOUT, CELL_SIZE, TICKS_PER_FRAME } from '../config';
import { Direction } from './core';
import { Character } from './Character';
import { Cell } from './Cell';
import { Maze } from './Maze';
import { Sprite, orientationToSpriteRow } from '../util/sprite';
import { promiseLoadedImage, makeImage } from "../util/image";

export class Game {
  maze!: Maze;
  player!: Character;
  preys: Character[] = [];
  hunters: Character[] = [];
  totalPreys = 0;
  gamesPlayed = 0;
  debugMode = false

  // internal
  private canvas: HTMLCanvasElement;
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
  private initialized = false;
  private looping = true;
  private nextAnimationFrameRequest!: number;
  private tickSinceLastFrame!: number;
  private frameIndex!: number;
  private startedSince: number | null = null;
  private pausedSince: number | null = null;
  private overSince: number | null = null;
  private durationPaused = 0;

  constructor(canvas: HTMLCanvasElement, onTick: (points: number, totalPoints: number, elapsedSeconds: number) => void) {
    this.onTick = onTick;
    this.canvas = canvas;
  }

  get playTime() {
    if (!this.startedSince) {
      return 0;
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
      this.ctx.globalAlpha = 0.8;
      this.ctx.drawImage(this.pauseScreenImg, 0, 0, this.maze.width, this.maze.height);
      this.ctx.globalAlpha = 1;
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

    document.body.addEventListener('keydown', (e) => {
      if (e.repeat) {
        return;
      }
      if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'w', 'a', 's', 'd'].indexOf(e.key) > -1) {
        this.keys[e.keyCode] = true;
      }
      // DEBUG (m)ode => activate
      if (e.key === 'm') {
        this.debugMode = true;
        console.log('DEBUG (m)ode: on');
        this.debugLog("Logger: that's right!");
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
        this.debugMode = false;
        console.log('DEBUG (m)ode: off');
      }
      // DEBUG print full game status
      if (e.key === 'g') {
        console.log('==========GAME STATUS==========', this);
      }
    });

    // Preload all images for smoother transitions
    Promise.all([
      promiseLoadedImage('img/screens/screen-start.png'),
      promiseLoadedImage('img/screens/screen-tutorial.png'),
      promiseLoadedImage('img/screens/screen-pause.png'),
      promiseLoadedImage('img/screens/screen-game-over.png'),
      promiseLoadedImage('img/screens/screen-victory.png'),
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

    const playerSpriteImg = makeImage('img/sprites/privacy_dev_walking.png');
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

    const preySpriteImg = makeImage('img/sprites/data.png');
    const preySprite: Sprite = {
      image: preySpriteImg,
      frames: 7,
      directional: false,
      pauseOnIdle: false,
    };
    const preySize = this.maze.cellSize;

    const startingPositions = Array.from(this.maze.centerCell.mazeDistanceMap)
      .filter(([, distance]) => distance > 3)
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

    const hunterSpriteImg = makeImage('img/sprites/authority.png');
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
    if (![
      GameScreen.IN_GAME,
      GameScreen.PAUSE,
      GameScreen.GAME_OVER,
      GameScreen.VICTORY,
    ].includes(this.screen)) {
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

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  debugLog(msg: string, ...args: any[]) {
    if (this.debugMode) {
        console.log(msg, ...args);
    }
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

  private wallColor(): string {
    return this.debugMode ? 'gray' : '#b31d25';
  }

  private floorColor(): string {
    return this.debugMode ? 'white' : '#f8ca35';
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

    if (this.debugMode) {
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

      if (this.debugMode) {
        // DEBUG: print maze distance from player
        if (cell.isOpen()) {
          ctx.fillText(
            Math.floor(cell.mazeDistance(currentCell)).toString(),
            cell.origin.x,
            cell.center.y,
            cell.width
          );
        }
      }
    });

    if (this.debugMode) {
      // DEBUG: draw player neighbouring cells
      Object.values(currentCell.neighbours).forEach(n => {
        ctx.strokeStyle = n.isWall() ? 'red' : 'lime';
        ctx.strokeRect(n.origin.x, n.origin.y, maze.cellSize, maze.cellSize);
      });

      // DEBUG: draw player cell
      ctx.strokeStyle = 'orange';
      ctx.strokeRect(currentCell.origin.x, currentCell.origin.y, maze.cellSize, maze.cellSize);
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

      if (this.debugMode) {
        // DEBUG draw character id
        ctx.strokeStyle = 'red';
        ctx.strokeText(character.id, character.left, character.top - 5);

        // DEBUG: draw character bounding box
        ctx.strokeStyle = 'cyan';
        ctx.strokeRect(character.x, character.y, character.width, character.height);

        // DEBUG draw character distance from target
        if (character.target) {
          // ctx.strokeStyle = 'gray';
          // ctx.strokeText(`${Math.floor(character.target.pixelDistance(character))}` , character.right + 2, character.center.y, character.width);
          ctx.strokeStyle = 'blue';
          ctx.beginPath();
          ctx.moveTo(character.center.x, character.center.y);
          ctx.lineTo(character.target.center.x, character.target.center.y);
          ctx.stroke();
        }
      }
    });
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
      .map((dirStr) => dirStr as Direction)
      .filter((dir) => {
        const neighbour = expectedCell.neighbours[dir];
        return (
          !neighbour ||
          (neighbour.isWall() && character.collidesWith(neighbour))
        );
      })
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

  private applyFriction(character: Character, friction = 0.8, minSpeed = 0.1) {
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
    const command = {
        up: this.keys[38] || this.keys[87],
        down: this.keys[40] || this.keys[83],
        left: this.keys[37] || this.keys[65],
        right: this.keys[39] || this.keys[68],
    }

    if (Math.abs(player.velY) < player.speed) {
      if (command.up) {
        player.velY--;
      }
      if (command.down) {
        player.velY++;
      }
    }

    if (Math.abs(player.velX) < player.speed) {
      if (command.left) {
        player.velX--;
      }
      if (command.right) {
        player.velX++;
      }
    }    
  }

  private setPreyIntent(prey: Character, player: Character, maze: Maze) {
    const preyCell = maze.getCellAt(prey.center);
    const playerCell = maze.getCellAt(player.center);
    const distanceFromPlayer = preyCell.straightDistance(playerCell);

    const reactivity = 0.02;
    const minDistance = 3;
    const percentScared = 0.1 *
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
    const reachedTarget = character.target === characterCell &&
      character.target.pixelDistance(character) < character.speed;

    if (character.target && !reachedTarget) {
      this.debugLog(`${character.id} At ${characterCell}, WAITING to reach target, going ${character.targetDir}`);
    } else {
      // choose next target
      const possibleTargets: Array<{ dir: Direction | null; cell: Cell; profit: number; }> = [];
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
        this.debugLog(
          `${character.id} At ${characterCell}, opt chosen: STAY(null) for ${chosenTarget.profit}, choices:`,
          possibleTargets.map((t) => `${t.dir} -> ${t.cell} for ${t.profit}`)
        );
      } else {
        const randomisedChoice = Math.random() > 0.7 ? Math.floor(Math.random() * possibleTargets.length) : 0;
        chosenTarget = possibleTargets[randomisedChoice];
        this.debugLog(`${character.id} At ${characterCell}, ${randomisedChoice === 0 ? 'opt' : `subopt(${randomisedChoice})`} chosen: ${chosenTarget.dir} -> ${chosenTarget.cell} for ${chosenTarget.profit}, choices:`, possibleTargets.map(t => `${t.dir} -> ${t.cell} for ${t.profit}`));
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

export enum GameScreen {
  LOADING,
  START,
  TUTORIAL,
  IN_GAME,
  PAUSE,
  VICTORY,
  GAME_OVER,
}
