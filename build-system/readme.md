# Build System

This is a front-end build system that handles processing of Images, CSS, and JavaScript. The goal of this project was to keep the system as lean and as close to core dependencies as possible.

## Problem/Why?

Projects like WordPress and CakePHP do not provide any modern front-end tooling. So in some cases we need to add at least _something_, because there is nothing out of the box.

Some projects like Laravel or Vue come with some front-end tooling &mdash; see [mix](https://laravel-mix.com/) and [vite](https://github.com/vitejs/vite). These tools are great if you are building your app with modest constraints, modest performance goals, an ability to adopt most conventions of the ecosystem.

We have the occasional frankenstein's monster of enterprise constraints, want absolute speed, we usually can't adopt most conventions of an entire ecosystem. We had [some troubles with this](https://github.com/vuejs-templates/webpack/issues/78) on the Directory project.

### Why not Gulp or Webpack?

Gulp and Webpack require plugins or 'loaders' to add all functionality we need. Most of these are not supported by the core teams and can become stale more quickly that our projects lifetime.

By using these third party plugins and loaders we usually end up incurring a performance hit as well.

Upgrading these cobbled together systems can be a pain and migrating them can be even worse. We've done that a few times now with projects like Bridge and Apollo.

## Our real needs

Instead of plugging into larger projects we realized a few simple truths.

### JavaScript
- We need JS to be minimally processed. We don't do fancy automated splitting or imports, no CSS-in-JS, our non-app sites don't need hot module injection, etc.
- We need JavaScript to be made usuable for older browsers and compressed.
- A good old fashioned reload on file change would be fine.

### CSS
- We don't need our JavaScript bundler to handle our CSS.
- We are writing CSS closer and closer to what browsers ship with these days so why is working with it getting more complicated? We need to have a few CSS manifest files that include smaller chunks of CSS.
- Those output (manifest) files should be polyfilled for older browsers and compressed.
- Ideally file changes trigger re-processing and injection.

### Images
- We don't need fancy SVG tools. Figma exports SVGs very clean and with minor need for tweaks that only occur at initial export.
- It's really easy to paste new SVGs into a folder once.
- All image types (png, jpg, gif, svg) can be compressed with imagemin.

### Misc
- Reload/injection behavior for when files change.
- Logger that tells us what is going on.
- Reporter for our compiled file sizes.
- Manifest of all our assets with a hash based on their file contents.
- Linters to make sure we keep the code tidy for each other.

## Solution

### Core APIs
When we use things like Mix or Webpack they are are still referecing core tooling like Babel, Chokidar, PostCSS, etc. If you look at the API's for each of these lower level core tools it's usually pretty good.

So the main idea here is we can use these APIs ourselves without writing too much code. Including comments *AND* build scripts in `package.json` this project is about 400 lines. If you were reading the equivilent length in text that's only about 15 minutes of reading for every single line of this project!

### Low overhead
A side-effect of using these core APIs is we now have no overhead from third party code. We are interacting directly with the tool for it's core functionality.

### Freedom
We have the freedom to control the entire input -> output of our system.

## What does this look like?

At the time of writing here are all the core feature as npm scripts:
```json
{
  "css:build": "node ./build-system/build-css.js",
  "css:lint": "stylelint 'src/css/**/*.pcss'",
  "js:build": "node ./build-system/build-js.js",
  "js:lint": "standard 'src/js/**/*.js' --verbose | snazzy",
  "payloads": "node ./build-system/size-check.js",
  "images:compress": "node ./build-system/optimize-images.js",
  "manifest": "node ./build-system/create-manifest.js",
  "reload": "anubis -f 'dist/**/*.{js,css}' -f 'cms/{modules,templates}/**/*.twig' -t 'http://nginx:80' -o false",
  "dev": "NODE_ENV=development npm-run-all images:compress --parallel css:build js:build reload",
  "build": "NODE_ENV=production run-s images:compress js:build css:build manifest js:lint css:lint payloads"
}
```

In total there are 8 scripts and 2 super-scripts. Super-scripts is fancy speak for scripts that are actually made up of the other 8 scripts that run sequentially (build) or concurrently (dev). Each piece is mostly responsible for and empowered to do what it does best and nothing more.

## Ok but...

**Q:** Now we have to maintain code that interacts with things like Chokidar, node fs, glob, chalk, etc. What happens when these break or change suddenly. That's not great either, right?

**A:** These libraries are s.o.l.i.d. Chokidar for instance has over 30 million weekly downloads. If it breaks, the whole internet is going to freak out. In short: we will have company.






