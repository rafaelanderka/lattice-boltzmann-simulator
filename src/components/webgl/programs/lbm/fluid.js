class Fluid {
  constructor(wgli) {
    this.wgli = wgli;
    
    this.params = {};
    this.params.tau = 1.0;
    this.params.TRTmagic = 1.0 / 12.0;
    this.params.plusOmega = 1.0;
    this.params.minusOmega = 1.0 / ((this.params.TRTmagic / (1.0 / this.params.plusOmega - 0.5)) + 0.5);
    
    this._initFBOs();
  }

  _initFBOs() {
    // Stores velocity
    this.velocity = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores density
    this.density = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores imposed force density
    this.forceDensity = this.wgli.createFBO("RGBA", "NEAREST");

    // Store distribution functions
    this.distFunc0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Fluid;