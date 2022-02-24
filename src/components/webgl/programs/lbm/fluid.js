class Fluid {
  constructor(wgli, resolution, viscosity) {
    this.wgli = wgli;

    // Initialize multi-texture FBO holding:
    // * velocity x
    // * velocity y
    // * imposed force density x
    // * imposed force density y
    // * density
    // * distribution functions 0-8
    this.fbo = this.wgli.createReadWriteFBO("RGBA", "NEAREST", resolution, resolution, 4);

    // Initialize fluid parameters
    this.params = {
      initVelocity: [0.0, 0.0],
      initDensity: 1.0,
      TRTmagic: 1.0 / 4.0
    };
    this.setViscosity(viscosity);
  }

  setViscosity(viscosity) {
    this.params.plusOmega = 1.0 / (3.0 * viscosity + 0.5);
    this.params.minusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.plusOmega - 0.5)) + 0.5);
    this.params.tau = 1.0 / this.params.plusOmega;
  }
}

export default Fluid;