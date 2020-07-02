import requestAnimFrame from '../../helpers/request-anim-frame';
import fsPassthroughSource from '../../shaders/fragment/fs-passthrough';
import fsInitVelocitySource from '../../shaders/fragment/fs-init-velocity';
import fsInitDensitySource from '../../shaders/fragment/fs-init-density';
import fsInitEqSource from '../../shaders/fragment/fs-init-eq';
import fsForceDensitySource from '../../shaders/fragment/fs-force-density';
import fsWallSource from '../../shaders/fragment/fs-wall';
import fsConcentrationSource from '../../shaders/fragment/fs-concentration';
import fsTRTSource from '../../shaders/fragment/fs-trt';
import fsStreamingSource from '../../shaders/fragment/fs-streaming';
import fsSumDistFuncSource from '../../shaders/fragment/fs-sum-dist-func';
import fsVelocitySource from '../../shaders/fragment/fs-velocity';
import fsOutputSource from '../../shaders/fragment/fs-output';
import fsAverageRowsSource from '../../shaders/fragment/fs-average-rows';
import fsAverageColumnsSource from '../../shaders/fragment/fs-average-columns';
import fsCircleSource from '../../shaders/fragment/fs-circle';
import Fluid from './fluid';
import Tracer from './tracer';

class LBMProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;
    this.setNormalizedColors();

    this.params = {};
    this.params.initVelocity = [0.0, 0.0];
    this.params.initDensity = 1.0;
    this.params.speedOfSound = 0.3;
    
    this._initFBOs();
    this._initShaderPrograms();

    this.fluid = new Fluid(this.wgli, this.props.viscosity);
    this.tracers = [
      new Tracer(wgli, this.props.diffusivities[0]), 
      new Tracer(wgli, this.props.diffusivities[1]),
      new Tracer(wgli, this.props.diffusivities[2])
    ];
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
    this.concentrationProgram = this._createConcentrationShaderProgram();
    this.TRTProgramF0 = this._createTRTShaderProgram("#define F0 \n");
    this.TRTProgramF1_4 = this._createTRTShaderProgram("#define F1_4 \n");
    this.TRTProgramF5_8 = this._createTRTShaderProgram("#define F5_8 \n");
    this.streamingProgramF0 = this._createStreamingShaderProgram("#define F0 \n");
    this.streamingProgramF1_4 = this._createStreamingShaderProgram("#define F1_4 \n");
    this.streamingProgramF5_8 = this._createStreamingShaderProgram("#define F5_8 \n");
    this.sumDistFuncProgram = this._createSumDistFuncShaderProgram();
    this.velocityProgramF1_4 = this._createVelocityShaderProgram("#define F1_4 \n");
    this.velocityProgramF5_8 = this._createVelocityShaderProgram("#define F5_8 \n");
    this.outputProgram = this._createOutputShaderProgram();
    this.averageRowsProgram = this._createAverageRowsShaderProgram();
    this.averageColumnsProgram = this._createAverageColumnsShaderProgram();
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
    program.scalarFieldUniform = this.wgli.getUniformLocation(program, "uScalarField");
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
    program.leftRightWallUniform = this.wgli.getUniformLocation(program, "uLeftRightWall");
    program.topBottomWallUniform = this.wgli.getUniformLocation(program, "uTopBottomWall");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.texelSizeUniform = this.wgli.getUniformLocation(program, "uTexelSize");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createConcentrationShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsConcentrationSource);
    const program = this.wgli.createProgram(shader);
    program.isAddingUniform = this.wgli.getUniformLocation(program, "uIsAdding");
    program.isRemovingUniform = this.wgli.getUniformLocation(program, "uIsRemoving");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.concentrationUniform = this.wgli.getUniformLocation(program, "uConcentration");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createTRTShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsTRTSource);
    const program = this.wgli.createProgram(shader);
    program.plusOmegaUniform = this.wgli.getUniformLocation(program, "uPlusOmega");
    program.minusOmegaUniform = this.wgli.getUniformLocation(program, "uMinusOmega");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.scalarFieldUniform = this.wgli.getUniformLocation(program, "uScalarField");
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

  _createSumDistFuncShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsSumDistFuncSource);
    const program = this.wgli.createProgram(shader);
    program.summandUniform = this.wgli.getUniformLocation(program, "uSummand");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    program.defaultValUniform = this.wgli.getUniformLocation(program, "uDefaultVal");
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
    program.tracer0ColUniform = this.wgli.getUniformLocation(program, "uTracer0Col");
    program.tracer1ColUniform = this.wgli.getUniformLocation(program, "uTracer1Col");
    program.tracer2ColUniform = this.wgli.getUniformLocation(program, "uTracer2Col");
    program.tracer0Uniform = this.wgli.getUniformLocation(program, "uTracer0");
    program.tracer1Uniform = this.wgli.getUniformLocation(program, "uTracer1");
    program.tracer2Uniform = this.wgli.getUniformLocation(program, "uTracer2");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createAverageRowsShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsAverageRowsSource);
    const program = this.wgli.createProgram(shader);
    program.texelSizeUniform = this.wgli.getUniformLocation(program, "uTexelSize");
    program.canvasSizeUniform = this.wgli.getUniformLocation(program, "uCanvasSize");
    program.targetUniform = this.wgli.getUniformLocation(program, "uTarget");
    return program;
  }

  _createAverageColumnsShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsAverageColumnsSource);
    const program = this.wgli.createProgram(shader);
    program.texelSizeUniform = this.wgli.getUniformLocation(program, "uTexelSize");
    program.canvasSizeUniform = this.wgli.getUniformLocation(program, "uCanvasSize");
    program.targetUniform = this.wgli.getUniformLocation(program, "uTarget");
    return program;
  }

  _createCircleShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsCircleSource);
    const program = this.wgli.createProgram(shader);
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    return program;
  }

  // Set initial node Ids
  _setInitNodeId() {
    /*
    const aspect = this.wgli.getAspect();
    this.wgli.useProgram(this.circleProgram);
    this.wgli.uniform1f(this.circleProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.circleProgram.yAspectUniform, aspect.yAspect);
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();
    */
  }

  // Initialise all fluid variables
  _initFluid() {
    // Initialise fluid velocity
    this._setInitVelocity();
    
    // Initialise fluid density
    this._setInitDensity();
    
    // Initialise fluid distribution functions to equilibrium
    this._computeInitFluidDist();
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
  _computeInitFluidDist() {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF0.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc0.write.fbo);
    this.fluid.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF1_4.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc1_4.write.fbo);
    this.fluid.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF5_8.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc5_8.write.fbo);
    this.fluid.distFunc5_8.swap();
  }

  // Initialise tracer variables
  _initTracer(tracer) {
    // Initialise concentration field
    this._initTracerConcentration(tracer);

    // Initialise equilibrium distribution functions
    this._computeInitTracerDist(tracer);
  }

  _initTracerConcentration(tracer) {
    const aspect = this.wgli.getAspect();
    this.wgli.useProgram(this.circleProgram);
    this.wgli.uniform1f(this.circleProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.circleProgram.yAspectUniform, aspect.yAspect);
    this.wgli.blit(tracer.concentration.write.fbo);
    tracer.concentration.swap();
  }

  _computeInitTracerDist(tracer) {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, tracer.params.tau);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF0.scalarFieldUniform, tracer.concentration.read.attach(3));
    this.wgli.blit(tracer.distFunc0.write.fbo);
    tracer.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, tracer.params.tau);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF1_4.scalarFieldUniform, tracer.concentration.read.attach(3));
    this.wgli.blit(tracer.distFunc1_4.write.fbo);
    tracer.distFunc1_4.swap();
    
    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, tracer.params.tau);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF5_8.scalarFieldUniform, tracer.concentration.read.attach(3));
    this.wgli.blit(tracer.distFunc5_8.write.fbo);
    tracer.distFunc5_8.swap();
  }

  // Performs TRT colision for fluid populations
  _performFluidTRT() {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, this.fluid.distFunc0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc0.write.fbo);
    this.fluid.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, this.fluid.distFunc1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc1_4.write.fbo);
    this.fluid.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, this.fluid.distFunc5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc5_8.write.fbo);
    this.fluid.distFunc5_8.swap();
  }

  // Performs TRT colision for tracer populations
  _performTracerTRT(tracer) {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, tracer.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, tracer.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, tracer.distFunc0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.scalarFieldUniform, tracer.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(tracer.distFunc0.write.fbo);
    tracer.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, tracer.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, tracer.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, tracer.distFunc1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.scalarFieldUniform, tracer.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(tracer.distFunc1_4.write.fbo);
    tracer.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, tracer.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, tracer.params.minusOmega);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, tracer.distFunc5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.scalarFieldUniform, tracer.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(tracer.distFunc5_8.write.fbo);
    tracer.distFunc5_8.swap();
  }

  // Performs streaming on fluid or tracer distribution functions
  _performStreaming(target) {
    // Rest component
    this.wgli.useProgram(this.streamingProgramF0);
    this.wgli.uniform2f(this.streamingProgramF0.texelSizeUniform, target.distFunc0.read.texelSizeX, target.distFunc0.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF0.distFuncUniform, target.distFunc0.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF0.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(target.distFunc0.write.fbo);
    target.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.streamingProgramF1_4);
    this.wgli.uniform2f(this.streamingProgramF1_4.texelSizeUniform, target.distFunc1_4.read.texelSizeX, target.distFunc1_4.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF1_4.distFuncUniform, target.distFunc1_4.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF1_4.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(target.distFunc1_4.write.fbo);
    target.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.streamingProgramF5_8);
    this.wgli.uniform2f(this.streamingProgramF5_8.texelSizeUniform, target.distFunc5_8.read.texelSizeX, target.distFunc5_8.read.texelSizeY);
    this.wgli.uniform1i(this.streamingProgramF5_8.distFuncUniform, target.distFunc5_8.read.attach(0));
    this.wgli.uniform1i(this.streamingProgramF5_8.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(target.distFunc5_8.write.fbo);
    target.distFunc5_8.swap();
  }

  _computeDensity() {
    // Clear density buffer
    this.wgli.clear(this.fluid.density.read.fbo, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc0.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.params.initDensity);
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc1_4.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.params.initDensity);
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add diagonal components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc5_8.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.params.initDensity);
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();
  }

  _computeConcentration(tracer) {
    // Clear concentration buffer
    this.wgli.clear(tracer.concentration.read.fbo, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, tracer.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, tracer.distFunc0.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, 0.0);
    this.wgli.blit(tracer.concentration.write.fbo);
    tracer.concentration.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, tracer.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, tracer.distFunc1_4.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, 0.0);
    this.wgli.blit(tracer.concentration.write.fbo);
    tracer.concentration.swap();

    // Add diagonal components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, tracer.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, tracer.distFunc5_8.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, 0.0);
    this.wgli.blit(tracer.concentration.write.fbo);
    tracer.concentration.swap();
  }

  _computeVelocity() {
    // Clear velocity buffer
    this.wgli.clear(this.fluid.velocity.read.fbo, 0, 0, 0);

    // Add main cartesian components
    this.wgli.useProgram(this.velocityProgramF1_4);
    this.wgli.uniform1f(this.velocityProgramF1_4.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF1_4.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF1_4.distFuncUniform, this.fluid.distFunc1_4.read.attach(2));
    this.wgli.uniform1i(this.velocityProgramF1_4.nodeIdUniform, this.nodeId.read.attach(3));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();

    // Add diagonal components
    this.wgli.useProgram(this.velocityProgramF5_8);
    this.wgli.uniform1f(this.velocityProgramF5_8.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1i(this.velocityProgramF5_8.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF5_8.distFuncUniform, this.fluid.distFunc5_8.read.attach(2));
    this.wgli.uniform1i(this.velocityProgramF5_8.nodeIdUniform, this.nodeId.read.attach(3));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();
  }

  _computeAverageDensity() {
    // Average rows
    this.wgli.useProgram(this.averageRowsProgram);
    this.wgli.uniform2f(this.averageRowsProgram.texelSizeUniform, this.fluid.density.read.texelSizeX, this.fluid.density.read.texelSizeY);
    this.wgli.uniform2f(this.averageRowsProgram.canvasSizeUniform, this.props.width, this.props.height);
    this.wgli.uniform1i(this.averageRowsProgram.targetUniform, this.fluid.density.read.attach(0));
    this.wgli.blit(this.fluid.averageDensity.write.fbo);
    this.fluid.averageDensity.swap();

    // Average columns
    this.wgli.useProgram(this.averageColumnsProgram);
    this.wgli.uniform2f(this.averageColumnsProgram.texelSizeUniform, this.fluid.density.read.texelSizeX, this.fluid.density.read.texelSizeY);
    this.wgli.uniform2f(this.averageColumnsProgram.canvasSizeUniform, this.props.width, this.props.height);
    this.wgli.uniform1i(this.averageColumnsProgram.targetUniform, this.fluid.averageDensity.read.attach(0));
    this.wgli.blit(this.fluid.averageDensity.write.fbo);
    this.fluid.averageDensity.swap();
  }

  // Copies one FBO to another
  _copy(source, destination) {
    this.wgli.useProgram(this.passthroughProgram);
    this.wgli.uniform1i(this.passthroughProgram.xUniform, source.attach(0));
    this.wgli.blit(destination.fbo);
  }

  // Entry point for the program
  run() {
    // Initialise node Ids
    this._setInitNodeId();

    // Initialise fluid parameters
    this._initFluid();

    // Initialise tracers
    for (let tracer of this.tracers) {
      this._initTracer(tracer);
    }

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
    this.wgli.uniform1i(this.wallProgram.leftRightWallUniform, this.props.leftRightWall);
    this.wgli.uniform1i(this.wallProgram.topBottomWallUniform, this.props.topBottomWall);
    this.wgli.uniform1f(this.wallProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.wallProgram.yAspectUniform, aspect.yAspect);
    this.wgli.uniform2f(this.wallProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.uniform2f(this.wallProgram.texelSizeUniform, this.nodeId.write.texelSizeX, this.nodeId.write.texelSizeY);
    this.wgli.uniform1i(this.wallProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();

    // Update concentration
    const isAddingConcentration = cursorState.isActive && this.props.tool == 3;
    const isRemovingConcentration = cursorState.isActive && this.props.tool == 4;
    const activeTracer = this.props.tracer;
    this.wgli.useProgram(this.concentrationProgram);
    this.wgli.uniform1i(this.concentrationProgram.isAddingUniform, isAddingConcentration);
    this.wgli.uniform1i(this.concentrationProgram.isRemovingUniform, isRemovingConcentration);
    this.wgli.uniform1f(this.concentrationProgram.xAspectUniform, aspect.xAspect);
    this.wgli.uniform1f(this.concentrationProgram.yAspectUniform, aspect.yAspect);
    this.wgli.uniform2f(this.concentrationProgram.cursorPosUniform, cursorState.cursorPos.x, cursorState.cursorPos.y);
    this.wgli.uniform1i(this.concentrationProgram.concentrationUniform, this.tracers[activeTracer].concentration.read.attach(0));
    this.wgli.uniform1i(this.concentrationProgram.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.tracers[activeTracer].concentration.write.fbo);
    this.tracers[activeTracer].concentration.swap();

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

    // Perform fluid TRT collision step
    this._performFluidTRT();

    // Perform fluid streaming step
    this._performStreaming(this.fluid);

    // Perform tracer TRT collision step
    for (let tracer of this.tracers) {
      this._performTracerTRT(tracer);
    }

    // Perform tracer streaming step
    for (let tracer of this.tracers) {
      this._performStreaming(tracer);
    }

    // Compute macroscopic fluid density
    this._computeDensity();

    // Compute macroscopic fluid velocity
    this._computeVelocity();

    // Compute macroscopic tracer concentration
    for (let tracer of this.tracers) {
      this._computeConcentration(tracer);
    }

    // Draw fluid velocity, tracers and node Id
    this.wgli.useProgram(this.outputProgram);
    this.wgli.uniform1i(this.outputProgram.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform3f(this.outputProgram.tracer0ColUniform, this.normalizedColors[0].r, this.normalizedColors[0].g, this.normalizedColors[0].b);
    this.wgli.uniform3f(this.outputProgram.tracer1ColUniform, this.normalizedColors[1].r, this.normalizedColors[1].g, this.normalizedColors[1].b);
    this.wgli.uniform3f(this.outputProgram.tracer2ColUniform, this.normalizedColors[2].r, this.normalizedColors[2].g, this.normalizedColors[2].b);
    this.wgli.uniform1i(this.outputProgram.tracer0Uniform, this.tracers[0].concentration.read.attach(1));
    this.wgli.uniform1i(this.outputProgram.tracer1Uniform, this.tracers[1].concentration.read.attach(2));
    this.wgli.uniform1i(this.outputProgram.tracer2Uniform, this.tracers[2].concentration.read.attach(3));
    this.wgli.uniform1i(this.outputProgram.nodeIdUniform, this.nodeId.read.attach(4));
    this.wgli.blit(null);
  }

  setNormalizedColors() {
    this.normalizedColors = [];
    for (let c of this.props.colors) {
      let normalizedColor = {r: c.r / 255.0, g: c.g / 255.0, b: c.b / 255.0};
      this.normalizedColors.push(normalizedColor);
    }
  }

  setProps(props) {
    this.props = props;
    this.setNormalizedColors();
    this.fluid.setViscosity(this.props.viscosity);
    this.tracers[0].setDiffusivity(this.props.diffusivities[0]);
    this.tracers[1].setDiffusivity(this.props.diffusivities[1]);
    this.tracers[2].setDiffusivity(this.props.diffusivities[2]);
  }
}

export default LBMProgram;