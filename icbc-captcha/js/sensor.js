
/*! author: qihailong*/

;(function() {
  'use strict'
  function motionHandler(event) {
    sensor.motionHandler(event);
  }
  function orientationHandler(event) {
    sensor.orientationHandler(event);
  }

  var sensor = {
    options: {
      collecting: false,
      totaltime: 1000,
      totalcount: 20
    },
    motion: {
      orientation: [],
      acceleration: [],
      accelerationIncludingGravity: [],
      rotationRate: []
    },
    start: function () {
      this.options.collecting = true;
      this.motion = {
        orientation: [],//方向/角度
        acceleration: [],//加速度
        accelerationIncludingGravity: [],//重力加速度
        rotationRate: []//旋转速度
      };
      var _this = this;
      setTimeout(function(){
        _this.options.collecting = false;
      }, this.options.totaltime);
    },
    getData: function () {
      return this.motion;
    },
    orientationHandler: function(event) {
      if (!this.options.collecting || this.motion.orientation.length > this.options.totalcount)
        return;
      this.motion.orientation.push({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        webkitCompassHeading: event.webkitCompassHeading,
        webkitCompassAccuracy: event.webkitCompassAccuracy
      });
    },
    motionHandler: function(event) {
      if (!this.options.collecting || this.motion.acceleration.length > this.options.totalcount)
        return;
      // document.getElementById("interval").innerHTML = event.interval;
      var acc = event.acceleration;
      var accGravity = event.accelerationIncludingGravity;
      var rotationRate = event.rotationRate;
      
      this.motion.acceleration.push({
        x: acc.x, y: acc.y, z: acc.z
      })
      this.motion.accelerationIncludingGravity.push({
        x: accGravity.x, y: accGravity.y, z: accGravity.z
      })
      this.motion.rotationRate.push({
        alpha: rotationRate.alpha,
        beta: rotationRate.beta,
        gamma: rotationRate.gamma
      })
    },
    initSensor: function ()//不可以多次调用 否则会有多个相同的handler加到一个事件上
    {
      window.addEventListener("devicemotion", motionHandler, false);
      window.addEventListener("deviceorientation", orientationHandler, false);
    },
    destroySensor: function ()
    {
      this.options.collecting = false;
      window.removeEventListener("devicemotion", motionHandler);
      window.removeEventListener("deviceorientation", orientationHandler);
    }
  }
  
  if(typeof exports == "object") {
    module.exports = sensor
  } else if(typeof define == "function" && define.amd) {
    define([], function() {
      return sensor
    })
  } else if(window) {
    window.sensor = sensor
  }
})(jQuery, window, document);