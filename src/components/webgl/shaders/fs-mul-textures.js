export default `#version 300 es
  // FRAGMENT SHADER

  // Multiplies two given textures

  precision mediump float;
  precision mediump sampler2D;

  uniform sampler2D uTexture0;
  uniform sampler2D uTexture1;

  in vec2 UV; 

  void main(void) {
    gl_FragColor = texture(uTexture0, UV) * texture(uTexture1, UV);
  }
`;