import { Direction } from '../models/core';

export type Sprite = {
  image: HTMLImageElement;
  frames: number;
  directional: boolean;
  pauseOnIdle: boolean;
};

export const orientationToSpriteRow = {
  [Direction.u]: 0,
  [Direction.r]: 1,
  [Direction.d]: 2,
  [Direction.l]: 3,
};
