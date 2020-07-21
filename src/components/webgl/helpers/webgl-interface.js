/*
* Copyright (c) 2020 Rafael Anderka
* Copyright (c) 2017 Pavel Dobryakov
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import vsBaseSource from '../shaders/vertex/vs-base';

class WebGLInterface {
  constructor(props) {
    this.props = props;
    this._setAspect();
    this._initWebGLContext();
    this._initFloatRendering();
    if (!this.supportsFloatRendering) {
      this._initHalfFloatRendering();
    }
    this._initVertexBuffer();
    this._initBaseVertexShader();
  }

  // Initialises the canvas and WebGL 1 or 2 context
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initWebGLContext() {
    // Get canvas
    this.canvas = document.querySelector(`#${this.props.id}`);

    // Initialize WebGL context
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false
    };
    this.gl = this.canvas.getContext('webgl2', params);
    this.isWebGL2 = !!this.gl;
    if (!this.isWebGL2) {
      this.gl = this.canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    }

    // Set default clear color to black
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  // Initialises float rendering (textures and framebuffers)
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initFloatRendering() {
    // Enable WebGL extensions
    if (this.isWebGL2) {
      this.gl.getExtension('EXT_color_buffer_float');
    } else {
      this.gl.getExtension('OES_texture_float');
    }
    this.supportsLinearFiltering = this.gl.getExtension('OES_texture_float_linear');

    // Set supported texture formats
    this.floatTexType = this.gl.FLOAT;
    if (this.isWebGL2) {  
      this.formatRGBA = this.getSupportedFormat(this.gl.RGBA32F, this.gl.RGBA, this.floatTexType);
      this.formatRG = this.getSupportedFormat(this.gl.RG32F, this.gl.RG, this.floatTexType);
      this.formatR = this.getSupportedFormat(this.gl.R32F, this.gl.RED, this.floatTexType);
    } else {
      this.formatRGBA = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
      this.formatRG = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
      this.formatR = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
    }

    // Store whether GPU supports float rendering
    this.supportsFloatRendering = (this.formatR != null) && (this.formatRG != null) && (this.formatRGBA != null);
  }

  // Initialises half float rendering (textures and framebuffers)
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initHalfFloatRendering() {
    // Enable WebGL extensions
    let halfFloat;
    if (this.isWebGL2) {
      this.gl.getExtension('EXT_color_buffer_float');
      this.supportsLinearFiltering = this.gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = this.gl.getExtension('OES_texture_half_float');
      this.supportsLinearFiltering = this.gl.getExtension('OES_texture_half_float_linear');
    }

    // Set supported texture formats
    this.floatTexType = this.isWebGL2 ? this.gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    if (this.isWebGL2) {
      this.formatRGBA = this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, this.floatTexType);
      this.formatRG = this.getSupportedFormat(this.gl.RG16F, this.gl.RG, this.floatTexType);
      this.formatR = this.getSupportedFormat(this.gl.R16F, this.gl.RED, this.floatTexType);
    } else {
      this.formatRGBA = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
      this.formatRG = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
      this.formatR = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.floatTexType);
    }
  }

  // Returns the most closely matching supported render texture format
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  getSupportedFormat (internalFormat, format, type) {
    if (!this.supportsRenderTextureFormat(internalFormat, format, type)) {
      switch (internalFormat) {
        case this.gl.R16F:
          return this.getSupportedFormat(this.gl.RG16F, this.gl.RG, type);
        case this.gl.RG16F:
          return this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, type);
        default:
          return null;
      }
    }

    return {
      internalFormat,
      format
    }
  }

  // Determines whether a given render texture format is supported by the browser
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  supportsRenderTextureFormat(internalFormat, format, type) {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    return status == this.gl.FRAMEBUFFER_COMPLETE;
  }

  // Initializes a vertex and element buffer for drawing full screen quads
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initVertexBuffer() {
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), this.gl.STATIC_DRAW);
    this.elementBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), this.gl.STATIC_DRAW);
  }

  _initBaseVertexShader() {
    this.vertexShader = this._createShader(vsBaseSource, 'vertex');
  }

  // Creates a framebuffer to use as a render target
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  createFBO(formatParam, filteringParam) {
    // Parse input
    let internalFormat;
    let format;
    switch (formatParam) {
      case "RGBA":
        internalFormat = this.formatRGBA.internalFormat;
        format = this.formatRGBA.format;
        break;
      case "RG":
        internalFormat = this.formatRG.internalFormat;
        format = this.formatRG.format;
        break;
      case "R":
        internalFormat = this.formatR.internalFormat;
        format = this.formatR.format;
        break;
      default:
        internalFormat = this.formatRGBA.internalFormat;
        format = this.formatRGBA.format;
        break;
    }

    let filtering;
    switch (filteringParam) {
      case "LINEAR":
        filtering = this.supportsLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;
        break;
      default:
        filtering = this.gl.NEAREST;
    }

    // Create FBO
    this.gl.activeTexture(this.gl.TEXTURE0);
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, filtering);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filtering);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, this.canvas.width, this.canvas.height, 0, format, this.floatTexType, null);

    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / this.canvas.width;
    const texelSizeY = 1.0 / this.canvas.height;
    const gl = this.gl;
    return {
      texture,
      fbo,
      width: this.canvas.width,
      height: this.canvas.height,
      format,
      texelSizeX,
      texelSizeY,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  // Creates a "double" framebuffer with separate read and write targets
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  createDoubleFBO(formatParam, filteringParam) {
    let fbo1 = this.createFBO(formatParam, filteringParam);
    let fbo2 = this.createFBO(formatParam, filteringParam);

    return {
      width: this.canvas.width,
      height: this.canvas.height,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(v) {
        fbo1 = v;
      },
      get write() {
        return fbo2;
      },
      set write(v) {
        fbo2 = v;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      }
    }
  }

  // Creates and compiles a fragment shader
  createFragmentShader(shaderSource) {
    return this._createShader(shaderSource, 'fragment');
  }

  // Creates and compiles vertex and fragment shaders
  _createShader(shaderSource, shaderType) {
    if (!shaderSource) {
      return null;
    }

    let shader;
    if (shaderType === 'fragment') {
      shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    } else if (shaderType === 'vertex') {
      shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    } else {
      return null;
    }

    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.log(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // Creates and links a pixel shader program
  createProgram(fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.log(this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  // Sets active program
  useProgram(program) {
    this.gl.useProgram(program);
  }

  // Gets uniform location
  getUniformLocation(program, uniform) {
    return this.gl.getUniformLocation(program, uniform);
  }

  uniform1f(location, v0) {
    this.gl.uniform1f(location, v0);
  }

  uniform2f(location, v0, v1) {
    this.gl.uniform2f(location, v0, v1);
  }

  uniform3f(location, v0, v1, v2) {
    this.gl.uniform3f(location, v0, v1, v2);
  }

  uniform1i(location, v0) {
    this.gl.uniform1i(location, v0);
  }

  // Clears the viewport
  clear(destination, r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  // Draw to destination frame buffer
  blit(destination) {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }

  // Read pixels from specified frame buffer
  readPixels(source, x, y, width, height, target) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, source.fbo);
    this.gl.readPixels(x, y, width, height, source.format, this.gl.FLOAT, target);
  }

  setProps(props) {
    this.props = props;
  }

  _setAspect() {
    this.aspect = this.props.containerWidth / this.props.containerHeight;
  }

  // Gets canvas aspect ratio
  getAspect() {
    return {
      xAspect: this.aspect > 1.0 ? this.aspect : 1.0,
      yAspect: this.aspect < 1.0 ? 1 / this.aspect : 1.0
    };
  }

  // Update WebGL state
  update() {
    this._setAspect();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default WebGLInterface;