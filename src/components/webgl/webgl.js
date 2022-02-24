import React from 'react';
import WebGLInterface from './helpers/webgl-interface'
import DefaultProgram from './programs/default/default';
import LBMProgram from './programs/lbm/lbm';

export default class WebGL extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // Initialize WebGL interface
    const scale = this.props.resolution / this.props.containerWidth;
    this.wgli = new WebGLInterface(this.props);
    
    // Get corresponding program
    switch (this.props.program) {
      case "lbm":
        this.program = new LBMProgram(this.wgli, this.props);
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
    // Pass props to WebGL interface and program
    this.wgli.setProps(this.props);
    this.program.setProps(this.props);
  }

  render() {
    // Render canvas elements as hosts to WebGL and its optional overlay
    const containerStyle = {
      position: "relative",
      width: this.props.containerWidth, 
      height: this.props.containerHeight,
      left: 0,
      top: 0
    };

    const canvasStyle = {
      zIndex: 11,
      position: "absolute",
      width: "100.5%", 
      height: "100.5%",
      left: 0,
      top: 0
    };``
    
    return (
      <div style={containerStyle}>
        <canvas 
          id={this.props.id} 
          width={this.props.renderWidth}
          height={this.props.renderHeight}
          style={canvasStyle}
        />
      </div>
    );
  }
}