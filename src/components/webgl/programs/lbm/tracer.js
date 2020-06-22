class Tracer {
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
    // Stores concentration
    this.concentration = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Store distribution functions
    this.distFunc0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFunc5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Tracer;