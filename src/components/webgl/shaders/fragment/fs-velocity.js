export default `
  // FRAGMENT SHADER

  // Calculates and caps the macroscopic velocity

  precision highp float;
  precision highp sampler2D;

  uniform float uSpeedOfSound;
  uniform sampler2D uDensity;
  uniform sampler2D uVelocity;
  uniform sampler2D uDistFunc;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(0.0);
    } else {
      // Fluid node
      float invDensity = 1.0 / texture2D(uDensity, vUV).x;
      vec2 velocity = texture2D(uVelocity, vUV).xy;
      vec4 nodalDistFunc = texture2D(uDistFunc, vUV);

      #if defined(F0)
      // Rest component does not contribute
      #elif defined(F1_4)
      // Main cartesian components
      velocity.x = velocity.x + invDensity * (nodalDistFunc.x - nodalDistFunc.z);
      velocity.y = velocity.y + invDensity * (nodalDistFunc.y - nodalDistFunc.w);
      #elif defined(F5_8)
      // Diagonal components
      velocity.x = velocity.x + invDensity * (nodalDistFunc.x - nodalDistFunc.y - nodalDistFunc.z + nodalDistFunc.w);
      velocity.y = velocity.y + invDensity * (nodalDistFunc.x + nodalDistFunc.y - nodalDistFunc.z - nodalDistFunc.w);
      #endif
      
      // Ensure velocity is subsonic
      float velocityMag = length(velocity);
      if (velocityMag > uSpeedOfSound) {
        velocity = velocity * (uSpeedOfSound / velocityMag);
      }

      gl_FragColor = vec4(velocity.x, velocity.y, 0.0, 0.0);
    }
  }
`;