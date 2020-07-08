import requestAnimFrame from '../../helpers/request-anim-frame';

class DefaultProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;
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

    // Clear screen based on current cursor position
    this.wgli.clear(null, this.props.cursorPos.x, this.props.cursorPos.y, this.props.isCursorActive ? 1.0 : 0.0, 1.0);
  }
}

export default DefaultProgram;