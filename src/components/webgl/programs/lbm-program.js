import requestAnimFrame from '../helpers/request-anim-frame';
import fsCursorFollowSource from '../shaders/fragment/fs-cursor-follow';
import fsGrayscaleSource from '../shaders/fragment/fs-grayscale';

class LBMProgram {
  constructor(wgli) {
    this.wgli = wgli;
    this.initFBOs();
    this.initShaderPrograms();
  }

  initFBOs() {
    this.cursorFollowFBO = this.wgli.createFBO("RGBA", "NEAREST");
  }

  initShaderPrograms() {
    const cursorFollowShader = this.wgli.createFragmentShader(fsCursorFollowSource);
    this.cursorFollowProgram = this.wgli.createProgram(cursorFollowShader);
    this.cursorFollowProgram.cursorPosUniform = this.wgli.getUniformLocation(this.cursorFollowProgram, "uCursorPos");

    const grayscaleShader = this.wgli.createFragmentShader(fsGrayscaleSource);
    this.grayscaleProgram = this.wgli.createProgram(grayscaleShader);
    this.grayscaleProgram.xUniform = this.wgli.getUniformLocation(this.grayscaleProgram, "uX");
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

    // Draw mouse follow shader to FBO
    const cursorState = this.wgli.getCursorState();
    this.wgli.useProgram(this.cursorFollowProgram);
    this.wgli.uniform2f(this.cursorFollowProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.blit(this.cursorFollowFBO.fbo);

    // Draw greyscale shader to screen
    this.wgli.useProgram(this.grayscaleProgram);
    this.wgli.uniform1i(this.grayscaleProgram.xUniform, this.cursorFollowFBO.attach(0));
    this.wgli.blit(null);
  }
}

export default LBMProgram;