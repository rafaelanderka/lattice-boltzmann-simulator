export default `
  // FRAGMENT SHADER

  // Draws a circle for testing purposes

  precision highp float;

  uniform float uXAspect;
  uniform float uYAspect;

  varying vec2 vUV; 
  
  void main(void) {
    vec2 center = vec2(uXAspect * 0.5, uYAspect * 0.5);
    vec2 newUV = vec2(uXAspect * vUV.x, uYAspect * vUV.y);
    float dist = length(newUV - center);
    if (dist < 0.1) {
      gl_FragColor = vec4(1.0);
    } else {
      gl_FragColor = vec4(0.0);
    }
  }
`;