import React from 'react';
import IconExpander from 'url:~/src/public/icon-expander-black.png';
import './settings-card.css';

export default class SettingsCard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const classNameContainer = "settings-card-container" + (this.props.isExpanded ? "" : " inactive");
    const classNameExpander = "settings-card-expander" + (this.props.isExpanded ? "" : " settings-card-expander-inactive");
    const classNameChildren = "settings-card-children" + (this.props.isExpanded ? "" : " settings-card-children-hidden");
    return (
      <div className={classNameContainer}>
        <div className="settings-card-subcontainer">
          <div className="settings-card-title">
            <button onClick={this.props.toggleExpansion}>
              <img className={classNameExpander} src={IconExpander} alt=""/>
              <img className="settings-card-icon" src={this.props.icon} alt=""/>
              {this.props.title}
            </button>
            <hr/>
          </div>
          <div className={classNameChildren}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}