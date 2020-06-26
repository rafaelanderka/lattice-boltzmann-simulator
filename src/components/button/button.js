import React from 'react';
import './button.css';

export default class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isActive: false
    }

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.state.isActive) {
      this.setState({isActive: false});
    } else {
      this.setState({isActive: true});
    }
  }

  render() {
    const className = "button" + (this.state.isActive ? " active" : "");
    const img = this.state.isActive ? this.props.activeImage : this.props.image;
    return (
      <button className={className} onClick={this.handleClick}><img src={img} alt={this.props.altText}/></button>
    );
  }
}