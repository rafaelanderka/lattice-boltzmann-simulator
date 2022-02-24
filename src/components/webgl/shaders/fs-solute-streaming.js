export default `#version 300 es
// Performs solute streaming

precision mediump float;
precision mediump sampler2D;

uniform sampler2D uNodeIds;
uniform sampler2D uSoluteData[3];
uniform vec2 uTexelSize;
uniform float uInitConcentration;

in vec2 UV;

layout(location = 0) out vec4 updatedSoluteData0;
layout(location = 1) out vec4 updatedSoluteData1;
layout(location = 2) out vec4 updatedSoluteData2;

void main(void) {
  // Unpack solute data
  vec4 soluteData0 = texture(uSoluteData[0], UV);
  vec4 soluteData1 = texture(uSoluteData[1], UV);
  vec4 soluteData2 = texture(uSoluteData[2], UV);
  float concentration = soluteData0.x;
  float concentrationSource = 0.; // Reset concentration source
  float dist0 = soluteData0.z;
  float dist1 = soluteData0.w;
  float dist2 = soluteData1.x;
  float dist3 = soluteData1.y;
  float dist4 = soluteData1.z;
  float dist5 = soluteData1.w;
  float dist6 = soluteData2.x;
  float dist7 = soluteData2.y;
  float dist8 = soluteData2.z;

  // Determine whether node is adjacent to wall
  float offsetX = uTexelSize.x;
  float offsetY = uTexelSize.y;
  vec2 UV_t  = UV + vec2(      0.,  offsetY);
  vec2 UV_tr = UV + vec2( offsetX,  offsetY);
  vec2 UV_r  = UV + vec2( offsetX,       0.);
  vec2 UV_br = UV + vec2( offsetX, -offsetY);
  vec2 UV_b  = UV + vec2(      0., -offsetY);
  vec2 UV_bl = UV + vec2(-offsetX, -offsetY);
  vec2 UV_l  = UV + vec2(-offsetX,       0.);
  vec2 UV_tl = UV + vec2(-offsetX,  offsetY);
  bool isWall_t  = int(texture(uNodeIds, UV_t).x + 0.5) == 1;
  bool isWall_tr = int(texture(uNodeIds, UV_tr).x + 0.5) == 1;
  bool isWall_r  = int(texture(uNodeIds, UV_r).x + 0.5) == 1;
  bool isWall_br = int(texture(uNodeIds, UV_br).x + 0.5) == 1;
  bool isWall_b  = int(texture(uNodeIds, UV_b).x + 0.5) == 1;
  bool isWall_bl = int(texture(uNodeIds, UV_bl).x + 0.5) == 1;
  bool isWall_l  = int(texture(uNodeIds, UV_l).x + 0.5) == 1;
  bool isWall_tl = int(texture(uNodeIds, UV_tl).x + 0.5) == 1;

  // Stream
  dist1 = isWall_l ? dist3 : texture(uSoluteData[0], UV_l).w;
  dist2 = isWall_b ? dist4 : texture(uSoluteData[1], UV_b).x;
  dist3 = isWall_r ? dist1 : texture(uSoluteData[1], UV_r).y;
  dist4 = isWall_t ? dist2 : texture(uSoluteData[1], UV_t).z; 
  dist5 = (isWall_b || isWall_l || isWall_bl) ? dist7 : texture(uSoluteData[1], UV_bl).w;
  dist6 = (isWall_b || isWall_r || isWall_br) ? dist8 : texture(uSoluteData[2], UV_br).x;
  dist7 = (isWall_t || isWall_r || isWall_tr) ? dist5 : texture(uSoluteData[2], UV_tr).y;
  dist8 = (isWall_t || isWall_l || isWall_tl) ? dist6 : texture(uSoluteData[2], UV_tl).z;

  // Calculate macroscopic concentration
  int nodeId = int(texture(uNodeIds, UV).x + 0.5);
  concentration = (nodeId == 0) ? max(-1., -uInitConcentration + dist0 + dist1 + dist2 + dist3 + dist4 + dist5 + dist6 + dist7 + dist8) : 0.;

  updatedSoluteData0 = vec4(concentration, concentrationSource, dist0, dist1);
  updatedSoluteData1 = vec4(dist2, dist3, dist4, dist5);
  updatedSoluteData2 = vec4(dist6, dist7, dist8, 0.);
}
`;
