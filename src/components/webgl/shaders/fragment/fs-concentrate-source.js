export default `
  // FRAGMENT SHADER

  // Adds or removes concentrate source based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsAdding;
  uniform bool uIsRemoving;
  uniform float uToolSize;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform sampler2D uConcentrateSource;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    // Calculate normalized distance to cursor position
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    
    // Calculate value to be added to or removed from current node
    float val = 0.1 * (1.0 - dist / uToolSize);
    
    // Add or remove value
    bool isActiveNode = dist <= uToolSize;
    bool isAddingNodal = uIsAdding && isActiveNode;
    bool isRemovingNodal = uIsRemoving && isActiveNode;
    float nodalConcentrateSource = texture2D(uConcentrateSource, vUV).x;
    if (isAddingNodal) {
      float newConcentration = nodalConcentrateSource + val;
      gl_FragColor = vec4(newConcentration, 0.0, 0.0, 0.0);
    } else if (isRemovingNodal) {
      float newConcentration = nodalConcentrateSource - val;
      gl_FragColor = vec4(newConcentration, 0.0, 0.0, 0.0);
    } else {
      gl_FragColor = texture2D(uConcentrateSource, vUV);
    }
  }
`;