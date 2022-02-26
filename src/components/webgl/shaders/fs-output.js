export default `#version 300 es
// Visualises the velocity field and solutes

precision mediump float;
precision mediump sampler2D;

const float baseBrightness = 0.;
const vec3 velocityCol = vec3(1.); 
const vec4 wallCol = vec4(1.);
const vec4 indicatorCol = vec4(1.);
const float indicatorOffset = 0.05;
const float indicatorArrowWidth = 0.15;
const float indicatorArrowScale = 0.04;

uniform sampler2D uNodeIds;
uniform sampler2D uFluidData;
uniform sampler2D uSolute0Data;
uniform sampler2D uSolute1Data;
uniform sampler2D uSolute2Data;
uniform vec3 uSolute0Col;
uniform vec3 uSolute1Col;
uniform vec3 uSolute2Col;
uniform vec2 uTexelSize;
uniform vec2 uAspect;
uniform float uPhase;
uniform bool uDrawIndicatorLines;
uniform bool uDrawIndicatorArrows;

in vec2 UV; 

out vec4 outColor;

vec2 getIndicatorUV() {
  return UV - vec2(mod(UV.x, indicatorOffset), mod(UV.y, indicatorOffset)) + 0.5 * indicatorOffset;
}

float getToneMappedConcentration(sampler2D solute) {
    return sqrt(min(1., texture(solute, UV).x));
}

float getToneMappedVelocity() {
    return 0.2 * length(texture(uFluidData, UV).xy);
}

float signedDistanceSegment(vec2 p, vec2 offset) {
    vec2 UVa = UV - p;
    float h = clamp(dot(UVa, offset) / dot(offset, offset), 0., 1.);
    return length(UVa - offset * h);
}

float signedDistanceTriangle(vec2 p0, vec2 p1, vec2 p2) {
    vec2 e0 = p1 - p0;
    vec2 e1 = p2 - p1;
    vec2 e2 = p0 - p2;
    vec2 v0 = UV - p0;
    vec2 v1 = UV - p1;
    vec2 v2 = UV - p2;
    vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0., 1.);
    vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0., 1.);
    vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0., 1.);
    float s = sign(e0.x * e2.y - e0.y * e2.x);
    vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                     vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                     vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
    return -sqrt(d.x) * sign(d.y);
}

void main(void) {
  // Shade fluid and solutes
  float c0 = getToneMappedConcentration(uSolute0Data);
  float c1 = getToneMappedConcentration(uSolute1Data);
  float c2 = getToneMappedConcentration(uSolute2Data);
  float v = getToneMappedVelocity();
  vec4 solute0 = vec4(c0 * uSolute0Col, c0);
  vec4 solute1 = vec4(c1 * uSolute1Col, c1);
  vec4 solute2 = vec4(c2 * uSolute2Col, c2);
  vec4 velocity = vec4(v * velocityCol, v);
  vec4 blend = vec4(1.) - (vec4(1.) - solute0) * (vec4(1.) - solute1) * (vec4(1.) - solute2) * (vec4(1.) - velocity);;

  // Determine nearest indicator data
  vec2 indicatorUV = getIndicatorUV();
  vec2 indicatorVel = texture(uFluidData, indicatorUV).xy;
  float indicatorSpeed = dot(indicatorVel, indicatorVel);

  // Calculate indicator line shading
  float indicatorLineDistanceField = signedDistanceSegment(indicatorUV, 0.1 * indicatorVel);
  bool shadeIndicator = uDrawIndicatorLines && (indicatorSpeed > 1e-5) && (indicatorLineDistanceField < 7e-4);

  // Calculate indicator arrow shading
  vec2 indicatorOffset = indicatorUV + 0.03 * indicatorVel;
  vec2 indicatorArrowP1 = indicatorOffset + indicatorArrowScale * vec2(indicatorVel.x, indicatorVel.y);
  vec2 indicatorArrowP0 = indicatorOffset + indicatorArrowScale * vec2(indicatorVel.y * indicatorArrowWidth, -indicatorVel.x * indicatorArrowWidth);
  vec2 indicatorArrowP2 = indicatorOffset + indicatorArrowScale * vec2(-indicatorVel.y * indicatorArrowWidth, indicatorVel.x * indicatorArrowWidth);
  float indicatorArrowDistanceField = signedDistanceTriangle(indicatorArrowP0, indicatorArrowP1, indicatorArrowP2);
  shadeIndicator = shadeIndicator || (uDrawIndicatorArrows && (indicatorSpeed > 1e-5) && (indicatorArrowDistanceField < 7e-4));

  // Determine whether node is adjacent to wall
  float offsetX = 0.3 * uTexelSize.x;
  float offsetY = 0.3 * uTexelSize.y;
  vec2 UV_t  = UV + vec2(      0.,  offsetY);
  vec2 UV_tr = UV + vec2( offsetX,  offsetY);
  vec2 UV_r  = UV + vec2( offsetX,       0.);
  vec2 UV_br = UV + vec2( offsetX, -offsetY);
  vec2 UV_b  = UV + vec2(      0., -offsetY);
  vec2 UV_bl = UV + vec2(-offsetX, -offsetY);
  vec2 UV_l  = UV + vec2(-offsetX,       0.);
  vec2 UV_tl = UV + vec2(-offsetX,  offsetY);
  bool hasAdjacentWall  = (texture(uNodeIds, UV_t).x + texture(uNodeIds, UV_tr).x + texture(uNodeIds, UV_r).x + texture(uNodeIds, UV_br).x + texture(uNodeIds, UV_b).x + texture(uNodeIds, UV_bl).x + texture(uNodeIds, UV_l).x + texture(uNodeIds, UV_tl).x) > .99;

  // Determine node type
  float nodeId = texture(uNodeIds, UV).x;
  bool isFluid = nodeId < .7;
  bool isWall = nodeId > .1;
  float shadeWallOutline = (isFluid && hasAdjacentWall) ? 1. : 0.;
  vec2 scaledUV = uAspect * UV;
  float maxAspect = max(uAspect.x, uAspect.y);
  float shadeWallStripe = isWall ? max(0., pow(sin((300. / maxAspect) * (scaledUV.x + scaledUV.y + uPhase)), 10.)) : 0.;

  outColor = shadeIndicator ? indicatorCol : blend + (shadeWallOutline + shadeWallStripe) * wallCol;
}
`;