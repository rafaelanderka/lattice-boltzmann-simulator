export default `
  // FRAGMENT SHADER

  precision highp float;

  uniform vec2 uCursorPos;
  
  varying vec2 vUV; 
  
  void main(void) {
    if (length(uCursorPos - vUV) < 0.1) {
      gl_FragColor = vec4(1.0 - uCursorPos, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(vUV, 0.0, 1.0);
    }
  }
`;