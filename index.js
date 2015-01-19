#!/usr/bin/env node

'use strict';

var fs         = require('fs')
  , browserify = require('browserify')
  , to5ify    = require('6to5ify')
  , uglifyify  = require('uglifyify')
  , program    = require('commander')
  , brfs       = require('brfs')
  , watchify   = require('watchify')
  , chalk      = require('chalk')
  , exec       = require('child_process').exec
  , version    = require('./package.json').version
  , path       = require('path')
  , util       = require('util')

var node_modules = path.join(__dirname, 'node_modules', '.bin')

var messages = {
  bundleBuilt: 'bundle file built successfully',
  bundleRebuilt: 'files changed, bundle file rebuilt',
  poweredByHeader: 'Build browserify tool',
  requestReceivedFor: 'Request received for ',
  contentType: 'text/plain',
  error404: 'Error 404: File not found',
  serverListening: 'server listening on port ',
  buildFailed: 'bundle file could not be built'
}

function logNotice(message) {
  console.log(chalk.cyan(message))
}

function logSuccess(message) {
  console.log(chalk.green(message))
}

function server(webroot, port) {
  var StaticServer = require('static-server')

  var server = new StaticServer({
    rootPath: webroot,
    name: 'buildbro-server',
    port: port
  })

  return {
    start: function () {
      server.start(function () {
        console.log('Server listening on port ', server.port);
      })
      server.on('request', function (req, res) {
        console.log(req)
      })
    }
  }
}

function handleBundling(bundler, dest, message) {
  bundler.bundle()
    .on('error', function (err) {
      console.error(chalk.red(messages.buildFailed))
      console.error(err.message)
      console.error(err.stack)
    })
    .pipe(fs.createWriteStream(dest))
    .on('finish', function () {
      logSuccess(message)
    })
}

function jshint(terminateOnFail) {
  var hinter = path.join(node_modules, 'jshint')
  var child = exec(util.format('%s %s/.', hinter, process.cwd()))
  child.stdout.on('data', function (data) {
    console.error(chalk.red.bold('JSHINT ERRORS:'))
    process.stdout.write(chalk.red(data))
    if (terminateOnFail) process.exit(1)
  })
}

function run(source, dest) {
  source = process.cwd() + '/' + source
  dest   = process.cwd() + '/' + dest

  var httpServer

  if (program.jshint) jshint(true)

  var bundler = browserify({
    debug: !!program.debug,
    cache: {},
    packageCache: {},
    fullPaths: !!program.fullpaths
  })

  if (program.es6) bundler = bundler.transform(to5ify)

  if (program.brfs) bundler = bundler.transform(brfs)

  if (program.minifyglobal || program.minify) {
    var minificationOptions = {
      sourcemap: false,
      global: !!program.minifyglobal
    }

    bundler = bundler.transform(minificationOptions, uglifyify)
  }

  bundler
    .require(require.resolve(source), { entry: true })

  if (program.watch) {
    bundler = watchify(bundler)
      .on('update', function () {
        if (program.jshint) jshint()
        handleBundling(bundler, dest, messages.bundleRebuilt)
      })
  }

  handleBundling(bundler, dest, messages.bundleBuilt)

  if (program.serve) {
    var webroot = process.cwd() + '/' + program.serve
    var port = program.port || 8080
    httpServer = server(webroot, port)
    httpServer.start()
  }
}

process.on('uncaughtException', function(err) {
  console.error(chalk.red('Unexpected exception:'))
  if (err.message) {
    console.error(chalk.red(err.message))
  }
  if (err.stack) {
    console.error(err.stack)
  }
});

program
  .version(version)
  .option('-e, --es6', 'Transform es6 code to es5 using 6to5')
  .option('-d, --debug', 'Include source files')
  .option('-f, --fullpaths', 'Expand Browserify ids to full paths')
  .option('-m, --minify', 'Minify the resulting bundle')
  .option('-mg --minifyglobal', 'Minify and include all node_modules when minifying - may cause hard to trace errors')
  .option('-b, --brfs', 'Use brfs transform')
  .option('-j, --jshint', 'Run jshint before every build')
  .option('-w, --watch', 'Watch files for changes and update bundle')
  .option('-s, --serve [folder]', 'Serve up files in the given directory')
  .option('-p, --port [port]', 'Set which port should be used when using the -s, --serve option')

program
  .command('*')
  .action(run)

program
  .parse(process.argv)
