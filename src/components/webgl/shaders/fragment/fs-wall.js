export default `
  // FRAGMENT SHADER

  // Adds or removes walls based on the cursor position

  precision highp float;
  precision highp sampler2D;

  uniform bool uIsAdding;
  uniform bool uIsRemoving;
  uniform bool uLeftRightWall;
  uniform bool uTopBottomWall;
  uniform float uXAspect;
  uniform float uYAspect;
  uniform vec2 uCursorPos;
  uniform vec2 uTexelSize;
  uniform sampler2D uNodeId;

  varying vec2 vUV; 
  
  void main(void) {
    float dist = length(vec2(uXAspect * uCursorPos.x, uYAspect * uCursorPos.y) - vec2(uXAspect * vUV.x, uYAspect * vUV.y));
    float threshold = 0.02;
    bool isActiveNode = dist <= threshold;
    bool isAdding = uIsAdding && isActiveNode;
    bool isRemoving = uIsRemoving && isActiveNode;
    bool leftRightWall = uLeftRightWall && vUV.x >= 1.0 - uTexelSize.x;
    bool topBottomWall = uTopBottomWall && vUV.y <= 0.0 + uTexelSize.y;
    bool leftWall = false;
    bool bottomWall = false;
    if (isAdding || leftRightWall || topBottomWall) {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 0.0);
    } else if (isRemoving || !leftRightWall || !topBottomWall) {
      gl_FragColor = vec4(0.0);
    } else {
      gl_FragColor = texture2D(uNodeId, vUV);
    }
  }
`;