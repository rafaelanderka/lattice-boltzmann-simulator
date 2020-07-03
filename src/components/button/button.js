import React from 'react';
import './button.css';

export default class Button extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button 
        className="button" 
        onClick={this.props.onClick}
        style={{color: this.props.color, borderColor: this.props.color}}
      >
        {this.props.text}
      </button>
    );
  }
}