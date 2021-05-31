
/*! author: qihailong*/

;(function() {
  'use strict'
  // function (options) {
  //   if (!(this instanceof WindowFinger)) {
  //     return new WindowFinger(options)
  //   }

  //   var defaultOptions = {
  //     // swfContainerId: 'NavigatorFinger',
  //     // detectScreenOrientation: true,
  //     // sortPluginsFor: [/palemoon/i]
  //   }
  //   this.options = this.extend(options, defaultOptions)
  // }
  var windowFinger = {
    options: {},
    extend: function (source, target) {
      if (source == null) { return target }
      for (var k in source) {
        if (source[k] != null && target[k] !== source[k]) {
          target[k] = source[k]
        }
      }
      return target
    },
    get: function () {
      var that = this
      var keys = {
        data: {},
        addPreprocessedComponent: function (pair) {
          var componentValue = pair.value
          // if (typeof that.options.preprocessor === 'function') {
          //   componentValue = that.options.preprocessor(pair.key, componentValue)
          // }
          // this.data.push({key: pair.key, value: componentValue})
          this.data[pair.key] =  componentValue
        }
      }

      if (!this.options.excludeColorDepth) {//colorDepthKey
        keys.addPreprocessedComponent({key: 'color_depth', value: this.screenColorDepth()})
      }
      if (!this.options.excludeScreenResolution) {//screenResolutionKey
        keys.addPreprocessedComponent({key: 'resolution', value: this.getScreenResolution()})
      }
      if (!this.options.excludeSessionStorage) {//sessionStorageKey
        keys.addPreprocessedComponent({key: 'session_storage', value: this.hasSessionStorage() ? 1 : 0})
      }
      if (!this.options.excludeSessionStorage) {//localStorageKey
        keys.addPreprocessedComponent({key: 'local_storage', value: this.hasLocalStorage() ? 1 : 0})
      }
      if (!this.options.excludeIndexedDB) {//indexedDbKey
        keys.addPreprocessedComponent({key: 'indexed_db', value: this.hasIndexedDB() ? 1 : 0})
      }
      if (!this.options.excludeOpenDatabase) {//openDatabaseKey
        keys.addPreprocessedComponent({key: 'open_database', value: this.hasOpenDatabase() ? 1 : 0})
      }

      return keys.data
    },
    screenColorDepth: function () {
      try {
        return window.screen.colorDepth
      } catch (e) {
        return -1
      }
    },
    getScreenResolution: function () {
      return [window.screen.width, window.screen.height]
    },
    hasSessionStorage: function () {
      try {
        return !!window.sessionStorage
      } catch (e) {
        return true 
      }
    },
    hasLocalStorage: function () {
      try {
        return !!window.localStorage
      } catch (e) {
        return true // SecurityError when referencing it means it exists
      }
    },
    hasIndexedDB: function () {
      try {
        return !!window.indexedDB
      } catch (e) {
        return true
      }
    },
    hasOpenDatabase: function () {
      try {
        return !!window.openDatabase
      } catch (e) {
        return true
      }
    }
  }
//   return WindowFinger
// })
  if(typeof exports == "object") {
    module.exports = windowFinger
  } else if(typeof define == "function" && define.amd) {
    define([], function() {
      return windowFinger
    })
  } else if(window) {
    window.windowFinger = windowFinger
  }
})(jQuery, window, document);