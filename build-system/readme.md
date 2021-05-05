# Readme

## About

A build system that cuts through layers of abstraction to directly use the APIs of the tools we like.

## Usage
- `nvm use`
- `npm install`
- new term tab: `cd static && php -S 0.0.0.0:8080`
- `npm run dev`

## Docs

We will break down each piece of the system and highlight some of the decision making process behind each.

**Sections:**
- [CSS](#css)
- [JavaScript](#javascript)
- [Reload & Injection](reload-injection)
- [Size Check](#size-check)
- [Logger](#logger)
- [Manifest](#manifest)

---

### CSS
```
- src
  - css
    - modules
      - utilities.pcss
      - base.pcss
    - partials
      - browser-quirks.pcss
```
Our CSS will be written as *modules*. Each module will be processed into an output file of the same name in the `dist` directory. Modules can be composed of more than one *partial* by importing them.

This pattern is nice because we can break our CSS up into modules and then only include the modules on pages that need them. 

This approach is not a dogma. Be pragmatic. If 90% of pages use classes from 'base.pcss', it's _most likely ok_ to include everywhere. If 'blog.pcss' is 50kb, _maybe don't_ include it everywhere. Don't over think it.

The npm script calls a file to be executed by node:
```shell
node ./build-system/build-css.js
```

The build-css script uses [PostCSS](https://github.com/postcss/postcss) to process our CSS. PostCSS uses 'plugins' to transform our code.
- [Imports](https://github.com/postcss/postcss-import) let us write CSS that includes other CSS at build time, rahter than run time.
- [Tailwind with JIT](https://tailwindcss.com) helps us maintain industry naming patterns and best practices for utility classes.
- [Polyfills](https://github.com/csstools/postcss-preset-env) and [Autoprefixer](https://github.com/postcss/autoprefixer) make sure our CSS works with older browsers.
- [CSSNano](https://github.com/cssnano/cssnano) compresses our CSS.
- [Chokidar](https://github.com/paulmillr/chokidar) watches our files for changes, so we can re-process them.

### JavaScript

```
- src
  - js
    - modules
      - base.js
      - social-widget.js
      - hello.js
    - utils
      - uuid.js
    - components
      - Hello.svelte
    - polyfills
      - detector.js
```

Much like the CSS, files in side the `js/modules` folder will be output to `dist` by the same name. Smaller pieces of JavaScript can live in any other subfolders under js folder (`js/**`). For example there might be folders for utilities, polyfills, or vendor libraries.

The npm script calls a file to be executed by node:
```shell
node ./build-system/build-js.js
```

We use [esbuild](https://esbuild.github.io/) to bundle are JavaScript files and make sure they run in older browsers.

### Reload & Injection

Reloads and CSS injection are important parts of a fast, frictionless developer experience. We used to use [browser-sync](https://github.com/BrowserSync/browser-sync) for this. It was overkill. It has all sorts of bells and whistles to sync multiple browsers scrolling positions, a node server for a dashboard, etc. We only need our recently saved files updated.

Now we use [Anubis](https://github.com/billcolumbia/anubis). Anubis doesn't try to do a ton of fancy stuff. It focuses on proxying a web back-end like PHP to its tiny node server. The requests that are proxied get a tiny `client.js` script injected on the fly. This client script creates a socket connection between this build system and your browser. When you save a file, the build system fires off an event, and the anubis client on the other side of the socket knows to inject or reload the page.

### Size Check

We can add maximum file size limits for any files we want in our `build-system/config.js`. Size check will take a look at all of those files we've asked it to check and alert us if any are over the maximum we set. This is really valuable for those times you add a library or big chunk of new functionality and don't at first realize you've doubled the payload size!

Size Check uses tooling bundled with node.js, so there are no dependencies to discuss here 😁.

### Logger

This is just a tiny helper object with a few utility methods on it (3 at the time of writing). It makes sure when we log things like an asset being built, a time, or a file change, that we present all of those in a consistent manner.

We are using the widely adopted [chalk](https://www.npmjs.com/package/chalk) library to make our logs pretty and colorful.

### Manifest

When we add more code to our files and rebuild them, their file names don't change. For browsers, this means that they could potentially not realize we've made changes and load a file by the same name from the cache from a previous visit.

To fix this the build system creates a `manifest.json` file. This file is a list of key:value pairs of all our built files and a hash that represents their contents. So if we rebuild a file and it has no changes, that hash does not change. If we change or add some code, it does.

Our backend can read this manifest file and use this hash to add a query string at the end of the request for the file. Now the browser references the file name with a hash of its contents and will know when to re-download changed files!
