export default `
  // FRAGMENT SHADER

  // Draws a circle for testing purposes

  precision highp float;

  varying vec2 vUV; 
  
  void main(void) {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(vUV - center);
    if (dist < 0.1 && dist > 0.09) {
      gl_FragColor = vec4(1.0);
    } else {
      gl_FragColor = vec4(0.0);
    }
  }
`;