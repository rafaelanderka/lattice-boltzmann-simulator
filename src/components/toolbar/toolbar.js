import React from 'react';
import SliderVertical from "../slider-vertical/slider-vertical";
import IconForceToolBlack from 'url:~/src/public/icon-force-tool-black.png';
import IconWallToolBlack from 'url:~/src/public/icon-wall-tool-black.png';
import IconWallEraserToolBlack from 'url:~/src/public/icon-wall-eraser-tool-black.png';
import IconConcentrationToolBlack from 'url:~/src/public/icon-concentration-tool-black.png';
import IconConcentrationEraserToolBlack from 'url:~/src/public/icon-concentration-eraser-tool-black.png';
import IconForceToolWhite from 'url:~/src/public/icon-force-tool-white.png';
import IconWallToolWhite from 'url:~/src/public/icon-wall-tool-white.png';
import IconWallEraserToolWhite from 'url:~/src/public/icon-wall-eraser-tool-white.png';
import IconConcentrationToolWhite from 'url:~/src/public/icon-concentration-tool-white.png';
import IconConcentrationEraserToolWhite from 'url:~/src/public/icon-concentration-eraser-tool-white.png';
import './toolbar.css';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    // Synchronous state
    this.dropdowns = [false, false, false, false, false];

    // Asynchronous React state
    this.state = {
      dropdowns: this.dropdowns
    }
  }

  useTool(id) {
    this.props.setTool(id);
    this.dropdowns[id] = true;
    this.setState({dropdowns: this.dropdowns});
  }

  enableDropdown(id) {
    this.dropdowns[id] = this.props.tool == id;
    this.setState({dropdowns: this.dropdowns});
  }

  disableDropdown(id) {
    this.dropdowns[id] = false;
    this.setState({dropdowns: this.dropdowns});
  }

  render() {
    const tool0ContainerClassName = "toolbar-button-container toolbar-button-container-leftmost" + (this.state.dropdowns[0] ? " toolbar-button-container-dropdown toolbar-button-container-dropdown-leftmost" : "");
    const tool0ButtonClassName = "toolbar-button" + (this.props.tool == 0 ? " toolbar-button-active" : "");
    const tool0Img = this.props.tool == 0 ? IconForceToolWhite : IconForceToolBlack;

    const tool1ContainerClassName = "toolbar-button-container toolbar-button-container-inner" + (this.state.dropdowns[1] ? " toolbar-button-container-dropdown toolbar-button-container-dropdown-inner" : "");
    const tool1ButtonClassName = "toolbar-button" + (this.props.tool == 1 ? " toolbar-button-active" : "");
    const tool1Img = this.props.tool == 1 ? IconWallToolWhite : IconWallToolBlack;

    const tool2ContainerClassName = "toolbar-button-container toolbar-button-container-inner" + (this.state.dropdowns[2] ? " toolbar-button-container-dropdown toolbar-button-container-dropdown-inner" : "");
    const tool2ButtonClassName = "toolbar-button" + (this.props.tool == 2 ? " toolbar-button-active" : "");
    const tool2Img = this.props.tool == 2 ? IconWallEraserToolWhite : IconWallEraserToolBlack;

    const tool3ContainerClassName = "toolbar-button-container toolbar-button-container-inner" + (this.state.dropdowns[3] ? " toolbar-button-container-dropdown toolbar-button-container-dropdown-inner" : "");
    const tool3ButtonClassName = "toolbar-button" + (this.props.tool == 3 ? " toolbar-button-active" : "");
    const tool3Img = this.props.tool == 3 ? IconConcentrationToolWhite : IconConcentrationToolBlack;
    
    const tool4ContainerClassName = "toolbar-button-container toolbar-button-container-rightmost" + (this.state.dropdowns[4] ? " toolbar-button-container-dropdown toolbar-button-container-dropdown-rightmost" : "");
    const tool4ButtonClassName = "toolbar-button" + (this.props.tool == 4 ? " toolbar-button-active" : "");
    const tool4Img = this.props.tool == 4 ? IconConcentrationEraserToolWhite : IconConcentrationEraserToolBlack;
    
    return (
      <div className="toolbar">
        <div 
          className={tool0ContainerClassName}
          onMouseEnter={() => this.enableDropdown(0)}
          onMouseLeave={() => this.disableDropdown(0)}
          style={{
            left: 0
          }}
        >
          <button className={tool0ButtonClassName} onClick={() => this.useTool(0)}>
            <img src={tool0Img} alt="Force Tool"/>
          </button>
          <div className="toolbar-dropdown">
            <div className="toolbar-dropdown-slider">
              <SliderVertical
                value={this.props.toolSizes[0]}
                min={0.0025}
                max={0.15}
                step={0.0005}
                decimals={2}
                setValue={(value) => this.props.setToolSize(0, value)}
                labeled={false}
              />
            </div>
          </div>
        </div>
        <div 
          className={tool1ContainerClassName}
          onMouseEnter={() => this.enableDropdown(1)}
          onMouseLeave={() => this.disableDropdown(1)}
          style={{
            left: -2
          }}
        >
          <button className={tool1ButtonClassName} onClick={() => this.useTool(1)}>
            <img src={tool1Img} alt="Wall Tool"/>
          </button>
          <div className="toolbar-dropdown">
            <div className="toolbar-dropdown-slider">
              <SliderVertical
                value={this.props.toolSizes[1]}
                min={0.0025}
                max={0.15}
                step={0.0005}
                decimals={2}
                setValue={(value) => this.props.setToolSize(1, value)}
                labeled={false}
              />
            </div>
          </div>
        </div>
        <div 
          className={tool2ContainerClassName}
          onMouseEnter={() => this.enableDropdown(2)}
          onMouseLeave={() => this.disableDropdown(2)}
          style={{
            left: -4
          }}
        >
          <button className={tool2ButtonClassName} onClick={() => this.useTool(2)}>
            <img src={tool2Img} alt="Wall Eraser Tool"/>
          </button>
          <div className="toolbar-dropdown">
            <div className="toolbar-dropdown-slider">
              <SliderVertical
                value={this.props.toolSizes[2]}
                min={0.0025}
                max={0.15}
                step={0.0005}
                decimals={2}
                setValue={(value) => this.props.setToolSize(2, value)}
                labeled={false}
              />
            </div>
          </div>
        </div>
        <div 
          className={tool3ContainerClassName}
          onMouseEnter={() => this.enableDropdown(3)}
          onMouseLeave={() => this.disableDropdown(3)}
          style={{
            left: -6
          }}
        >
          <button className={tool3ButtonClassName} onClick={() => this.useTool(3)}>
            <img src={tool3Img} alt="Concentration Tool"/>
          </button>
          <div className="toolbar-dropdown">
            <div className="toolbar-dropdown-slider">
              <SliderVertical
                value={this.props.toolSizes[3]}
                min={0.0025}
                max={0.15}
                step={0.0005}
                decimals={2}
                setValue={(value) => this.props.setToolSize(3, value)}
                labeled={false}
              />
            </div>
          </div>
        </div>
        <div 
          className={tool4ContainerClassName}
          onMouseEnter={() => this.enableDropdown(4)}
          onMouseLeave={() => this.disableDropdown(4)}
          style={{
            left: -8
          }}
        >
          <button className={tool4ButtonClassName} onClick={() => this.useTool(4)}>
            <img src={tool4Img} alt="Concentration Eraser Tool"/>
          </button>
          <div className="toolbar-dropdown">
            <div className="toolbar-dropdown-slider">
              <SliderVertical
                value={this.props.toolSizes[4]}
                min={0.0025}
                max={0.15}
                step={0.0005}
                decimals={2}
                setValue={(value) => this.props.setToolSize(4, value)}
                labeled={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}