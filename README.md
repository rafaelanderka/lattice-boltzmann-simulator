<h1 align="center">
  <br>
  <a href="https://rafaelanderka.com/synbim-fluid-simulation/"><img src="http://www.synbim.co.uk/uploads/2/2/4/4/22449348/geetanjalipatwa-12072017-final.jpg" alt="Markdownify" width="400"></a>
  <br>
  <br>
  SynBIM Fluid Simulation
  <br>
</h1>

<h4 align="center">A web-based fluid flow simulation tool for advection-diffusion problems.</h4>

<p align="center">
  <a href="#getting-started">Getting Started</a> •
  <a href="#building-for-release">Building for Release</a> •
  <a href="#coding-style">Coding Style</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

## Getting Started

These instructions will help you set up a local development environment on your machine to help you get started with development, testing and deployment.

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your local machine in order to use [npm](https://www.npmjs.com).

After cloning the repository, navigate to the top-level directory of the project in your terminal and run

```
npm install
```

in order to install all dependencies.

### Running the Development Server

Simply run

```
npm run start
```

to build the app and start a local server at [http://localhost:1234](http://localhost:1234). Any changes you make while the server is running will automatically be reflected in your browser.

## Building for Release

To build a version of the app that can be hosted on a static web server, run the command

```
npm run build
```

in the top-level directory of the repository. Once finished, the `/dist` directory will contain all the files of the web app necessary for release (including all folders). **However, note that this assumes that the simulator will be the home page of the website.**

### Specifying a Custom Subdirectory

To build a version of the app that is **not** the home page of a website, you must manually specify the intended subdirectory. To do this, simply add the following parameters to the build command

```
npm run build -- --public-url /SUBDIRECTORY_PATH
```

where `/SUBDIRECTORY_PATH` should be replaced with the path to the intended subfolder. 

For example, if you wanted to host the web app at `http://www.example.com/synbim-fluid-simulation` then the above command would become

```
npm run build -- --public-url /synbim-fluid-simulation
```

After the script is finished, again the `/dist` directory will contain all necessary files for hosting.

## Coding Style

This project follows the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).

## Credits

This software uses the following open source packages:

- [Node.js](https://nodejs.org/)
- [React](https://reactjs.org)
- [Babel](https://babeljs.io)
- [Parcel](https://parceljs.org)
- [Normalize.css](http://necolas.github.io/normalize.css/)
- [nano-react-app](https://github.com/nano-react-app/nano-react-app)
- [react-range](https://github.com/tajo/react-range)
- [gh-pages](https://github.com/tschaub/gh-pages)

## Related

- Pavel Dobryakov's [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)

## License

MIT
