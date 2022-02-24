export default `
  // FRAGMENT SHADER

  // Visualises the velocity field and solutes

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

  const float baseBrightness = 0.;
  const vec3 velocityCol = vec3(1.); 
  const vec3 wallCol = vec3(0.5);

  vec4 screen(vec4 a, vec4 b) {
    return a + b - (a * b);
  }

  float getToneMappedConcentration(sampler2D solute) {
      return sqrt(min(1., texture2D(solute, vUV).x));
  }

  float getToneMappedVelocity() {
      return 0.5 * length(texture2D(uVelocity, vUV).xy);
  }

  void main(void) {
    // Determine node type
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(wallCol, 1.);
    } else {
      // Fluid node
      float c0 = getToneMappedConcentration(uSolute0);
      float c1 = getToneMappedConcentration(uSolute1);
      float c2 = getToneMappedConcentration(uSolute2);
      float v = getToneMappedVelocity();
      vec4 solute0 = vec4(c0 * uSolute0Col, c0);
      vec4 solute1 = vec4(c1 * uSolute1Col, c1);
      vec4 solute2 = vec4(c2 * uSolute2Col, c2);
      vec4 velocity = vec4(v * velocityCol, v);
      vec4 blend = vec4(1.) - (vec4(1.) - solute0) * (vec4(1.) - solute1) * (vec4(1.) - solute2) * (vec4(1.) - velocity);
      gl_FragColor = blend;
    }
  }
`;