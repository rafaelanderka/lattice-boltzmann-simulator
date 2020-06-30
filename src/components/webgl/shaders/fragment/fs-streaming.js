export default `
  // FRAGMENT SHADER

  // Performs streaming and bounce-back

  precision highp float;
  precision highp sampler2D;

  uniform vec2 uTexelSize;
  uniform sampler2D uDistFunc;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    // Determine whether node is adjacent to wall
    bool wallN  = int(texture2D(uNodeId, vUV + vec2(            0, +uTexelSize.y)).x + 0.5) == 1;
    bool wallNE = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x, +uTexelSize.y)).x + 0.5) == 1;
    bool wallE  = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x,             0)).x + 0.5) == 1;
    bool wallSE = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x, -uTexelSize.y)).x + 0.5) == 1;
    bool wallS  = int(texture2D(uNodeId, vUV + vec2(            0, -uTexelSize.y)).x + 0.5) == 1;
    bool wallSW = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x, -uTexelSize.y)).x + 0.5) == 1;
    bool wallW  = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x,             0)).x + 0.5) == 1;
    bool wallNW = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x, +uTexelSize.y)).x + 0.5) == 1;
    bool isAdjacentToWall = wallN || wallNE || wallE || wallSE || wallS || wallSW || wallW || wallNW;
    
    float x = 0.0, y = 0.0, z = 0.0, w = 0.0;
    vec4 nodalDistFunc = texture2D(uDistFunc, vUV);
    #if defined(F0)
    // Rest component
    x = texture2D(uDistFunc, vUV).x;
    #elif defined(F1_4)
    // Main cartesian components
    // East
    if (wallW) {
      x = nodalDistFunc.z;
    } else {
      x = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x, 0)).x;
    }

    // North
    if (wallS) {
      y = nodalDistFunc.w;
    } else {
      y = texture2D(uDistFunc, vUV + vec2(0, -uTexelSize.y)).y;
    }

    // West
    if (wallE) {
      z = nodalDistFunc.x;
    } else {
      z = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x, 0)).z;
    }

    // South
    if (wallN) {
      w = nodalDistFunc.y;
    } else {
      w = texture2D(uDistFunc, vUV + vec2(0, +uTexelSize.y)).w; 
    }
    #elif defined(F5_8)
    // Diagonal components
    // Northeast
    if (wallS || wallW || wallSW) {
      x = nodalDistFunc.z;
    } else {
      x = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x, -uTexelSize.y)).x;
    }

    // Northwest
    if (wallS || wallE || wallSE) {
      y = nodalDistFunc.w;
    } else {
      y = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x, -uTexelSize.y)).y;
    }

    // Southwest
    if (wallN || wallE || wallNE) {
      z = nodalDistFunc.x;
    } else {
      z = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x, +uTexelSize.y)).z;
    }

    // Southeast
    if (wallN || wallW || wallNW) {
      w = nodalDistFunc.y;
    } else {
      w = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x, +uTexelSize.y)).w;
    }
    #endif

    gl_FragColor = vec4(x, y, z, w);
  }
`;