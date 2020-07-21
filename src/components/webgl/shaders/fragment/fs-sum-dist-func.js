export default `
  // FRAGMENT SHADER

  // Calculates the sum of distribution functions (e.g. for density and concentration calculationn)

  precision highp float;
  precision highp sampler2D;

  uniform float uDefaultVal;
  uniform sampler2D uSummand;
  uniform sampler2D uDistFunc;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      // Fluid node
      vec4 nodalDistFunc = texture2D(uDistFunc, vUV);
      float sum = texture2D(uSummand, vUV).x + nodalDistFunc.x + nodalDistFunc.y + nodalDistFunc.z + nodalDistFunc.w;
      gl_FragColor = vec4(max(sum, -1.0), 0.0, 0.0, 0.0);
    }
  }
`;