class Fluid {
  constructor(wgli, viscosity) {
    this.wgli = wgli;
    
    this.params = {
      initVelocity: [0.0, 0.0],
      initDensity: 1.0,
      TRTmagic: 1.0 / 4.0
    };
    this.setViscosity(viscosity);
    
    this._initFBOs();
  }

  setViscosity(viscosity) {
    this.params.plusOmega = 1.0 / (3.0 * viscosity + 0.5);
    this.params.minusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.plusOmega - 0.5)) + 0.5);
    this.params.tau = 1.0 / this.params.plusOmega;
  }

  _initFBOs() {
    // Stores velocity
    this.velocity = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores density
    this.density = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores average density
    this.averageDensity = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores imposed force density
    this.forceDensity = this.wgli.createFBO("RGBA", "NEAREST");

    // Store distribution functions
    this.distFunc0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Fluid;