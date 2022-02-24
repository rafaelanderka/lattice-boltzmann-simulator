export default `#version 300 es
// Initialises macroscopic solute concentration and computes the initial equilibrium distribution

precision mediump float;
precision mediump sampler2D;

const float prefactor0 = 2. / 9.;
const float prefactor1_4 = 1. / 18.;
const float prefactor5_8 = 1. / 72.;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData[4];
uniform sampler2D uSoluteData[3];
uniform vec2 uCenter;
uniform vec2 uAspect;
uniform float uInitDensity;
uniform float uTau;
uniform float uRadius;

in vec2 UV;

layout(location = 0) out vec4 updatedSoluteData0;
layout(location = 1) out vec4 updatedSoluteData1;
layout(location = 2) out vec4 updatedSoluteData2;

void main(void) {
  // Unpack required fluid data
  vec2 velocity = texture(uFluidData[0], UV).xy;
  vec2 forceDensity = texture(uFluidData[0], UV).zw;
  float density = texture(uFluidData[1], UV).x;

  // Unpack required solute data
  float concentrationSource = texture(uSoluteData[0], UV).y;

  // Set initial macroscopic solute concentration
  float distanceFromCenter = length(uCenter - (uAspect * UV));
  float isWithinCircle = (distanceFromCenter < uRadius) ? 1. : 0.;
  float isFluid = (int(texture(uNodeIds, UV).x + 0.5) == 0) ? 1. : 0.;
  float concentration = min(1., isFluid * isWithinCircle / distanceFromCenter);

  // Calculate equilibrium distributions
  // TODO: Pre-compute repeated factors
  float nodalDensity = uInitDensity + density;
  vec2 nodalVel = velocity + (uTau / nodalDensity) * forceDensity;
  float nodalVelMagSquared = dot(nodalVel, nodalVel);

  // Rest component
  float dist0 = prefactor0 * concentration * (2. - 3. * nodalVelMagSquared);

  // Main cartesian components
  float dist1 = prefactor1_4 * concentration * (2. + 6. * nodalVel.x + 9. * nodalVel.x * nodalVel.x - 3. * nodalVelMagSquared);
  float dist2 = prefactor1_4 * concentration * (2. + 6. * nodalVel.y + 9. * nodalVel.y * nodalVel.y - 3. * nodalVelMagSquared);
  float dist3 = prefactor1_4 * concentration * (2. - 6. * nodalVel.x + 9. * nodalVel.x * nodalVel.x - 3. * nodalVelMagSquared);
  float dist4 = prefactor1_4 * concentration * (2. - 6. * nodalVel.y + 9. * nodalVel.y * nodalVel.y - 3. * nodalVelMagSquared);

  // Diagonal components
  float dist5 = prefactor5_8 * concentration * (2. + 6. * (nodalVel.x + nodalVel.y) + 9. * (nodalVel.x + nodalVel.y) * (nodalVel.x + nodalVel.y) - 3. * nodalVelMagSquared);
  float dist6 = prefactor5_8 * concentration * (2. + 6. * (-nodalVel.x + nodalVel.y) + 9. * (-nodalVel.x + nodalVel.y) * (-nodalVel.x + nodalVel.y) - 3. * nodalVelMagSquared);
  float dist7 = prefactor5_8 * concentration * (2. + 6. * (-nodalVel.x - nodalVel.y) + 9. * (-nodalVel.x - nodalVel.y) * (-nodalVel.x - nodalVel.y) - 3. * nodalVelMagSquared);
  float dist8 = prefactor5_8 * concentration * (2. + 6. * (nodalVel.x - nodalVel.y) + 9. * (nodalVel.x - nodalVel.y) * (nodalVel.x - nodalVel.y) - 3. * nodalVelMagSquared);

  updatedSoluteData0 = vec4(concentration, concentrationSource, dist0, dist1);
  updatedSoluteData1 = vec4(dist2, dist3, dist4, dist5);
  updatedSoluteData2 = vec4(dist6, dist7, dist8, 0.);
}
`;