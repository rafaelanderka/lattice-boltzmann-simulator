export default `
  // FRAGMENT SHADER

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uX;

  varying vec2 vUV; 
  
  void main(void) {
    gl_FragColor = texture2D(uX, vUV);
  }
`;