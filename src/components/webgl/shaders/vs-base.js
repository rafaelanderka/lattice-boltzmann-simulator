export default `#version 300 es
  
  in vec2 aPosition;
  out vec2 UV;

  void main(void) {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    UV = aPosition * 0.5 + 0.5;
  }
`;