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

class WebGLInterface {
  constructor(id) {
    this.id = id;
    this.initWebGLContext();
    this.initHalfFloatRendering();
    this.initVertexBuffer();
    this.initEventListeners();
  }

  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  initWebGLContext() {
    // Get canvas
    this.canvas = document.querySelector(`#${this.id}`);

    // Initialize WebGL context
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    this.gl = this.canvas.getContext('webgl2', params);
    this.isWebGL2 = !!this.gl;
    if (!this.isWebGL2) {
        this.gl = this.canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    }

    // Set default clear color to black
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  // Note: Originally taken from Pavel Dobryakov's WebGL Fluid Simulation
  // https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
  initHalfFloatRendering() {
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
    this.halfFloatTexType = this.isWebGL2 ? this.gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    if (this.isWebGL2) {
        this.formatRGBA = this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, this.halfFloatTexType);
        this.formatRG = this.getSupportedFormat(this.gl.RG16F, this.gl.RG, this.halfFloatTexType);
        this.formatR = this.getSupportedFormat(this.gl.R16F, this.gl.RED, this.halfFloatTexType);
    } else {
        this.formatRGBA = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.halfFloatTexType);
        this.formatRG = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.halfFloatTexType);
        this.formatR = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.halfFloatTexType);
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
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
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
  initVertexBuffer() {
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const vertices = [1.0, 1.0, 0.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, -1.0, 0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 0.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 5;
    this.vertexBuffer.numItems = 4;
  }

  // Inintializes event listeners for mouse and touch input
  initEventListeners() {
      // Initialize input state variables
      this.setCanvasPos();
      this.isActive = false;
      this.mousePos = {
        x: 0.0,
        y: 0.0
      };
      this.prevMousePos = {
        x: 0.0,
        y: 0.0
      };
      this.mouseVel = {
        x: 0.0,
        y: 0.0
      };
      
      // Handle mouse input
      this.canvas.addEventListener("mousemove", e => this.setMousePos(e), false);
      this.canvas.addEventListener("mousedown", e => {this.isActive = true;});
      this.canvas.addEventListener("mouseup", e => {this.isActive = false;});
  
      // Handle touch input
      this.canvas.addEventListener("touchstart", e => { 
        e.preventDefault();
        this.isActive = true;
        this.setMousePos(e.targetTouches[0]);
      });
      this.canvas.addEventListener("touchend", e => {this.isActive = false;});
      this.canvas.addEventListener("touchmove", e => { 
        e.preventDefault();
        this.setMousePos(e.targetTouches[0]);
      }, false);
  }

  setMousePos(e) {
    this.lastMousePos = this.mousePos;
    this.mousePos = {
        x: (e.clientX - this.canvasPos.x) / this.canvas.width,
        y: 1.0 - ((e.clientY - this.canvasPos.y)) / this.canvas.height
    };
    this.mouseVel = {
        x: this.mousePos.x - this.lastMousePos.x,
        y: this.mousePos.y - this.lastMousePos.y
    };
  }

  setCanvasPos() {
    this.canvasPos = this.getPosition(this.canvas);
  }

  // Helper function to get an element's exact position
  getPosition(el) {
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

  // Clears the viewport
  clear() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  // Main update loop
  update() {
    window.requestAnimFrame(() => this.update());
    this.setCanvasPos();
    this.gl.clearColor(this.mousePos.x, this.mousePos.y, this.isActive ? 1.0 : 0.0, 1.0);
    this.clear();
  }
}

// Provides requestAnimationFrame for cross browser support
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
           window.setTimeout(callback, 1000/60);
         };
})();

export default WebGLInterface;