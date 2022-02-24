class Reaction {
  constructor(wgli, resolution, molarMasses, stoichiometricCoeffs, reactionRate) {
    this.wgli = wgli;

    // Initialize FBO holding the instantaneous rate of reaction at each node
    this.fbo = this.wgli.createReadWriteFBO("RGBA", "NEAREST", resolution, resolution, 1);
    
    // Initialize fluid parameters
    this.params = {
      molarMasses: [...molarMasses],
      stoichiometricCoeffs: [...stoichiometricCoeffs],
      reactionRate: reactionRate
    };

    // Initialize premultiplied coeffs.
    this.params.molMassTimesCoeffs = [...molarMasses];
    for (let i = 0; i < molarMasses.length; i++) {
      this.params.molMassTimesCoeffs[i] *= this.params.stoichiometricCoeffs[i];
    }
  }

  setReactionRate(reactionRate) {
    this.params.reactionRate = reactionRate;
  }
}

export default Reaction;