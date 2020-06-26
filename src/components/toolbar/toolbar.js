import React from 'react';
import './toolbar.css';
import IconForceToolGrey from 'url:~/src/public/icon-force-tool-grey.png';
import IconWallToolGrey from 'url:~/src/public/icon-wall-tool-grey.png';
import IconWallEraserToolGrey from 'url:~/src/public/icon-wall-eraser-tool-grey.png';
import IconConcentrationToolGrey from 'url:~/src/public/icon-concentration-tool-grey.png';
import IconConcentrationEraserToolGrey from 'url:~/src/public/icon-concentration-eraser-tool-grey.png';
import IconForceToolWhite from 'url:~/src/public/icon-force-tool-white.png';
import IconWallToolWhite from 'url:~/src/public/icon-wall-tool-white.png';
import IconWallEraserToolWhite from 'url:~/src/public/icon-wall-eraser-tool-white.png';
import IconConcentrationToolWhite from 'url:~/src/public/icon-concentration-tool-white.png';
import IconConcentrationEraserToolWhite from 'url:~/src/public/icon-concentration-eraser-tool-white.png';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.useForceTool = this.useForceTool.bind(this);
    this.useWallTool = this.useWallTool.bind(this);
    this.useWallEraserTool = this.useWallEraserTool.bind(this);
    this.useConcentrationTool = this.useConcentrationTool.bind(this);
    this.useConcentrationEraserTool = this.useConcentrationEraserTool.bind(this);
  }

  useForceTool() {
    this.props.setTool(0);
  }

  useWallTool() {
    this.props.setTool(1);
  }

  useWallEraserTool() {
    this.props.setTool(2);
  }

  useConcentrationTool() {
    this.props.setTool(3);
  }

  useConcentrationEraserTool() {
    this.props.setTool(4);
  }


  render() {
    const tool0ClassName = "toolbar-button" + (this.props.tool == 0 ? " active" : "");
    const tool0Img = this.props.tool == 0 ? IconForceToolWhite : IconForceToolGrey;
    const tool1ClassName = "toolbar-button" + (this.props.tool == 1 ? " active" : "");
    const tool1Img = this.props.tool == 1 ? IconWallToolWhite : IconWallToolGrey;
    const tool2ClassName = "toolbar-button" + (this.props.tool == 2 ? " active" : "");
    const tool2Img = this.props.tool == 2 ? IconWallEraserToolWhite : IconWallEraserToolGrey;
    const tool3ClassName = "toolbar-button" + (this.props.tool == 3 ? " active" : "");
    const tool3Img = this.props.tool == 3 ? IconConcentrationToolWhite : IconConcentrationToolGrey;
    const tool4ClassName = "toolbar-button" + (this.props.tool == 4 ? " active" : "");
    const tool4Img = this.props.tool == 4 ? IconConcentrationEraserToolWhite : IconConcentrationEraserToolGrey;
    return (
      <div className="toolbar">
        <button className={tool0ClassName} onClick={this.useForceTool}><img src={tool0Img} alt="Force Tool"/></button>
        <button className={tool1ClassName} onClick={this.useWallTool}><img src={tool1Img} alt="Wall Tool"/></button>
        <button className={tool2ClassName} onClick={this.useWallEraserTool}><img src={tool2Img} alt="Wall Eraser Tool"/></button>
        <button className={tool3ClassName} onClick={this.useConcentrationTool}><img src={tool3Img} alt="Concentration Tool"/></button>
        <button className={tool4ClassName} onClick={this.useConcentrationEraserTool}><img src={tool4Img} alt="Concentration Eraser Tool"/></button>
      </div>
    );
  }
}