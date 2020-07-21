class Solute {
  constructor(wgli, diffusivity) {
    this.wgli = wgli;

    this.params = {
      initConcentration: 0.0,
      TRTmagic: 1.0 / 4.0
    };
    this.setDiffusivity(diffusivity);

    this._initFBOs();
  }

  setDiffusivity(diffusivity) {
    this.params.minusOmega =   1.0 / (3.0 * diffusivity + 0.5);
    this.params.plusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.minusOmega - 0.5)) + 0.5);
    this.params.tau = 1.0 / this.params.minusOmega;
    this.params.oneMinusInvTwoTau = (1.0 - 0.5 / this.params.tau);
  }

  _initFBOs() {
    // Stores concentration
    this.concentration = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    
    // Stores concentration source to be applied
    this.concentrateSource = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    
    // Store distribution functions
    this.distFunc0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Solute;