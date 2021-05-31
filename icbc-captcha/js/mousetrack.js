
/*! author: qihailong*/

;(function() {
	"use strict";

	var mouseTrack = {
	}

	var runTimer = false;//定时器是否开启
	var timer = null;
	var moveflag = false;//是否采集鼠标轨迹
	var trackList = new Array();
	var opts = {
		interval: 30,
		totaltime: 5000
	}

	mouseTrack.setOptions = function(options) {
		for(var k in options) {
			if(options.hasOwnProperty(k)) {
				opts[k] = options[k];
			}
		}
	}

	mouseTrack.insertJsonMove = function(e) {
		if (!moveflag) return;

		var len = trackList.length;
		var tmp = new Date().getTime();
		e = e || window.event;
		if (len > 0 && (e.type == 'mousemove' || e.type == 'touchmove')) {
			if (tmp - trackList[len - 1].timeStamp < opts.interval && len > 30) {
				return;
			}
		}
		var x = 0;
		var y = 0;
		if (e.touches && e.touches.length > 0) {
			x = e.touches[0].clientX;
			y = e.touches[0].clientY;
		} else if (e.clientX && e.clientY) {
			x = e.clientX;
			y = e.clientY;
		} else {
			return;
		}
		
		var jsonStr = {};
		jsonStr.x = parseInt(x);//e.x;
		jsonStr.y = parseInt(y);//e.y;
		jsonStr.type = e.type;
		//jsonStr.timeStamp = e.timeStamp;
		jsonStr.timeStamp = tmp;
		
		trackList.push(jsonStr);
	}

	mouseTrack.startTimer = function ()
	{
		if (runTimer) {
			return;
		} else {
			runTimer = true;
			var _this = this;
			timer = setTimeout(function(){
				runTimer = false;
				if (trackList.length < 40) {
					_this.startTimer();
				} else {
					moveflag = false;
				}
			}, opts.totaltime);
		}
	}
	mouseTrack.clearTimer = function ()
	{
		clearTimeout(timer);
		runTimer = false;
		// timer = 0;
	}

	mouseTrack.mousemoveResponse = function (e)
	{
		if (!runTimer) {
			this.startTimer();
		}
		this.insertJsonMove(e);
	}
	mouseTrack.mousedownResponse = function (e)
	{
		this.insertJsonMove(e);
	}
	mouseTrack.mouseupResponse = function (e)
	{
		this.insertJsonMove(e);
	}
	mouseTrack.mouseTrackInfo = function () {
		moveflag = false;
		return trackList;
	}

	mouseTrack.clearTrackInfo = function () {
		trackList = [];
		moveflag = true;
		this.clearTimer();
	}

	mouseTrack.initMouseTrack = function (divID)//不可以多次调用 否则会有多个相同的handler加到一个事件上
	{
		var panel = document.getElementById(divID);
		moveflag = true;
		
		if (!panel) {
			console.error('参数不正确，没有找到需要捕捉鼠标信息的DIV区域')
			return;
		}
		var _this = this;
		function mousemoveResponse(e) {
			_this.mousemoveResponse(e);
		}
		function mousedownResponse(e) {
			_this.mousedownResponse(e);
		}
		function mouseupResponse(e) {
			_this.mouseupResponse(e);
		}
		
		if (panel.addEventListener) {
			panel.addEventListener('mousemove', mousemoveResponse);
			panel.addEventListener('mousedown', mousedownResponse);
			panel.addEventListener('mouseup', mouseupResponse);
			panel.addEventListener('touchmove', mousemoveResponse);
			panel.addEventListener('touchstart', mousedownResponse);
			panel.addEventListener('touchend', mouseupResponse);
		} else if (panel.attachEvent) {
			panel.attachEvent('onmousemove', mousemoveResponse);
			panel.attachEvent('onmousedown', mousedownResponse);
			panel.attachEvent('onmouseup', mouseupResponse);
			panel.attachEvent('ontouchmove', mousemoveResponse);
			panel.attachEvent('ontouchstart', mousedownResponse);
			panel.attachEvent('ontouchend', mouseupResponse);
		}
	}

	if(typeof exports == "object") {
		module.exports = mouseTrack;
	} else if(typeof define == "function" && define.amd) {
		define([], function() {
			return mouseTrack;
		})
	} else if(window) {
		window.mouseTrack = mouseTrack;
	}
})()

