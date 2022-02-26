import React from 'react';
import './header-button.css';

export default class HeaderButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const className = "header-button" + (this.props.isActive ? " header-button-active" : "");
    const img = this.props.isActive ? this.props.activeImage : this.props.image;
    return (
      <button className={className} onClick={this.props.onClick}>
        { img === undefined
          ? this.props.text
          : <img src={img} alt={this.props.altText}/>
        }
      </button>
    );
  }
}