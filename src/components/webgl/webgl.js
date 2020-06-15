import React from 'react';
import WebGLInterface from './helpers/webgl-interface'
import DefaultProgram from './programs/default-program';
import LBMProgram from './programs/lbm-program';
import CursorFollowProgram from './programs/cursor-follow-program';

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
        this.program = new LBMProgram(this.wgli);
        break;
      case "cursorFollow":
        this.program = new CursorFollowProgram(this.wgli);
        break;
      default:
        this.program = new DefaultProgram(this.wgli);
        break;
    }

    // Start program
    this.program.run();
  }

  render() {
    return (<canvas id={this.props.id} width="256px" height="256px"></canvas>);
  }
}