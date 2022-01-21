import { Cell } from './Cell';
import { Sprite } from '../util/sprite';
import { Direction, CanvasCoordinates } from './core';


export class Character {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velX = 0;
  velY = 0;
  speed: number;
  sprite: Sprite;
  spriteFrameIndex = 0;
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
    canFly = false
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
