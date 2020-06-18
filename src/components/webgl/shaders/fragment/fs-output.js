export default `
  // FRAGMENT SHADER

  // Visualises the (scaled) magnitude of a given input texture

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uX;

  varying vec2 vUV; 
  
  void main(void) {
    vec4 col = texture2D(uX, vUV);
    float val = 1.0 - 10.0 * length(col.xy);
    gl_FragColor = vec4(val, val, val, 1.0);
    //gl_FragColor = vec4(col.x, col.y, -col.x-col.y, 1.0);
  }
`;