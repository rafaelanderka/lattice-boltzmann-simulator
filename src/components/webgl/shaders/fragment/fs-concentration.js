export default `
  // FRAGMENT SHADER

  // Adds or removes concentration based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsAdding;
  uniform bool uIsRemoving;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform sampler2D uConcentration;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    float threshold = 0.1;
    float val = 0.05 * (1.0 - dist / threshold);
    bool isActiveNode = dist <= threshold;
    bool isAdding = uIsAdding && isActiveNode;
    bool isRemoving = uIsRemoving && isActiveNode;
    float nodalConcentration = texture2D(uConcentration, vUV).x;
    if (isAdding) {
      float newConcentration = nodalConcentration + val;
      newConcentration = newConcentration > 1.0 ? 1.0 : newConcentration;
      gl_FragColor = vec4(newConcentration, 0.0, 0.0, 0.0);
    } else if (isRemoving) {
      float newConcentration = nodalConcentration - val;
      newConcentration = newConcentration < 0.0 ? 0.0 : newConcentration;
      gl_FragColor = vec4(newConcentration, 0.0, 0.0, 0.0);
    } else {
      gl_FragColor = texture2D(uConcentration, vUV);
    }
  }
`;