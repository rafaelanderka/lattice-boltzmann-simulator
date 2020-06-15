export default `
  // FRAGMENT SHADER

  precision highp float;

  uniform vec2 uMousePos;
  varying vec2 vUV; 
  
  void main(void) {
    if (length(uMousePos - vUV) < 0.1) {
      gl_FragColor = vec4(1.0 - uMousePos, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(uMousePos, 0.0, 1.0);
    }
  }
`;