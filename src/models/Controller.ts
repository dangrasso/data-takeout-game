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

export class Controllers {
  static initControllers(document: Document, hooks: ControllerHooks): Controller[] {
    const controllers = [
      new KeyboardController(document, hooks)
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