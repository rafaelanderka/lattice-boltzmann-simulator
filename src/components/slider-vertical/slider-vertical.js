import React from 'react';
import {Range, Direction, getTrackBackground} from 'react-range';

export default class SliderVertical extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(values) {
    this.props.setValue(values[0]);
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          outline: '0'
        }}
      >
        <Range
          direction={Direction.Up}
          values={[this.props.value]}
          step={this.props.step}
          min={this.props.min}
          max={this.props.max}
          onChange={this.handleChange}
          renderTrack={({ props, children }) => (
            <div
              onMouseDown={props.onMouseDown}
              onTouchStart={props.onTouchStart}
              style={{
                ...props.style,
                flexGrow: 1,
                height: '36px',
                display: 'flex',
                width: '100%',
                height: '100%',
                outline: '0'
              }}
            >
              <div
                ref={props.ref}
                style={{
                  width: '2.5px',
                  height: '100%',
                  borderRadius: '5px',
                  background: getTrackBackground({
                    values: [this.props.value],
                    colors: ['black', '#CCC'],
                    min: this.props.min,
                    max: this.props.max,
                    direction: Direction.Up
                  }),
                  alignSelf: 'center',
                  outline: '0'
                }}
              >
                {children}
              </div>
            </div>
          )}
          renderThumb={({ props, isDragged }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: '20px',
                width: '20px',
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: 'white',
                borderRadius: '23px',
                backgroundColor: 'black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                outline: '0'
              }}
            >
              <div
                style={{
                  display: this.props.labeled ? 'block' : 'none',
                  position: 'absolute',
                  left: '25px',
                  color: 'white',
                  fontWeight: 400,
                  fontSize: '11px',
                  fontFamily: 'Arial,Helvetica Neue,Helvetica,sans-serif',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'black',
                  outline: '0'
                }}
              >
                {this.props.value.toFixed(this.props.decimals)}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  height: '16px',
                  width: '16px',
                  borderRadius: '16px',
                  backgroundColor: isDragged ? 'black' : 'white',
                  outline: '0'
                }}
              />
            </div>
          )}
        />
      </div>
    );
  }
}
