import {LitElement, html} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import { Game } from './models/Game';

@customElement('mini-game')
export class MiniGame extends LitElement {
  @query('#game')
  $canvas!: HTMLCanvasElement;

  @state()
  gameDays = 0;
  @state()
  points = 0;
  @state()
  targetPoints = 0;

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
    const sizeInPx = Math.max(10, Math.min(200, days));
    return `${sizeInPx}px`;
  }

  override firstUpdated(): void {
    const ontick = (points: number, targetPoints: number, elapsedSeconds: number) => {
      this.gameDays = Math.floor(elapsedSeconds);
      this.points = points;
      this.targetPoints = targetPoints;
    };
    const takeoutGame = new Game(this.$canvas, ontick);
    takeoutGame.init();
  }
}
