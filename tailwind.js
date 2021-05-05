/**
 * Originally this config object was in build-css.js
 * It was moved to its own file so that the tailwind
 * intellisense would work.
 *
 * @url https://github.com/tailwindlabs/tailwindcss-intellisense
 */
module.exports = {
  mode: 'jit',
  purge: ['./static/**/*.{html,twig}', './src/js/**/*.{js,svelte}'],
  darkMode: false,
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
}
