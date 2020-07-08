import React from 'react';
import './tool-overlay.css';

export default class ToolOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.xCorrection = -1;
    this.yCorrection = 4;
  }

  render() {
    const halfSize = this.props.toolSize * Math.min(this.props.containerWidth, this.props.containerHeight);
    const size = 2 * halfSize;
    return (
      <div 
        className="tool-overlay"
        style={{
          display: this.props.isCursorOver ? "block" : "none",
          width: size,
          height: size,
          left: this.props.cursorPos.x * this.props.containerWidth - halfSize + this.xCorrection,
          bottom: this.props.cursorPos.y * this.props.containerHeight + halfSize + this.yCorrection,
          borderRadius: halfSize
        }}
      />
    );
  }
}