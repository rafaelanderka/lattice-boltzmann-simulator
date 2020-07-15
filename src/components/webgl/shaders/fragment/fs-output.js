export default `
  // FRAGMENT SHADER

  // Visualises the (scaled) magnitude of a given input texture

  precision highp float;
  precision highp sampler2D;

  uniform vec3 uSolute0Col;
  uniform vec3 uSolute1Col;
  uniform vec3 uSolute2Col;
  uniform sampler2D uVelocity;
  uniform sampler2D uSolute0;
  uniform sampler2D uSolute1;
  uniform sampler2D uSolute2;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 

  const float baseBrightness = 1.0;
  const vec3 velocityCol = vec3(0.95); 
  const vec3 wallCol = vec3(0.0);
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(wallCol, 1.0);
    } else {
      // Fluid node
      vec2 velocity = texture2D(uVelocity, vUV).xy;
      float concentration0 = min(1.0, texture2D(uSolute0, vUV).x);
      float concentration1 = min(1.0, texture2D(uSolute1, vUV).x);
      float concentration2 = min(1.0, texture2D(uSolute2, vUV).x);
      gl_FragColor = vec4(baseBrightness - concentration0 * (baseBrightness - uSolute0Col) - concentration1 * (baseBrightness - uSolute1Col) - concentration2 * (baseBrightness - uSolute2Col) - 3.33333333334 * length(velocity) * (baseBrightness - velocityCol), 1.0);
    }
  }
`;