export default `
  // FRAGMENT SHADER

  // Visualises the (scaled) magnitude of a given input texture

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uVelocity;
  uniform sampler2D uTracer;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 

  const float baseBrightness = 0.97;
  const vec3 velocityCol = vec3(0.8); 
  const vec3 tracer1Col = vec3(0.6352941176, 1.0, 0.0);
  const vec3 tracer2Col = vec3(1.0, 0.73333333334, 0.5764705882);
  const vec3 wallCol = vec3(0.2);
  const vec3 yellow = vec3(247.0 / 255.0, 216.0 / 255.0, 84.0 / 255.0);

  vec3 hsv2rgb(vec3 hsv) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
  }
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    if (nodeId == 1) {
      // Wall node
      gl_FragColor = vec4(wallCol, 1.0);
    } else {
      // Fluid node
      vec2 velocity = texture2D(uVelocity, vUV).xy;
      float concentration = texture2D(uTracer, vUV).x;
      gl_FragColor = vec4(baseBrightness - concentration * (baseBrightness - tracer2Col) - 3.33333333334 * length(velocity) * (baseBrightness - velocityCol), 1.0);
    }
  }
`;