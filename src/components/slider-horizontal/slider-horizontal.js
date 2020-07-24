import React from 'react';
import {Range, getTrackBackground} from 'react-range';

export default class SliderHorizontal extends React.Component {
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
                  height: '2.5px',
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
                  top: '-24px',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '11px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
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
                  height: '15px',
                  width: '15px',
                  borderRadius: '8px',
                  backgroundColor: isDragged ? '#000' : '#FFF',
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
