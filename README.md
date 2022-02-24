<h1 align="center">
  <br>
  <a href="https://rafaelanderka.com/lattice-boltzmann-simulator/"><img src="https://raw.githubusercontent.com/rafaelanderka/lattice-boltzmann-simulator/master/src/public/logo512.png" alt="Logo" width="300"></a>
  <br>
  <br>
  SynBIM Lattice Boltzmann Fluid Simulator
  <br>
</h1>

<h4 align="center">A WebGL2 fluid simulation tool implementing the lattice Boltzmann method (LBM) for advection-diffusion problems.</h4>

<p align="center">
  <a href="#contributing">Contributing</a> •
  <a href="#building-for-release">Building for Release</a> •
  <a href="#coding-style">Coding Style</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

## Contributing

These instructions will help you set up a local development environment on your machine to help you get started with development.

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your local machine in order to use [npm](https://www.npmjs.com).

After cloning the repository, navigate to the top-level directory of the project in your terminal and run

```
npm install
```

in order to install all dependencies.

### Running the Development Server

Run

```
npm run start
```

to build the app and start a local server at [http://localhost:1234](http://localhost:1234). Any changes you make while the server is running will automatically be reflected in your browser.

## Building for Release

To build a version of the app that can be hosted on a web server, run the command

```
npm run build
```

in the the repository. Once finished, the `dist` directory will contain all the files of the web app necessary for release (including all folders). *Note that this assumes that the simulator will be the home page of the website.*

### Specifying a Custom Subdirectory

To build a version of the app that is **not** the home page of a website, you must manually specify the intended subdirectory. To do this, simply add the following parameters to the build command

```
npm run build -- --public-url /SUBDIRECTORY_PATH
```

where `/SUBDIRECTORY_PATH` should be replaced with the path to the intended page. 

For example, if you wanted to host the web app at `http://www.example.com/lattice-boltzmann-simulator` then the above command would become

```
npm run build -- --public-url /lattice-boltzmann-simulator
```

After the script is finished, again the `dist` directory will contain all necessary files for hosting.

## Coding Style

This project follows the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).

## Related Work

- Pavel Dobryakov's [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)

## License

MIT
