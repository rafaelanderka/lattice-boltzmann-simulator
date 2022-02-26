import requestAnimationFrame from 'raf'

import Fluid from './fluid';
import Solute from './solute';
import Reaction from './reaction';

import fsNodeIdUpdate from '../../shaders/fs-nodeid-update';
import fsFluidCollision from '../../shaders/fs-fluid-collision';
import fsFluidStreaming from '../../shaders/fs-fluid-streaming';
import fsFluidInit from '../../shaders/fs-fluid-init';
import fsSoluteCollision from '../../shaders/fs-solute-collision';
import fsSoluteStreaming from '../../shaders/fs-solute-streaming';
import fsSoluteInit from '../../shaders/fs-solute-init';
import fsReaction from '../../shaders/fs-reaction';
import fsOutput from '../../shaders/fs-output';

class LBMProgram {
  constructor(wgli, props) {
    this.wgli = wgli;
    this.props = props;
    this.params = {
      speedOfSound: 0.3,
      overlayLineWidth: 1
    };
    this.aspect = this.wgli.getAspect();
    this.setNormalizedColors();
    this._initFBOs();
    this._compileShaders();

    this.fluid = new Fluid(this.wgli, this.props.resolution, this.props.viscosity);
    this.solutes = [
      new Solute(wgli, this.props.resolution, this.props.diffusivities[0]), 
      new Solute(wgli, this.props.resolution, this.props.diffusivities[1]),
      new Solute(wgli, this.props.resolution, this.props.diffusivities[2])
    ];

    // Currently only this default reaction is supported
    this.reaction = new Reaction(wgli, this.props.resolution, [1, 1, 1], [-1, -1, 1], this.props.reactionRate)

    this._update = this._update.bind(this);
  }

  setNormalizedColors() {
    this.normalizedColors = [];
    for (let c of this.props.colors) {
      let nc = [c.r / 255.0, c.g / 255.0, c.b / 255.0];
      this.normalizedColors.push(nc);
    }
  }

  _initFBOs() {
    // Stores node id
    // 0: fluid
    // 1: bounce-back wall
    this.nodeIds = this.wgli.createReadWriteFBO("RGBA", "LINEAR", this.props.resolution, this.props.resolution, 1);
  }

  resetNodeIds() {
    this.wgli.clear(this.nodeIds.write, 0.0, 0.0, 0.0);
    this.nodeIds.swap();
  }

  _compileShaders() {
    // Create nodeId shaders
    this.nodeIdUpdateShader = this.wgli.createProgramInfo(fsNodeIdUpdate);

    // Create fluid shaders
    this.fluidInitShader = this.wgli.createProgramInfo(fsFluidInit);
    this.fluidCollisionShader = this.wgli.createProgramInfo(fsFluidCollision);
    this.fluidStreamingShader = this.wgli.createProgramInfo(fsFluidStreaming);

    // Create solute shaders
    this.soluteInitShader = this.wgli.createProgramInfo(fsSoluteInit);
    this.soluteCollisionShader = this.wgli.createProgramInfo(fsSoluteCollision);
    this.soluteStreamingShader = this.wgli.createProgramInfo(fsSoluteStreaming);

    // Create reaction shader
    this.reactionShader = this.wgli.createProgramInfo(fsReaction);

    // Create output shader
    this.outputShader = this.wgli.createProgramInfo(fsOutput);
  }

