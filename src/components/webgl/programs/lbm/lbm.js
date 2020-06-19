import requestAnimFrame from '../../helpers/request-anim-frame';
import fsPassthroughSource from '../../shaders/fragment/fs-passthrough';
import fsInitVelocitySource from '../../shaders/fragment/fs-init-velocity';
import fsInitDensitySource from '../../shaders/fragment/fs-init-density';
import fsInitEqSource from '../../shaders/fragment/fs-init-eq';
import fsForceDensitySource from '../../shaders/fragment/fs-force-density';
import fsWallSource from '../../shaders/fragment/fs-wall';
import fsTRTSource from '../../shaders/fragment/fs-trt';
import fsStreamingSource from '../../shaders/fragment/fs-streaming';
import fsDensitySource from '../../shaders/fragment/fs-density';
import fsVelocitySource from '../../shaders/fragment/fs-velocity';
import fsOutputSource from '../../shaders/fragment/fs-output';
import fsCircleSource from '../../shaders/fragment/fs-circle';
import Fluid from './fluid';

class LBMProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;

    this.params = {};
    this.params.tau = 1.0;
    this.params.TRTmagic = 1.0 / 12.0;
    this.params.plusOmega = 1.0;
    this.params.minusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.plusOmega - 0.5)) + 0.5);
    this.params.initVelocity = [0.0, 0.0];
    this.params.initDensity = 1.0;
    this.params.speedOfSound = 0.3;
    
    this._initFBOs();
    this._initShaderPrograms();

    this.fluid = new Fluid(this.wgli);
  }

  _initFBOs() {
    // Stores node id
    // 0: fluid
    // 1: bounce-back wall
    this.nodeId = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }

  _initShaderPrograms() {
    this.passthroughProgram = this._createPassthroughShaderProgram();
    this.initVelocityProgram = this._createInitVelocityShaderProgram();
    this.initDensityProgram = this._createInitDensityShaderProgram();
    this.initEqProgramF0 = this._createInitEqShaderProgram("#define F0 \n");
    this.initEqProgramF1_4 = this._createInitEqShaderProgram("#define F1_4 \n");
    this.initEqProgramF5_8 = this._createInitEqShaderProgram("#define F5_8 \n");
    this.forceProgram = this._createForceShaderProgram();
    this.wallProgram = this._createWallShaderProgram();
    this.TRTProgramF0 = this._createTRTShaderProgram("#define F0 \n");
    this.TRTProgramF1_4 = this._createTRTShaderProgram("#define F1_4 \n");
    this.TRTProgramF5_8 = this._createTRTShaderProgram("#define F5_8 \n");
    this.streamingProgramF0 = this._createStreamingShaderProgram("#define F0 \n");
    this.streamingProgramF1_4 = this._createStreamingShaderProgram("#define F1_4 \n");
    this.streamingProgramF5_8 = this._createStreamingShaderProgram("#define F5_8 \n");
    this.densityProgram = this._createDensityShaderProgram();
    this.velocityProgramF1_4 = this._createVelocityShaderProgram("#define F1_4 \n");
    this.velocityProgramF5_8 = this._createVelocityShaderProgram("#define F5_8 \n");
    this.outputProgram = this._createOutputShaderProgram();
    this.circleProgram = this._createCircleShaderProgram();
  }

  _createPassthroughShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsPassthroughSource);
    const program = this.wgli.createProgram(shader);
    program.xUniform = this.wgli.getUniformLocation(program, "uX");
    return program;
  }

  _createInitVelocityShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsInitVelocitySource);
    const program = this.wgli.createProgram(shader);
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createInitDensityShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsInitDensitySource);
    const program = this.wgli.createProgram(shader);
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createInitEqShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsInitEqSource);
    const program = this.wgli.createProgram(shader);
    program.tauUniform = this.wgli.getUniformLocation(program, "uTau");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.forceDensityUniform = this.wgli.getUniformLocation(program, "uForceDensity");
    return program;
  }

  _createForceShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsForceDensitySource);
    const program = this.wgli.createProgram(shader);
    program.isActiveUniform = this.wgli.getUniformLocation(program, "uIsActive");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.cursorVelUniform = this.wgli.getUniformLocation(program, "uCursorVel");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createWallShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsWallSource);
    const program = this.wgli.createProgram(shader);
    program.isAddingUniform = this.wgli.getUniformLocation(program, "uIsAdding");
    program.isRemovingUniform = this.wgli.getUniformLocation(program, "uIsRemoving");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
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

  _createDensityShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsDensitySource);
    const program = this.wgli.createProgram(shader);
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    return program;
  }

  _createVelocityShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsVelocitySource);
    const program = this.wgli.createProgram(shader);
    program.speedOfSoundUniform = this.wgli.getUniformLocation(program, "uSpeedOfSound");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createOutputShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsOutputSource);
    const program = this.wgli.createProgram(shader);
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createCircleShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsCircleSource);
    const program = this.wgli.createProgram(shader);
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    return program;
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

  // Set initial node Ids
  _setInitNodeId() {
    const aspect = this.wgli.getAspect();
    this.wgli.useProgram(this.circleProgram);
    this.wgli.uniform1f(this.circleProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.circleProgram.yAspectUniform, aspect.yAspect);
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();
  }

  // Set initial velocity
  _setInitVelocity() {
    this.wgli.useProgram(this.initVelocityProgram);
    this.wgli.uniform2f(this.initVelocityProgram.velocityUniform, this.params.initVelocity[0], this.params.initVelocity[1]);
    this.wgli.uniform1i(this.initVelocityProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();
  }

  // Set initial density
  _setInitDensity() {
    this.wgli.useProgram(this.initDensityProgram);
    this.wgli.uniform1f(this.initDensityProgram.densityUniform, this.params.initDensity);
    this.wgli.uniform1i(this.initDensityProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();
  }

  // Initialises the fluid distribution functions to equilibrium
  _computeInitDist() {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.blit(this.fluid.distFuncF0.write.fbo);
    this.fluid.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.blit(this.fluid.distFuncF1_4.write.fbo);
    this.fluid.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, this.params.tau);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.blit(this.fluid.distFuncF5_8.write.fbo);
    this.fluid.distFuncF5_8.swap();
  }

  // Performs TRT colision
  _performTRT() {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, this.fluid.distFuncF0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.fluid.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(3));
    this.wgli.blit(this.fluid.distFuncF0.write.fbo);
    this.fluid.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, this.fluid.distFuncF1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.fluid.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(3));
    this.wgli.blit(this.fluid.distFuncF1_4.write.fbo);
    this.fluid.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, this.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, this.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, this.fluid.distFuncF5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.fluid.density.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(3));
    this.wgli.blit(this.fluid.distFuncF5_8.write.fbo);
    this.fluid.distFuncF5_8.swap();
  }

  // Performs streaming
  _performStreaming() {
    // Rest component
    this.wgli.useProgram(this.streamingProgramF0);
    this.wgli.uniform2f(this.streamingProgramF0.texelSizeUniform, this.fluid.distFuncF0.read.texelSizeX, this.fluid.distFuncF0.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF0.distFuncUniform, this.fluid.distFuncF0.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF0.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.fluid.distFuncF0.write.fbo);
    this.fluid.distFuncF0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.streamingProgramF1_4);
    this.wgli.uniform2f(this.streamingProgramF1_4.texelSizeUniform, this.fluid.distFuncF1_4.read.texelSizeX, this.fluid.distFuncF1_4.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF1_4.distFuncUniform, this.fluid.distFuncF1_4.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF1_4.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.fluid.distFuncF1_4.write.fbo);
    this.fluid.distFuncF1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.streamingProgramF5_8);
    this.wgli.uniform2f(this.streamingProgramF5_8.texelSizeUniform, this.fluid.distFuncF5_8.read.texelSizeX, this.fluid.distFuncF5_8.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF5_8.distFuncUniform, this.fluid.distFuncF5_8.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF5_8.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.fluid.distFuncF5_8.write.fbo);
    this.fluid.distFuncF5_8.swap();
  }

  _computeDensity() {
    // Clear density buffer
    this.wgli.clear(this.fluid.density.read.fbo, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.fluid.distFuncF0.read.attach(1));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.fluid.distFuncF1_4.read.attach(1));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add diagonal components
    this.wgli.useProgram(this.densityProgram);
    this.wgli.uniform1i(this.densityProgram.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.densityProgram.distFuncUniform, this.fluid.distFuncF5_8.read.attach(1));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();
  }

  _computeVelocity() {
    // Clear velocity buffer
    this.wgli.clear(this.fluid.velocity.read.fbo, 0, 0, 0);

    // Add main cartesian components
    this.wgli.useProgram(this.velocityProgramF1_4);
    this.wgli.uniform1f(this.velocityProgramF1_4.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF1_4.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF1_4.distFuncUniform, this.fluid.distFuncF1_4.read.attach(2));
    this.wgli.uniform1i(this.velocityProgramF1_4.nodeIdUniform, this.nodeId.read.attach(3));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();

    // Add diagonal components
    this.wgli.useProgram(this.velocityProgramF5_8);
    this.wgli.uniform1f(this.velocityProgramF5_8.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF5_8.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF5_8.distFuncUniform, this.fluid.distFuncF5_8.read.attach(2));
    this.wgli.uniform1i(this.velocityProgramF5_8.nodeIdUniform, this.nodeId.read.attach(3));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();
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

    // Get WebGl state
    const cursorState = this.wgli.getCursorState();
    const aspect = this.wgli.getAspect();
    
    // Update walls
    const isAddingWalls = cursorState.isActive && this.props.tool == 1;
    const isRemovingWalls = cursorState.isActive && this.props.tool == 2;
    this.wgli.useProgram(this.wallProgram);
    this.wgli.uniform1i(this.wallProgram.isAddingUniform, isAddingWalls);
    this.wgli.uniform1i(this.wallProgram.isRemovingUniform, isRemovingWalls);
    this.wgli.uniform1f(this.wallProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.wallProgram.yAspectUniform, aspect.yAspect);
    this.wgli.uniform2f(this.wallProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.uniform1i(this.wallProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();

    // Get imposed forces
    const isAddingForce = cursorState.isActive && this.props.tool == 0;
    this.wgli.useProgram(this.forceProgram);
    this.wgli.uniform1i(this.forceProgram.isActiveUniform, isAddingForce);
    this.wgli.uniform1f(this.forceProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.forceProgram.yAspectUniform, aspect.yAspect);
    this.wgli.uniform2f(this.forceProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.uniform2f(this.forceProgram.cursorVelUniform, cursorState.cursorVel.x, cursorState.cursorVel.y);
    this.wgli.uniform1i(this.forceProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.fluid.forceDensity.fbo);

    // Perform TRT collision step
    this._performTRT();

    // Perform streaming step
    this._performStreaming();

    // Compute macroscopic density
    this._computeDensity();

    // Compute macroscopic velocity
    this._computeVelocity();

    // Draw velocity and node Id
    this.wgli.useProgram(this.outputProgram);
    this.wgli.uniform1i(this.outputProgram.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.outputProgram.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(null);
  }

  setProps(props) {
    this.props = props;
  }
}

export default LBMProgram;