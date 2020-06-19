class Fluid {
  constructor(wgli) {
    this.wgli = wgli;
    this._initFBOs();
  }

  _initFBOs() {
    // Stores velocity
    this.velocity = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores density
    this.density = this.wgli.createDoubleFBO("RGBA", "NEAREST");

    // Stores imposed force density
    this.forceDensity = this.wgli.createFBO("RGBA", "NEAREST");

    // Stores distribution functions
    this.distFuncF0 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFuncF1_4 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
    this.distFuncF5_8 = this.wgli.createDoubleFBO("RGBA", "NEAREST");
  }
}

export default Fluid;