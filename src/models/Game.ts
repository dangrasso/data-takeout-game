import { ASCII_MAZE_LAYOUT, CELL_SIZE, TICKS_PER_FRAME } from '../config';
import { Direction } from './core';
import { Character } from './Character';
import { Cell } from './Cell';
import { Maze } from './Maze';
import { ActiveControllerInputs, Controller, Controllers } from './Controller'
import { Sprite, orientationToSpriteRow } from '../util/sprite';
import { promiseLoadedImage, makeImage } from "../util/image";


export class Game {
  maze!: Maze;
  player!: Character;
  preys: Character[] = [];
  hunters: Character[] = [];
  totalPreys = 0;
  totalHunters = 0;
  gamesPlayed = 0;
  debugMode = false

  // internal
  private canvas: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private _screen?: GameScreen;
  private controllers: Controller[] = [];

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

  get activeInputs(): ActiveControllerInputs {
    return Controllers.combineActiveInputs(this.controllers)
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
    this.canvas.width = this.maze.width;
    this.canvas.height = this.maze.height;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    this.controllers = Controllers.initControllers(document, {
      next: () => this.nextScreen(),
      pause: () => this.togglePausedScreen(),
      restart: () => this.restart(),
      victory: () => this.gameWon(),
      stats: () => console.log('===== GAME STATUS =====', this),
      enterDebugMode: () => {
        this.debugMode = true;
        console.log('DEBUG mode: ON');
        this.debugLog("Logger: that's right!");
      },
      exitDebugMode: () => {
        this.debugMode = false;
        console.log('DEBUG mode: off');
      },
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
    const playerHeight = this.maze.cellSize;
    const playerWidth = playerHeight / 2;

    this.player = new Character(
      `g${this.gamesPlayed}-player`,
      this.maze.centerCell.origin,
      playerSprite,
      3,
      playerWidth,
      playerHeight
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
      .filter(([, distance]) => distance > 5)
      .map(([cell]) => cell);

    this.totalPreys = 12;
    this.preys = [];
    for (let i = 0; i < this.totalPreys; i++) {
      this.preys.push(
        new Character(
          `g${this.gamesPlayed}-prey-${i}`,
          startingPositions[Math.floor(Math.random() * startingPositions.length)].origin,
          preySprite,
          2.8,
          preySize,
          preySize
        )
      );
    }

    const hunterSpriteImg = makeImage('img/sprites/helicopter.png');
    const hunterSprite: Sprite = {
      image: hunterSpriteImg,
      frames: 4,
      directional: true,
      pauseOnIdle: false,
    };
    const hunterSize = this.maze.cellSize * 2;

    this.totalHunters = 4
    this.hunters = [];
    for (let i = 0; i < this.totalHunters; i++) {
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
    this.setPlayerIntent(this.player, this.activeInputs);
    this.applyFriction(this.player);

    // Move preys
    this.preys.forEach(prey => {
      this.setPreyIntent(prey, this.player, this.maze);
      // this.applyFriction(prey);
      this.updatePosition(prey, this.maze);
    });

    // Move hunters (as a pack)
    this.setHuntersPackIntent(this.hunters, this.player, this.maze);
    this.hunters.forEach((hunter) => {
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

  private setPlayerIntent(player: Character, activeInputs: ActiveControllerInputs) {
    if (Math.abs(player.velY) < player.speed) {
      if (activeInputs.up) {
        player.velY--;
      }
      if (activeInputs.down) {
        player.velY++;
      }
    }

    if (Math.abs(player.velX) < player.speed) {
      if (activeInputs.left) {
        player.velX--;
      }
      if (activeInputs.right) {
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

  private setHuntersPackIntent(hunters: Character[], player: Character, maze: Maze) {
    const playerCell = maze.getCellAt(player.center);
    
    // 1. The "alpha" hunter (currently closest to player) goes straight to it.
    const [alphaHunter, ...remainingHunters] = [...hunters]
      .sort((a, b) => a.pixelDistance(player) - b.pixelDistance(player));
    alphaHunter.target = playerCell;
    this.goStraightTowards(alphaHunter, alphaHunter.target, alphaHunter.speed);

    // 2. other hunters surround the player
    const aimedEscapeCell = playerCell.nextDecisionPoints
      .find(p => p.direction === player.orientation)
      ?.cell;
    const otherEscapeCells = playerCell.nextDecisionPoints
      .filter(p => p.direction != player.orientation)
      .map(dp => dp.cell);
    
    // Start from where the player is aiming to, then cover all remaining escape routes, sending each time the closest hunter.
    const sortedEscapeCells = aimedEscapeCell ? [aimedEscapeCell, ...otherEscapeCells] : otherEscapeCells;
    sortedEscapeCells.forEach((escapeCell) => {
      const closestHunter = remainingHunters
        .sort((a, b) => a.pixelDistance(escapeCell) - b.pixelDistance(escapeCell))
        .shift();
      if (closestHunter) {
        closestHunter.target = escapeCell;
        this.goStraightTowards(closestHunter, closestHunter.target, closestHunter.speed);
      }
    })

    // If there are extra hunters, send them to the closest escape route from where they are.
    remainingHunters.forEach(hunter => {
      hunter.target = [playerCell, ...sortedEscapeCells]
        .sort((a, b) => a.pixelDistance(hunter) - b.pixelDistance(hunter))[0];
      this.goStraightTowards(hunter, hunter.target, hunter.speed);
    });
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

      const [bestTarget, ...otherTargets] = possibleTargets.sort((a, b) => b.profit - a.profit);
      let chosenTarget;

      if (bestTarget.dir === null || !otherTargets.length) {
        // if the best/only choice is not to move, don't move
        chosenTarget = bestTarget;
        this.debugLog(
          `${character.id} At ${characterCell}, optimal chosen: STAY(null) for ${chosenTarget.profit}, choices:`,
          possibleTargets.map((t) => `${t.dir} -> ${t.cell} for ${t.profit}`)
        );
      } else {
        const actSmartly = Math.random() <= 0.75; // 75% chance of doing the right thing
        chosenTarget = actSmartly ? bestTarget : otherTargets[Math.floor(Math.random() * otherTargets.length)];
        this.debugLog(`${character.id} At ${characterCell}, ${actSmartly ? 'optimal' : `suboptimal`} chosen: ${chosenTarget.dir} -> ${chosenTarget.cell} for ${chosenTarget.profit}, choices:`, possibleTargets.map(t => `${t.dir} -> ${t.cell} for ${t.profit}`));
      }

      character.target = chosenTarget.cell;
    }
    this.goStraightTowards(character, character.target, speed);
  }

  private goStraightTowards(character: Character, target: Cell, speed: number) {
    if (character.pixelDistance(target) < 1) {
      // arrived!
      character.velX = 0;
      character.velY = 0;
      return;
    }
    
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
