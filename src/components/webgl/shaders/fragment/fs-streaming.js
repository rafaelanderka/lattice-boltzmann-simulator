export default `
  // FRAGMENT SHADER

  // Performs streaming

  precision highp float;
  precision highp sampler2D;

  uniform vec2 uTexelSize;
  uniform sampler2D uDistFunc;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    // Determine whether node is adjacent to wall
    int nodeIdN  = int(texture2D(uNodeId, vUV + vec2(            0, +uTexelSize.y)).x + 0.5);
    int nodeIdNE = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x, +uTexelSize.y)).x + 0.5);
    int nodeIdE  = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x,             0)).x + 0.5);
    int nodeIdSE = int(texture2D(uNodeId, vUV + vec2(+uTexelSize.x, -uTexelSize.y)).x + 0.5);
    int nodeIdS  = int(texture2D(uNodeId, vUV + vec2(            0, -uTexelSize.y)).x + 0.5);
    int nodeIdSW = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x, -uTexelSize.y)).x + 0.5);
    int nodeIdW  = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x,             0)).x + 0.5);
    int nodeIdNW = int(texture2D(uNodeId, vUV + vec2(-uTexelSize.x, +uTexelSize.y)).x + 0.5);
    bool isAdjacentToWall = nodeIdN == 1 || nodeIdNE == 1 || nodeIdE == 1 || nodeIdSE == 1 || nodeIdS == 1 || nodeIdSW == 1 || nodeIdW == 1 || nodeIdNW == 1;
    
    float x = 0.0, y = 0.0, z = 0.0, w = 0.0;
    if (isAdjacentToWall) {
      // Bounce-back
      vec4 nodalDistFunc = texture2D(uDistFunc, vUV);
      #if defined(F0)
      // Rest component
      x = nodalDistFunc.x;
      #elif defined(F1_4)
      // Main cartesian components
      x = nodalDistFunc.z;
      y = nodalDistFunc.w;
      z = nodalDistFunc.x;
      w = nodalDistFunc.y;
      #elif defined(F5_8)
      // Diagonal components
      x = nodalDistFunc.z;
      y = nodalDistFunc.w;
      z = nodalDistFunc.x;
      w = nodalDistFunc.y;
      #endif
    } else {
      // Regular streaming
      #if defined(F0)
      // Rest component
      x = texture2D(uDistFunc, vUV).x;
      #elif defined(F1_4)
      // Main cartesian components
      x = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x,             0)).x;
      y = texture2D(uDistFunc, vUV + vec2(            0, -uTexelSize.y)).y;
      z = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x,             0)).z;
      w = texture2D(uDistFunc, vUV + vec2(            0, +uTexelSize.y)).w; 
      #elif defined(F5_8)
      // Diagonal components
      x = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x, -uTexelSize.y)).x;
      y = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x, -uTexelSize.y)).y;
      z = texture2D(uDistFunc, vUV + vec2(+uTexelSize.x, +uTexelSize.y)).z;
      w = texture2D(uDistFunc, vUV + vec2(-uTexelSize.x, +uTexelSize.y)).w;
      #endif
    }

    gl_FragColor = vec4(x, y, z, w);
  }
`;