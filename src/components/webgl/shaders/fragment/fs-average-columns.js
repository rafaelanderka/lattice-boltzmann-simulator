export default `
  // FRAGMENT SHADER

  // Averages the columns of a given target texture

  precision highp float;
  precision highp sampler2D;

  uniform vec2 uTexelSize;
  uniform vec2 uCanvasSize;
  uniform sampler2D uTarget;

  const int samples = 256;

  varying vec2 vUV; 
  
  void main(void) {
    float x = vUV.x;
    float y = 0.0;
    float offset = 1.0 / float(samples);
    float sum = 0.0;
    for (int i = 0; i < samples; i++) {
      sum += texture2D(uTarget, vec2(x, y)).x;
      y += offset;
    }
    float avg = sum / float(samples);
    gl_FragColor = vec4(avg, 0.0, 0.0, 0.0);
  }
`;