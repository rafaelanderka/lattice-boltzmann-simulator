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
    const scale = this.props.resolution / this.props.containerWidth;
    this.wgli = new WebGLInterface(this.props.id, scale);
    
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

    // Expose program to parent
    this.props.exposeProgram(this.program);

    // Start program
    this.program.run();
  }

  componentDidUpdate() {
    // Pass props to program
    this.program.setProps(this.props);
  }

  render() {
    // Render a single canvas element as the host to the WebGL context
    return (<canvas 
      id={this.props.id} 
      width={this.props.containerWidth * this.props.resolution / this.props.containerWidth} 
      height={this.props.containerHeight * this.props.resolution / this.props.containerHeight} 
      style={{
        width: this.props.containerWidth, 
        height: this.props.containerHeight
      }}
    />);
  }
}