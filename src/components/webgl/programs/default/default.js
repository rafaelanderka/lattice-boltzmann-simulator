import requestAnimationFrame from 'raf'

class DefaultProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;
    this._update = this._update.bind(this);
  }

  // Entry point for the program
  run() {
    // Begin main update loop
    requestAnimationFrame(this._update);
  }

  // Update props
  setProps(props) {
    this.props = props;
  }

  // Main update loop
  _update() {
    requestAnimationFrame(this._update);

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Clear screen based on current cursor position
    this.wgli.clear(null, this.props.cursorPos[0], this.props.cursorPos[1], this.props.isCursorActive ? 1.0 : 0.0, 1.0);
  }
}

export default DefaultProgram;