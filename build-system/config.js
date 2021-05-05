module.exports = {
  paths: {
    dist: 'static/dist',
    js: {
      modules: ['src/js/modules/*.js'],
      watch: ['src/js/**/*.js'],
      dist: 'static/dist/js'
    },
    css: {
      modules: ['src/css/modules/*.css'],
      watch: ['src/css/**/*.css', './static/*.{html,twig}'],
      dist: 'static/dist/css',
      purge: ['./static/**/*.{html,twig}', './src/js/**/*.js']
    },
    images: {
      src: 'src/images',
      dist: 'static/dist/images'
    }
  },
  sizeCheck: {
    options: [
      {
        pattern: 'static/dist/**/*.js',
        limit: 20
      },
      {
        pattern: 'static/dist/**/*.css',
        limit: 15
      }
    ]
  }
}
