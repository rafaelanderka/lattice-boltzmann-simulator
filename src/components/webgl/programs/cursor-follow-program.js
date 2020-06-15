import requestAnimFrame from '../helpers/request-anim-frame';
import fsCursorFollowSource from '../shaders/fragment/fs-cursor-follow';

class CursorFollowProgram {
  constructor(wgli) {
    this.wgli = wgli;
    this.initShaderPrograms();
  }

  initShaderPrograms() {
    const cursorFollowShader = this.wgli.createFragmentShader(fsCursorFollowSource);
    this.cursorFollowProgram = this.wgli.createProgram(cursorFollowShader);
    this.cursorFollowProgram.cursorPosUniform = this.wgli.getUniformLocation(this.cursorFollowProgram, "uCursorPos");
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

    // Draw mouse follow shader
    const cursorState = this.wgli.getCursorState();
    this.wgli.useProgram(this.cursorFollowProgram);
    this.wgli.uniform2f(this.cursorFollowProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.blit(null);
  }
}

export default CursorFollowProgram;