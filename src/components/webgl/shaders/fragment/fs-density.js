export default `
  // FRAGMENT SHADER

  // Calculates the macroscopic density

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uDensity;
  uniform sampler2D uDistFunc;

  varying vec2 vUV; 
  
  void main(void) {
    vec4 nodalDistFunc = texture2D(uDistFunc, vUV);
    float density = texture2D(uDensity, vUV).x + nodalDistFunc.x + nodalDistFunc.y + nodalDistFunc.z + nodalDistFunc.w;
    gl_FragColor = vec4(density, 0.0, 0.0, 0.0);
  }
`;