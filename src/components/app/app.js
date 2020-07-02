import React from "react";
import WebGL from "../webgl/webgl";
import Toolbar from "../toolbar/toolbar";
import Button from "../button/button";
import Selector from "../selector/selector";
import TracerSelector from "../tracer-selector/tracer-selector";
import Slider from "../slider/slider";
import ContainerDimensions from 'react-container-dimensions';
import SynBIMLogo from 'url:~/src/public/synbim-logo.jpg';
import IconFluidSettingsBlack from 'url:~/src/public/icon-fluid-settings-black.png';
import IconTracerSettingsBlack from 'url:~/src/public/icon-tracer-settings-black.png';
import IconAboutBlack from 'url:~/src/public/icon-about-black.png';
import IconAboutWhite from 'url:~/src/public/icon-about-white.png';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tool: 0,
      tracer: 0,
      viscosity: 0.1,
      boundaryWalls: 0,
      diffusivities: [0.1, 0.65, 0.4],
      colors: [{r: 162, g: 255, b: 0}, {r: 255, g: 100, b: 100}, {r: 70, g: 200, b: 255}]
    }
    this.setTool = this.setTool.bind(this);
    this.setTracer = this.setTracer.bind(this);
    this.setViscosity = this.setViscosity.bind(this);
    this.setBoundaryWalls = this.setBoundaryWalls.bind(this);
    this.setActiveTracerDiffusivity = this.setActiveTracerDiffusivity.bind(this);
    this.setActiveTracerColorR = this.setActiveTracerColorR.bind(this);
    this.setActiveTracerColorG = this.setActiveTracerColorG.bind(this);
    this.setActiveTracerColorB = this.setActiveTracerColorB.bind(this);
  }

  setTool(id) {
    this.setState({tool: id});
  }

  setTracer(id) {
    this.setState({tracer: id});
  }

  setViscosity(value) {
    this.setState({viscosity: value});
  }

  setBoundaryWalls(id) {
    this.setState({boundaryWalls: id});
  }

  setDiffusivity(index, value) {
    const diffusivities = [...this.state.diffusivities];
    diffusivities[index] = value;
    this.setState({diffusivities: diffusivities});
  }

  setActiveTracerDiffusivity(value) {
    this.setDiffusivity(this.state.tracer, value);
  }

  setColor(index, value) {
    const colors = [...this.state.colors];
    colors[index] = value;
    this.setState({colors: colors});
  }

  setActiveTracerColorR(value) {
    const color = this.state.colors[this.state.tracer];
    color.r = value;
    this.setColor(this.state.tracer, color);
  }

  setActiveTracerColorG(value) {
    const color = this.state.colors[this.state.tracer];
    color.g = value;
    this.setColor(this.state.tracer, color);
  }

  setActiveTracerColorB(value) {
    const color = this.state.colors[this.state.tracer];
    color.b = value;
    this.setColor(this.state.tracer, color);
  }

  rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
  }

  render() {
    const leftRightWall = (this.state.boundaryWalls == 1 || this.state.boundaryWalls == 3) ? true : false;
    const topBottomWall = (this.state.boundaryWalls == 2 || this.state.boundaryWalls == 3) ? true : false;
    return (
      <div id="app">
        <div id="header">
          <img id="logo" src={SynBIMLogo} alt="SynBIM"/>
          <Toolbar tool={this.state.tool} setTool={this.setTool}/>
          <div className="header-buttons-container">
            <Button
              image={IconAboutBlack}
              activeImage={IconAboutWhite}
              altText="About"
            />
          </div>
        </div>
        <div id="main">
          <div id="webgl-container">
            <ContainerDimensions>
              <WebGL 
                id="webgl" 
                program="lbm" 
                resolution={256}
                tool={this.state.tool} 
                tracer={this.state.tracer}
                viscosity={this.state.viscosity}
                diffusivities={this.state.diffusivities}
                colors={this.state.colors}
                leftRightWall={leftRightWall}
                topBottomWall={topBottomWall}
              />
            </ContainerDimensions>
          </div>
          <div id="settings-container">
            <div className="settings-title">
              <img src={IconFluidSettingsBlack} alt=""/>
              FLUID SETTINGS
              <hr/>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">VISCOSITY</div>
              <div className="slider-container">
                <Slider
                  value={this.state.viscosity}
                  min={0.05}
                  max={1}
                  step={0.01}
                  decimals={2}
                  setValue={this.setViscosity}
                />
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">BOUNDARY WALLS</div>
              <Selector
                values={["OFF", "HORIZONTAL", "VERTICAL", "ALL"]}
                selection={this.state.boundaryWalls}
                setSelection={this.setBoundaryWalls}
              />
            </div>
            <div className="settings-title">
              <img src={IconTracerSettingsBlack} alt=""/>
              TRACER SETTINGS
              <hr/>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">ACTIVE TRACER</div>
              <div className="tracer-selectors-container">
                <TracerSelector
                  color={this.state.colors[0]}
                  setTracer={() => this.setTracer(0)}
                  isActive={this.state.tracer == 0}
                />
                <TracerSelector
                  color={this.state.colors[1]}
                  setTracer={() => this.setTracer(1)}
                  isActive={this.state.tracer == 1}
                />
                <TracerSelector
                  color={this.state.colors[2]}
                  setTracer={() => this.setTracer(2)}
                  isActive={this.state.tracer == 2}
                />
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">COLOR</div>
              <div className="tracer-color-settings-container">
                <div className="tracer-color-sliders-container">
                  <div className="tracer-color-slider">
                    R
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.tracer].r}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveTracerColorR}
                      />
                    </div>
                  </div>
                  <div className="tracer-color-slider">
                    G
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.tracer].g}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveTracerColorG}
                      />
                    </div>
                  </div>
                  <div className="tracer-color-slider">
                    B
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.tracer].b}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveTracerColorB}
                      />
                    </div>
                  </div>
                </div>
                <div className="tracer-color-preview-border">
                  <div 
                    className="tracer-color-preview" 
                    style={{backgroundColor: this.rgbToHex(this.state.colors[this.state.tracer])}}
                  />
                </div>
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">DIFFUSIVITY</div>
              <div className="slider-container">
                <Slider
                  value={this.state.diffusivities[this.state.tracer]}
                  min={0.05}
                  max={1}
                  step={0.01}
                  decimals={2}
                  setValue={this.setActiveTracerDiffusivity}
                />
              </div>
            </div>
            <br/>
          </div>
        </div>
      </div>
    );
  }
}

export default App;