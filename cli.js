/*!
 *
 * Copyright (c) 2013 Sebastian Golasch
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

'use strict';

// ext. libs
var spawn = require('child_process').spawn;
var optimist = require('optimist');
var path = require('path');

/**
 * Dalek Command Line Tools
 *
 * The command line interface is your interface to the world of DalekJS.
 * This is the way to run your tests.
 * There might be a web interface to Dalek in the future, but as long as there is not, you have to deal with this;
 * But hey, this isn't difficult & I know you can do it! *
 * Available options:
 *
 * > --version, -v   Shows the version of the dalek-cli & local dalek installation
 *
 * > --reporter, -r  Reporter(s) you would like to invoke
 *
 * > --driver, -d    Driver(s) you would like to invoke
 *
 * > --browser, -b   Browser(s) you would like to invoke
 *
 * > --viewport      Viewport dimensions you would like to invoke
 *
 * > --remote Starts a dalek host server for clients to connect to
 *
 * > --logLevel, -l  Log level, controls the amount of information outputted to the console (0 to 5)
 *
 * > --nocolors     Disable colorized output in the console
 *
 * > --nosymbols    Disable UTF-8 symbols in the console
 *
 * > --help, -h      Displays the cli help
 *
 * @part CLI
 * @api
 */

module.exports = function () {

  var loadDalek = function (dalekPath) {
    var argv = optimist
      .usage('Usage: dalek [test files] {OPTIONS}')
      .wrap(80)
      .option('version', {
        alias: 'v',
        desc : 'Shows the version of the dalek-cli & local dalek installation'
      })
      .option('reporter', {
        alias: 'r',
        type : 'string',
        desc : 'Reporter(s) you would like to invoke'
      })
      .option('driver', {
        alias: 'd',
        type : 'string',
        desc : 'Driver(s) you would like to invoke'
      })
      .option('browser', {
        alias: 'b',
        type : 'string',
        desc : 'Browser(s) you would like to invoke'
      })
      .option('viewport', {
        type: 'integer',
        desc: 'Viewport dimensions you would like to invoke'
      })
      .option('baseUrl', {
        alias: 'u',
        type : 'string',
        desc : 'Base URL to append all .open()\'s with if relative path is given'
      })
      .option('logLevel', {
        alias: 'l',
        type : 'string',
        desc : 'Log level, controls the amount of information outputted to the console (0 to 5)'
      })
      .option('remote', {
        type: 'integer',
        desc: 'Starts a dalek host server for clients to connect to'
      })
      .option('nocolors', {
        type : 'boolean',
        desc : 'Disable colorized output in the console'
      })
      .option('nosymbols', {
        type : 'boolean',
        desc : 'Disable UTF-8 symbols in the console'
      })
      .option('help', {
        alias : 'h',
        desc : 'Show this message'
      })
      .check(function (argv) {
        // output some version info
        if (argv.version) {
          // load the versions
          var fs = require('fs');
          console.log('DalekJS CLI Tools Tardis Edition');
          console.log('');
          throw '';
        }

        // show help
        if (argv.help) {
          throw '';
        }
      })
      .argv;

    // building viewport option
    var viewportDimensions, viewportWidth, viewportHeight, viewportOption;
    if( argv.viewport ) {
      viewportDimensions = argv.viewport.split(',');
      viewportWidth = +viewportDimensions[0];
      viewportHeight = +viewportDimensions[1];
      viewportOption = ( isNaN( viewportWidth ) || isNaN( viewportHeight ) ) ? {} : { width: viewportWidth, height: viewportHeight };
    }

    // run dalekjs
    var Dalek = require(dalekPath);
    var dalek = new Dalek({
      tests: argv._,
      driver: argv.driver ? argv.driver.split(',') : [],
      reporter: argv.reporter ? argv.reporter.split(',') : [],
      browser: argv.browser ? argv.browser.split(',') : [],
      viewport: argv.viewport ? viewportOption : {},
      logLevel: argv.logLevel,
      baseUrl: argv.baseUrl,
      noColors: argv.nocolors,
      noSymbols: argv.nosymbols,
      remote: argv.remote
    });

    dalek.run();

  };

  var dalekpath = './lib/tardis.js';
  loadDalek(dalekpath);
};
