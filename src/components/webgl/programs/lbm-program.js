import requestAnimFrame from '../helpers/request-anim-frame';
import fsPassthroughSource from '../shaders/fragment/fs-passthrough';
import fsInitVelocitySource from '../shaders/fragment/fs-init-velocity';
import fsInitDensitySource from '../shaders/fragment/fs-init-density';
import fsInitEqSource from '../shaders/fragment/fs-init-eq';
import fsForceDensitySource from '../shaders/fragment/fs-force-density';
import fsTRTSource from '../shaders/fragment/fs-trt';
import fsStreamingSource from '../shaders/fragment/fs-streaming';
import fsDensitySource from '../shaders/fragment/fs-density';
import fsVelocitySource from '../shaders/fragment/fs-velocity';
import fsOutputSource from '../shaders/fragment/fs-output';
import fsCircleSource from '../shaders/fragment/fs-circle';

class LBMProgram {
  constructor(wgli) {
    this.params = {};
    this.params.tau = 1.0;
    this.params.TRTmagic = 1.0 / 12.0;
    this.params.plusOmega = 1.0;
    this.params.minusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.plusOmega - 0.5)) + 0.5);
    this.params.initVelocity = [0.0, 0.0];
    this.params.initDensity = 1.0;
    this.params.speedOfSound = 0.3;

    this.wgli = wgli;
    
    this._initFBOs();
    this._initShaderPrograms();
  }

  _initFBOs() {
    // Stores node id
    // 0: fluid
    // 1: bounce-back
    this.nodeId = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores velocity
    this.velocity = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores density
    this.density = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores imposed force density
    this.forceDensity = this.wgli.createFBO("RGBA", "NEAREST");

    // Stores distribution functions
    this.distFuncF0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFuncF1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFuncF5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores equilibrium distribution functions
    this.eqDistFuncF0 = this.wgli.createFBO("RGBA", "NEAREST");
    this.eqDistFuncF1_4 = this.wgli.createFBO("RGBA", "NEAREST");
    this.eqDistFuncF5_8 = this.wgli.createFBO("RGBA", "NEAREST");
  }

  _initShaderPrograms() {
    const passthroughShader = this.wgli.createFragmentShader(fsPassthroughSource);
    this.passthroughProgram = this.wgli.createProgram(passthroughShader);
    this.passthroughProgram.xUniform = this.wgli.getUniformLocation(this.passthroughProgram, "uX");

    const initVelocityShader = this.wgli.createFragmentShader(fsInitVelocitySource);
    this.initVelocityProgram = this.wgli.createProgram(initVelocityShader);
    this.initVelocityProgram.velocityUniform = this.wgli.getUniformLocation(this.initVelocityProgram, "uVelocity");
    this.initVelocityProgram.nodeIdUniform = this.wgli.getUniformLocation(this.initVelocityProgram, "uNodeId");

    const initDensityShader = this.wgli.createFragmentShader(fsInitDensitySource);
    this.initDensityProgram = this.wgli.createProgram(initDensityShader);
    this.initDensityProgram.densityUniform = this.wgli.getUniformLocation(this.initDensityProgram, "uDensity");
    this.initDensityProgram.nodeIdUniform = this.wgli.getUniformLocation(this.initDensityProgram, "uNodeId");

    this.initEqProgramF0 = this._createInitEqShaderProgram("#define F0 \n");
    this.initEqProgramF1_4 = this._createInitEqShaderProgram("#define F1_4 \n");
    this.initEqProgramF5_8 = this._createInitEqShaderProgram("#define F5_8 \n");

    const forceShader = this.wgli.createFragmentShader(fsForceDensitySource);
    this.forceProgram = this.wgli.createProgram(forceShader);
    this.forceProgram.isActiveUniform = this.wgli.getUniformLocation(this.forceProgram, "uIsActive");
    this.forceProgram.cursorPosUniform = this.wgli.getUniformLocation(this.forceProgram, "uCursorPos");
    this.forceProgram.cursorVelUniform = this.wgli.getUniformLocation(this.forceProgram, "uCursorVel");
    this.forceProgram.nodeIdUniform = this.wgli.getUniformLocation(this.forceProgram, "uNodeId");

    this.TRTProgramF0 = this._createTRTShaderProgram("#define F0 \n");
    this.TRTProgramF1_4 = this._createTRTShaderProgram("#define F1_4 \n");
    this.TRTProgramF5_8 = this._createTRTShaderProgram("#define F5_8 \n");

    this.streamingProgramF0 = this._createStreamingShaderProgram("#define F0 \n");
    this.streamingProgramF1_4 = this._createStreamingShaderProgram("#define F1_4 \n");
    this.streamingProgramF5_8 = this._createStreamingShaderProgram("#define F5_8 \n");

    const densityShader = this.wgli.createFragmentShader(fsDensitySource);
    this.densityProgram = this.wgli.createProgram(densityShader);
    this.densityProgram.densityUniform = this.wgli.getUniformLocation(this.densityProgram, "uDensity");
    this.densityProgram.distFuncUniform = this.wgli.getUniformLocation(this.densityProgram, "uDistFunc");

    this.velocityProgramF1_4 = this._createVelocityShaderProgram("#define F1_4 \n");
    this.velocityProgramF5_8 = this._createVelocityShaderProgram("#define F5_8 \n");

    const outputShader = this.wgli.createFragmentShader(fsOutputSource);
    this.outputProgram = this.wgli.createProgram(outputShader);
    this.outputProgram.xUniform = this.wgli.getUniformLocation(this.outputProgram, "uX");

    const circleShader = this.wgli.createFragmentShader(fsCircleSource);
    this.circleProgram = this.wgli.createProgram(circleShader);
  }

  // Creates and returns a init-eq shader program based on the specified define
  _createInitEqShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsInitEqSource);
    const program = this.wgli.createProgram(shader);
    program.tauUniform = this.wgli.getUniformLocation(program, "uTau");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.forceDensityUniform = this.wgli.getUniformLocation(program, "uForceDensity");
    return program;
  }

  _createTRTShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsTRTSource);
    const program = this.wgli.createProgram(shader);
    program.plusOmegaUniform = this.wgli.getUniformLocation(program, "uPlusOmega");
    program.minusOmegaUniform = this.wgli.getUniformLocation(program, "uMinusOmega");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.forceDensityUniform = this.wgli.getUniformLocation(program, "uForceDensity");
    return program;
  }

  _createStreamingShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsStreamingSource);
    const program = this.wgli.createProgram(shader);
    program.texelSizeUniform = this.wgli.getUniformLocation(program, "uTexelSize");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createVelocityShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsVelocitySource);
    const program = this.wgli.createProgram(shader);
    program.speedOfSoundUniform = this.wgli.getUniformLocation(program, "uSpeedOfSound");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    return program;
  }

  // Initialises the fluid distribution functions to equilibrium
  _computeInitDist() {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.forceDensity.attach(2));
    this.wgli.blit(this.distFuncF0.write.fbo);
    this.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.forceDensity.attach(2));
    this.wgli.blit(this.distFuncF1_4.write.fbo);
    this.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.forceDensity.attach(2));
    this.wgli.blit(this.distFuncF5_8.write.fbo);
    this.distFuncF5_8.swap();
  }

  // Set initial node Ids
  _setInitNodeId() {
    this.wgli.useProgram(this.circleProgram);
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();
  }

  // Set initial velocity
  _setInitVelocity() {
    this.wgli.useProgram(this.initVelocityProgram);
    this.wgli.uniform2f(this.initVelocityProgram.velocityUniform, this.params.initVelocity[0], this.params.initVelocity[1]);
    this.wgli.uniform1i(this.initVelocityProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.velocity.write.fbo);
    this.velocity.swap();
  }

  // Set initial density
  _setInitDensity() {
    this.wgli.useProgram(this.initDensityProgram);
    this.wgli.uniform1f(this.initDensityProgram.densityUniform, this.params.initDensity);
    this.wgli.uniform1i(this.initDensityProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.density.write.fbo);
    this.density.swap();
  }

  // Performs TRT colision
  _performTRT() {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, this.distFuncF0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.forceDensity.attach(3));
    this.wgli.blit(this.distFuncF0.write.fbo);
    this.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, this.distFuncF1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.forceDensity.attach(3));
    this.wgli.blit(this.distFuncF1_4.write.fbo);
    this.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, this.distFuncF5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.forceDensity.attach(3));
    this.wgli.blit(this.distFuncF5_8.write.fbo);
    this.distFuncF5_8.swap();
  }

  // Performs streaming
  _performStreaming() {
    // Rest component
    this.wgli.useProgram(this.streamingProgramF0);
    this.wgli.uniform2f(this.streamingProgramF0.texelSizeUniform, this.distFuncF0.read.texelSizeX, this.distFuncF0.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF0.distFuncUniform, this.distFuncF0.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF0.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.distFuncF0.write.fbo);
    this.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.streamingProgramF1_4);
    this.wgli.uniform2f(this.streamingProgramF1_4.texelSizeUniform, this.distFuncF1_4.read.texelSizeX, this.distFuncF1_4.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF1_4.distFuncUniform, this.distFuncF1_4.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF1_4.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.distFuncF1_4.write.fbo);
    this.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.streamingProgramF5_8);
    this.wgli.uniform2f(this.streamingProgramF5_8.texelSizeUniform, this.distFuncF5_8.read.texelSizeX, this.distFuncF5_8.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF5_8.distFuncUniform, this.distFuncF5_8.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF5_8.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.distFuncF5_8.write.fbo);
    this.distFuncF5_8.swap();
  }

  _computeDensity() {
    // Clear density buffer
    this.wgli.clear(this.density.read.fbo, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.distFuncF0.read.attach(1));
    this.wgli.blit(this.density.write.fbo);
    this.density.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.distFuncF1_4.read.attach(1));
    this.wgli.blit(this.density.write.fbo);
    this.density.swap();

    // Add diagonal components
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.distFuncF5_8.read.attach(1));
    this.wgli.blit(this.density.write.fbo);
    this.density.swap();
  }

  _computeVelocity() {
    // Clear velocity buffer
    this.wgli.clear(this.velocity.read.fbo, 0, 0, 0);

    // Add main cartesian components
    this.wgli.useProgram(this.velocityProgramF1_4);
    this.wgli.uniform1f(this.velocityProgramF1_4.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF1_4.densityUniform, this.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF1_4.velocityUniform, this.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF1_4.distFuncUniform, this.distFuncF1_4.read.attach(2));
    this.wgli.blit(this.velocity.write.fbo);
    this.velocity.swap();

    // Add diagonal components
    this.wgli.useProgram(this.velocityProgramF5_8);
    this.wgli.uniform1f(this.velocityProgramF5_8.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF5_8.densityUniform, this.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF5_8.velocityUniform, this.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF5_8.distFuncUniform, this.distFuncF5_8.read.attach(2));
    this.wgli.blit(this.velocity.write.fbo);
    this.velocity.swap();
  }

  // Initialise all fluid variables
  _initFluid() {
    // Initialise node Ids
    this._setInitNodeId();

    // Initialise fluid velocity
    this._setInitVelocity();
    
    // Initialise fluid density
    this._setInitDensity();
    
    // Initialise fluid distribution functions to equilibrium
    this._computeInitDist();
  }

  // Copies one FBO to another
  _copy(source, destination) {
    this.wgli.useProgram(this.passthroughProgram);
    this.wgli.uniform1i(this.passthroughProgram.xUniform, source.attach(0));
    this.wgli.blit(destination.fbo);
  }

  // Entry point for the program
  run() {
    // Initialise fluid parameters
    this._initFluid();

    // Begin main update loop
    requestAnimFrame(() => this._update());
  }

  // Main update loop
  _update() {
    // Callback
    requestAnimFrame(() => this._update());

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Get imposed forces
    const cursorState = this.wgli.getCursorState();
    this.wgli.useProgram(this.forceProgram);
    this.wgli.uniform1i(this.forceProgram.isActiveUniform, cursorState.isActive);
    this.wgli.uniform2f(this.forceProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.uniform2f(this.forceProgram.cursorVelUniform, cursorState.cursorVel.x, cursorState.cursorVel.y);
    this.wgli.uniform1i(this.forceProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.forceDensity.fbo);

    // Perform TRT collision step
    this._performTRT();

    // Perform streaming step
    this._performStreaming();

    // Compute macroscopic density
    this._computeDensity();

    // Compute macroscopic velocity
    this._computeVelocity();

    // Draw velocity
    this.wgli.useProgram(this.outputProgram);
    this.wgli.uniform1i(this.outputProgram.xUniform, this.velocity.read.attach(0));
    this.wgli.blit(null);

    /*
    // Draw nodeId
    this.wgli.useProgram(this.passthroughProgram);
    this.wgli.uniform1i(this.passthroughProgram.xUniform, this.nodeId.read.attach(0));
    this.wgli.blit(null);
    */
  }
}

export default LBMProgram;