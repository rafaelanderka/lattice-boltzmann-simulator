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
    this.useEraserTool = this.useEraserTool.bind(this);
  }

  useForceTool() {
    this.setState({tool: 0});
  }

  useWallTool() {
    this.setState({tool: 1});
  }

  useEraserTool() {
    this.setState({tool: 2});
  }

  render() {
    return (
      <div>
        <h1>SynBIM Fluid Simulation</h1>
        <button onClick={this.useForceTool}>Force Tool</button>
        <button onClick={this.useWallTool}>Wall Tool</button>
        <button onClick={this.useEraserTool}>Eraser Tool</button>
        <br/>
        <WebGL id="webgl" program="lbm" tool={this.state.tool}/>
      </div>
    );
  }
}

export default App;