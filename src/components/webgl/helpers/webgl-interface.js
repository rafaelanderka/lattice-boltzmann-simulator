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
  constructor(id) {
    this.id = id;
    this._initWebGLContext();
    this._initFloatRendering();
    this._initVertexBuffer();
    this._initBaseVertexShader();
    this._initEventListeners();
  }

  // Initialises the canvas and WebGL 1 or 2 context
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initWebGLContext() {
    // Get canvas
    this.canvas = document.querySelector(`#${this.id}`);

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

  // Initializes a vertex buffer for drawing full screen quads
  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  _initVertexBuffer() {
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const vertices = [1.0, 1.0, 0.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, -1.0, 0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 0.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 5;
    this.vertexBuffer.numItems = 4;
  }

  _initBaseVertexShader() {
    this.vertexShader = this._createShader(vsBaseSource, 'vertex');
  }

  // Inintializes event listeners for mouse and touch input
  _initEventListeners() {
    // Initialize input state variables
    this._setCanvasPos();
    this.isActive = false;
    this.cursorPos = {
      x: 0.5,
      y: 0.5
    };
    this.prevMousePos = {
      x: 0.5,
      y: 0.5
    };
    this.cursorVel = {
      x: 0.0,
      y: 0.0
    };
    
    // Handle mouse input
    this.canvas.addEventListener("mousemove", e => this._setCursorPos(e), false);
    this.canvas.addEventListener("mousedown", e => {this.isActive = true;});
    this.canvas.addEventListener("mouseup", e => {this.isActive = false;});

    // Handle touch input
    this.canvas.addEventListener("touchstart", e => { 
      e.preventDefault();
      this.isActive = true;
      this._setCursorPos(e.targetTouches[0]);
    });
    this.canvas.addEventListener("touchend", e => {this.isActive = false;});
    this.canvas.addEventListener("touchmove", e => { 
      e.preventDefault();
      this._setCursorPos(e.targetTouches[0]);
    }, false);
  }

  _setCursorPos(e) {
    this.lastCursorPos = this.cursorPos;
    this.cursorPos = {
      x: (e.clientX - this.canvasPos.x) / this.canvas.width,
      y: 1.0 - ((e.clientY - this.canvasPos.y)) / this.canvas.height
    };
    this.cursorVel = {
      x: this.cursorPos.x - this.lastCursorPos.x,
      y: this.cursorPos.y - this.lastCursorPos.y
    };
  }

  // Returns the current cursor state
  getCursorState() {
    return {
      cursorPos: this.cursorPos,
      cursorVel: this.cursorVel,
      isActive: this.isActive
    }
  }

  _setCanvasPos() {
    this.canvasPos = this._getPosition(this.canvas);
  }

  // Helper function to get an element's exact position
  _getPosition(el) {
    let xPos = 0;
    let yPos = 0;
    
    while (el) {
      if (el.tagName == "BODY") {
        // Deal with browser quirks with body/window/document and page scroll
        let xScroll = el.scrollLeft || document.documentElement.scrollLeft;
        let yScroll = el.scrollTop || document.documentElement.scrollTop;
        xPos += (el.offsetLeft - xScroll + el.clientLeft);
        yPos += (el.offsetTop - yScroll + el.clientTop);
      } else {
        // For all other non-BODY elements  
        xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      }
      el = el.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
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
    this.gl.enableVertexAttribArray(0);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexBuffer.numItems);
  }

  // Update WebGL state
  update() {
    this._setCanvasPos();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default WebGLInterface;