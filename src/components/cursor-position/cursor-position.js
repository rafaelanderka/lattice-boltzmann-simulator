import React from 'react';
import ReactDOM from 'react-dom';

export default class CursorPosition extends React.Component {
  constructor(props) {
    super(props);

    // Internal state for synchronous updates
    this.container = null;
    this.containerWidth = 0;
    this.containerHeight = 0;
    this.containerPos = {x: 0, y: 0};
    this.cursorPos = {x: 0, y: 0};
    this.lastCursorPos = {x: 0, y: 0};
    this.cursorVel = {x: 0, y: 0};
    this.isCursorActive = false;
    this.isCursorOver = false;

    // React state for asynchronous updates
    this.state = {
      isInitialised: false,
      containerWidth: 0,
      containerHeight: 0,
      cursorPos: {x: 0, y: 0},
      cursorVel: {x: 0, y:0},
      isCursorActive: false,
      isCursorOver: false
    };
  }

  // Helper function to get an element's exact position
  _getPosition(el) {
    let xPos = 0;
    let yPos = 0;
    
    while (el) {
      if (el.tagName == "BODY") {
        // Deal with browser quirks with body/window/document and page scroll
        let xScroll = el.scrollLeft || document.documentElement.scrollLeft;
        let yScroll = el.scrollTop || document.documentElement.scrollTop;
        xPos += (el.offsetLeft - xScroll + el.clientLeft);
        yPos += (el.offsetTop - yScroll + el.clientTop);
      } else {
        // For all other non-BODY elements  
        xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      }
      el = el.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
  }

  _setContainerState() {
    this.containerPos = this._getPosition(this.container);
    this.containerWidth = this.container.clientWidth;
    this.containerHeight = this.container.clientHeight;

    this.setState({
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight
    });
  }

  _setCursorState(e) {
    // Update the container state
    this._setContainerState();

    // Calculate updated cursor state
    this.lastCursorPos = this.cursorPos;
    this.cursorPos = {
      x: (e.clientX - this.containerPos.x) / this.container.clientWidth,
      y: 1.0 - ((e.clientY - this.containerPos.y)) / this.container.clientHeight
    };
    this.cursorVel = {
      x: this.cursorPos.x - this.lastCursorPos.x,
      y: this.cursorPos.y - this.lastCursorPos.y
    };

    // Update cursor state
    this.setState({
      cursorPos: this.cursorPos,
      cursorVel: this.cursorVel
    });
  }

  componentDidMount() {
    // Get the container
    this.container = ReactDOM.findDOMNode(this).parentNode;

    // Update container position
    this._setContainerState();

    // Handle mouse input
    this.container.addEventListener("mousemove", e => this._setCursorState(e), false);
    this.container.addEventListener("mousedown", () => {
      this.isCursorActive = true;
      this.setState({isCursorActive: this.isCursorActive});
      this.props.setIsCursorActive(true);
    });
    this.container.addEventListener("mouseup", () => {
      this.isCursorActive = false;
      this.setState({isCursorActive: this.isCursorActive});
      this.props.setIsCursorActive(false);
    });
    this.container.addEventListener("mouseenter", () => {
      this.isCursorOver = true;
      this.setState({isCursorOver: this.isCursorOver});
    });
    this.container.addEventListener("mouseleave", () => {
      this.isCursorActive = false;
      this.setState({isCursorActive: this.isCursorActive});
      this.props.setIsCursorActive(false);
      this.isCursorOver = false;
      this.setState({isCursorOver: this.isCursorOver});
    });


    // Handle touch input
    this.container.addEventListener("touchstart", e => { 
      this._setCursorState(e.targetTouches[0]);
      this.isCursorActive = true;
      this.setState({isCursorActive: this.isCursorActive});
      this.props.setIsCursorActive(true);
      this.isCursorOver = true;
      this.setState({isCursorOver: this.isCursorOver});
    });
    this.container.addEventListener("touchend", () => {
      this.isCursorActive = false;
      this.setState({isCursorActive: this.isCursorActive});
      this.props.setIsCursorActive(false);
      this.isCursorOver = false;
      this.setState({isCursorOver: this.isCursorOver});
    });
    this.container.addEventListener("touchmove", e => { 
      e.preventDefault();
      this._setCursorState(e.targetTouches[0]);
    }, false);

    // Handle resizing
    window.addEventListener("resize", () => this._setContainerState());

    this.setState({isInitialised: true});
  }

  render() {
    if (this.state.isInitialised) {
      // Add props to children
      const children = React.Children.map(this.props.children, child => {
        return React.cloneElement(child, {
          containerWidth: this.state.containerWidth,
          containerHeight: this.state.containerHeight,
          pixelRatio: window.devicePixelRatio || 1.0,
          cursorPos: this.state.cursorPos,
          cursorVel: this.state.cursorVel,
          isCursorActive: this.state.isCursorActive,
          isCursorOver: this.state.isCursorOver
        });
      });

      // Render children with added props
      return children;
    }

    return <div/>;
  }
}
