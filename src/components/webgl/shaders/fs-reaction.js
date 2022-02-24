export default `#version 300 es
// Performs solute TRT collision

precision mediump float;
precision mediump sampler2D;

uniform sampler2D uNodalReactionRate;
uniform sampler2D uSolute0Data;
uniform sampler2D uSolute1Data;
uniform sampler2D uSolute2Data;
uniform float uReactionRate;
uniform int uStoichiometricCoeff0;
uniform int uStoichiometricCoeff1;
uniform int uStoichiometricCoeff2;

in vec2 UV;

out vec4 updatedNodalReactionRate;

void main(void) {
  // Unpack solute data
  float concentration0 = texture(uSolute0Data, UV).x;
  float concentration1 = texture(uSolute1Data, UV).x;
  float concentration2 = texture(uSolute2Data, UV).x;

  float nodalReactionRate = uReactionRate;
  nodalReactionRate *= (uStoichiometricCoeff0 < 0) ? concentration0 : 1.;
  nodalReactionRate *= (uStoichiometricCoeff1 < 0) ? concentration1 : 1.;
  nodalReactionRate *= (uStoichiometricCoeff2 < 0) ? concentration2 : 1.;
  updatedNodalReactionRate = vec4(nodalReactionRate);
}
`;
