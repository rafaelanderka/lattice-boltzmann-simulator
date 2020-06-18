export default `
  // FRAGMENT SHADER

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uX;
  varying vec2 vUV; 
  
  void main(void) {
    vec4 val = texture2D(uX, vUV);
    float valGrayscale = 0.3 * val.x + 0.59 * val.y + 0.11 * val.z;
    gl_FragColor = vec4(valGrayscale, valGrayscale, valGrayscale, val.w);
  }
`;