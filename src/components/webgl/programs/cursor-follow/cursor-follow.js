import requestAnimFrame from '../../helpers/request-anim-frame';
import fsCursorFollowSource from '../../shaders/fragment/fs-cursor-follow';

class CursorFollowProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;

    this._initShaderPrograms();
  }

  _initShaderPrograms() {
    const cursorFollowShader = this.wgli.createFragmentShader(fsCursorFollowSource);
    this.cursorFollowProgram = this.wgli.createProgram(cursorFollowShader);
    this.cursorFollowProgram.cursorPosUniform = this.wgli.getUniformLocation(this.cursorFollowProgram, "uCursorPos");
  }

  // Entry point for the program
  run() {
    // Begin main update loop
    requestAnimFrame(() => this._update());
  }

  // Update props
  setProps(props) {
    this.props = props;
  }

  // Main update loop
  _update() {
    requestAnimFrame(() => this._update());

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Draw mouse follow shader
    this.wgli.useProgram(this.cursorFollowProgram);
    this.wgli.uniform2f(this.cursorFollowProgram.cursorPosUniform, this.props.cursorPos.x, this.props.cursorPos.y);
    this.wgli.blit(null);
  }
}

export default CursorFollowProgram;