  _initFluid() {
    this.wgli.useProgram(this.fluidInitShader.program);
    this.wgli.setUniforms(this.fluidInitShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uFluidData: this.fluid.fbo.read.textures,
      uInitVelocity:  this.fluid.params.initVelocity,
      uInitDensity:  this.fluid.params.initDensity,
      uTau: this.fluid.params.tau,
    });
    this.wgli.blit(this.fluid.fbo.write, this.props.resolution, this.props.resolution);
    this.fluid.fbo.swap()
  }

  // Resets the fluid
  resetFluid() {
    this.wgli.clear(this.fluid.fbo.write, 0.0, 0.0, 0.0, 0.0);
    this.fluid.fbo.swap();
    this._initFluid();
  }

  _initSolute(solute, center, radius) {
    this.wgli.useProgram(this.soluteInitShader.program);
    this.wgli.setUniforms(this.soluteInitShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uFluidData: this.fluid.fbo.read.textures,
      uSoluteData: solute.fbo.read.textures,
      uInitDensity:  this.fluid.params.initDensity,
      uTau: solute.params.tau,
      uCenter: center,
      uRadius: radius,
      uAspect: this.aspect,
    });
    this.wgli.blit(solute.fbo.write, this.props.resolution, this.props.resolution);
    solute.fbo.swap()
  }

  // Resets the solute with the given Id
  resetSolute(id) {
    const solute = this.solutes[id];
    this._initSolute(solute, [0, 0], 0);
  }

  // Entry point for the program
  run() {
    // Initialise fluid parameters
    this._initFluid();

    // Initialise solutes
    this._initSolute(this.solutes[0], [this.aspect[0] * 0.5 - 0.15, this.aspect[1] * 0.515 - 0.15 * Math.sin(Math.PI / 3)], 0.25);
    this._initSolute(this.solutes[1], [this.aspect[0] * 0.5 + 0.15, this.aspect[1] * 0.515 - 0.15 * Math.sin(Math.PI / 3)], 0.25);
    this._initSolute(this.solutes[2], [this.aspect[0] * 0.5,        this.aspect[1] * 0.515 + 0.15 * Math.sin(Math.PI / 3)], 0.25);
    
    // Set start time
    this.timeStart = Date.now();

    // Begin main update loop
    requestAnimationFrame(this._update);
  }

  // Main update loop
  _update() {
    // Callback
    requestAnimationFrame(this._update);

    // Pre-update: ensure WebGL interface state is up to date
    this.wgli.update();

    // Get aspect ratios
    this.aspect = this.wgli.getAspect();

    // Update nodes
    this._updateNodeIds();

    // Run simulation
    for (let i = 0; i < this.props.stepsPerUpdate; i++) {
      this._runSimStep();
    }

    // Draw fluid velocity, solutes and node Id
    this.wgli.useProgram(this.outputShader.program);
    this.wgli.setUniforms(this.outputShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uFluidData: this.fluid.fbo.read.textures[0],
      uSolute0Data: this.solutes[0].fbo.read.textures[0],
      uSolute1Data: this.solutes[1].fbo.read.textures[0],
      uSolute2Data: this.solutes[2].fbo.read.textures[0],
      uSolute0Col: this.normalizedColors[0],
      uSolute1Col: this.normalizedColors[1],
      uSolute2Col: this.normalizedColors[2],
      uTexelSize: this.nodeIds.texelSize,
      uDrawIndicatorLines: this.props.overlayType == 1,
      uDrawIndicatorArrows: this.props.overlayType == 2,
      uAspect: this.aspect,
      uPhase: (this.timeStart - Date.now()) * 1.3e-5,
    });
    this.wgli.blit(null, this.props.renderWidth, this.props.renderHeight);

    // Draw velocity field overlay
    // this._drawOverlay();
  }

  _updateNodeIds() {
    const isAddingWalls = this.props.isCursorOver && this.props.isCursorActive && (this.props.tool == 1);
    const isRemovingWalls = this.props.isCursorOver && this.props.isCursorActive && (this.props.tool == 2);

    this.wgli.useProgram(this.nodeIdUpdateShader.program);
    this.wgli.setUniforms(this.nodeIdUpdateShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uIsAddingWalls: isAddingWalls,
      uIsRemovingWalls: isRemovingWalls,
      uHasVerticalWalls: this.props.hasVerticalWalls,
      uHasHorizontalWalls: this.props.hasHorizontalWalls,
      uToolSize: this.props.toolSize,
      uCursorPos: this.props.cursorPos,
      uAspect: this.aspect,
      uTexelSize: this.nodeIds.texelSize,
    });
    this.wgli.blit(this.nodeIds.write, this.props.resolution, this.props.resolution);
    this.nodeIds.swap()
  }

  _runSimStep() {
    this._updateFluid();
    this._updateSolutes();
  }

  _updateFluid() {
    // Perform TRT collision
    const isApplyingForce = this.props.isCursorOver && this.props.isCursorActive && (this.props.tool == 0);
    this.wgli.useProgram(this.fluidCollisionShader.program);
    this.wgli.setUniforms(this.fluidCollisionShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uFluidData: this.fluid.fbo.read.textures,
      uInitDensity:  this.fluid.params.initDensity,
      uPlusOmega: this.fluid.params.plusOmega,
      uMinusOmega: this.fluid.params.minusOmega,
      uIsApplyingForce: isApplyingForce,
      uToolSize: this.props.toolSize,
      uCursorPos: this.props.cursorPos,
      uCursorVel: this.props.cursorVel,
      uAspect: this.aspect,
      uTexelSize: this.fluid.fbo.texelSize,
    });
    this.wgli.blit(this.fluid.fbo.write, this.props.resolution, this.props.resolution);
    this.fluid.fbo.swap()

    // Perform streaming
    this.wgli.useProgram(this.fluidStreamingShader.program);
    this.wgli.setUniforms(this.fluidStreamingShader, {
      uNodeIds: this.nodeIds.read.textures[0],
      uFluidData: this.fluid.fbo.read.textures,
      uTexelSize: this.fluid.fbo.texelSize,
      uInitDensity:  this.fluid.params.initDensity,
      uSpeedOfSound: this.params.speedOfSound,
    });
    this.wgli.blit(this.fluid.fbo.write, this.props.resolution, this.props.resolution);
    this.fluid.fbo.swap()
  }

  _updateSolutes() {
    // Handle reactions
    if (this.props.areReactionsEnabled) {
      this._react();
    } else {
      this.wgli.clear(this.reaction.fbo.write, 0.0, 0.0, 0.0, 0.0);
      this.reaction.fbo.swap();
    }

    // Update each solute
    for (let i = 0; i < this.solutes.length; i++) {
      const solute = this.solutes[i]

      // Perform TRT collision
      const isActive = this.props.solute == i;
      const isAddingConcentration = + (this.props.isCursorOver && this.props.isCursorActive && isActive && (this.props.tool == 3));
      const isRemovingConcentration = + (this.props.isCursorOver && this.props.isCursorActive && isActive && (this.props.tool == 4));
      const concentrationSourcePolarity = isAddingConcentration - isRemovingConcentration;
      this.wgli.useProgram(this.soluteCollisionShader.program);
      this.wgli.setUniforms(this.soluteCollisionShader, {
        uNodeIds: this.nodeIds.read.textures[0],
        uFluidData: this.fluid.fbo.read.textures,
        uSoluteData: solute.fbo.read.textures,
        uNodalReactionRate: this.reaction.fbo.read.textures[0],
        uInitDensity:  this.fluid.params.initDensity,
        uInitConcentration:  solute.params.initConcentration,
        uPlusOmega: solute.params.plusOmega,
        uMinusOmega: solute.params.minusOmega,
        uOneMinusInvTwoTau: solute.params.oneMinusInvTwoTau,
        uConcentrationSourcePolarity: concentrationSourcePolarity,
        uToolSize: this.props.toolSize,
        uCursorPos: this.props.cursorPos,
        uAspect: this.aspect,
        uMolMassTimesCoeff: this.reaction.params.molMassTimesCoeffs[i],
      });
      this.wgli.blit(solute.fbo.write, this.props.resolution, this.props.resolution);
      solute.fbo.swap()

      // Perform streaming
      this.wgli.useProgram(this.soluteStreamingShader.program);
      this.wgli.setUniforms(this.soluteStreamingShader, {
        uNodeIds: this.nodeIds.read.textures[0],
        uSoluteData: solute.fbo.read.textures,
        uInitConcentration:  solute.params.initConcentration,
        uTexelSize: solute.fbo.texelSize,
      });
      this.wgli.blit(solute.fbo.write, this.props.resolution, this.props.resolution);
      solute.fbo.swap()
    }
  }

  _react() {
    this.wgli.useProgram(this.reactionShader.program);
    this.wgli.setUniforms(this.reactionShader, {
      uNodalReactionRate: this.reaction.fbo.read.textures[0],
      uSolute0Data: this.solutes[0].fbo.read.textures[0],
      uSolute1Data: this.solutes[1].fbo.read.textures[0],
      uSolute2Data: this.solutes[2].fbo.read.textures[0],
      uReactionRate: this.reaction.params.reactionRate,
      uStoichiometricCoeff0: this.reaction.params.stoichiometricCoeffs[0],
      uStoichiometricCoeff1: this.reaction.params.stoichiometricCoeffs[1],
      uStoichiometricCoeff2: this.reaction.params.stoichiometricCoeffs[2],
    });
    this.wgli.blit(this.reaction.fbo.write, this.props.resolution, this.props.resolution);
    this.reaction.fbo.swap()
  } 

  _react_old(reaction) {
    // Return early if reaction rate is zero
    if (reaction.params.reactionRate == 0.0) {
      return;
    }

    // Calculate instantaneous rate of reaction for each node
    this.wgli.clear(reaction.nodalReactionRate.read.fbo, reaction.params.reactionRate, 0.0, 0.0, 0.0);
    for (let i = 0; i < reaction.params.soluteIds.length; i++) {
      const soluteId = reaction.params.soluteIds[i];
      if (reaction.params.stoichiometricCoeffs[soluteId] >= 0) {
        continue;
      }

      // Multiply with solute concentration
      this.wgli.useProgram(this.mulTexturesProgram);
      this.wgli.uniform1i(this.mulTexturesProgram.texture0Uniform, reaction.nodalReactionRate.read.attach(0));
      this.wgli.uniform1i(this.mulTexturesProgram.texture1Uniform, this.solutes[soluteId].concentration.read.attach(1));
      this.wgli.blit(reaction.nodalReactionRate.write.fbo);
      reaction.nodalReactionRate.swap();
    }

    // Calculate the resulting concentrate source for each solute
    for (let i = 0; i < reaction.params.soluteIds.length; i++) {
      const soluteId = reaction.params.soluteIds[i];

      // Set concentrate source to molar mass times reaction coefficient
      this.wgli.clear(this.solutes[soluteId].concentrateSource.read.fbo, reaction.params.molMassTimesCoeffs[soluteId], 0.0, 0.0, 0.0);

      // Multiply concentrate source by nodal reaction rate
      this.wgli.useProgram(this.mulTexturesProgram);
      this.wgli.uniform1i(this.mulTexturesProgram.texture0Uniform, reaction.nodalReactionRate.read.attach(0));
      this.wgli.uniform1i(this.mulTexturesProgram.texture1Uniform, this.solutes[soluteId].concentrateSource.read.attach(1));
      this.wgli.blit(this.solutes[soluteId].concentrateSource.write.fbo);
      this.solutes[soluteId].concentrateSource.swap();
    }
  }

  setProps(props) {
    this.props = props;
    this.setNormalizedColors();
    this.fluid.setViscosity(this.props.viscosity);
    this.solutes[0].setDiffusivity(this.props.diffusivities[0]);
    this.solutes[1].setDiffusivity(this.props.diffusivities[1]);
    this.solutes[2].setDiffusivity(this.props.diffusivities[2]);
    this.reaction.setReactionRate(this.props.reactionRate);
  }
}

export default LBMProgram;