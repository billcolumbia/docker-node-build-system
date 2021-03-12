module.exports = {
  paths: {
    dist: 'dist',
    js: {
      modules: ['src/js/modules/*.js'],
      watch: ['src/js/**/*.js'],
      dist: 'dist/js'
    },
    css: {
      modules: ['src/css/modules/*.pcss'],
      watch: ['src/css/**/*.pcss'],
      dist: 'dist/css',
      purge: [
        './static/**/*.{html}',
        './src/js/**/*.js'
      ]
    },
    images: {
      src: 'src/images',
      dist: 'dist/images'
    }
  },
  sizeCheck: {
    options: [
      {
        pattern: 'dist/**/*.js',
        limit: 20
      },
      {
        pattern: 'dist/**/*.css',
        limit: 15
      }
    ]
  }  
}
