import requestAnimFrame from '../helpers/request-anim-frame';
import vsBaseSource from '../shaders/vertex/vs-base';
import fsMouseFollowSource from '../shaders/fragment/fs-mouse-follow';

class LBMProgram {
  constructor(wgli) {
    this.wgli = wgli;

    // Set up shader programs
    const mouseFollowShader = this.wgli.createFragmentShader(fsMouseFollowSource);
    this.mouseFollowProgram = this.wgli.createProgram(mouseFollowShader);
    this.mouseFollowProgram.mousePosUniform = this.wgli.getUniformLocation(this.mouseFollowProgram, "uMousePos");
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
    this.wgli.useProgram(this.mouseFollowProgram);
    this.wgli.uniform2f(this.mouseFollowProgram.mousePosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.blit(null);
  }
}

export default LBMProgram;