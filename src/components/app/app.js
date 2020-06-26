import React from "react";
import WebGL from "../webgl/webgl";
import Toolbar from "../toolbar/toolbar";
import Button from "../button/button";
import ContainerDimensions from 'react-container-dimensions';
import SynBIMLogo from 'url:~/src/public/synbim-logo.jpg';
import IconFluidSettingsGrey from 'url:~/src/public/icon-fluid-settings-grey.png';
import IconFluidSettingsWhite from 'url:~/src/public/icon-fluid-settings-white.png';
import IconTracerSettingsGrey from 'url:~/src/public/icon-tracer-settings-grey.png';
import IconTracerSettingsWhite from 'url:~/src/public/icon-tracer-settings-white.png';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tool: 0,
    }
    this.setTool = this.setTool.bind(this);
  }

  setTool(id) {
    this.setState({tool: id});
  }

  render() {
    return (
      <div className="app">
        <div className="header">
          <img className="logo" src={SynBIMLogo} alt="SynBIM"/>
          <Toolbar tool={this.state.tool} setTool={this.setTool}/>
          <div className="settings-container">
            <Button image={IconFluidSettingsGrey} activeImage={IconFluidSettingsWhite} altText="Fluid Settings"/>
            <Button image={IconTracerSettingsGrey} activeImage={IconTracerSettingsWhite} altText="Tracer Settings"/>
          </div>
        </div>
        <div id="webgl-container">
          <ContainerDimensions>
            <WebGL id="webgl" program="lbm" tool={this.state.tool} resolution={256}/>
          </ContainerDimensions>
        </div>
      </div>
    );
  }
}

export default App;