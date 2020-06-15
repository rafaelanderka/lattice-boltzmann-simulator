export default `
  // VERTEX SHADER
  
  attribute vec3 aPosition;
  attribute vec2 aUV;
  varying vec2 vUV;

  void main(void) {
    gl_Position = vec4(aPosition, 1.0); 
    vUV = aUV; 
  }
`;