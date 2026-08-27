module.exports = {
  content: [
    './views/**/*.ejs',
    './public/**/*.js'
  ],
  css: [
    './public/css/main.css'
  ],
  output: './public/optimized',

  safelist: [
    'active',
    'hidden'
  ]
};