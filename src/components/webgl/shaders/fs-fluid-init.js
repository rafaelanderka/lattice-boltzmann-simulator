export default `#version 300 es
// Initialises macroscopic fluid velocity, density and computes the initial equilibrium distribution

precision mediump float;
precision mediump sampler2D;

const float prefactor0 = 2. / 9.;
const float prefactor1_4 = 1. / 18.;
const float prefactor5_8 = 1. / 72.;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData[4];
uniform vec2 uInitVelocity;
uniform float uInitDensity;
uniform float uTau;

in vec2 UV;

layout(location = 0) out vec4 updatedFluidData0;
layout(location = 1) out vec4 updatedFluidData1;
layout(location = 2) out vec4 updatedFluidData2;
layout(location = 3) out vec4 updatedFluidData3;

void main(void) {
  // Unpack required fluid data
  vec2 forceDensity = texture(uFluidData[0], UV).zw;
  float density =  texture(uFluidData[1], UV).x;

  // Set initial macroscopic velocity and density
  int nodeId = int(texture(uNodeIds, UV).x + 0.5);
  vec2 velocity = (nodeId == 0) ? uInitVelocity : vec2(0.);

  // Calculate equilibrium distributions
  // TODO: Pre-compute repeated factors
  float nodalDensity = uInitDensity + density;
  vec2 nodalVel = velocity + (uTau / nodalDensity) * forceDensity;
  float nodalVelMagSquared = dot(nodalVel, nodalVel);

  // Rest component
  float dist0 = prefactor0 * density * (2. - 3. * nodalVelMagSquared);

  // Main cartesian components
  float dist1 = prefactor1_4 * density * (2. + 6. * nodalVel.x + 9. * nodalVel.x * nodalVel.x - 3. * nodalVelMagSquared);
  float dist2 = prefactor1_4 * density * (2. + 6. * nodalVel.y + 9. * nodalVel.y * nodalVel.y - 3. * nodalVelMagSquared);
  float dist3 = prefactor1_4 * density * (2. - 6. * nodalVel.x + 9. * nodalVel.x * nodalVel.x - 3. * nodalVelMagSquared);
  float dist4 = prefactor1_4 * density * (2. - 6. * nodalVel.y + 9. * nodalVel.y * nodalVel.y - 3. * nodalVelMagSquared);

  // Diagonal components
  float dist5 = prefactor5_8 * density * (2. + 6. * (nodalVel.x + nodalVel.y) + 9. * (nodalVel.x + nodalVel.y) * (nodalVel.x + nodalVel.y) - 3. * nodalVelMagSquared);
  float dist6 = prefactor5_8 * density * (2. + 6. * (-nodalVel.x + nodalVel.y) + 9. * (-nodalVel.x + nodalVel.y) * (-nodalVel.x + nodalVel.y) - 3. * nodalVelMagSquared);
  float dist7 = prefactor5_8 * density * (2. + 6. * (-nodalVel.x - nodalVel.y) + 9. * (-nodalVel.x - nodalVel.y) * (-nodalVel.x - nodalVel.y) - 3. * nodalVelMagSquared);
  float dist8 = prefactor5_8 * density * (2. + 6. * (nodalVel.x - nodalVel.y) + 9. * (nodalVel.x - nodalVel.y) * (nodalVel.x - nodalVel.y) - 3. * nodalVelMagSquared);

  updatedFluidData0 = vec4(velocity, forceDensity);
  updatedFluidData1 = vec4(density, dist0, dist1, dist2);
  updatedFluidData2 = vec4(dist3, dist4, dist5, dist6);
  updatedFluidData3 = vec4(dist7, dist8, 0., 0.);
}
`;