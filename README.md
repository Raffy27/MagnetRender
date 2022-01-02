<img src="/public/favicon.png" alt="MagnetRender" width="96" align="right">

# MagnetRender

> A responsive application for creating dynamic vector images of magnets

This project is an Electron application built on top of Svelte. It provides a simple and intuitive interface for creating dynamic vector images of magnets. These vectors come from prebuilt templates and feautre adaptive dimension legends. Input dimensions are scaled to fit the screen and the resulting images can be exported as SVG, PNG, or JPEG.

It is also possible to save and load presets (this includes, dimensions, colors, perspective, etc.) thereby exporting (or reading) the current state as a JSON file.

:warning: This is a **utility application**, and as such it does not honor the best practices regarding security.

![Screenshot](/public/screen.png)

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
* [Svelte](https://svelte.dev/) v3.44.3
    * [Official Template](https://github.com/sveltejs/template)
* [Electron](https://electronjs.org/) v15.3.4
* [Jimp](https://github.com/oliver-moran/jimp) v0.16.1
* [Tailwind CSS](https://tailwindcss.com/) v2.2.17
* [Node.js](https://nodejs.org/) v16.4.2

For other modules used, please refer to the [Dependency graph](https://github.com/Raffy27/MagnetRender/network/dependencies).

This project does **not** have any native dependencies, because I wasted a whole day of my life trying to get what I assumed would be a more convenient way of handling images to work, but it turns out that the only thing node-canvas is good for is generating [a](https://github.com/Automattic/node-canvas/issues/1855) [myriad](https://github.com/Automattic/node-canvas/issues/1868) [of](https://github.com/nodejs/nan/issues/922) [cryptic](https://github.com/Automattic/node-canvas/issues/1589) [error](https://github.com/nodejs/nan/issues/892) [messages](https://github.com/Automattic/node-canvas/issues/1901). Why is this a thing?

### Setting up Dev

Use an IDE of your choice to test and tinker with MagnetRender. Make sure it has internal support for JavaScript and JSX. Visual Studio Code is recommended.

You will also need Node.js and a package manager, such as npm.

Most parameters can be modified on the fly, and the application will update the preview accordingly. For constants and strings, see the appropriate files (check `InputForm.svelte` for ranges and individual schemas for previews).

Live reloading is enabled by default.

## Releases

For active releases and pre-compiled binaries, see [Releases](https://github.com/Raffy27/MagnetRender/releases).

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](/LICENSE) file for more information.