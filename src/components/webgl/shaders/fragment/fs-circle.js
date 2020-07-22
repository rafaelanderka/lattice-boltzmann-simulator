export default `
  // FRAGMENT SHADER

  // Draws a circle for testing purposes

  precision highp float;

  uniform float uXAspect;
  uniform float uYAspect;
  uniform float uRadius;
  uniform vec2 uCenter;

  varying vec2 vUV; 
  
  void main(void) {
    vec2 newUV = vec2(uXAspect * vUV.x, uYAspect * vUV.y);
    float dist = length(newUV - uCenter);
    if (dist < uRadius) {
      gl_FragColor = vec4(1.0);
    } else {
      gl_FragColor = vec4(0.0);
    }
  }
`;