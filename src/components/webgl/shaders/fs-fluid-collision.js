export default `#version 300 es
// Performs fluid TRT collision

precision mediump float;
precision mediump sampler2D;

const float TRTprefactor0 = 2. / 9.;
const float TRTprefactor1_4 = 1. / 18.;
const float TRTprefactor5_8 = 1. / 72.;
const float forceLimit = 0.01;
const float forceStrength = 5.;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData[4];
uniform vec2 uCursorPos;
uniform vec2 uCursorVel;
uniform vec2 uAspect;
uniform float uToolSize;
uniform float uInitDensity;
uniform float uPlusOmega;
uniform float uMinusOmega;
uniform bool uIsApplyingForce;

in vec2 UV;

layout(location = 0) out vec4 updatedFluidData0;
layout(location = 1) out vec4 updatedFluidData1;
layout(location = 2) out vec4 updatedFluidData2;
layout(location = 3) out vec4 updatedFluidData3;

void main(void) {
  // Unpack fluid data
  vec4 fluidData0 = texture(uFluidData[0], UV);
  vec4 fluidData1 = texture(uFluidData[1], UV);
  vec4 fluidData2 = texture(uFluidData[2], UV);
  vec4 fluidData3 = texture(uFluidData[3], UV);

  vec2 velocity = fluidData0.xy;
  vec2 forceDensity = fluidData0.zw;
  float density = fluidData1.x;
  float dist0 = fluidData1.y;
  float dist1 = fluidData1.z;
  float dist2 = fluidData1.w;
  float dist3 = fluidData2.x;
  float dist4 = fluidData2.y;
  float dist5 = fluidData2.z;
  float dist6 = fluidData2.w;
  float dist7 = fluidData3.x;
  float dist8 = fluidData3.y;
  
  // Update force density
  int nodeId = int(texture(uNodeIds, UV).x + 0.5);
  float dist = length((uAspect * uCursorPos) - (uAspect * UV));
  if (uIsApplyingForce && dist <= uToolSize && nodeId == 0) {
    float coeff = forceStrength * (1. - dist / uToolSize);
    forceDensity = vec2(coeff * max(-forceLimit, min(uCursorVel.x, forceLimit)), coeff * max(-forceLimit, min(uCursorVel.y, forceLimit)));
  } else {
    forceDensity = vec2(0.);
  }

  // Perform TRT collision
  // Precalculate factors
  float nodalDensity = uInitDensity + density;
  vec2 nodalVelPlus = velocity + (forceDensity / (uPlusOmega * nodalDensity));
  vec2 nodalVelMinus = velocity + (forceDensity / (uMinusOmega * nodalDensity));
  float premulNodalDensity1_4 = TRTprefactor1_4 * nodalDensity;
  float premulNodalDensity5_8 = TRTprefactor5_8 * nodalDensity;
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
  float plusEqDistFunc0 = TRTprefactor0 * nodalDensity * (2. + premulNodalVelPlusSquared);
  float minusEqDistFunc0 = 0.;
  
  float plusEqDistFunc1 = premulNodalDensity1_4 * (2. + premulNodalVelPlusSquared_x + premulNodalVelPlusSquared);
  float plusEqDistFunc2 = premulNodalDensity1_4 * (2. + premulNodalVelPlusSquared_y + premulNodalVelPlusSquared);
  float plusEqDistFunc3 = premulNodalDensity1_4 * (2. + premulNodalVelPlusSquared_x + premulNodalVelPlusSquared);
  float plusEqDistFunc4 = premulNodalDensity1_4 * (2. + premulNodalVelPlusSquared_y + premulNodalVelPlusSquared);
  float minusEqDistFunc1 = premulNodalDensity1_4 * (6. * nodalVelMinus.x);
  float minusEqDistFunc2 = premulNodalDensity1_4 * (6. * nodalVelMinus.y);
  float minusEqDistFunc3 = premulNodalDensity1_4 * (-6. * nodalVelMinus.x);
  float minusEqDistFunc4 = premulNodalDensity1_4 * (-6. * nodalVelMinus.y);

  float plusEqDistFunc5 = premulNodalDensity5_8 * (2. + premulNodalVelPlusSquared_xy + premulNodalVelPlusSquared);
  float plusEqDistFunc6 = premulNodalDensity5_8 * (2. + premulNodalVelPlusSquared_mxy + premulNodalVelPlusSquared);
  float plusEqDistFunc7 = premulNodalDensity5_8 * (2. + premulNodalVelPlusSquared_mxmy + premulNodalVelPlusSquared);
  float plusEqDistFunc8 = premulNodalDensity5_8 * (2. + premulNodalVelPlusSquared_xmy + premulNodalVelPlusSquared);
  float minusEqDistFunc5 = premulNodalDensity5_8 * (6. * (nodalVelMinus.x + nodalVelMinus.y));
  float minusEqDistFunc6 = premulNodalDensity5_8 * (6. * (-nodalVelMinus.x + nodalVelMinus.y));
  float minusEqDistFunc7 = premulNodalDensity5_8 * (6. * (-nodalVelMinus.x - nodalVelMinus.y));
  float minusEqDistFunc8 = premulNodalDensity5_8 * (6. * (nodalVelMinus.x - nodalVelMinus.y));

  // Post-collision distribution calculation
  float plusDistFunc0 = dist0;
  float minusDistFunc0 = 0.;

  float plusDistFunc1 = 0.5 * (dist1 + dist3);
  float plusDistFunc2 = 0.5 * (dist2 + dist4);
  float plusDistFunc3 = plusDistFunc1;
  float plusDistFunc4 = plusDistFunc2;
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

  // Put it all together
  dist0 = max(0., dist0 - uPlusOmega * (plusDistFunc0 - plusEqDistFunc0) - uMinusOmega * (minusDistFunc0 - minusEqDistFunc0));
  dist1 = max(0., dist1 - uPlusOmega * (plusDistFunc1 - plusEqDistFunc1) - uMinusOmega * (minusDistFunc1 - minusEqDistFunc1));
  dist2 = max(0., dist2 - uPlusOmega * (plusDistFunc2 - plusEqDistFunc2) - uMinusOmega * (minusDistFunc2 - minusEqDistFunc2));
  dist3 = max(0., dist3 - uPlusOmega * (plusDistFunc3 - plusEqDistFunc3) - uMinusOmega * (minusDistFunc3 - minusEqDistFunc3));
  dist4 = max(0., dist4 - uPlusOmega * (plusDistFunc4 - plusEqDistFunc4) - uMinusOmega * (minusDistFunc4 - minusEqDistFunc4));
  dist5 = max(0., dist5 - uPlusOmega * (plusDistFunc5 - plusEqDistFunc5) - uMinusOmega * (minusDistFunc5 - minusEqDistFunc5));
  dist6 = max(0., dist6 - uPlusOmega * (plusDistFunc6 - plusEqDistFunc6) - uMinusOmega * (minusDistFunc6 - minusEqDistFunc6));
  dist7 = max(0., dist7 - uPlusOmega * (plusDistFunc7 - plusEqDistFunc7) - uMinusOmega * (minusDistFunc7 - minusEqDistFunc7));
  dist8 = max(0., dist8 - uPlusOmega * (plusDistFunc8 - plusEqDistFunc8) - uMinusOmega * (minusDistFunc8 - minusEqDistFunc8));

  updatedFluidData0 = vec4(velocity, forceDensity);
  updatedFluidData1 = vec4(density, dist0, dist1, dist2);
  updatedFluidData2 = vec4(dist3, dist4, dist5, dist6);
  updatedFluidData3 = vec4(dist7, dist8, 0., 0.);
}
`;
