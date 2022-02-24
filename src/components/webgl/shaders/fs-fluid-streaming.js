export default `#version 300 es
// Performs fluid streaming

precision mediump float;
precision mediump sampler2D;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData[4];
uniform vec2 uTexelSize;
uniform float uInitDensity;
uniform float uSpeedOfSound;

in vec2 UV;

layout(location = 0) out vec4 updatedFluidData0;
layout(location = 1) out vec4 updatedFluidData1;
layout(location = 2) out vec4 updatedFluidData2;
layout(location = 3) out vec4 updatedFluidData3;

void main(void) {
  // Unpack fluid data
  vec4 fluidData0 = texture(uFluidData[0], UV);
  vec4 fluidData1 = texture(uFluidData[1], UV);
  vec4 fluidData2 = texture(uFluidData[2], UV);
  vec4 fluidData3 = texture(uFluidData[3], UV);
  vec2 velocity = fluidData0.xy;
  vec2 forceDensity = fluidData0.zw;
  float density = fluidData1.x;
  float dist0 = fluidData1.y;
  float dist1 = fluidData1.z;
  float dist2 = fluidData1.w;
  float dist3 = fluidData2.x;
  float dist4 = fluidData2.y;
  float dist5 = fluidData2.z;
  float dist6 = fluidData2.w;
  float dist7 = fluidData3.x;
  float dist8 = fluidData3.y;
  
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
  dist1 = isWall_l ? dist3 : texture(uFluidData[1], UV_l).z;
  dist2 = isWall_b ? dist4 : texture(uFluidData[1], UV_b).w;
  dist3 = isWall_r ? dist1 : texture(uFluidData[2], UV_r).x;
  dist4 = isWall_t ? dist2 : texture(uFluidData[2], UV_t).y; 
  dist5 = (isWall_b || isWall_l || isWall_bl) ? dist7 : texture(uFluidData[2], UV_bl).z;
  dist6 = (isWall_b || isWall_r || isWall_br) ? dist8 : texture(uFluidData[2], UV_br).w;
  dist7 = (isWall_t || isWall_r || isWall_tr) ? dist5 : texture(uFluidData[3], UV_tr).x;
  dist8 = (isWall_t || isWall_l || isWall_tl) ? dist6 : texture(uFluidData[3], UV_tl).y;

  // Calculate macroscopic density and velocity
  int nodeId = int(texture(uNodeIds, UV).x + 0.5);
  if (nodeId == 1) {
    // Wall node
    density = 0.;
    velocity = vec2(0.);
  } else {
    // Fluid node
    density = max(-1., -uInitDensity + dist0 + dist1 + dist2 + dist3 + dist4 + dist5 + dist6 + dist7 + dist8);
    float invDensity = 1. / (uInitDensity + density);
    velocity.x = invDensity * (dist1 - dist3 + dist5 - dist6 - dist7 + dist8);
    velocity.y = invDensity * (dist2 - dist4 + dist5 + dist6 - dist7 - dist8);
    
    // Ensure velocity is subsonic
    float velocityMag = length(velocity);
    if (velocityMag > uSpeedOfSound) {
      velocity = velocity * (uSpeedOfSound / velocityMag);
    }
  }

  updatedFluidData0 = vec4(velocity, forceDensity);
  updatedFluidData1 = vec4(density, dist0, dist1, dist2);
  updatedFluidData2 = vec4(dist3, dist4, dist5, dist6);
  updatedFluidData3 = vec4(dist7, dist8, 0., 0.);
}
`;
