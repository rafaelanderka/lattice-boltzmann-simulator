export default `
  // FRAGMENT SHADER

  // Initialises macroscopic fluid velocity

  precision highp float;
  precision highp sampler2D;

  uniform vec2 uVelocity;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    vec4 col = vec4(uVelocity.x, uVelocity.y, 0.0, 0.0);
    if (nodeId == 1) {
      col = vec4(0.0);
    }
    gl_FragColor = col;
  }
`;