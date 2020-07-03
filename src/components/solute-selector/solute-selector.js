import React from 'react';
import './solute-selector.css';

export default class SoluteSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
  }

  render() {
    const containerClassName = "solute-selector-border" + (this.props.isActive ? " solute-selector-border-active" : "");
    return (
      <div className={containerClassName}>
        <button className="solute-selector" onClick={this.props.setSolute} style={{backgroundColor: this.rgbToHex(this.props.color)}} />
      </div>
    );
  }
}