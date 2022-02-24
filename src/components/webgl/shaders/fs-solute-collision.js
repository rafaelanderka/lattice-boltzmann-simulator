export default `#version 300 es
// Performs solute TRT collision

precision mediump float;
precision mediump sampler2D;

const float TRTprefactor0 = 2. / 9.;
const float TRTprefactor1_4 = 1. / 18.;
const float TRTprefactor5_8 = 1. / 72.;
const float concentrationSourceStrength = 0.1;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData[4];
uniform sampler2D uSoluteData[3];
uniform sampler2D uNodalReactionRate;
uniform vec2 uCursorPos;
uniform vec2 uAspect;
uniform float uToolSize;
uniform float uConcentrationSourcePolarity;
uniform float uInitDensity;
uniform float uInitConcentration;
uniform float uPlusOmega;
uniform float uMinusOmega;
uniform float uOneMinusInvTwoTau;
uniform float uMolMassTimesCoeff;

in vec2 UV;

layout(location = 0) out vec4 updatedSoluteData0;
layout(location = 1) out vec4 updatedSoluteData1;
layout(location = 2) out vec4 updatedSoluteData2;

void main(void) {
  // Unpack solute data
  vec4 soluteData0 = texture(uSoluteData[0], UV);
  vec4 soluteData1 = texture(uSoluteData[1], UV);
  vec4 soluteData2 = texture(uSoluteData[2], UV);
  float concentration = soluteData0.x;
  float concentrationSource = soluteData0.y;
  float dist0 = soluteData0.z;
  float dist1 = soluteData0.w;
  float dist2 = soluteData1.x;
  float dist3 = soluteData1.y;
  float dist4 = soluteData1.z;
  float dist5 = soluteData1.w;
  float dist6 = soluteData2.x;
  float dist7 = soluteData2.y;
  float dist8 = soluteData2.z;

  // Unpack required fluid data
  vec2 velocity = texture(uFluidData[0], UV).xy;
  vec2 forceDensity = texture(uFluidData[0], UV).zw;
  float density = texture(uFluidData[1], UV).x;
  
  // Update concentration source (we can disregard the nodeId here)
  float nodalReactionRate = texture(uNodalReactionRate, UV).x;
  float distanceFromCursor = length((uAspect * uCursorPos) - (uAspect * UV));
  float isWithinTool = (distanceFromCursor < uToolSize) ? 1. : 0.;
  float toolStrength = concentrationSourceStrength * (1.0 - distanceFromCursor / uToolSize);
  concentrationSource = uMolMassTimesCoeff * nodalReactionRate + uConcentrationSourcePolarity * isWithinTool * toolStrength;

  // Perform TRT collision
  // Precalculate factors
  float nodalConcentration = uInitConcentration + concentration;
  float nodalDensity = uInitDensity + density;
  vec2 nodalVelPlus = velocity + (forceDensity / (uPlusOmega * nodalDensity));
  vec2 nodalVelMinus = velocity + (forceDensity / (uMinusOmega * nodalDensity));
  float premulNodalConcentration1_4 = TRTprefactor1_4 * nodalConcentration;
  float premulNodalConcentration5_8 = TRTprefactor5_8 * nodalConcentration;
  float premulNodalVelPlusSquared = -3. * dot(nodalVelPlus, nodalVelPlus);
  float nodalVelPlus_xy = nodalVelPlus.x + nodalVelPlus.y;
  float nodalVelPlus_mxy = -nodalVelPlus.x + nodalVelPlus.y;
  float nodalVelPlus_mxmy = -nodalVelPlus.x - nodalVelPlus.y;
  float nodalVelPlus_xmy = nodalVelPlus.x - nodalVelPlus.y;
  float premulNodalVelPlusSquared_xy = 9. * nodalVelPlus_xy * nodalVelPlus_xy;
  float premulNodalVelPlusSquared_mxy = 9. * nodalVelPlus_mxy * nodalVelPlus_mxy;
  float premulNodalVelPlusSquared_mxmy = 9. * nodalVelPlus_mxmy * nodalVelPlus_mxmy;
  float premulNodalVelPlusSquared_xmy = 9. * nodalVelPlus_xmy * nodalVelPlus_xmy;
  float premulNodalVelPlusSquared_x = 9. * nodalVelPlus.x * nodalVelPlus.x;
  float premulNodalVelPlusSquared_y = 9. * nodalVelPlus.y * nodalVelPlus.y;

  // Equilibrium calculation
  float plusEqDistFunc0 = TRTprefactor0 * nodalConcentration * (2. + premulNodalVelPlusSquared);
  float minusEqDistFunc0 = 0.;

  float plusEqDistFunc1 = premulNodalConcentration1_4 * (2. + premulNodalVelPlusSquared_x + premulNodalVelPlusSquared);
  float plusEqDistFunc2 = premulNodalConcentration1_4 * (2. + premulNodalVelPlusSquared_y + premulNodalVelPlusSquared);
  float plusEqDistFunc3 = premulNodalConcentration1_4 * (2. + premulNodalVelPlusSquared_x + premulNodalVelPlusSquared);
  float plusEqDistFunc4 = premulNodalConcentration1_4 * (2. + premulNodalVelPlusSquared_y + premulNodalVelPlusSquared);
  float minusEqDistFunc5 = premulNodalConcentration5_8 * (6. * (nodalVelMinus.x + nodalVelMinus.y));
  float minusEqDistFunc6 = premulNodalConcentration5_8 * (6. * (-nodalVelMinus.x + nodalVelMinus.y));
  float minusEqDistFunc7 = premulNodalConcentration5_8 * (6. * (-nodalVelMinus.x - nodalVelMinus.y));
  float minusEqDistFunc8 = premulNodalConcentration5_8 * (6. * (nodalVelMinus.x - nodalVelMinus.y));
  
  float plusEqDistFunc5 = premulNodalConcentration5_8 * (2. + premulNodalVelPlusSquared_xy + premulNodalVelPlusSquared);
  float plusEqDistFunc6 = premulNodalConcentration5_8 * (2. + premulNodalVelPlusSquared_mxy + premulNodalVelPlusSquared);
  float plusEqDistFunc7 = premulNodalConcentration5_8 * (2. + premulNodalVelPlusSquared_mxmy + premulNodalVelPlusSquared);
  float plusEqDistFunc8 = premulNodalConcentration5_8 * (2. + premulNodalVelPlusSquared_xmy + premulNodalVelPlusSquared);
  float minusEqDistFunc1 = premulNodalConcentration1_4 * (6. * nodalVelMinus.x);
  float minusEqDistFunc2 = premulNodalConcentration1_4 * (6. * nodalVelMinus.y);
  float minusEqDistFunc3 = premulNodalConcentration1_4 * (-6. * nodalVelMinus.x);
  float minusEqDistFunc4 = premulNodalConcentration1_4 * (-6. * nodalVelMinus.y);

  // Post-collision distribution calculation
  float plusDistFunc0 = dist0;
  float plusDistFunc1 = 0.5 * (dist1 + dist3);
  float plusDistFunc2 = 0.5 * (dist2 + dist4);
  float plusDistFunc3 = plusDistFunc1;
  float plusDistFunc4 = plusDistFunc2;
  float minusDistFunc0 = 0.;
  float minusDistFunc1 = 0.5 * (dist1 - dist3);
  float minusDistFunc2 = 0.5 * (dist2 - dist4);
  float minusDistFunc3 = -minusDistFunc1;
  float minusDistFunc4 = -minusDistFunc2;

  float plusDistFunc5 = 0.5 * (dist5 + dist7);
  float plusDistFunc6 = 0.5 * (dist6 + dist8);
  float plusDistFunc7 = plusDistFunc5;
  float plusDistFunc8 = plusDistFunc6;
  float minusDistFunc5 = 0.5 * (dist5 - dist7);
  float minusDistFunc6 = 0.5 * (dist6 - dist8);
  float minusDistFunc7 = -minusDistFunc5;
  float minusDistFunc8 = -minusDistFunc6;

  // Calculate concentration source
  float nodalConcentrationSource0 = uOneMinusInvTwoTau * concentrationSource * 2. * TRTprefactor0;
  float nodalConcentrationSource1_4 = uOneMinusInvTwoTau * concentrationSource * 2. * TRTprefactor1_4;
  float nodalConcentrationSource5_8 = uOneMinusInvTwoTau * concentrationSource * 2. * TRTprefactor5_8;

  // Put it all together
  dist0 = max(0., dist0 - uPlusOmega * (plusDistFunc0 - plusEqDistFunc0) - uMinusOmega * (minusDistFunc0 - minusEqDistFunc0) + nodalConcentrationSource0);
  dist1 = max(0., dist1 - uPlusOmega * (plusDistFunc1 - plusEqDistFunc1) - uMinusOmega * (minusDistFunc1 - minusEqDistFunc1) + nodalConcentrationSource1_4);
  dist2 = max(0., dist2 - uPlusOmega * (plusDistFunc2 - plusEqDistFunc2) - uMinusOmega * (minusDistFunc2 - minusEqDistFunc2) + nodalConcentrationSource1_4);
  dist3 = max(0., dist3 - uPlusOmega * (plusDistFunc3 - plusEqDistFunc3) - uMinusOmega * (minusDistFunc3 - minusEqDistFunc3) + nodalConcentrationSource1_4);
  dist4 = max(0., dist4 - uPlusOmega * (plusDistFunc4 - plusEqDistFunc4) - uMinusOmega * (minusDistFunc4 - minusEqDistFunc4) + nodalConcentrationSource1_4);
  dist5 = max(0., dist5 - uPlusOmega * (plusDistFunc5 - plusEqDistFunc5) - uMinusOmega * (minusDistFunc5 - minusEqDistFunc5) + nodalConcentrationSource5_8);
  dist6 = max(0., dist6 - uPlusOmega * (plusDistFunc6 - plusEqDistFunc6) - uMinusOmega * (minusDistFunc6 - minusEqDistFunc6) + nodalConcentrationSource5_8);
  dist7 = max(0., dist7 - uPlusOmega * (plusDistFunc7 - plusEqDistFunc7) - uMinusOmega * (minusDistFunc7 - minusEqDistFunc7) + nodalConcentrationSource5_8);
  dist8 = max(0., dist8 - uPlusOmega * (plusDistFunc8 - plusEqDistFunc8) - uMinusOmega * (minusDistFunc8 - minusEqDistFunc8) + nodalConcentrationSource5_8);

  updatedSoluteData0 = vec4(concentration, concentrationSource, dist0, dist1);
  updatedSoluteData1 = vec4(dist2, dist3, dist4, dist5);
  updatedSoluteData2 = vec4(dist6, dist7, dist8, 0.);
}
`;
