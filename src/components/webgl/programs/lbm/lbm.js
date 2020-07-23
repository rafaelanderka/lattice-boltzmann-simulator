import requestAnimFrame from '../../helpers/request-anim-frame';
import fsPassthroughSource from '../../shaders/fragment/fs-passthrough';
import fsInitVelocitySource from '../../shaders/fragment/fs-init-velocity';
import fsInitEqSource from '../../shaders/fragment/fs-init-eq';
import fsForceDensitySource from '../../shaders/fragment/fs-force-density';
import fsWallSource from '../../shaders/fragment/fs-wall';
import fsConcentrateSourceSource from '../../shaders/fragment/fs-concentrate-source';
import fsTRTSource from '../../shaders/fragment/fs-trt';
import fsStreamingSource from '../../shaders/fragment/fs-streaming';
import fsSumDistFuncSource from '../../shaders/fragment/fs-sum-dist-func';
import fsVelocitySource from '../../shaders/fragment/fs-velocity';
import fsOutputSource from '../../shaders/fragment/fs-output';
import fsAverageRowsSource from '../../shaders/fragment/fs-average-rows';
import fsAverageColumnsSource from '../../shaders/fragment/fs-average-columns';
import fsMulTexturesSource from '../../shaders/fragment/fs-mul-textures';
import fsCircleSource from '../../shaders/fragment/fs-circle';
import Fluid from './fluid';
import Solute from './solute';
import Reaction from './reaction';

class LBMProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;
    this.setNormalizedColors();

    this.params = {
      speedOfSound: 0.3,
      overlayLineWidth: 1
    };

    this.aspect = this.wgli.getAspect();

    this._initOverlay();
    this._initFBOs();
    this._initShaderPrograms();

    this.fluid = new Fluid(this.wgli, this.props.viscosity);
    this.solutes = [
      new Solute(wgli, this.props.diffusivities[0]), 
      new Solute(wgli, this.props.diffusivities[1]),
      new Solute(wgli, this.props.diffusivities[2])
    ];

    this.reactions = [
      new Reaction(wgli, [0, 1, 2], [1, 1, 1], [-1, -1, 1], 0.1)
    ];
  }

  _initOverlay() {
    // Get overlay canvas element and corresponding 2D context
    this.overlay = document.querySelector(`#${this.props.id}-overlay`);
    this.overlayCtx = this.overlay.getContext("2d");

    // Initialise array to temporarily hold sampled velocity values
    this.overlayBuffer = new Float32Array(4 * Math.pow(this.props.resolution, 2));

    // Initialise overlay parameters
    this._setOverlayParameters();
  }

  _setOverlayParameters() {
    // Set overlay line width
    this.overlayCtx.lineWidth = this.params.overlayLineWidth * this.props.pixelRatio;

    // Set indicator offsets
    this.overlayXCount = Math.round(this.overlay.width / (this.props.overlayXOffset * this.props.pixelRatio));
    this.overlayYCount = Math.round(this.overlay.height / (this.props.overlayYOffset * this.props.pixelRatio));
    this.correctedOverlayXOffset = this.overlay.width / this.overlayXCount;
    this.correctedOverlayYOffset = this.overlay.height / this.overlayYCount;
    this.overlayXSampleOffset = this.props.resolution / this.overlayXCount;
    this.overlayYSampleOffset = this.props.resolution / this.overlayYCount;

    // Set indicator magnitude factor
    const xFactor = this.overlay.width / this.overlayXCount;
    const yFactor = this.overlay.height / this.overlayYCount;
    this.overlayMagnitude = Math.min(xFactor, yFactor) / this.params.speedOfSound;

    // Set indicator drawing function
    this._setDrawIndicatorFct();
  }

  _setDrawIndicatorFct() {
    let fct = null;
    switch(this.props.overlayType) {
      case 0:
        fct = () => {};
        break;
      case 1:
        fct = this._drawIndicatorLine;
        break;
      case 2:
        fct = this._drawIndicatorArrow;
        break;
    } 

    this.drawIndicatorFct = fct;
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
    this.initEqProgramF0 = this._createInitEqShaderProgram("#define F0 \n");
    this.initEqProgramF1_4 = this._createInitEqShaderProgram("#define F1_4 \n");
    this.initEqProgramF5_8 = this._createInitEqShaderProgram("#define F5_8 \n");
    this.forceProgram = this._createForceShaderProgram();
    this.wallProgram = this._createWallShaderProgram();
    this.concentrateSourceProgram = this._createConcentrateSourceShaderProgram();
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
    this.mulTexturesProgram = this._createMulTexturesShaderProgram();
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

  _createInitEqShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsInitEqSource);
    const program = this.wgli.createProgram(shader);
    program.tauUniform = this.wgli.getUniformLocation(program, "uTau");
    program.initDensityUniform = this.wgli.getUniformLocation(program, "uInitDensity");
    program.velocityUniform = this.wgli.getUniformLocation(program, "uVelocity");
    program.densityUniform = this.wgli.getUniformLocation(program, "uDensity");
    program.forceDensityUniform = this.wgli.getUniformLocation(program, "uForceDensity");
    program.scalarFieldUniform = this.wgli.getUniformLocation(program, "uScalarField");
    return program;
  }

  _createForceShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsForceDensitySource);
    const program = this.wgli.createProgram(shader);
    program.isCursorActiveUniform = this.wgli.getUniformLocation(program, "uIsActive");
    program.toolSizeUniform = this.wgli.getUniformLocation(program, "uToolSize");
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
    program.toolSizeUniform = this.wgli.getUniformLocation(program, "uToolSize");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.texelSizeUniform = this.wgli.getUniformLocation(program, "uTexelSize");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createConcentrateSourceShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsConcentrateSourceSource);
    const program = this.wgli.createProgram(shader);
    program.isAddingUniform = this.wgli.getUniformLocation(program, "uIsAdding");
    program.isRemovingUniform = this.wgli.getUniformLocation(program, "uIsRemoving");
    program.toolSizeUniform = this.wgli.getUniformLocation(program, "uToolSize");
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.cursorPosUniform = this.wgli.getUniformLocation(program, "uCursorPos");
    program.concentrateSourceUniform = this.wgli.getUniformLocation(program, "uConcentrateSource");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createTRTShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsTRTSource);
    const program = this.wgli.createProgram(shader);
    program.hasScalarFieldSourceUniform = this.wgli.getUniformLocation(program, "uHasScalarFieldSource");
    program.plusOmegaUniform = this.wgli.getUniformLocation(program, "uPlusOmega");
    program.minusOmegaUniform = this.wgli.getUniformLocation(program, "uMinusOmega");
    program.oneMinusInvTwoTauUniform = this.wgli.getUniformLocation(program, "uOneMinusInvTwoTau");
    program.initDensityUniform = this.wgli.getUniformLocation(program, "uInitDensity");
    program.initScalarFieldUniform = this.wgli.getUniformLocation(program, "uInitScalarField");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.scalarFieldUniform = this.wgli.getUniformLocation(program, "uScalarField");
    program.scalarFieldSourceUniform = this.wgli.getUniformLocation(program, "uScalarFieldSource");
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
    program.defaultValUniform = this.wgli.getUniformLocation(program, "uDefaultVal");
    program.summandUniform = this.wgli.getUniformLocation(program, "uSummand");
    program.distFuncUniform = this.wgli.getUniformLocation(program, "uDistFunc");
    program.nodeIdUniform = this.wgli.getUniformLocation(program, "uNodeId");
    return program;
  }

  _createVelocityShaderProgram(define) {
    const shader = this.wgli.createFragmentShader(define + fsVelocitySource);
    const program = this.wgli.createProgram(shader);
    program.speedOfSoundUniform = this.wgli.getUniformLocation(program, "uSpeedOfSound");
    program.initDensityUniform = this.wgli.getUniformLocation(program, "uInitDensity");
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
    program.solute0ColUniform = this.wgli.getUniformLocation(program, "uSolute0Col");
    program.solute1ColUniform = this.wgli.getUniformLocation(program, "uSolute1Col");
    program.solute2ColUniform = this.wgli.getUniformLocation(program, "uSolute2Col");
    program.solute0Uniform = this.wgli.getUniformLocation(program, "uSolute0");
    program.solute1Uniform = this.wgli.getUniformLocation(program, "uSolute1");
    program.solute2Uniform = this.wgli.getUniformLocation(program, "uSolute2");
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

  _createMulTexturesShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsMulTexturesSource);
    const program = this.wgli.createProgram(shader);
    program.texture0Uniform = this.wgli.getUniformLocation(program, "uTexture0");
    program.texture1Uniform = this.wgli.getUniformLocation(program, "uTexture1");
    return program;
  }

  _createCircleShaderProgram() {
    const shader = this.wgli.createFragmentShader(fsCircleSource);
    const program = this.wgli.createProgram(shader);
    program.xAspectUniform = this.wgli.getUniformLocation(program, "uXAspect");
    program.yAspectUniform = this.wgli.getUniformLocation(program, "uYAspect");
    program.radiusUniform = this.wgli.getUniformLocation(program, "uRadius");
    program.centerUniform = this.wgli.getUniformLocation(program, "uCenter");
    return program;
  }

  // Set initial node Ids
  _setInitNodeId() {
    this.wgli.clear(this.nodeId.read.fbo, 0, 0, 0, 0);
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
    this.wgli.uniform2f(this.initVelocityProgram.velocityUniform, this.fluid.params.initVelocity[0], this.fluid.params.initVelocity[1]);
    this.wgli.uniform1i(this.initVelocityProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();
  }

  // Set initial density
  _setInitDensity() {
    this.wgli.clear(this.fluid.density.read.fbo, 0.0, 0.0, 0.0, 0.0);
  }

  // Initialises the fluid distribution functions to equilibrium
  _computeInitFluidDist() {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1f(this.initEqProgramF0.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF0.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc0.write.fbo);
    this.fluid.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1f(this.initEqProgramF1_4.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF1_4.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc1_4.write.fbo);
    this.fluid.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, this.fluid.params.tau);
    this.wgli.uniform1f(this.initEqProgramF5_8.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF5_8.scalarFieldUniform, this.fluid.density.read.attach(3));
    this.wgli.blit(this.fluid.distFunc5_8.write.fbo);
    this.fluid.distFunc5_8.swap();
  }

  // Resets the fluid
  resetFluid() {
    this._initFluid();
  }

  // Initialise solute variables
  _initSolute(solute, center, radius) {
    // Initialise concentration field
    this._initSoluteConcentration(solute, center, radius);

    // Initialise equilibrium distribution functions
    this._computeInitSoluteDist(solute);
  }

  _initSoluteConcentration(solute, center, radius) {
    this.aspect = this.wgli.getAspect();
    this.wgli.useProgram(this.circleProgram);
    this.wgli.uniform1f(this.circleProgram.xAspectUniform, this.aspect.xAspect);
    this.wgli.uniform1f(this.circleProgram.yAspectUniform, this.aspect.yAspect);
    this.wgli.uniform1f(this.circleProgram.radiusUniform, radius);
    this.wgli.uniform2f(this.circleProgram.centerUniform, center[0], center[1]);
    this.wgli.blit(solute.concentration.write.fbo);
    solute.concentration.swap();
  }

  _computeInitSoluteDist(solute) {
    // Rest component
    this.wgli.useProgram(this.initEqProgramF0);
    this.wgli.uniform1f(this.initEqProgramF0.tauUniform, solute.params.tau);
    this.wgli.uniform1f(this.initEqProgramF0.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF0.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF0.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF0.scalarFieldUniform, solute.concentration.read.attach(3));
    this.wgli.blit(solute.distFunc0.write.fbo);
    solute.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.initEqProgramF1_4);
    this.wgli.uniform1f(this.initEqProgramF1_4.tauUniform, solute.params.tau);
    this.wgli.uniform1f(this.initEqProgramF1_4.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF1_4.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF1_4.scalarFieldUniform, solute.concentration.read.attach(3));
    this.wgli.blit(solute.distFunc1_4.write.fbo);
    solute.distFunc1_4.swap();
    
    // Diagonal components
    this.wgli.useProgram(this.initEqProgramF5_8);
    this.wgli.uniform1f(this.initEqProgramF5_8.tauUniform, solute.params.tau);
    this.wgli.uniform1f(this.initEqProgramF5_8.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.initEqProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform1i(this.initEqProgramF5_8.densityUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.initEqProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(2));
    this.wgli.uniform1i(this.initEqProgramF5_8.scalarFieldUniform, solute.concentration.read.attach(3));
    this.wgli.blit(solute.distFunc5_8.write.fbo);
    solute.distFunc5_8.swap();
  }

  // Resets the solute with the given Id
  resetSolute(id) {
    const solute = this.solutes[id];
    this.wgli.clear(solute.concentration.write.fbo, 0.0, 0.0, 0.0);
    solute.concentration.swap();
    this._computeInitSoluteDist(solute);
  }

  // Performs TRT colision for fluid populations
  _performFluidTRT() {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1i(this.TRTProgramF0.hasScalarFieldSourceUniform, false);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF0.initScalarFieldUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, this.fluid.distFunc0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc0.write.fbo);
    this.fluid.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1i(this.TRTProgramF1_4.hasScalarFieldSourceUniform, false);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF1_4.initScalarFieldUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, this.fluid.distFunc1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc1_4.write.fbo);
    this.fluid.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1i(this.TRTProgramF5_8.hasScalarFieldSourceUniform, false);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, this.fluid.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, this.fluid.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF5_8.initScalarFieldUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, this.fluid.distFunc5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.scalarFieldUniform, this.fluid.density.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.fluid.density.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(4));
    this.wgli.blit(this.fluid.distFunc5_8.write.fbo);
    this.fluid.distFunc5_8.swap();
  }

  // Performs TRT colision for solute populations
  _performSoluteTRT(solute) {
    // Rest component
    this.wgli.useProgram(this.TRTProgramF0);
    this.wgli.uniform1i(this.TRTProgramF0.hasScalarFieldSourceUniform, true);
    this.wgli.uniform1f(this.TRTProgramF0.plusOmegaUniform, solute.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.minusOmegaUniform, solute.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF0.oneMinusInvTwoTauUniform, solute.params.oneMinusInvTwoTau);
    this.wgli.uniform1f(this.TRTProgramF0.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF0.initScalarFieldUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.TRTProgramF0.distFuncUniform, solute.distFunc0.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF0.scalarFieldUniform, solute.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF0.scalarFieldSourceUniform, solute.concentrateSource.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF0.velocityUniform, this.fluid.velocity.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF0.densityUniform, this.fluid.density.read.attach(4));
    this.wgli.uniform1i(this.TRTProgramF0.forceDensityUniform, this.fluid.forceDensity.attach(5));
    this.wgli.blit(solute.distFunc0.write.fbo);
    solute.distFunc0.swap();

    // Main cartesian components
    this.wgli.useProgram(this.TRTProgramF1_4);
    this.wgli.uniform1i(this.TRTProgramF1_4.hasScalarFieldSourceUniform, true);
    this.wgli.uniform1f(this.TRTProgramF1_4.plusOmegaUniform, solute.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.minusOmegaUniform, solute.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF1_4.oneMinusInvTwoTauUniform, solute.params.oneMinusInvTwoTau);
    this.wgli.uniform1f(this.TRTProgramF1_4.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF1_4.initScalarFieldUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.TRTProgramF1_4.distFuncUniform, solute.distFunc1_4.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF1_4.scalarFieldUniform, solute.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF1_4.scalarFieldSourceUniform, solute.concentrateSource.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF1_4.densityUniform, this.fluid.density.read.attach(4));
    this.wgli.uniform1i(this.TRTProgramF1_4.forceDensityUniform, this.fluid.forceDensity.attach(5));
    this.wgli.blit(solute.distFunc1_4.write.fbo);
    solute.distFunc1_4.swap();

    // Diagonal components
    this.wgli.useProgram(this.TRTProgramF5_8);
    this.wgli.uniform1i(this.TRTProgramF5_8.hasScalarFieldSourceUniform, true);
    this.wgli.uniform1f(this.TRTProgramF5_8.plusOmegaUniform, solute.params.plusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.minusOmegaUniform, solute.params.minusOmega);
    this.wgli.uniform1f(this.TRTProgramF5_8.oneMinusInvTwoTauUniform, solute.params.oneMinusInvTwoTau);
    this.wgli.uniform1f(this.TRTProgramF5_8.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1f(this.TRTProgramF5_8.initScalarFieldUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.TRTProgramF5_8.distFuncUniform, solute.distFunc5_8.read.attach(0));
    this.wgli.uniform1i(this.TRTProgramF5_8.scalarFieldUniform, solute.concentration.read.attach(1));
    this.wgli.uniform1i(this.TRTProgramF5_8.scalarFieldSourceUniform, solute.concentrateSource.read.attach(2));
    this.wgli.uniform1i(this.TRTProgramF5_8.velocityUniform, this.fluid.velocity.read.attach(3));
    this.wgli.uniform1i(this.TRTProgramF5_8.densityUniform, this.fluid.density.read.attach(4));
    this.wgli.uniform1i(this.TRTProgramF5_8.forceDensityUniform, this.fluid.forceDensity.attach(5));
    this.wgli.blit(solute.distFunc5_8.write.fbo);
    solute.distFunc5_8.swap();
  }

  // Performs streaming on fluid or solute distribution functions
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
    this.wgli.clear(this.fluid.density.read.fbo, -this.fluid.params.initDensity, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc0.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc1_4.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();

    // Add diagonal components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, this.fluid.distFunc5_8.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(this.fluid.density.write.fbo);
    this.fluid.density.swap();
  }

  _computeConcentration(solute) {
    // Clear concentration buffer
    this.wgli.clear(solute.concentration.read.fbo, -solute.params.initConcentration, 0, 0, 0);

    // Add rest component
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, solute.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, solute.distFunc0.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(solute.concentration.write.fbo);
    solute.concentration.swap();

    // Add main cartesian components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, solute.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, solute.distFunc1_4.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(solute.concentration.write.fbo);
    solute.concentration.swap();

    // Add diagonal components
    this.wgli.useProgram(this.sumDistFuncProgram);
    this.wgli.uniform1f(this.sumDistFuncProgram.defaultValUniform, solute.params.initConcentration);
    this.wgli.uniform1i(this.sumDistFuncProgram.summandUniform, solute.concentration.read.attach(0));
    this.wgli.uniform1i(this.sumDistFuncProgram.distFuncUniform, solute.distFunc5_8.read.attach(1));
    this.wgli.uniform1i(this.sumDistFuncProgram.nodeIdUniform, this.nodeId.read.attach(2));
    this.wgli.blit(solute.concentration.write.fbo);
    solute.concentration.swap();
  }

  _computeVelocity() {
    // Clear velocity buffer
    this.wgli.clear(this.fluid.velocity.read.fbo, 0, 0, 0, 0);

    // Add main cartesian components
    this.wgli.useProgram(this.velocityProgramF1_4);
    this.wgli.uniform1f(this.velocityProgramF1_4.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1f(this.velocityProgramF1_4.initDensityUniform, this.fluid.params.initDensity);
    this.wgli.uniform1i(this.velocityProgramF1_4.densityUniform, this.fluid.density.read.attach(0));
    this.wgli.uniform1i(this.velocityProgramF1_4.velocityUniform, this.fluid.velocity.read.attach(1));
    this.wgli.uniform1i(this.velocityProgramF1_4.distFuncUniform, this.fluid.distFunc1_4.read.attach(2));
    this.wgli.uniform1i(this.velocityProgramF1_4.nodeIdUniform, this.nodeId.read.attach(3));
    this.wgli.blit(this.fluid.velocity.write.fbo);
    this.fluid.velocity.swap();

    // Add diagonal components
    this.wgli.useProgram(this.velocityProgramF5_8);
    this.wgli.uniform1f(this.velocityProgramF5_8.speedOfSoundUniform, this.params.speedOfSound);
    this.wgli.uniform1f(this.velocityProgramF5_8.initDensityUniform, this.fluid.params.initDensity);
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
    this.wgli.uniform2f(this.averageRowsProgram.canvasSizeUniform, this.props.resolution, this.props.resolution);
    this.wgli.uniform1i(this.averageRowsProgram.targetUniform, this.fluid.density.read.attach(0));
    this.wgli.blit(this.fluid.averageDensity.write.fbo);
    this.fluid.averageDensity.swap();

    // Average columns
    this.wgli.useProgram(this.averageColumnsProgram);
    this.wgli.uniform2f(this.averageColumnsProgram.texelSizeUniform, this.fluid.density.read.texelSizeX, this.fluid.density.read.texelSizeY);
    this.wgli.uniform2f(this.averageColumnsProgram.canvasSizeUniform, this.props.resolution, this.props.resolution);
    this.wgli.uniform1i(this.averageColumnsProgram.targetUniform, this.fluid.averageDensity.read.attach(0));
    this.wgli.blit(this.fluid.averageDensity.write.fbo);
    this.fluid.averageDensity.swap();
  }

  _react(reaction) {
    // Return early if reaction rate is zero
    if (reaction.params.reactionRate == 0.0) {
      return;
    }

    // Calculate instantaneous rate of reaction for each node
    this.wgli.clear(reaction.nodalRateOfReaction.read.fbo, reaction.params.reactionRate, 0.0, 0.0, 0.0);
    for (let i = 0; i < reaction.params.soluteIds.length; i++) {
      const soluteId = reaction.params.soluteIds[i];
      if (reaction.params.stoichiometricCoeffs[soluteId] >= 0) {
        continue;
      }

      // Multiply with solute concentration
      this.wgli.useProgram(this.mulTexturesProgram);
      this.wgli.uniform1i(this.mulTexturesProgram.texture0Uniform, reaction.nodalRateOfReaction.read.attach(0));
      this.wgli.uniform1i(this.mulTexturesProgram.texture1Uniform, this.solutes[soluteId].concentration.read.attach(1));
      this.wgli.blit(reaction.nodalRateOfReaction.write.fbo);
      reaction.nodalRateOfReaction.swap();
    }

    // Calculate the resulting concentrate source for each solute
    for (let i = 0; i < reaction.params.soluteIds.length; i++) {
      const soluteId = reaction.params.soluteIds[i];

      // Set concentrate source to molar mass times reaction coefficient
      this.wgli.clear(this.solutes[soluteId].concentrateSource.read.fbo, reaction.params.molMassTimesCoeffs[soluteId], 0.0, 0.0, 0.0);

      // Multiply concentrate source by nodal reaction rate
      this.wgli.useProgram(this.mulTexturesProgram);
      this.wgli.uniform1i(this.mulTexturesProgram.texture0Uniform, reaction.nodalRateOfReaction.read.attach(0));
      this.wgli.uniform1i(this.mulTexturesProgram.texture1Uniform, this.solutes[soluteId].concentrateSource.read.attach(1));
      this.wgli.blit(this.solutes[soluteId].concentrateSource.write.fbo);
      this.solutes[soluteId].concentrateSource.swap();
    }
  }

  _drawIndicatorArrow(x, y, xOffset, yOffset) {
    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(x, y);
    this.overlayCtx.lineTo(x + xOffset * 0.7, y - yOffset * 0.7);
    this.overlayCtx.lineTo(x + xOffset * 0.7 - yOffset * 0.08, y - yOffset * 0.7 - xOffset * 0.08);
    this.overlayCtx.lineTo(x + xOffset, y - yOffset);
    this.overlayCtx.lineTo(x + xOffset * 0.7 + yOffset * 0.08, y - yOffset * 0.7 + xOffset * 0.08);
    this.overlayCtx.lineTo(x + xOffset * 0.7, y - yOffset * 0.7);
    this.overlayCtx.lineTo(x, y);
    this.overlayCtx.fill();
    this.overlayCtx.stroke();
  }

  _drawIndicatorLine(x, y, xOffset, yOffset) {
    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(x, y);
    this.overlayCtx.lineTo(x + xOffset, y - yOffset);
    this.overlayCtx.stroke();
  }

  _drawOverlay() {
    // Clear previous overlay
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    // Sample entire velocity field in single call
    this.wgli.readPixels(this.fluid.velocity.read, 0, 0, this.props.resolution, this.props.resolution, this.overlayBuffer);

    // Draw velocity indicators
    let x = this.correctedOverlayXOffset / 2;
    let sampleX = this.overlayXSampleOffset / 2;
    for (let Xi = 0; Xi < this.overlayXCount; Xi++) {
      let y = this.overlay.height - this.correctedOverlayYOffset / 2;
      let sampleY = this.overlayYSampleOffset / 2;
      for (let Yi = 0; Yi < this.overlayYCount; Yi++) {
        // Calculate texel index
        const i = 4 * (Math.round(sampleX) + this.props.resolution * Math.round(sampleY));

        // Get velocity values
        const velX = this.overlayMagnitude * this.overlayBuffer[i];
        const velY = this.overlayMagnitude * this.overlayBuffer[i + 1];

        // Draw indicator to screen
        this.drawIndicatorFct(x, y, velX, velY);
       
        // Increment coordinates
        y -= this.correctedOverlayYOffset;
        sampleY += this.overlayYSampleOffset;
      }
      x += this.correctedOverlayXOffset;
      sampleX += this.overlayXSampleOffset;
    }
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

    // Initialise solutes
    this._initSolute(this.solutes[0], [this.aspect.xAspect * 0.5 - 0.1, this.aspect.yAspect * 0.515 - 0.1 * Math.sin(Math.PI / 3)], 0.2);
    this._initSolute(this.solutes[1], [this.aspect.xAspect * 0.5 + 0.1, this.aspect.yAspect * 0.515 - 0.1 * Math.sin(Math.PI / 3)], 0.2);
    this._initSolute(this.solutes[2], [this.aspect.xAspect * 0.5,       this.aspect.yAspect * 0.515 + 0.1 * Math.sin(Math.PI / 3)], 0.2);

    // Begin main update loop
    requestAnimFrame(() => this._update());
  }

  // Main update loop
  _update() {
    // Callback
    requestAnimFrame(() => this._update());

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Get aspect ratios
    this.aspect = this.wgli.getAspect();
    
    // Update walls
    const isAddingWalls = this.props.isCursorOver && this.props.isCursorActive && this.props.tool == 1;
    const isRemovingWalls = this.props.isCursorOver && this.props.isCursorActive && this.props.tool == 2;
    this.wgli.useProgram(this.wallProgram);
    this.wgli.uniform1i(this.wallProgram.isAddingUniform, isAddingWalls);
    this.wgli.uniform1i(this.wallProgram.isRemovingUniform, isRemovingWalls);
    this.wgli.uniform1i(this.wallProgram.leftRightWallUniform, this.props.leftRightWall);
    this.wgli.uniform1i(this.wallProgram.topBottomWallUniform, this.props.topBottomWall);
    this.wgli.uniform1f(this.wallProgram.toolSizeUniform, this.props.toolSize);
    this.wgli.uniform1f(this.wallProgram.xAspectUniform, this.aspect.xAspect);
    this.wgli.uniform1f(this.wallProgram.yAspectUniform, this.aspect.yAspect);
    this.wgli.uniform2f(this.wallProgram.cursorPosUniform, this.props.cursorPos.x, this.props.cursorPos.y);
    this.wgli.uniform2f(this.wallProgram.texelSizeUniform, this.nodeId.write.texelSizeX, this.nodeId.write.texelSizeY);
    this.wgli.uniform1i(this.wallProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.nodeId.write.fbo);
    this.nodeId.swap();

    // Handle reactions
    if (this.props.reactionsEnabled) {
      for (let reaction of this.reactions) {
        this._react(reaction);
      }
    }

    // Add user imposed concentration source
    const isAddingConcentration = this.props.isCursorOver && this.props.isCursorActive && this.props.tool == 3;
    const isRemovingConcentration = this.props.isCursorOver && this.props.isCursorActive && this.props.tool == 4;
    const activeSolute = this.props.solute;
    this.wgli.useProgram(this.concentrateSourceProgram);
    this.wgli.uniform1i(this.concentrateSourceProgram.isAddingUniform, isAddingConcentration);
    this.wgli.uniform1i(this.concentrateSourceProgram.isRemovingUniform, isRemovingConcentration);
    this.wgli.uniform1f(this.concentrateSourceProgram.toolSizeUniform, this.props.toolSize);
    this.wgli.uniform1f(this.concentrateSourceProgram.xAspectUniform, this.aspect.xAspect);
    this.wgli.uniform1f(this.concentrateSourceProgram.yAspectUniform, this.aspect.yAspect);
    this.wgli.uniform2f(this.concentrateSourceProgram.cursorPosUniform, this.props.cursorPos.x, this.props.cursorPos.y);
    this.wgli.uniform1i(this.concentrateSourceProgram.concentrateSourceUniform, this.solutes[activeSolute].concentrateSource.read.attach(0));
    this.wgli.uniform1i(this.concentrateSourceProgram.nodeIdUniform, this.nodeId.read.attach(1));
    this.wgli.blit(this.solutes[activeSolute].concentrateSource.write.fbo);
    this.solutes[activeSolute].concentrateSource.swap();

    // Get imposed forces
    const isAddingForce = this.props.isCursorOver && this.props.isCursorActive && this.props.tool == 0;
    this.wgli.useProgram(this.forceProgram);
    this.wgli.uniform1i(this.forceProgram.isCursorActiveUniform, isAddingForce);
    this.wgli.uniform1f(this.forceProgram.toolSizeUniform, this.props.toolSize);
    this.wgli.uniform1f(this.forceProgram.xAspectUniform, this.aspect.xAspect);
    this.wgli.uniform1f(this.forceProgram.yAspectUniform, this.aspect.yAspect);
    this.wgli.uniform2f(this.forceProgram.cursorPosUniform, this.props.cursorPos.x, this.props.cursorPos.y);
    this.wgli.uniform2f(this.forceProgram.cursorVelUniform, this.props.cursorVel.x, this.props.cursorVel.y);
    this.wgli.uniform1i(this.forceProgram.nodeIdUniform, this.nodeId.read.attach(0));
    this.wgli.blit(this.fluid.forceDensity.fbo);

    // Perform fluid TRT collision step
    this._performFluidTRT();

    // Perform fluid streaming step
    this._performStreaming(this.fluid);

    // Perform solute TRT collision step
    for (let solute of this.solutes) {
      this._performSoluteTRT(solute);

      // Reset concentration source
      this.wgli.clear(solute.concentrateSource.read.fbo, 0.0, 0.0, 0.0, 0.0);
    }

    // Perform solute streaming step
    for (let solute of this.solutes) {
      this._performStreaming(solute);
    }

    // Compute macroscopic fluid density
    this._computeDensity();

    // Compute macroscopic fluid velocity
    this._computeVelocity();

    // Compute macroscopic solute concentration
    for (let solute of this.solutes) {
      this._computeConcentration(solute);
    }

    // Draw fluid velocity, solutes and node Id
    this.wgli.useProgram(this.outputProgram);
    this.wgli.uniform1i(this.outputProgram.velocityUniform, this.fluid.velocity.read.attach(0));
    this.wgli.uniform3f(this.outputProgram.solute0ColUniform, this.normalizedColors[0].r, this.normalizedColors[0].g, this.normalizedColors[0].b);
    this.wgli.uniform3f(this.outputProgram.solute1ColUniform, this.normalizedColors[1].r, this.normalizedColors[1].g, this.normalizedColors[1].b);
    this.wgli.uniform3f(this.outputProgram.solute2ColUniform, this.normalizedColors[2].r, this.normalizedColors[2].g, this.normalizedColors[2].b);
    this.wgli.uniform1i(this.outputProgram.solute0Uniform, this.solutes[0].concentration.read.attach(1));
    this.wgli.uniform1i(this.outputProgram.solute1Uniform, this.solutes[1].concentration.read.attach(2));
    this.wgli.uniform1i(this.outputProgram.solute2Uniform, this.solutes[2].concentration.read.attach(3));
    this.wgli.uniform1i(this.outputProgram.nodeIdUniform, this.nodeId.read.attach(4));
    this.wgli.blit(null);

    // Draw velocity field overlay
    this._drawOverlay();
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
    this.solutes[0].setDiffusivity(this.props.diffusivities[0]);
    this.solutes[1].setDiffusivity(this.props.diffusivities[1]);
    this.solutes[2].setDiffusivity(this.props.diffusivities[2]);
    this.reactions[0].setReactionRate(this.props.reactionRate);
    this._setOverlayParameters();
  }

  resetWalls() {
    this.wgli.clear(this.nodeId.write.fbo, 0.0, 0.0, 0.0);
    this.nodeId.swap();
  }
}

export default LBMProgram;