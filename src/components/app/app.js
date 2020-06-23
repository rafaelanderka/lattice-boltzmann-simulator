import React from "react";
import WebGL from "../webgl/webgl";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tool: 0,
    }

    this.useForceTool = this.useForceTool.bind(this);
    this.useWallTool = this.useWallTool.bind(this);
    this.useWallEraserTool = this.useWallEraserTool.bind(this);
    this.useConcentrationTool = this.useConcentrationTool.bind(this);
    this.useConcentrationEraserTool = this.useConcentrationEraserTool.bind(this);
  }

  useForceTool() {
    this.setState({tool: 0});
  }

  useWallTool() {
    this.setState({tool: 1});
  }

  useWallEraserTool() {
    this.setState({tool: 2});
  }

  useConcentrationTool() {
    this.setState({tool: 3});
  }

  useConcentrationEraserTool() {
    this.setState({tool: 4});
  }

  render() {
    return (
      <div>
        <h1>SynBIM Fluid Simulation</h1>
        <button onClick={this.useForceTool}>Force Tool</button>
        <button onClick={this.useWallTool}>Wall Tool</button>
        <button onClick={this.useWallEraserTool}>Wall Eraser Tool</button>
        <button onClick={this.useConcentrationTool}>Concentration Tool</button>
        <button onClick={this.useConcentrationEraserTool}>Concentration Eraser Tool</button>
        <br/>
        <WebGL id="webgl" program="lbm" tool={this.state.tool}/>
      </div>
    );
  }
}

export default App;