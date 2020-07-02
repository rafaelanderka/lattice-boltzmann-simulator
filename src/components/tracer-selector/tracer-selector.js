import React from 'react';
import './tracer-selector.css';

export default class TracerSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
  }

  render() {
    const containerClassName = "tracer-selector-border" + (this.props.isActive ? " tracer-selector-border-active" : "");
    return (
      <div className={containerClassName}>
        <button className="tracer-selector" onClick={this.props.setTracer} style={{backgroundColor: this.rgbToHex(this.props.color)}} />
      </div>
    );
  }
}