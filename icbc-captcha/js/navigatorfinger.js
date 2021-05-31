/*! author: qihailong*/

;(function() {

// (function (name, context, definition) {
//   'use strict'
//   if (typeof window.define === 'function' && window.define.amd) {
//     window.define(definition)
//   } else if (typeof module !== 'undefined' && module.exports) {
//     module.exports = definition()
//   } else if (context.exports) {
//     context.exports = definition()
//   } else {
//     context[name] = definition()
//   }
// })('NavigatorFinger', this, function () {
  'use strict'
  var navigatorFinger = {
    options: {}
  };
  // function (options) {
  //   if (!(this instanceof NavigatorFinger)) {
  //     return new NavigatorFinger(options)
  //   }
  //   var defaultOptions = {
  //     swfContainerId: 'NavigatorFinger',
  //     detectScreenOrientation: true,
  //     sortPluginsFor: [/palemoon/i]
  //   }
  //   this.options = this.extend(options, defaultOptions)
  // }
  navigatorFinger.extend = function (source, target) {
    if (source == null) { return target }
    for (var k in source) {
      if (source[k] != null && target[k] !== source[k]) {
        target[k] = source[k]
      }
    }
    return target
  };
  navigatorFinger.get = function () {
    var that = this;
    var keys = {
      data: {},
      add: function (pair) {
        var componentValue = pair.value
        // if (typeof that.options.preprocessor === 'function') {
        //   componentValue = that.options.preprocessor(pair.key, componentValue)
        // }
        // this.data.push({key: pair.key, value: componentValue})
        this.data[pair.key] =  componentValue
      }
    }
    
    if (!this.options.excludeUserAgent) {//userAgentKey
      keys.add({key: 'user_agent', value: this.getUserAgent()})
    }
    if (!this.options.excludeLanguage) {//languageKey
      keys.add({ key: 'language', value: navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || '' })
    }
    if (!this.options.excludeTimezoneOffset) {//timezoneOffsetKey
      keys.add({key: 'timezone_offset', value: new Date().getTimezoneOffset()})
    }
    keys = this.addBehaviorKey(keys)
    if (!this.options.excludeCpuClass) {//cpuClassKey
      keys.add({key: 'cpu_class', value: this.getNavigatorCpuClass()})
    }
    if (!this.options.excludePlatform) {//platformKey
      keys.add({key: 'navigator_platform', value: this.getNavigatorPlatform()})
    }
    if (!this.options.excludeDoNotTrack) {//doNotTrackKey
      keys.add({key: 'do_not_track', value: this.getDoNotTrack()})
    }
    if (!this.options.excludePlugins) {//pluginsKey
      if (!this.options.excludeIEPlugins) {
        // if (this.isIE()) {
        //   keys.add({key: 'plugins', value: this.getIEPlugins()})
        // } else {
          keys.add({key: 'plugins', value: this.getRegularPlugins()})
        // }
      }
    }

    that.each(keys.data, function (value, key, list) {
      if (typeof value.join !== 'undefined') {
        list[key] = value.join(';')
      }
    })

    return keys.data
  };
  navigatorFinger.getUserAgent = function () {
    return navigator.userAgent
  }
  navigatorFinger.addBehaviorKey = function (keys) {
    if (document.body && !this.options.excludeAddBehavior && document.body.addBehavior) {
      keys.add({key: 'add_behavior', value: 1})
    } else {
      keys.add({key: 'add_behavior', value: 0})
    }
    return keys
  }
  navigatorFinger.getRegularPlugins = function () {
    var plugins = []
    for (var i = 0, l = navigator.plugins.length; i < l; i++) {
      plugins.push(navigator.plugins[i])
    }
    if (this.pluginsShouldBeSorted()) {
      plugins = plugins.sort(function (a, b) {
        if (a.name > b.name) { return 1 }
        if (a.name < b.name) { return -1 }
        return 0
      })
    }
    return this.map(plugins, function (p) {
      var mimeTypes = this.map(p, function (mt) {
        return [mt.type, mt.suffixes].join('~')
      }).join(',')
      return [p.name, p.description, mimeTypes].join('::')
    }, this)
  }
  navigatorFinger.getIEPlugins = function () {
    var result = []
    if ((Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(window, 'ActiveXObject')) || ('ActiveXObject' in window)) {
      var names = [
        'AcroPDF.PDF', // Adobe PDF reader 7+
        'Adodb.Stream',
        'AgControl.AgControl', // Silverlight
        'DevalVRXCtrl.DevalVRXCtrl.1',
        'MacromediaFlashPaper.MacromediaFlashPaper',
        'Msxml2.DOMDocument',
        'Msxml2.XMLHTTP',
        'PDF.PdfCtrl', // Adobe PDF reader 6 and earlier, brrr
        'QuickTime.QuickTime', // QuickTime
        'QuickTimeCheckObject.QuickTimeCheck.1',
        'RealPlayer',
        'RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)',
        'RealVideo.RealVideo(tm) ActiveX Control (32-bit)',
        'Scripting.Dictionary',
        'SWCtl.SWCtl', // ShockWave player
        'Shell.UIHelper',
        'ShockwaveFlash.ShockwaveFlash', // flash plugin
        'Skype.Detection',
        'TDCCtl.TDCCtl',
        'WMPlayer.OCX', // Windows media player
        'rmocx.RealPlayer G2 Control',
        'rmocx.RealPlayer G2 Control.1'
      ]
      // starting to detect plugins in IE
      result = this.map(names, function (name) {
        try {
          // eslint-disable-next-line no-new
          new window.ActiveXObject(name)
          return name
        } catch (e) {
          return null
        }
      })
    }
    if (navigator.plugins) {
      result = result.concat(this.getRegularPlugins())
    }
    return result
  }
  navigatorFinger.pluginsShouldBeSorted = function () {
    var should = false
    // for (var i = 0, l = this.options.sortPluginsFor.length; i < l; i++) {
    //   var re = this.options.sortPluginsFor[i]
    //   if (navigator.userAgent.match(re)) {
    //     should = true
    //     break
    //   }
    // }
    return should
  }
  navigatorFinger.getNavigatorCpuClass = function () {
    if (navigator.cpuClass) {
      return navigator.cpuClass
    } else {
      return 'unknown'
    }
  }
  navigatorFinger.getNavigatorPlatform = function () {
    if (navigator.platform) {
      return navigator.platform
    } else {
      return 'unknown'
    }
  }
  navigatorFinger.getDoNotTrack = function () {
    if (navigator.doNotTrack) {
      return navigator.doNotTrack
    } else if (navigator.msDoNotTrack) {
      return navigator.msDoNotTrack
    } else if (window.doNotTrack) {
      return window.doNotTrack
    } else {
      return 'unknown'
    }
  }
  navigatorFinger.isIE = function () {
    if (navigator.appName === 'Microsoft Internet Explorer') {
      return true
    } else if (navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)) { // IE 11
      return true
    }
    return false
  }
  navigatorFinger.each = function (obj, iterator, context) {
    if (obj === null) {
      return
    }
    if (this.nativeForEach && obj.forEach === this.nativeForEach) {
      obj.forEach(iterator, context)
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === {}) { return }
      }
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (iterator.call(context, obj[key], key, obj) === {}) { return }
        }
      }
    }
  }
  navigatorFinger.map = function (obj, iterator, context) {
    var results = []
    if (obj == null) { return results }
    if (this.nativeMap && obj.map === this.nativeMap) { return obj.map(iterator, context) }
    this.each(obj, function (value, index, list) {
      results[results.length] = iterator.call(context, value, index, list)
    })
    return results
  }
//   }
//   return navigatorFinger
// })

  if(typeof exports == "object") {
    module.exports = navigatorFinger
  } else if(typeof define == "function" && define.amd) {
    define([], function() {
      return navigatorFinger
    })
  } else if(window) {
    window.navigatorFinger = navigatorFinger
  }
})(jQuery, window, document);