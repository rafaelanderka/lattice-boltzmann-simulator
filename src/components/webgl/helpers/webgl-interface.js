/*
* Copyright (c) 2022 Rafael Anderka
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

import vsBaseSource from '../shaders/vs-base';
import * as twgl from 'twgl.js';

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
  }

  // Initialises the canvas and WebGL 1 or 2 context
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
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
    this.supportsWebGL2 = !!this.gl;
    if (!this.supportsWebGL2) {
      alert('WebGL2 is required from v0.3.0.')
      throw new Error('WebGL2 is required from v0.3.0.') 
    }
    
    // Set default clear color to black
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  // Initialises float rendering (textures and framebuffers)
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initFloatRendering() {
    // Enable WebGL extensions
    this.gl.getExtension('EXT_color_buffer_float');
    this.supportsLinearFiltering = this.gl.getExtension('OES_texture_float_linear');

    // Set supported texture formats
    this.formatRGBA = this._getSupportedFormat(this.gl.RGBA32F, this.gl.RGBA, this.gl.FLOAT);
    this.formatRG = this._getSupportedFormat(this.gl.RG32F, this.gl.RG, this.gl.FLOAT);
    this.formatR = this._getSupportedFormat(this.gl.R32F, this.gl.RED, this.gl.FLOAT);
    this.floatTexType = this.gl.FLOAT;

    // Store whether GPU supports float rendering
    this.supportsFloatRendering = (this.formatR != null) && (this.formatRG != null) && (this.formatRGBA != null);
  }

  // Initialises half float rendering (textures and framebuffers)
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initHalfFloatRendering() {
    // Enable WebGL extensions
    this.gl.getExtension('EXT_color_buffer_float');
    this.supportsLinearFiltering = this.gl.getExtension('OES_texture_float_linear');

    // Set supported texture formats
    this.formatRGBA = this._getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, this.gl.HALF_FLOAT);
    this.formatRG = this._getSupportedFormat(this.gl.RG16F, this.gl.RG, this.gl.HALF_FLOAT);
    this.formatR = this._getSupportedFormat(this.gl.R16F, this.gl.RED, this.gl.HALF_FLOAT);
    this.floatTexType = this.gl.HALF_FLOAT;
  }

  // Returns the most closely matching supported render texture format
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _getSupportedFormat (internalFormat, format, type) {
    if (!this._supportsRenderTextureFormat(internalFormat, format, type)) {
      switch (internalFormat) {
        case this.gl.R16F:
          return this._getSupportedFormat(this.gl.RG16F, this.gl.RG, type);
        case this.gl.RG16F:
          return this._getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, type);
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
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _supportsRenderTextureFormat(internalFormat, format, type) {
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

  // Initializes a vertex and element buffer for drawing a single full screen triangle. A single
  // triangle is chosen over a full-screen quad to minimize the number of draw calls (along the diagonal).
  _initVertexBuffer() {
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 3, 3, -1]), this.gl.STATIC_DRAW);
    this.elementBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2]), this.gl.STATIC_DRAW);
  }

  createFBO(formatType, filteringType, width, height, numTextures) {
    // Parse input
    let internalFormat;
    let format;
    switch (formatType) {
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
    switch (filteringType) {
      case "LINEAR":
        filtering = this.supportsLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;
        break;
      default:
        filtering = this.gl.NEAREST;
    }

    // Create FBO
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.viewport(0, 0, width, height);

    // Attach textures to FBO
    const textures = []
    const drawBuffers = [];
    for (let i = 0; i < numTextures; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      const texture = this.gl.createTexture();
      textures.push(texture);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, filtering);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filtering);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, this.floatTexType, null);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, texture, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      drawBuffers.push(this.gl.COLOR_ATTACHMENT0 + i)
    }

    const texelSize = [1.0 / width, 1.0 / height];
    return {
      textures,
      fbo,
      width: width,
      height: height,
      format,
      texelSize,
      drawBuffers,
    };
  }

  // Creates a "double" framebuffer with separate read and write targets
  // Note: Adapted from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  createReadWriteFBO(formatType, filteringType, width, height, numTextures) {
    let fbo2 = this.createFBO(formatType, filteringType, width, height, numTextures);
    let fbo1 = this.createFBO(formatType, filteringType, width, height, numTextures);

    return {
      width: width,
      height: height,
      format: fbo1.format,
      texelSize: fbo1.texelSize,
      drawBuffers: fbo1.drawBuffers,
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

  // Creates and links a shader program
  createProgram(fragmentShader) {
    const p = twgl.createProgram(this.gl, [vsBaseSource, fragmentShader]);
    return p;
  }

  // Creates and links a shader program, stores uniform locations
  createProgramInfo(fragmentShader) {
    const p = twgl.createProgramInfo(this.gl, [vsBaseSource, fragmentShader]);
    return p;
  }

  // Sets active program
  useProgram(program) {
    this.gl.useProgram(program);
  }

  // Sets uniforms
  setUniforms(setters, values) {
    twgl.setUniforms(setters, values);
  }

  // Clears the current viewport
  clear(destination, r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination.fbo);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  // Draw to destination frame buffer
  blit(destination, width, height) {
    this.gl.viewport(0, 0, width, height)

    const fbo = destination ? destination.fbo : null;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);

    if (destination != null) {
      this.gl.drawBuffers(destination.drawBuffers);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.drawElements(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_SHORT, 0);
  }

  logError() {
    const err = this.gl.getError();
    console.log(err);
    switch (err) {
      case this.gl.NO_ERROR:
        console.log('NO_ERROR');
        return false;
      case this.gl.INVALID_ENUM:
        console.log('INVALID_ENUM');
        return true;
      case this.gl.INVALID_VALUE:
        console.log('INVALID_VALUE');
        return true;
      case this.gl.INVALID_OPERATION:
        console.log('INVALID_OPERATION');
        return true;
      case this.gl.INVALID_FRAMEBUFFER_OPERATION:
        console.log('INVALID_FRAMEBUFFER_OPERATION');
        return true;
      case this.gl.OUT_OF_MEMORY:
        console.log('OUT_OF_MEMORY');
        return true;
      case this.gl.CONTEXT_LOST_WEBG:
        console.log('CONTEXT_LOST_WEBG');
        return true;
    }
  }

  // Read pixels from specified frame buffer
  readPixels(source, x, y, width, height, target) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, source.fbo);
    this.gl.readPixels(x, y, width, height, source.format, this.floatTexType, target);
  }

  setProps(props) {
    this.props = props;
  }

  _setAspect() {
    this.aspect = this.props.containerWidth / this.props.containerHeight;
  }

  // Gets canvas aspect ratio
  getAspect() {
    return [this.aspect > 1.0 ? this.aspect : 1.0, this.aspect < 1.0 ? 1 / this.aspect : 1.0];
  }

  // Update WebGL state
  update() {
    this._setAspect();
  }
}

export default WebGLInterface;