import React from "react";
import WebGL from "../webgl/webgl";
import Toolbar from "../toolbar/toolbar";
import Button from "../button/button";
import HeaderButton from "../header-button/header-button";
import Selector from "../selector/selector";
import SoluteSelector from "../solute-selector/solute-selector";
import Slider from "../slider/slider";
import CursorPositon from "../cursor-position/cursor-position";
import ToolOverlay from "../tool-overlay/tool-overlay";
import SynBIMLogo from 'url:~/src/public/synbim-logo.jpg';
import IconFluidSettingsBlack from 'url:~/src/public/icon-fluid-settings-black.png';
import IconSoluteSettingsBlack from 'url:~/src/public/icon-solute-settings-black.png';
import IconAboutBlack from 'url:~/src/public/icon-about-black.png';
import IconAboutWhite from 'url:~/src/public/icon-about-white.png';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resolution: 256,
      tool: 0,
      toolSize: 0.05,
      solute: 0,
      soluteCount: 3,
      viscosity: 0.1,
      boundaryWalls: 0,
      diffusivities: [0.1, 0.3, 0.4],
      colors: [{r: 162, g: 255, b: 0}, {r: 255, g: 100, b: 100}, {r: 70, g: 200, b: 255}]
    }
    this.setTool = this.setTool.bind(this);
    this.setToolSize = this.setToolSize.bind(this);
    this.setSolute = this.setSolute.bind(this);
    this.setViscosity = this.setViscosity.bind(this);
    this.setBoundaryWalls = this.setBoundaryWalls.bind(this);
    this.setActiveSoluteDiffusivity = this.setActiveSoluteDiffusivity.bind(this);
    this.setActiveSoluteColorR = this.setActiveSoluteColorR.bind(this);
    this.setActiveSoluteColorG = this.setActiveSoluteColorG.bind(this);
    this.setActiveSoluteColorB = this.setActiveSoluteColorB.bind(this);
    this.resetAllSolutes = this.resetAllSolutes.bind(this);
    this.resetFluid = this.resetFluid.bind(this);
    this.resetWalls = this.resetWalls.bind(this);
  }

  setTool(id) {
    this.setState({tool: id});
  }

  setToolSize(value) {
    this.setState({toolSize: value});
  }

  setSolute(id) {
    this.setState({solute: id});
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

  setActiveSoluteDiffusivity(value) {
    this.setDiffusivity(this.state.solute, value);
  }

  setColor(index, value) {
    const colors = [...this.state.colors];
    colors[index] = value;
    this.setState({colors: colors});
  }

  setActiveSoluteColorR(value) {
    const color = this.state.colors[this.state.solute];
    color.r = value;
    this.setColor(this.state.solute, color);
  }

  setActiveSoluteColorG(value) {
    const color = this.state.colors[this.state.solute];
    color.g = value;
    this.setColor(this.state.solute, color);
  }

  setActiveSoluteColorB(value) {
    const color = this.state.colors[this.state.solute];
    color.b = value;
    this.setColor(this.state.solute, color);
  }

  resetAllSolutes() {
    for (let i = 0; i < this.state.soluteCount; i++) {
      this.program.resetSolute(i);
    }
  }

  resetFluid() {
    this.setState({viscosity: 0.1});
    this.program.resetFluid();
  }

  resetWalls() {
    this.setState({boundaryWalls: 0});
    this.program.resetWalls();
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
          <div id="tool-size-container">
              <div id="tool-size-title">TOOL SIZE</div>
              <div className="slider-unlabeled-container">
                <Slider
                  value={this.state.toolSize}
                  min={0.0025}
                  max={0.2}
                  step={0.0005}
                  decimals={2}
                  setValue={this.setToolSize}
                  labeled={false}
                />
              </div>
            </div>
          <div className="header-buttons-container">
            <HeaderButton
              image={IconAboutBlack}
              activeImage={IconAboutWhite}
              altText="About"
            />
          </div>
        </div>
        <div id="main">
          <div id="webgl-container">
            <CursorPositon>
              <WebGL 
                id="webgl" 
                program="lbm" 
                resolution={this.state.resolution}
                tool={this.state.tool} 
                toolSize={this.state.toolSize}
                solute={this.state.solute}
                viscosity={this.state.viscosity}
                diffusivities={this.state.diffusivities}
                colors={this.state.colors}
                leftRightWall={leftRightWall}
                topBottomWall={topBottomWall}
                exposeProgram={program => this.program = program}
              />
              <ToolOverlay
                toolSize={this.state.toolSize}
              />
            </CursorPositon>
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
                  labeled={true}
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
            <div className="settings-subcontainer">
              <div className="reset-buttons-container">
                <div className="reset-button">
                  <Button 
                    text="RESET FLUID"
                    onClick={this.resetFluid} 
                    color="#000"
                  />
                </div>
                <div className="reset-button">
                  <Button 
                    text="RESET WALLS"
                    onClick={this.resetWalls} 
                    color="#000"
                  />
                </div>
              </div>
            </div>
            <div className="settings-title">
              <img src={IconSoluteSettingsBlack} alt=""/>
              SOLUTE SETTINGS
              <hr/>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">ACTIVE SOLUTE</div>
              <div className="solute-selectors-container">
                <SoluteSelector
                  color={this.state.colors[0]}
                  setSolute={() => this.setSolute(0)}
                  isActive={this.state.solute == 0}
                />
                <SoluteSelector
                  color={this.state.colors[1]}
                  setSolute={() => this.setSolute(1)}
                  isActive={this.state.solute == 1}
                />
                <SoluteSelector
                  color={this.state.colors[2]}
                  setSolute={() => this.setSolute(2)}
                  isActive={this.state.solute == 2}
                />
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">COLOR</div>
              <div className="solute-color-settings-container">
                <div className="solute-color-sliders-container">
                  <div className="solute-color-slider">
                    R
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.solute].r}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveSoluteColorR}
                        labeled={true}
                  />
                    </div>
                  </div>
                  <div className="solute-color-slider">
                    G
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.solute].g}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveSoluteColorG}
                        labeled={true}
                      />
                    </div>
                  </div>
                  <div className="solute-color-slider">
                    B
                    <div className="slider-container">
                      <Slider
                        value={this.state.colors[this.state.solute].b}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveSoluteColorB}
                        labeled={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="solute-color-preview-border">
                  <div 
                    className="solute-color-preview" 
                    style={{backgroundColor: this.rgbToHex(this.state.colors[this.state.solute])}}
                  />
                </div>
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">DIFFUSIVITY</div>
              <div className="slider-container">
                <Slider
                  value={this.state.diffusivities[this.state.solute]}
                  min={0.05}
                  max={1}
                  step={0.01}
                  decimals={2}
                  setValue={this.setActiveSoluteDiffusivity}
                  labeled={true}
                  />
              </div>
            </div>
            <div className="settings-subcontainer">
              <div className="reset-buttons-container">
                <div className="reset-button">
                  <Button 
                    text="CLEAR SOLUTE"
                    onClick={() => this.program.resetSolute(this.state.solute)} 
                    color="#000"
                  />
                </div>
                <div className="reset-button">
                  <Button 
                    text="CLEAR ALL SOLUTES"
                    onClick={this.resetAllSolutes} 
                    color="#F00"
                  />
                </div>
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