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
 *
 */

'use strict';

// ext. libs
var Q = require('q');

/**
 * Execute related methods
 *
 * @module Driver
 * @class Execute
 * @namespace Dalek.DriverNative.Commands
 */

var Execute = {

  /**
   * Executes a JavaScript function 
   *
   * @method execute
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  execute: function (script, args, hash) {
    this.actionQueue.push(this.webdriverClient.execute.bind(this.webdriverClient, {script: script.toString(), arguments: args}));
    this.actionQueue.push(this._setExecuteCb.bind(this, script.toString(), args, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `execute` call
   *
   * @method _setExecuteCb
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {string} hash Unique hash of that fn call
   * @param {string} result Serialized JSON with the results of the call
   * @return {object} promise Exists promise
   * @private
   */

  _setExecuteCb: function (script, args, hash, data) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'execute', value: JSON.parse(data).value, uuid: hash, hash: hash});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Executes an asynchronous JavaScript function
   *
   * @method executeAsync
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  executeAsync: function (script, args, hash) {
    this.actionQueue.push(this.webdriverClient.executeAsync.bind(this.webdriverClient, {script: script.toString(), arguments: args}));
    this.actionQueue.push(this._setExecuteAsyncCb.bind(this, script.toString(), args, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `executeAsync` call
   *
   * @method _setExecuteAsyncCb
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {string} hash Unique hash of that fn call
   * @param {string} data Serialized JSON with the results of the call
   * @return {object} promise Exists promise
   * @private
   */

  _setExecuteAsyncCb: function (script, args, hash, data) {

    var deferred = Q.defer();
    var dataObj = JSON.parse(data);

    if (dataObj.status === 0) {
      this.events.emit('driver:message', {key: 'executeAsync', value: dataObj.value, uuid: hash, hash: hash});
      deferred.resolve();
    }
    else {
      // if there was an error (status != 0), extract the error message
      this.events.emit('driver:message', {key: 'executeAsync', errorMessage: dataObj.value.message, uuid: hash, hash: hash});
      deferred.resolve();
    }

    return deferred.promise;
  },

  /**
   * Sets the timeout for asynchronous function execution
   *
   * @method asyncScriptTimeout
   * @param {number} timeout The timeout, in ms
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  asyncScriptTimeout: function (timeout, hash) {
    this.actionQueue.push(this.webdriverClient.asyncScript.bind(this.webdriverClient, timeout));
    this.actionQueue.push(this._setAsyncScriptTimeoutCb.bind(this, timeout, hash));
    return this;
  },

  /**
   * Sends out an event indicating that the asyncScriptTimeout call is done
   *
   * @method _setAsyncScriptTimeoutCb
   * @param {number} timeout The timeout, in ms
   * @param {string} hash Unique hash of that fn call
   * @return {object} promise Exists promise
   * @private
   */

  _setAsyncScriptTimeoutCb: function (timeout, hash) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'asyncScriptTimeout', value: '', uuid: hash, hash: hash});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Executes a JavaScript function until the timeout rans out or
   * the function returns true
   *
   * @method execute
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {integer} timeout Timeout of the function
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  waitFor: function (script, args, timeout, hash) {
    this.actionQueue.push(this.webdriverClient.execute.bind(this.webdriverClient, {script: script.toString(), arguments: args}));
    this.actionQueue.push(this._waitForCb.bind(this, script.toString(), args, timeout, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `waitFor` call
   *
   * @method _setExecuteCb
   * @param {function} script Script to execute
   * @param {array} args Arguments to pass to the function
   * @param {integer} timeout Timeout of the function
   * @param {string} hash Unique hash of that fn call
   * @param {string} data Serialized JSON with the reuslts of the toFrame call
   * @return {object} Promise
   * @private
   */

  _waitForCb: function (script, args, timeout, hash, data) {
    var deferred = Q.defer();
    var ret = JSON.parse(data);
    var timeoutId;
    var clearWaitForTimeout = function() {
      if(timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    var checker = function (yData) {
      if (JSON.parse(yData).value.userRet === true) {
        this.events.emit('driver:message', {key: 'waitFor', value: '', uuid: hash, hash: hash});
        clearWaitForTimeout();
        deferred.resolve();
      } else {
        Q.when(this.webdriverClient.execute.bind(this.webdriverClient, {script: script, arguments: args})())
          .then(checker);
      }
    }.bind(this);

    timeoutId = setTimeout(function () {
      this.events.emit('driver:message', {key: 'waitFor', value: 'Interrupted by timeout', uuid: hash, hash: hash});
      clearWaitForTimeout();
      deferred.resolve();
    }.bind(this), timeout);

    if (ret.value.userRet === true) {
      this.events.emit('driver:message', {key: 'waitFor', value: '', uuid: hash, hash: hash});
      clearWaitForTimeout();
      deferred.resolve();
    } else {
      Q.when(this.webdriverClient.execute.bind(this.webdriverClient, {script: script, arguments: args})())
        .then(checker);
    }

    return deferred.promise;
  },

  /**
   * Executes a local JavaScript function. Named thenLocal to not clobber then.
   *
   * @method execute
   * @param {array} func Function to call
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  thenLocal: function (func, hash) {
    var deferred = Q.defer();
    this.actionQueue.push(this._setThenLocalCb.bind(this, func, hash));
    return this;
  },

  _setThenLocalCb: function (func, hash) {
    var deferred = Q.defer();

    func(function() {
      deferred.resolve();
    })

    return deferred.promise;
  },

};

/**
 * Mixes in the script execute methods
 *
 * @param {Dalek.DriverNative} DalekNative Native driver base class
 * @return {Dalek.DriverNative} DalekNative Native driver base class
 */

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(Execute).forEach(function (fn) {
    DalekNative.prototype[fn] = Execute[fn];
  });

  return DalekNative;
};
