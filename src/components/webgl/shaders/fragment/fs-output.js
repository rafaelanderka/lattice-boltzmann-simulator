export default `
  // FRAGMENT SHADER

  // Visualises the (scaled) magnitude of a given input texture

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uVelocity;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(1.0, 0.6, 0.3, 1.0);
    } else {
      // Fluid node
      vec4 velocity = texture2D(uVelocity, vUV);
      float val = 0.9 - 10.0 * length(velocity.xy);
      gl_FragColor = vec4(val, val, val, 1.0);
    }
  }
`;