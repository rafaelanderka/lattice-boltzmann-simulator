import React from 'react';
import './tool-overlay.css';

export default class ToolOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.xCorrection = -1;
    this.yCorrection = -3;
  }

  render() {
    const halfSize = this.props.toolSize * Math.min(this.props.containerWidth, this.props.containerHeight);
    const size = 2 * halfSize;
    const left = this.props.isChangingSize 
                 ? this.props.containerWidth * 0.5 - halfSize + this.xCorrection
                 : this.props.cursorPos.x * this.props.containerWidth * 1.005 - halfSize + this.xCorrection;
    const bottom = this.props.isChangingSize 
                   ? this.props.containerHeight * 0.5 + halfSize + this.yCorrection
                   : this.props.cursorPos.y * this.props.containerHeight * 1.005 + halfSize + this.yCorrection;
    return (
      <div 
        className="tool-overlay"
        style={{
          display: this.props.isCursorOver || this.props.isChangingSize ? "block" : "none",
          width: size,
          height: size,
          left: left,
          bottom: bottom,
          borderRadius: halfSize
        }}
      />
    );
  }
}