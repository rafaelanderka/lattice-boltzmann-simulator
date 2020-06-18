export default `
  // FRAGMENT SHADER

  // Computes the initial equilibrium distributions of a fluid domain

  precision highp float;
  precision highp sampler2D;

  const float prefactor0 = 2.0 / 9.0;
  const float prefactor1_4 = 1.0 / 18.0;
  const float prefactor5_8 = 1.0 / 72.0;

  uniform float uTau;
  uniform sampler2D uVelocity;
  uniform sampler2D uDensity;
  uniform sampler2D uForceDensity;

  varying vec2 vUV; 
  
  void main(void) {
    float nodalDensity = texture2D(uDensity, vUV).x;
    vec2 nodalVel = texture2D(uVelocity, vUV).xy + (uTau / nodalDensity) * texture2D(uForceDensity, vUV).xy;
    float nodalVelMagSquared = dot(nodalVel, nodalVel);

    float x = 0.0, y = 0.0, z = 0.0, w = 0.0;
    #if defined(F0)
    // Rest component
    x = prefactor0 * nodalDensity * (2.0 - 3.0 * nodalVelMagSquared);
    #elif defined(F1_4)
    // Main cartesian components
    x = prefactor1_4 * nodalDensity * (2.0 + 6.0 * nodalVel.x + 9.0 * nodalVel.x * nodalVel.x - 3.0 * nodalVelMagSquared);
    y = prefactor1_4 * nodalDensity * (2.0 + 6.0 * nodalVel.y + 9.0 * nodalVel.y * nodalVel.y - 3.0 * nodalVelMagSquared);
    z = prefactor1_4 * nodalDensity * (2.0 - 6.0 * nodalVel.x + 9.0 * nodalVel.x * nodalVel.x - 3.0 * nodalVelMagSquared);
    w = prefactor1_4 * nodalDensity * (2.0 - 6.0 * nodalVel.y + 9.0 * nodalVel.y * nodalVel.y - 3.0 * nodalVelMagSquared);
    #elif defined(F5_8)
    // Diagonal components
    x = prefactor5_8 * nodalDensity * (2.0 + 6.0 * (nodalVel.x + nodalVel.y) + 9.0 * (nodalVel.x + nodalVel.y) * (nodalVel.x + nodalVel.y) - 3.0 * nodalVelMagSquared);
    y = prefactor5_8 * nodalDensity * (2.0 + 6.0 * (-nodalVel.x + nodalVel.y) + 9.0 * (-nodalVel.x + nodalVel.y) * (-nodalVel.x + nodalVel.y) - 3.0 * nodalVelMagSquared);
    z = prefactor5_8 * nodalDensity * (2.0 + 6.0 * (-nodalVel.x - nodalVel.y) + 9.0 * (-nodalVel.x - nodalVel.y) * (-nodalVel.x - nodalVel.y) - 3.0 * nodalVelMagSquared);
    w = prefactor5_8 * nodalDensity * (2.0 + 6.0 * (nodalVel.x - nodalVel.y) + 9.0 * (nodalVel.x - nodalVel.y) * (nodalVel.x - nodalVel.y) - 3.0 * nodalVelMagSquared);
    #endif

    gl_FragColor = vec4(x, y, z, w);
  }
`;