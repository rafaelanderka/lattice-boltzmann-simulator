export default `
  // FRAGMENT SHADER

  // Adds or removes walls based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsAdding;
  uniform bool uIsRemoving;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    float threshold = 0.05;
    bool isActiveNode = dist <= threshold;
    bool isAdding = uIsAdding && isActiveNode;
    bool isRemoving = uIsRemoving && isActiveNode;
    if (isAdding) {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 0.0);
    } else if (isRemoving) {
      gl_FragColor = vec4(0.0);
    } else {
      gl_FragColor = texture2D(uNodeId, vUV);
    }
  }
`;