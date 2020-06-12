import React from 'react';
import WebGLInterface from './webgl-interface'

export default class WebGL extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // Initialize GLInterface
    this.wgli = new WebGLInterface(this.props.id);
    
    // Begin main update loop
    this.wgli.update();
  }

  render() {
    return (<canvas id={this.props.id}></canvas>);
  }
}