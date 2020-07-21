export default `
  // FRAGMENT SHADER

  // Performs TRT collision

  precision highp float;
  precision highp sampler2D;

  const float prefactor0 = 2.0 / 9.0;
  const float prefactor1_4 = 1.0 / 18.0;
  const float prefactor5_8 = 1.0 / 72.0;

  uniform bool uHasScalarFieldSource;
  uniform float uPlusOmega;
  uniform float uMinusOmega;
  uniform float uOneMinusInvTwoTau;
  uniform float uInitDensity;
  uniform float uInitScalarField;
  uniform sampler2D uDistFunc;
  uniform sampler2D uScalarField;
  uniform sampler2D uScalarFieldSource;
  uniform sampler2D uVelocity;
  uniform sampler2D uDensity;
  uniform sampler2D uForceDensity;

  varying vec2 vUV; 
  
  void main(void) {
    float nodalDensity = uInitDensity + texture2D(uDensity, vUV).x;
    vec2 nodalVel = texture2D(uVelocity, vUV).xy;
    vec2 nodalForceDensity = texture2D(uForceDensity, vUV).xy;
    vec2 nodalVelPlus = nodalVel + (nodalForceDensity / (uPlusOmega * nodalDensity));
    vec2 nodalVelMinus = nodalVel + (nodalForceDensity / (uMinusOmega * nodalDensity));
    float nodalVelPlusSquared = dot(nodalVelPlus, nodalVelPlus);
    
    float nodalScalarField = uInitScalarField + texture2D(uScalarField, vUV).x;
    float nodalScalarFieldSource = 0.0;
    vec4 nodalDistFunc = texture2D(uDistFunc, vUV);
    vec4 plusDistFunc = vec4(0);
    vec4 minusDistFunc = vec4(0);
    vec4 plusEqDistFunc = vec4(0);
    vec4 minusEqDistFunc = vec4(0);

    #if defined(F0)
    // Rest component
    // Equilibrium calculation
    plusEqDistFunc.x = prefactor0 * nodalScalarField * (2.0 - 3.0 * nodalVelPlusSquared);
    minusEqDistFunc.x = 0.0;

    // Post-collision distribution calculation
    plusDistFunc.x = nodalDistFunc.x;
    minusDistFunc.x = 0.0;

    // Calculate scalar field source
    if (uHasScalarFieldSource) {
      nodalScalarFieldSource = uOneMinusInvTwoTau * texture2D(uScalarFieldSource, vUV).x * 2.0 * prefactor0;
    }
    #elif defined(F1_4)
    // Main cartesian components
    // Equilibrium calculation
    plusEqDistFunc.x = prefactor1_4 * nodalScalarField * (2.0 + 9.0 * nodalVelPlus.x * nodalVelPlus.x - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.y = prefactor1_4 * nodalScalarField * (2.0 + 9.0 * nodalVelPlus.y * nodalVelPlus.y - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.z = prefactor1_4 * nodalScalarField * (2.0 + 9.0 * nodalVelPlus.x * nodalVelPlus.x - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.w = prefactor1_4 * nodalScalarField * (2.0 + 9.0 * nodalVelPlus.y * nodalVelPlus.y - 3.0 * nodalVelPlusSquared);
    minusEqDistFunc.x = prefactor1_4 * nodalScalarField * (6.0 * nodalVelMinus.x);
    minusEqDistFunc.y = prefactor1_4 * nodalScalarField * (6.0 * nodalVelMinus.y);
    minusEqDistFunc.z = prefactor1_4 * nodalScalarField * (-6.0 * nodalVelMinus.x);
    minusEqDistFunc.w = prefactor1_4 * nodalScalarField * (-6.0 * nodalVelMinus.y);

    // Post-collision distribution calculation
    plusDistFunc.x = 0.5 * (nodalDistFunc.x + nodalDistFunc.z);
    minusDistFunc.x = 0.5 * (nodalDistFunc.x - nodalDistFunc.z);
    plusDistFunc.y = 0.5 * (nodalDistFunc.y + nodalDistFunc.w);
    minusDistFunc.y = 0.5 * (nodalDistFunc.y - nodalDistFunc.w);
    plusDistFunc.z = plusDistFunc.x;
    minusDistFunc.z = -minusDistFunc.x;
    plusDistFunc.w = plusDistFunc.y;
    minusDistFunc.w = -minusDistFunc.y;

    // Calculate scalar field source
    if (uHasScalarFieldSource) {
      nodalScalarFieldSource = uOneMinusInvTwoTau * texture2D(uScalarFieldSource, vUV).x * 2.0 * prefactor1_4;
    }
    #elif defined(F5_8)
    // Diagonal components
    // Equilibrium calculation
    plusEqDistFunc.x = prefactor5_8 * nodalScalarField * (2.0 + 9.0 * (nodalVelPlus.x + nodalVelPlus.y) * (nodalVelPlus.x + nodalVelPlus.y) - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.y = prefactor5_8 * nodalScalarField * (2.0 + 9.0 * (-nodalVelPlus.x + nodalVelPlus.y) * (-nodalVelPlus.x + nodalVelPlus.y) - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.z = prefactor5_8 * nodalScalarField * (2.0 + 9.0 * (-nodalVelPlus.x - nodalVelPlus.y) * (-nodalVelPlus.x - nodalVelPlus.y) - 3.0 * nodalVelPlusSquared);
    plusEqDistFunc.w = prefactor5_8 * nodalScalarField * (2.0 + 9.0 * (nodalVelPlus.x - nodalVelPlus.y) * (nodalVelPlus.x - nodalVelPlus.y) - 3.0 * nodalVelPlusSquared);
    minusEqDistFunc.x = prefactor5_8 * nodalScalarField * (6.0 * (nodalVelMinus.x + nodalVelMinus.y));
    minusEqDistFunc.y = prefactor5_8 * nodalScalarField * (6.0 * (-nodalVelMinus.x + nodalVelMinus.y));
    minusEqDistFunc.z = prefactor5_8 * nodalScalarField * (6.0 * (-nodalVelMinus.x - nodalVelMinus.y));
    minusEqDistFunc.w = prefactor5_8 * nodalScalarField * (6.0 * (nodalVelMinus.x - nodalVelMinus.y));

    // Post-collision distribution calculation
    plusDistFunc.x = 0.5 * (nodalDistFunc.x + nodalDistFunc.z);
    minusDistFunc.x = 0.5 * (nodalDistFunc.x - nodalDistFunc.z);
    plusDistFunc.y = 0.5 * (nodalDistFunc.y + nodalDistFunc.w);
    minusDistFunc.y = 0.5 * (nodalDistFunc.y - nodalDistFunc.w);
    plusDistFunc.z = plusDistFunc.x;
    minusDistFunc.z = -minusDistFunc.x;
    plusDistFunc.w = plusDistFunc.y;
    minusDistFunc.w = -minusDistFunc.y;

    // Calculate scalar field source
    if (uHasScalarFieldSource) {
      nodalScalarFieldSource = uOneMinusInvTwoTau * texture2D(uScalarFieldSource, vUV).x * 2.0 * prefactor5_8;
    }
    #endif
    
    // Put it all together
    vec4 newDistFunc = nodalDistFunc - uPlusOmega * (plusDistFunc - plusEqDistFunc) - uMinusOmega * (minusDistFunc - minusEqDistFunc) + nodalScalarFieldSource;

    // Ensure distributions are non-negative
    newDistFunc.x = max(newDistFunc.x, 0.0);
    newDistFunc.y = max(newDistFunc.y, 0.0);
    newDistFunc.z = max(newDistFunc.z, 0.0);
    newDistFunc.w = max(newDistFunc.w, 0.0);

    gl_FragColor = newDistFunc;
  }
`;