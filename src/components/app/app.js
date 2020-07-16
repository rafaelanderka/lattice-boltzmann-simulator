import React from "react";
import WebGL from "../webgl/webgl";
import Toolbar from "../toolbar/toolbar";
import Button from "../button/button";
import HeaderButton from "../header-button/header-button";
import Selector from "../selector/selector";
import SoluteSelector from "../solute-selector/solute-selector";
import SliderHorizontal from "../slider-horizontal/slider-horizontal";
import CursorPositon from "../cursor-position/cursor-position";
import ToolOverlay from "../tool-overlay/tool-overlay";
import SynBIMLogo from 'url:~/src/public/synbim-logo.jpg';
import IconFluidSettingsBlack from 'url:~/src/public/icon-fluid-settings-black.png';
import IconSoluteSettingsBlack from 'url:~/src/public/icon-solute-settings-black.png';
import IconReactionSettingsBlack from 'url:~/src/public/icon-reaction-settings-black.png';
import IconAboutBlack from 'url:~/src/public/icon-about-black.png';
import IconAboutWhite from 'url:~/src/public/icon-about-white.png';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resolution: 256,
      velXCount: 32,
      velYCount: 32,
      tool: 0,
      toolSizes: [0.1, 0.02, 0.05, 0.1, 0.12],
      solute: 0,
      soluteCount: 3,
      viscosity: 0.1,
      boundaryWalls: 0,
      diffusivities: [0.05, 0.18, 0.05],
      colors: [{r: 162, g: 255, b: 0}, {r: 255, g: 179, b: 13}, {r: 135, g: 0, b: 255}],
      reactionsEnabled: 1,
      reactionRate: 0.03
    };
    this.setTool = this.setTool.bind(this);
    this.setToolSize = this.setToolSize.bind(this);
    this.setSolute = this.setSolute.bind(this);
    this.setViscosity = this.setViscosity.bind(this);
    this.setBoundaryWalls = this.setBoundaryWalls.bind(this);
    this.setActiveDiffusivity = this.setActiveDiffusivity.bind(this);
    this.setActiveColorR = this.setActiveColorR.bind(this);
    this.setActiveColorG = this.setActiveColorG.bind(this);
    this.setActiveColorB = this.setActiveColorB.bind(this);
    this.setReactionsEnabled = this.setReactionsEnabled.bind(this);
    this.setReactionRate = this.setReactionRate.bind(this);
    this.resetAllSolutes = this.resetAllSolutes.bind(this);
    this.resetFluid = this.resetFluid.bind(this);
    this.resetWalls = this.resetWalls.bind(this);
  }

  setTool(id) {
    this.setState({tool: id});
  }

  setToolSize(id, value) {
    const toolSizes = [...this.state.toolSizes];
    toolSizes[id] = value;
    this.setState({toolSizes: toolSizes});
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

  setDiffusivity(id, value) {
    const diffusivities = [...this.state.diffusivities];
    diffusivities[id] = value;
    this.setState({diffusivities: diffusivities});
  }

  setActiveDiffusivity(value) {
    this.setDiffusivity(this.state.solute, value);
  }

  setColor(id, value) {
    const colors = [...this.state.colors];
    colors[id] = value;
    this.setState({colors: colors});
  }

  setActiveColorR(value) {
    const color = this.state.colors[this.state.solute];
    color.r = value;
    this.setColor(this.state.solute, color);
  }

  setActiveColorG(value) {
    const color = this.state.colors[this.state.solute];
    color.g = value;
    this.setColor(this.state.solute, color);
  }

  setActiveColorB(value) {
    const color = this.state.colors[this.state.solute];
    color.b = value;
    this.setColor(this.state.solute, color);
  }

  setReactionsEnabled(id) {
    this.setState({reactionsEnabled: id});
  }

  setReactionRate(value) {
    this.setState({reactionRate: value});
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
    const reactionsEnabledBool = this.state.reactionsEnabled == 1;
    return (
      <div id="app">
        <div id="header">
          <img id="logo" src={SynBIMLogo} alt="SynBIM"/>
          <Toolbar 
            tool={this.state.tool} 
            setTool={this.setTool}
            toolSizes={this.state.toolSizes}
            setToolSize={this.setToolSize}
          />
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
                hasOverlay={true}
                resolution={this.state.resolution}
                velXCount={this.state.velXCount}
                velYCount={this.state.velYCount}
                tool={this.state.tool} 
                toolSize={this.state.toolSizes[this.state.tool]}
                solute={this.state.solute}
                viscosity={this.state.viscosity}
                diffusivities={this.state.diffusivities}
                colors={this.state.colors}
                leftRightWall={leftRightWall}
                topBottomWall={topBottomWall}
                exposeProgram={program => this.program = program}
                reactionsEnabled={reactionsEnabledBool}
                reactionRate={this.state.reactionRate}
              />
              <ToolOverlay
                toolSize={this.state.toolSizes[this.state.tool]}
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
              <div className="slider-horizontal-container">
                <SliderHorizontal
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
                    <div className="slider-horizontal-container">
                      <SliderHorizontal
                        value={this.state.colors[this.state.solute].r}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveColorR}
                        labeled={true}
                  />
                    </div>
                  </div>
                  <div className="solute-color-slider">
                    G
                    <div className="slider-horizontal-container">
                      <SliderHorizontal
                        value={this.state.colors[this.state.solute].g}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveColorG}
                        labeled={true}
                      />
                    </div>
                  </div>
                  <div className="solute-color-slider">
                    B
                    <div className="slider-horizontal-container">
                      <SliderHorizontal
                        value={this.state.colors[this.state.solute].b}
                        min={0}
                        max={255}
                        step={1}
                        decimals={0}
                        setValue={this.setActiveColorB}
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
              <div className="slider-horizontal-container">
                <SliderHorizontal
                  value={this.state.diffusivities[this.state.solute]}
                  min={0.05}
                  max={1}
                  step={0.01}
                  decimals={2}
                  setValue={this.setActiveDiffusivity}
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
            <div className="settings-title">
              <img src={IconReactionSettingsBlack} alt=""/>
              REACTION SETTINGS
              <hr/>
            </div>
            <div className="settings-subcontainer">
              <div className="settings-subtitle">ENABLE REACTION</div>
              <Selector
                values={["OFF", "ON"]}
                selection={this.state.reactionsEnabled}
                setSelection={this.setReactionsEnabled}
              />
            </div>
            {reactionsEnabledBool &&
              <div className="settings-subcontainer">
                <div className="settings-subtitle">REACTION RATE</div>
                <div className="slider-horizontal-container">
                  <SliderHorizontal
                    value={this.state.reactionRate}
                    min={0.01}
                    max={1}
                    step={0.01}
                    decimals={2}
                    setValue={this.setReactionRate}
                    labeled={true}
                  />
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;