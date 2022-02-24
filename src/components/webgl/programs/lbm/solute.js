class Solute {
  constructor(wgli, resolution, diffusivity) {
    this.wgli = wgli;

    // Initialize multi-texture FBO holding:
    // * concentration
    // * applied concentration source
    // * distribution functions 0-8
    this.fbo = this.wgli.createReadWriteFBO("RGBA", "NEAREST", resolution, resolution, 3);

    // Initialize solute parameters
    this.params = {
      initConcentration: 0.0,
      TRTmagic: 1.0 / 4.0
    };
    this.setDiffusivity(diffusivity);
  }

  setDiffusivity(diffusivity) {
    this.params.minusOmega =   1.0 / (3.0 * diffusivity + 0.5);
    this.params.plusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.minusOmega - 0.5)) + 0.5);
    this.params.tau = 1.0 / this.params.minusOmega;
    this.params.oneMinusInvTwoTau = (1.0 - 0.5 / this.params.tau);
  }
}

export default Solute;