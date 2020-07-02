import React from 'react';
import './selector.css';

export default class Selector extends React.Component {
  constructor(props) {
    super(props);
    this.setSelection = this.setSelection.bind(this);
  }

  setSelection(id) {
    this.props.setSelection(id);
  }


  render() {
    let buttons = [];
    for (let i = 0; i < this.props.values.length; i++) {
      const className = "selector-button" + (this.props.selection == i ? " selector-button-active" : "");
      const onClick = () => this.setSelection(i);
      const button = (
        <button 
          key={i}
          className={className} 
          onClick={onClick}
        >
          {this.props.values[i]}
        </button>
      );
      buttons.push(button);
    }

    return (
      <div className="selector">
        {buttons}
      </div>
    );
  }
}