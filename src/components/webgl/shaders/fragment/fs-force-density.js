export default `
  // FRAGMENT SHADER

  // Applies a force density based on the cursor position

  precision highp float;

  uniform bool uIsActive;
  uniform vec2 uCursorPos;
  uniform vec2 uCursorVel;

  varying vec2 vUV; 
  
  void main(void) {
    float dist = length(uCursorPos - vUV);
    float threshold = 0.1;
    if (uIsActive && dist < threshold) {
      float coeff = 2.0 * (1.0 - dist / threshold);
      gl_FragColor = vec4(coeff * uCursorVel.x, coeff * uCursorVel.y, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;