import React from "react";
import WebGL from "../webgl/webgl";

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>SynBIM Fluid Simulation</h1>
        <WebGL id="webgl" program="lbm"/>
      </div>
    );
  }
}
 
export default App;