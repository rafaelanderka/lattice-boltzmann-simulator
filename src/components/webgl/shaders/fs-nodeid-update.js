export default `#version 300 es
// Adds or removes walls based on the cursor position

precision mediump float;
precision mediump sampler2D;

uniform sampler2D uNodeIds;
uniform vec2 uAspect;
uniform vec2 uCursorPos;
uniform vec2 uTexelSize;
uniform float uToolSize;
uniform bool uIsAddingWalls;
uniform bool uIsRemovingWalls;
uniform bool uHasVerticalWalls;
uniform bool uHasHorizontalWalls;

in vec2 UV; 

out vec4 updatedNodeId;

void main(void) {
  float dist = length((uAspect * uCursorPos) - (uAspect * UV));
  bool isActiveNode = dist <= uToolSize;
  bool isAdding = uIsAddingWalls && isActiveNode;
  bool isRemoving = uIsRemovingWalls && isActiveNode;
  bool liesOnRightWall = UV.x >= 1.0 - uTexelSize.x;
  bool liesOnBottomWall = UV.y <= 0.0 + uTexelSize.y;
  bool hasVerticalWallsEnabled = uHasVerticalWalls && liesOnRightWall;
  bool hasHorizontalWallsEnabled = uHasHorizontalWalls && liesOnBottomWall;
  bool hasVerticalWallsDisabled = !uHasVerticalWalls && liesOnRightWall;
  bool hasHorizontalWallsDisabled = !uHasHorizontalWalls && liesOnBottomWall;
  if (isAdding || hasVerticalWallsEnabled || hasHorizontalWallsEnabled) {
    updatedNodeId = vec4(1.0, 0.0, 0.0, 0.0);
  } else if (isRemoving || hasVerticalWallsDisabled || hasHorizontalWallsDisabled) {
    updatedNodeId = vec4(0.0);
  } else {
    updatedNodeId = texture(uNodeIds, UV);
  }
}
`;