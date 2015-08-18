# HS Name Game

Hacker Schoolers can use this bookmarklet to launch a simple name / picture matching game from behind the hackerschool.com login wall.  

## How to use 

Just copy the code in `bookmarklet.js` into a bookmark ( or paste the source into your console on [http://recurse.com/private](http://recurse.com/private)) and you're ready to go!

## Development

To automatically generate `bookmarklet.js` whenever main.js is saved:

1. Install [Node.js](https://nodejs.org/)
2. Install npm packages including Grunt and it's supporting packages with `npm install` on cli
3. Run Grunt with `grunt watch`
4. Grunt will automatically regenerate the bookmarklet everytime main.js is saved

Note: Bookmarklet generation is a simple JS minification using the [grunt-contrib-uglify](https://github.com/gruntjs/grunt-contrib-uglify) (into `dist.js`) and [grunt-file-append](https://www.npmjs.com/package/grunt-file-append) (into `bookmarklet.js`) plugins.