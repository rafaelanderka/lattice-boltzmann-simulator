class Reaction {
  constructor(wgli, soluteIds, molarMasses, stoichiometricCoeffs, reactionRate) {
    this.wgli = wgli;
    
    this.params = {};
    this.params.soluteIds = [...soluteIds];
    this.params.molarMasses = [...molarMasses];
    this.params.stoichiometricCoeffs = [...stoichiometricCoeffs];
    this.params.reactionRate = reactionRate;

    this.params.molMassTimesCoeffs = [...molarMasses];
    for (let i = 0; i < molarMasses.length; i++) {
      this.params.molMassTimesCoeffs[i] *= this.params.stoichiometricCoeffs[i];
    }

    this._initFBOs();
  }

  setReactionRate(reactionRate) {
    this.params.reactionRate = reactionRate;
  }

  _initFBOs() {
    // Stores instantaneous rate of reaction for each node
    this.nodalRateOfReaction = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Reaction;