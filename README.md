<img src="/public/favicon.png" alt="Magnet" align="right">

# MagnetRender

> A responsive application for creating dynamic vector images of magnets

This project is an Electron application built on top of Svelte. It provides a simple and intuitive interface for creating dynamic vector images of magnets. These vectors come from prebuilt templates and feautre adaptive dimension legends. Input dimensions are scaled to fit the screen and the resulting images can be exported as SVG, PNG, or JPEG.

It is also possible to save and load presets (this includes, dimensions, colors, perspective, etc.) thereby exporting (or reading) the current state as a JSON file.

This is a **utility application**, and as such it does not honor the best practices regarding security.

## Getting Started
To test MagnetRender for yourself, use one of the precompiled binaries for your system (available under Releases), or clone the repository and run the debug version:
```bash
git clone https://github.com/Raffy27/MagnetRender.git
cd MagnetRender

npm install
npm run dev
```
If you decide to build MagnetRender instead of testing it in its debug environment, you can do so by issuing
```bash
npm run build
```
or alternatively, for a distributable version:
```bash
npm run dist
```
Make sure to update the target specifications in the package.json file to match your system. The default is Windows.

## Developing
### Built with
* [Svelte](https://svelte.dev/)
    * [Official Template](https://github.com/sveltejs/template)
* [Electron](https://electronjs.org/)
* [Jimp](https://github.com/oliver-moran/jimp)
* [Node.js](https://nodejs.org/) v16.4.2

For other modules used, please refer to the [Dependency graph](https://github.com/Raffy27/MagnetRender/network/dependencies).

This project does **not** have any native dependencies, because I wasted a whole day of my life trying to get what I assumed would be a more convenient way of handling images to work, but it turns out that the only thing *node-canvas* is good for is generating [a](https://github.com/Automattic/node-canvas/issues/1855) [myriad](https://github.com/Automattic/node-canvas/issues/1868) [of](https://github.com/nodejs/nan/issues/922) [cryptic](https://github.com/Automattic/node-canvas/issues/1589) [error](https://github.com/nodejs/nan/issues/892) [messages](https://github.com/Automattic/node-canvas/issues/1901). Why is this a thing?

### Setting up Dev
