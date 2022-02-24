import React from "react";
import WebGL from "../webgl/webgl";
import Toolbar from "../toolbar/toolbar";
import Button from "../button/button";
import HeaderButton from "../header-button/header-button";
import SettingsCard from "../settings-card/settings-card";
import Selector from "../selector/selector";
import SoluteSelector from "../solute-selector/solute-selector";
import SliderHorizontal from "../slider-horizontal/slider-horizontal";
import CursorPositon from "../cursor-position/cursor-position";
import ToolOverlay from "../tool-overlay/tool-overlay";
import FluidSimulatorLogo from 'url:~/src/public/logo192.png';
import SynBIMLogo from 'url:~/src/public/synbim-logo.png';
import BiofmLogo from 'url:~/src/public/biofm-logo.png';
import EPSRCLogo from 'url:~/src/public/epsrc-logo.png';
import UoELogo from 'url:~/src/public/uoe-logo.png';
import RALogo from 'url:~/src/public/ra-logo.png';
import GitHubLogo from 'url:~/src/public/github-logo.png';
import IconFluidSettingsWhite from 'url:~/src/public/icon-fluid-settings-black.png';
import IconSoluteSettingsWhite from 'url:~/src/public/icon-solute-settings-black.png';
import IconReactionSettingsWhite from 'url:~/src/public/icon-reaction-settings-black.png';
import IconAboutBlack from 'url:~/src/public/icon-about-black.png';
import IconAboutWhite from 'url:~/src/public/icon-about-white.png';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      viewportWidth: 0,
      viewportHeight: 0,
      aspect: 1,
      isMounted: false,
      resolution: 256,
      stepsPerUpdate: 4,
      activeSetttings: 0,
      tool: 0,
      toolSizes: [0.1, 0.04, 0.05, 0.1, 0.12],
      isToolActive: false,
      solute: 0,
      soluteCount: 3,
      viscosity: 0.1,
      boundaryWalls: 0,
      diffusivities: [0.02, 0.02, 0.02],
      colors: [{r: 255, g: 200, b: 0}, {r: 100, g: 0, b: 255}, {r: 100, g: 255, b: 200}],
      areReactionsEnabled: true,
      reactionRate: 0.01,
      overlayType: 0,
      toolbarDropdown: false,
      aboutOverlay: false
    };

    this.updateViewportDimensions = this.updateViewportDimensions.bind(this);
    this.setTool = this.setTool.bind(this);
    this.setToolSize = this.setToolSize.bind(this);
    this.setIsToolActive = this.setIsToolActive.bind(this);
    this.setSolute = this.setSolute.bind(this);
    this.setViscosity = this.setViscosity.bind(this);
    this.setBoundaryWalls = this.setBoundaryWalls.bind(this);
    this.setActiveDiffusivity = this.setActiveDiffusivity.bind(this);
    this.setActiveColorR = this.setActiveColorR.bind(this);
    this.setActiveColorG = this.setActiveColorG.bind(this);
    this.setActiveColorB = this.setActiveColorB.bind(this);
    this.setReactionsEnabled = this.setReactionsEnabled.bind(this);
    this.setReactionRate = this.setReactionRate.bind(this);
    this.setOverlayType = this.setOverlayType.bind(this);
    this.setToolbarDropdown = this.setToolbarDropdown.bind(this);
    this.toggleAbout = this.toggleAbout.bind(this);
    this.resetAllSolutes = this.resetAllSolutes.bind(this);
    this.resetFluid = this.resetFluid.bind(this);
    this.resetNodeIds = this.resetNodeIds.bind(this);
  }

  updateViewportDimensions() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    this.setState({
      viewportWidth: vw,
      viewportHeight: vh,
      aspect: vw / vh
    });
  }

  setActiveSettings(id) {
    this.setState({activeSetttings: id});
  }

  setTool(id) {
    this.setState({tool: id});
  }

  setToolSize(id, value) {
    const toolSizes = [...this.state.toolSizes];
    toolSizes[id] = value;
    this.setState({toolSizes: toolSizes});
  }

  setIsToolActive(value) {
    this.setState({isToolActive: value});
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
    this.setState({areReactionsEnabled: id == 1});
  }

  setReactionRate(value) {
    this.setState({reactionRate: value});
  }

  setOverlayType(id) {
    this.setState({overlayType: id});
  }

  setToolbarDropdown(value) {
    this.setState({toolbarDropdown: value});
  }

  toggleAbout() {
    this.setState({aboutOverlay: !this.state.aboutOverlay});
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

  resetNodeIds() {
    this.setState({boundaryWalls: 0});
    this.program.resetNodeIds();
  }

  rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
  }

  renderHeader() {
    return (
        <div id="header">
          <div id="header-tools-container">
            {this.renderLogo()}
            <Toolbar 
              tool={this.state.tool} 
              setTool={this.setTool}
              toolSizes={this.state.toolSizes}
              setToolSize={this.setToolSize}
              setDropdownActive={this.setToolbarDropdown}
              isToolActive={this.state.isToolActive}
            />
            <div className="solute-selectors-container header-selectors">
              <SoluteSelector
                color={this.state.colors[0]}
                setSolute={() => this.setSolute(0)}
                isActive={this.state.solute == 0}
              />
              {this.state.areReactionsEnabled && <div className="reaction-symbol" style={{marginBottom: 2}}>+</div>}
              <SoluteSelector
                color={this.state.colors[1]}
                setSolute={() => this.setSolute(1)}
                isActive={this.state.solute == 1}
              />
              {this.state.areReactionsEnabled && <div className="reaction-symbol">→</div>}
              <SoluteSelector
                color={this.state.colors[2]}
                setSolute={() => this.setSolute(2)}
                isActive={this.state.solute == 2}
              />
            </div>
          </div>
          <div id="header-buttons-container">
            <HeaderButton
              image={IconAboutBlack}
              activeImage={IconAboutWhite}
              onClick={this.toggleAbout}
              isActive={this.state.aboutOverlay}
              altText="About"
            />
          </div>
        </div>
    );
  }

  renderLogo() {
    return (
      <div 
        className="logo-container"
        onClick={this.toggleAbout}
      >
        <img className="logo" src={FluidSimulatorLogo} alt="SynBIM"/>
      </div>
    );
  }

  renderMain() {
    const isRowLayout = this.state.viewportWidth > 1050 || this.state.aspect > 0.9;
    const className = isRowLayout ? "main-row" : "main-column";
    return (
      <div id={className}>
        {this.renderWebGL()}
        {this.renderSettings()}
      </div>
    );
  }

  renderWebGL() {
    const isPortrait = this.state.viewportWidth > 1050 || this.state.aspect > 0.9;
    const className = isPortrait ? "webgl-container-portrait" : "webgl-container-landscape";
    const hasVerticalWalls = (this.state.boundaryWalls == 1 || this.state.boundaryWalls == 3) ? true : false;
    const hasHorizontalWalls = (this.state.boundaryWalls == 2 || this.state.boundaryWalls == 3) ? true : false;
    return (
      <div id={className}>
        <CursorPositon
          setIsCursorActive={this.setIsToolActive}
        >
          <WebGL 
            id="webgl" 
            program="lbm"
            hasOverlay={true}
            resolution={this.state.resolution}
            stepsPerUpdate={this.state.stepsPerUpdate}
            tool={this.state.tool} 
            toolSize={this.state.toolSizes[this.state.tool]}
            solute={this.state.solute}
            viscosity={this.state.viscosity}
            diffusivities={this.state.diffusivities}
            colors={this.state.colors}
            hasVerticalWalls={hasVerticalWalls}
            hasHorizontalWalls={hasHorizontalWalls}
            exposeProgram={program => this.program = program}
            areReactionsEnabled={this.state.areReactionsEnabled}
            reactionRate={this.state.reactionRate}
            overlayType={this.state.overlayType}
          />
          <ToolOverlay
            toolSize={this.state.toolSizes[this.state.tool]}
            isChangingSize={this.state.toolbarDropdown && !this.state.isToolActive}
          />
        </CursorPositon>
      </div>
    );
  }

  renderSettings() {
    const isColumnLayout = this.state.viewportWidth > 1050 || this.state.aspect > 0.9;
    const className = isColumnLayout ? "settings-container-column" : "settings-container-row";
    return (
      <div id={className}>
        {this.renderFluidSettingsCard(!isColumnLayout)}
        {!isColumnLayout && <div className="settings-spacer"/>}
        {this.renderSoluteSettingsCard(!isColumnLayout)}
        {!isColumnLayout && <div className="settings-spacer"/>}
        {this.renderReactionSettingsCard(!isColumnLayout)}
      </div>
    );
  }

  renderFluidSettingsCard(alwaysExpanded) {
    const isReducedCard = this.state.viewportWidth < 830;
    const title = isReducedCard ? "FLUID" : "FLUID SETTINGS"
    const velocityFieldLabel = isReducedCard ? "FLOW FIELD" : "FLOW FIELD VISUALIZATION";
    const isColumnLayout = this.state.viewportWidth > 1050 || this.state.aspect > 0.9;
    const hasReducedBoundaryLabels = (this.state.viewportWidth < 990 && !isColumnLayout) || (this.state.viewportWidth < 1030 && isColumnLayout);
    const boundaryHorizontalLabel = hasReducedBoundaryLabels ? "|" : "VERTICAL";
    const boundaryVerticalLabel = hasReducedBoundaryLabels ? "—" : "HORIZONTAL";
    return (
      <SettingsCard
        title={title}
        icon={IconFluidSettingsWhite}
        isExpanded={this.state.activeSetttings == 0 || alwaysExpanded}
        toggleExpansion={() => this.setActiveSettings(0)}
      >
        <div className="settings-subcontainer">
          <div className="settings-subtitle">VISCOSITY</div>
          <div className="slider-horizontal-container">
            <SliderHorizontal
              value={this.state.viscosity}
              min={0.03}
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
            values={["OFF", boundaryHorizontalLabel, boundaryVerticalLabel, "ALL"]}
            selection={this.state.boundaryWalls}
            setSelection={this.setBoundaryWalls}
          />
        </div>
        <div className="settings-subcontainer">
          <div className="settings-subtitle">{velocityFieldLabel}</div>
          <Selector
            values={["OFF", "LINES", "ARROWS"]}
            selection={this.state.overlayType}
            setSelection={this.setOverlayType}
          />
        </div>
        <div className="settings-subcontainer">
          <div className="settings-subtitle">RESET</div>
          <div className="reset-buttons-container">
            <div className="reset-button">
              <Button 
                text="RESET FLUID"
                onClick={this.resetFluid} 
                color="black"
              />
            </div>
            <div className="reset-button">
              <Button 
                text="RESET WALLS"
                onClick={this.resetNodeIds} 
                color="black"
              />
            </div>
          </div>
        </div>
      </SettingsCard>
    );
  }

  renderSoluteSettingsCard(alwaysExpanded) {
    const isReducedCard = this.state.viewportWidth < 830;
    const title = isReducedCard ? "SOLUTES" : "SOLUTE SETTINGS"
    return (
      <SettingsCard
        title={title}
        icon={IconSoluteSettingsWhite}
        isExpanded={this.state.activeSetttings == 1 || alwaysExpanded}
        toggleExpansion={() => this.setActiveSettings(1)}
      >
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
                <div className="slider-horizontal-unlabeled-container">
                  <SliderHorizontal
                    value={this.state.colors[this.state.solute].r}
                    min={0}
                    max={255}
                    step={1}
                    decimals={0}
                    setValue={this.setActiveColorR}
                    labeled={false}
              />
                </div>
              </div>
              <div className="solute-color-slider">
                G
                <div className="slider-horizontal-unlabeled-container">
                  <SliderHorizontal
                    value={this.state.colors[this.state.solute].g}
                    min={0}
                    max={255}
                    step={1}
                    decimals={0}
                    setValue={this.setActiveColorG}
                    labeled={false}
                  />
                </div>
              </div>
              <div className="solute-color-slider">
                B
                <div className="slider-horizontal-unlabeled-container">
                  <SliderHorizontal
                    value={this.state.colors[this.state.solute].b}
                    min={0}
                    max={255}
                    step={1}
                    decimals={0}
                    setValue={this.setActiveColorB}
                    labeled={false}
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
              min={0.01}
              max={1}
              step={0.01}
              decimals={2}
              setValue={this.setActiveDiffusivity}
              labeled={true}
              />
          </div>
        </div>
        <div className="settings-subcontainer">
          <div className="settings-subtitle">RESET</div>
          <div className="reset-buttons-container">
            <div className="reset-button">
              <Button 
                text="CLEAR SOLUTE"
                onClick={() => this.program.resetSolute(this.state.solute)} 
                color="black"
              />
            </div>
            <div className="reset-button">
              <Button 
                text="CLEAR ALL SOLUTES"
                onClick={this.resetAllSolutes} 
                color="rgb(100,0,255)"
              />
            </div>
          </div>
        </div>
      </SettingsCard>
    );
  }

  renderReactionSettingsCard(alwaysExpanded) {
    const isReducedCard = this.state.viewportWidth < 830;
    const title = isReducedCard ? "REACTIONS" : "REACTION SETTINGS"
    return (
      <SettingsCard
        title={title}
        icon={IconReactionSettingsWhite}
        isExpanded={this.state.activeSetttings == 2 || alwaysExpanded}
        toggleExpansion={() => this.setActiveSettings(2)}
      >
        <div className="settings-subcontainer">
          <div className="settings-subtitle">ENABLE REACTION</div>
          <Selector
            values={["OFF", "ON"]}
            selection={this.state.areReactionsEnabled}
            setSelection={this.setReactionsEnabled}
          />
        </div>
        {this.state.areReactionsEnabled &&
          <div className="settings-subcontainer">
            <div className="settings-subtitle">REACTION RATE</div>
            <div className="slider-horizontal-container">
              <SliderHorizontal
                value={this.state.reactionRate}
                min={0.}
                max={1}
                step={0.001}
                decimals={2}
                setValue={this.setReactionRate}
                labeled={true}
              />
            </div>
          </div>
        }
      </SettingsCard>
    );
  }

  renderAboutOverlay() {
    return (
      <div 
        id="about-overlay"
        style={{
          opacity: this.state.aboutOverlay ? 1 : 0,
          pointerEvents: this.state.aboutOverlay ? "all" : "none"
        }}
      >
        <div
          id="about-overlay-button" 
          onClick={this.toggleAbout}
          style={{
            display: this.state.aboutOverlay ? "block" : "none"
          }}
        />
        <div 
          id="about-overlay-popup"
          style={{
            transform: this.state.aboutOverlay ? "none" : "translate(0px, 300px)",
          }}
        >
          <div className="about-overlay-supporters">
            <div className="about-overlay-center">
              <p>DEVELOPED FOR</p>
              <img id="about-overlay-synbim-logo" src={SynBIMLogo}/>
            </div>
            <div className="about-overlay-center">
              <p>FUNDED BY</p>
              <a href="https://epsrc.ukri.org/">
                <img id="about-overlay-epsrc-logo" src={EPSRCLogo}/>
              </a>
            </div>
          </div>
          <div className="about-overlay-center">
            <p>SUPPORTED BY</p>
            <div className="about-overlay-supporters">
              <a href="https://www.ed.ac.uk/">
                <img id="about-overlay-uoe-logo" src={UoELogo}/>
              </a>
              <img id="about-overlay-biofm-logo" src={BiofmLogo}/>
            </div>
          </div>
          <div className="about-overlay-supporters">
            <div className="about-overlay-center">
              <p>CODE BY</p>
              <a href="https://rafaelanderka.com/">
                <img id="about-overlay-ra-logo" src={RALogo}/>
              </a>
            </div>
          {this.renderSourceButton()}
          </div>
        </div>
      </div>
    );
  }

  renderSourceButton() {
    return (
      <div 
        id="about-overlay-source"
        onClick={() => window.location="https://github.com/rafaelanderka/lattice-boltzmann-simulator"}
      >
        <p>OPEN SOURCE</p>
        <a href="https://github.com/rafaelanderka/lattice-boltzmann-simulator">
          <img id="about-overlay-github-logo" src={GitHubLogo}/>
        </a>
        <div id="about-overlay-source-shine"/>
      </div>
    );
  }

  componentDidMount() {
    this.updateViewportDimensions();
    window.addEventListener('resize', this.updateViewportDimensions);
    this.setState({isMounted: true});
  }

  render() {
    if (this.state.isMounted) {
      const deviceSupported = this.state.viewportWidth >= 685 && this.state.viewportHeight >= 300 && (this.state.viewportHeight >= 565 || this.state.aspect > 2.5);
      if (deviceSupported) {
        return (
          <div id="app" className="noselect">
            {this.renderHeader()}
            {this.renderMain()}
            {this.renderAboutOverlay()}
          </div>
        );
      } else {
        return (
          <div id="app-not-supported" className="gradient-background">
            <div id="app-not-supported-container">
              <h1>DEVICE NOT SUPPORTED</h1>
              <p>PLEASE COME BACK WITH A LARGER SCREEN.</p>
            </div>
          </div>
        );
      }
    } else {
      return null;
    }
  }
}

export default App;