import React from 'react';
import {Range, getTrackBackground} from 'react-range';
import './slider.css';

export default class Slider extends React.Component {
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
        className="slider"
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          outline: '0'
        }}
      >
        <Range
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
                height: '36px',
                display: 'flex',
                width: '100%',
                outline: '0'
              }}
            >
              <div
                ref={props.ref}
                style={{
                  height: '3px',
                  width: '100%',
                  borderRadius: '5px',
                  background: getTrackBackground({
                    values: [this.props.value],
                    colors: ['#000', '#ddd'],
                    min: this.props.min,
                    max: this.props.max
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
                borderColor: '#FFF',
                borderRadius: '15px',
                backgroundColor: '#000',
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
                  top: '-28px',
                  color: '#fff',
                  fontWeight: 400,
                  fontSize: '14px',
                  fontFamily: 'Arial,Helvetica Neue,Helvetica,sans-serif',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#000',
                  outline: '0'
                }}
              >
                {this.props.value.toFixed(this.props.decimals)}
              </div>
              <div
                style={{
                  height: '14px',
                  width: '14px',
                  borderRadius: '7px',
                  backgroundColor: isDragged ? '#FFF' : '#FFF',
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
