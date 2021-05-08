// This config isn't being used at the moment, left for reference
const svelte = require('@sveltejs/vite-plugin-svelte')

export default {
  build: {
    clearScreen: false,
    manifest: false,
    chunkSizeWarningLimit: 50,
    rollupOptions: { input: ['src/js/modules/**/*.js'] }
  },
  plugins: [svelte()]
}
