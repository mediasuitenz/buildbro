BUILD IT BRO!!
==============

[![NPM](https://nodei.co/npm/buildbro.png?downloads=true&stars=true)](https://nodei.co/npm/buildbro/)

[![Media Suite](http://mediasuite.co.nz/ms-badge.png)](http://mediasuite.co.nz)

An easy commandline tool to configure, build, and serve Browserify projects

`buildbro --help` for usage information

Options:
```
-h, --help            output usage information
-V, --version         output the version number
-e, --es6             Transform es6 code to es5 using traceur
-d, --debug           Include source files
-m, --minify          Minify the resulting bundle
-b, --brfs            Use brfs transform
-j, --jshint          Run jshint before every build
-w, --watch           Watch files for changes and update bundle
-s, --serve [folder]  Serve up files in the given directory
-p, --port [port]     Set which port should be used when using the -s, --serve option
```

Example:
```
buildbro --es6 --brfs --jshint --watch --serve dist --port 3000 ./index.js ./dist/bundle-min.js
```
