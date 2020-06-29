export default `
  // VERTEX SHADER
  
  attribute vec2 aPosition;
  varying vec2 vUV;

  void main(void) {
    gl_Position = vec4(aPosition, 0.0, 1.0); 
    vUV = aPosition * 0.5 + 0.5; 
  }
`;