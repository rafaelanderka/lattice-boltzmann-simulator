export default `
  // FRAGMENT SHADER

  // Multiplies two given textures

  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uTexture0;
  uniform sampler2D uTexture1;

  varying vec2 vUV; 

  void main(void) {
    gl_FragColor = texture2D(uTexture0, vUV) * texture2D(uTexture1, vUV);
  }
`;