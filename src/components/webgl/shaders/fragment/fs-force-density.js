export default `
  // FRAGMENT SHADER

  // Applies a force density based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsActive;
  uniform float uToolSize;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform vec2 uCursorVel;
  uniform sampler2D uNodeId;

  const float limit = 0.01;

  varying vec2 vUV; 
  
  void main(void) {
    int nodeId = int(texture2D(uNodeId, vUV).x + 0.5);
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    if (uIsActive && dist <= uToolSize && nodeId != 1) {
      float coeff = 10.0 * (1.0 - dist / uToolSize);
      gl_FragColor = vec4(coeff * max(-limit, min(uCursorVel.x, limit)), coeff * max(-limit, min(uCursorVel.y, limit)), 0.0, 0.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
`;