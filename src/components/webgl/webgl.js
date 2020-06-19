import React from 'react';
import WebGLInterface from './helpers/webgl-interface'
import DefaultProgram from './programs/default/default';
import LBMProgram from './programs/lbm/lbm';
import CursorFollowProgram from './programs/cursor-follow/cursor-follow';

export default class WebGL extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // Initialize WebGL interface
    this.wgli = new WebGLInterface(this.props.id);
    
    // Get corresponding program
    switch (this.props.program) {
      case "lbm":
        this.program = new LBMProgram(this.wgli, this.props);
        break;
      case "cursorFollow":
        this.program = new CursorFollowProgram(this.wgli, this.props);
        break;
      default:
        this.program = new DefaultProgram(this.wgli, this.props);
        break;
    }

    // Start program
    this.program.run();
  }

  componentDidUpdate() {
    this.program.setProps(this.props);
  }

  render() {
    const width = "1000px";
    const height = "400px";
    return (<canvas id={this.props.id} width={width} height={height} style={{width: width, height: height}}></canvas>);
  }
}