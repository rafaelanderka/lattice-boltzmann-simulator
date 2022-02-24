export default `#version 300 es
  // FRAGMENT SHADER

  // Calculates the sum of distribution functions (e.g. for density and concentration calculationn)

  precision mediump float;
  precision mediump sampler2D;

  uniform float uDefaultVal;
  uniform sampler2D uSummand;
  uniform sampler2D uDistFunc;
  uniform sampler2D uNodeId;

  in vec2 UV; 
  
  void main(void) {
    int nodeId = int(texture(uNodeId, UV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      // Fluid node
      vec4 nodalDistFunc = texture(uDistFunc, UV);
      float sum = texture(uSummand, UV).x + nodalDistFunc.x + nodalDistFunc.y + nodalDistFunc.z + nodalDistFunc.w;
      gl_FragColor = vec4(max(sum, -1.0), 0.0, 0.0, 0.0);
    }
  }
`;