export default `
  // FRAGMENT SHADER

  // Applies a force density based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsActive;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform vec2 uCursorVel;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    float threshold = 0.1;
    if (uIsActive && dist <= threshold && nodeId != 1) {
      float coeff = 2.0 * (1.0 - dist / threshold);
      gl_FragColor = vec4(coeff * uCursorVel.x, coeff * uCursorVel.y, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;