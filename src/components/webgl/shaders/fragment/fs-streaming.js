export default `
  // FRAGMENT SHADER

  // Performs streaming

  precision highp float;
  precision highp sampler2D;

  uniform vec2 uTexelSize;
  uniform sampler2D uDistFunc;

  varying vec2 vUV; 
  
  void main(void) {
    float x = 0.0, y = 0.0, z = 0.0, w = 0.0;
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

    gl_FragColor = vec4(x, y, z, w);
  }
`;