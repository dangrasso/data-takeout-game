export enum ControllerInput {
  up = 'up',
  right = 'right',
  down = 'down',
  left = 'left',
}

export type ControllerHooks = {
  next: VoidFunction,
  pause: VoidFunction,
  restart: VoidFunction,
  victory: VoidFunction,
  stats: VoidFunction,
  enterDebugMode: VoidFunction,
  exitDebugMode: VoidFunction,
}

export type ActiveControllerInputs = {
  [i in ControllerInput]: boolean;
};

export class Controller {
  activeInputs: ActiveControllerInputs = Controller.defaultActiveInputs();
  hooks: ControllerHooks = {
    next() {},
    pause() {},
    restart() {},
    victory() {},
    stats() {},
    enterDebugMode() {},
    exitDebugMode() {},
  }

  constructor(hooks: ControllerHooks) {
    this.hooks = hooks;
  }
  
  static defaultActiveInputs(): ActiveControllerInputs {
    return {
      up: false,
      right: false,
      down: false,
      left: false,
    };
  }
}

export class KeyboardController extends Controller {
  pressedKeys: Set<string> = new Set()

  constructor(document: Document, hooks: ControllerHooks) {
    super(hooks);
    document.body.addEventListener('keydown', (e) => {
      if (e.repeat) {
        return;
      }
      if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'w', 'a', 's', 'd'].includes(e.key)) {
        this.pressedKeys.add(e.key)
        this.updateActiveInputs()
      }
      if (e.key === 'm') {
        this.hooks.enterDebugMode();
      }
    });

    document.body.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.key)
      this.updateActiveInputs()
      if (e.key === 'm') {
        this.hooks.exitDebugMode();
      }
      if (e.key === 'p') {
        this.hooks.pause();
      }
      if (e.key === 'r') {
        this.hooks.restart();
      }
      if (e.key === ' ') {
        this.hooks.next();
      }
      if (e.key === 'v') {
        this.hooks.victory();
      }
      if (e.key === 'g') {
        this.hooks.stats();
      }
    });
  }

  private updateActiveInputs() {
    // needed to allow "merging" key inputs
    this.activeInputs.up = this.pressedKeys.has('w') || this.pressedKeys.has('ArrowUp')
    this.activeInputs.right = this.pressedKeys.has('d') || this.pressedKeys.has('ArrowRight')
    this.activeInputs.down = this.pressedKeys.has('s') || this.pressedKeys.has('ArrowDown')
    this.activeInputs.left = this.pressedKeys.has('a') || this.pressedKeys.has('ArrowLeft')
  }
}

class TouchController extends Controller {
  touchOriginX?: number;
  touchOriginY?: number;
  
  constructor(document: Document, hooks: ControllerHooks) {
    super(hooks)
    const $touchElement = document.body
    $touchElement.style.touchAction = 'pinch-zoom'; // only keeps double-finger standard interactions with the browser
    $touchElement.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    $touchElement.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
    $touchElement.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
  }

  handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length == 1) {
      this.touchOriginX = e.touches[0].clientX;
      this.touchOriginY = e.touches[0].clientY;
    } else if (e.touches.length == 2) {
      this.hooks.pause();
    }
  }

  handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length == 1 && typeof this.touchOriginX == 'number' && typeof this.touchOriginY == 'number') {
      const destX = e.touches[0].clientX;
      const destY = e.touches[0].clientY;
      const deltaX = destX - this.touchOriginX;
      const deltaY = destY - this.touchOriginY;

      // Avoid too sensitive diagonal movements, by dividing the touch space into 8 slices (up, down, left, right + diagonals).
      // Allow diagonal move if touch is on the diagonal slices. 
      // Apply only horizontal/vertical move if touch is on the orthogonal slices. These are narrower
      const ratioXY = Math.abs(deltaX/deltaY)
      const mostlyHorizontally = ratioXY > 3;
      const mostlyVertically = ratioXY < 0.33;
      
      const moveThresholdPx = 10
      this.activeInputs.up = !mostlyHorizontally && deltaY < -moveThresholdPx;
      this.activeInputs.down = !mostlyHorizontally && deltaY > moveThresholdPx;
      this.activeInputs.right = !mostlyVertically && deltaX > moveThresholdPx;
      this.activeInputs.left = !mostlyVertically && deltaX < -moveThresholdPx;  
    }
  }

  handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length == 0) {
      this.hooks.next();
      this.touchOriginX = undefined;
      this.touchOriginY = undefined;
      this.activeInputs.up = false;
      this.activeInputs.right = false;
      this.activeInputs.down = false;
      this.activeInputs.left = false;
    }
  }
}

export class Controllers {
  static initControllers(document: Document, hooks: ControllerHooks): Controller[] {
    const controllers = [
      new KeyboardController(document, hooks),
      new TouchController(document, hooks)
    ]
    return controllers
  }

  static combineActiveInputs(controllers: Controller[]): ActiveControllerInputs {
    const combined: ActiveControllerInputs = {
      up: false,
      right: false,
      down: false,
      left: false,
    }
    
    if (controllers?.length) {
      controllers.forEach(c => {
        Object.entries(c.activeInputs)
          .filter(([_, isActive]) => isActive)
          .forEach(([input, _]) => {
            combined[input as ControllerInput] = true
          })
      })
    }

    return combined
  }
}