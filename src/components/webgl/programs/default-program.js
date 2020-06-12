import requestAnimFrame from '../helpers/request-anim-frame';

class DefaultProgram {
  constructor(wgli) {
    this.wgli = wgli;
  }

  // Entry point for the program
  run() {
    // Begin main update loop
    requestAnimFrame(() => this.update());
  }

  // Main update loop
  update() {
    requestAnimFrame(() => this.update());

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Clear screen based on current mouse position
    const cursorState = this.wgli.getCursorState();
    this.wgli.clear(cursorState.cursorPos.x, cursorState.cursorPos.y, cursorState.isActive ? 1.0 : 0.0, 1.0);
  }
}

export default DefaultProgram;