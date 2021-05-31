/*! author: qihailong*/

;(function() {
	"use strict";
	//定义构造函数
	var SliceCaptcha = function(captchaBoxId, options) {
		this.opts = {
			mode: 'fixed',//弹出式pop，固定fixed
			imageUrl: 'bgimg/demo.jpeg',//背景图片URL 从服务器获取
			sliceImageUrl: 'bgimg/demo.jpeg',//滑块图片URL 从服务器获取(不使用Canvas时)
			imageType: 'stream',//path路径方式，stream流方式
			bgWidth: 300, //验证码背景图片的宽，宽度如果是% 是相对于手机屏幕宽
			bgHeight: 200,//验证码背景图片的高，高度如果是% 是相对于宽度
			barHeight: 24,//滑动条的高度
			dragWidth: 34, //拖拽BTN的宽
			dragHeight: 24,//拖拽BTN的高
			dragBorderR: 12,//拖拽BTN的圆角半径
			dragColor: '#1296db',//拖拽BTN的颜色
			// trackHeight: 24,//拖拽轨道的高
			bgMarginW: 18,//图片边缘留白的宽度
			barBgDistance: 2,//滑动条和验证框的距离
			bgColor: '#e4e4e4',//背景颜色
			message: {
				loading: '加载中...',
				checking: '正在验证 请稍等...',
				tip: '按住滑块，拖动完成拼图',//提示信息
				seccess: '验证成功',
				fail: '位置不正确',
				forbidden: '操作异常',//怪兽吃掉了你的方块
				error: '网络错误'
			},
			clientID: null,//用于加密
			useCanvas: true,//是否使用Canvas
			cw: 60,//裁剪滑块的大小
			ch: 60,
			cRadius: 8,//裁剪滑块 耳朵的半径
			cTransparency: 0.8,//裁剪区域的透明度 0~1，值越大区域越黑
			useMixBlock: true,//是否使用混淆裁剪块
			allowSameRow: false,//是否允许混淆块与裁剪块在同一行
			cMixTransparency: 0.6,//混淆裁剪块的透明度 0~1，值越大区域越黑
			dragClip: true,//是否可以拖拽 裁剪滑块
			posx: 0,//抠图位置 从服务器获取
			posy: 0,
			blockStyle: [-1, 0, 0, 1],//滑块的样式，-1表示内凹 1表示外凸 0或其他表示不画耳朵，传空数组表示随机
			padding: 0,//滑块初始位置 距离左边缘的偏移
			needAgainNum: 2,//用户验证失败几次，需要重新拉取数据
			useDES3: true,//是否使用3DES加密
			useDeviceInfo: true,//是否获取设备信息
			interval: 5,//操作错误时等待的时间 单位s
			requestData: null,//请求初始化数据的函数
			sendData: null,//发送用户滑动数据的函数
			ready: function(){},//验证码准备好了的回调函数
			checkResult: function(res){},//用户验证结果的回调函数
			// success: function(){},//用户验证通过的回调函数
			// fail: function(){},//用户验证失败的回调函数
			eventinfo: {
				flag: false,
				currentX: 0
			}
		}
		this.captchaBoxId = captchaBoxId;
		this.captchaDOM = {
			captchaBox: null
		}
		this.deviceType = 'Windows';
		this.imageObject = null;
		this.userIsCan = true;//用户是否可以操作，比如当加载中等时机 不能操作
		this.errorNum = 0;//验证错误的次数
		this.keys = '';
		this.startTime = new Date().getTime();
		this.requestDataDone = false;//并且requestData()完成或不需要调requestData时 置为true
		this.intervalDone = true;//当opts.interval到期时 置为true

		//对应ie6 ie7浏览器不支持 window.console
		if (!window.console) {
			window.console = {
				log: function(){},
				warn: function(){},
				error: function(){},
				info: function(){}
			};
		}
		
		for(var k in options) {
			if(this.opts.hasOwnProperty(k)) {
				this.opts[k] = options[k];
			}
		}
		this.initData();
	}

	var _CaptchaObj = {
		curBrowser: 'unknown',
		browserVer: 0,
		debug_log: function(log) {
			if (window.console) console.log(log);
		},
		debug_error: function(err) {
			if (window.console) console.error(err);
		},
		debug_warn: function(warn) {
			if (window.console) console.warn(warn);
		},
		checkBrowser: function() {
			var ua = navigator.userAgent.toLowerCase();
			if (ua.indexOf("msie") > -1) {
				this.curBrowser = 'ie';
				var safariVersion = ua.match(/msie ([\d.]+)/)[1];
				this.browserVer = safariVersion;
			} else {
				this.curBrowser = 'other';
			}
		}
	}
	SliceCaptcha.prototype = {
		getVersion: function() {
			return '1.0.0';
		},
		destroy: function() {
			this.captchaDOM.captchaBox.innerHTML = '';
			for (var k in this){
				if (typeof this[k] == 'function') {
					this[k] = function(){};
				} else if (typeof this[k] == 'object') {
					this[k] = {};
				}
			}
		},
		initData: function() {
			//检查参数数据有效性
			if(typeof this.captchaBoxId !== 'string') {
				console.error("captchaBoxId is must be string");
				return;
			}
			this.captchaDOM.captchaBox = document.getElementById(this.captchaBoxId);
			if(!this.captchaDOM.captchaBox) {
				console.error("captchaBoxId is error");
				return;
			}
			if(!this.opts.requestData) {
				console.error("requestData is must");
				return;
			}
			if(!this.opts.sendData) {
				console.error("sendData is must");
				return;
			}
			if (!this.opts.clientID) {
				console.error('clientID 不能为空。');
				return "";
			}
			if(typeof this.opts.bgWidth == 'string') {
				if(this.opts.bgWidth.indexOf('%') != -1) {
					if (!this.isMobileDevice()) {
						console.error('非移动端 宽度不可以使用百分比的方式！');
						return;
					}
					// var screanW = document.documentElement.clientWidth || document.body.clientWidth;
					var screanW = window.screen.width;//在webview中，如果预加载页面，webview没有显示，此时文档宽为0
					screanW = screanW / window.devicePixelRatio;
					this.opts.bgWidth = parseInt(this.opts.bgWidth)/100 * screanW;
				} else {
					this.opts.bgWidth = parseInt(this.opts.bgWidth);
				}
			}
			if(typeof this.opts.bgHeight == 'string') {
				if(this.opts.bgHeight.indexOf('%') != -1) {
					this.opts.bgHeight = parseInt(this.opts.bgHeight)/100 * this.opts.bgWidth;
				} else {
					this.opts.bgHeight = parseInt(this.opts.bgHeight);
				}
			}
			// this.setBlockStyle(this.opts.blockStyle);
			this.getDeviceType();
			this.checkBrowser();
			
			this.createCaptchaBox(this.captchaDOM.captchaBox);
			this.showLoading(true);
			this.setUserEvent();

			this.initMouseTrack();

			this.refreshMethod();
			
			if(this.opts.mode === 'pop' && !this.isMobileDevice()) {
				var _this = this;
				// var dragbar = document.getElementById('slice-dragbarID');
				// dragbar.addEventListener('mouseover', function(e){
				// 	_this.showImg();
				// });
				// dragbar.addEventListener('mouseout', function(e){
				// 	_this.hideImg();
				// });
				// this.captchaDOM.captchaBox.addEventListener('mouseover', function(e){
				// 	_this.showImg();
				// });
				// this.captchaDOM.captchaBox.addEventListener('mouseout', function(e){
				// 	_this.hideImg();
				// });
				this.captchaDOM.captchaBox.onmouseover = function(e){
					_this.showImg();
				};
				this.captchaDOM.captchaBox.onmouseout = function(e){
					_this.hideImg();
				};
			}
			if(this.opts.mode === 'pop' && !this.isMobileDevice()) {
				// this.htmlDoms.out_panel.css({'display': 'none', 'position': 'absolute', 'bottom': '42px'});
				this.captchaDOM.slicebody.style.display = 'none';
				this.captchaDOM.slicebody.style.position = 'absolute';
				this.captchaDOM.slicebody.style.bottom = this.opts.barHeight + this.opts.barBgDistance + 'px';
			} else {
				// this.htmlDoms.out_panel.css({'position': 'relative'});
				this.captchaDOM.slicebody.style.position = 'relative';
			}
		},
		// setClientID: function(id) {
		// 	this.opts.clientID = id;
		// },
		initMouseTrack: function() {
			try {
				if (mouseTrack) {
					mouseTrack.initMouseTrack(this.captchaBoxId);
				} else {
					console.error('mouseTrack 未定义');
				}
			} catch (error) {
				console.error('mouseTrack.initMouseTrack 执行时出现了错误，详细信息如下：');
				console.log(error);
			}
		},
		clearMouseTrack: function() {
			try {
				if (mouseTrack) {
					mouseTrack.clearTrackInfo();
				} else {
					console.error('mouseTrack 未定义');
				}
			} catch (error) {
				console.error('mouseTrack.clearTrackInfo 执行时出现了错误，详细信息如下：');
				console.log(error);
			}
		},
		getMouseTrack: function() {
			try {
				if (mouseTrack) {
					return mouseTrack.mouseTrackInfo();
				} else {
					console.error('mouseTrack 未定义');
				}
			} catch (error) {
				console.error('mouseTrack.mouseTrackInfo 执行时出现了错误，详细信息如下：');
				console.log(error);
			}
		},
		extend: function (target, source) {
			if (source == null) { return target }
			for (var k in source) {
				if (source[k] != null && target[k] !== source[k]) {
					target[k] = source[k];
				}
			}
			return target
		},
		getDeviceInfo: function() {
			var NavigatorFinger = {};
			var WindowFinger = {};
			try {
				if (navigatorFinger) {
					NavigatorFinger = navigatorFinger.get();
				} else {
					console.error('navigatorFinger 未定义');
				}
			} catch (error) {
				console.error('navigatorFinger.get 执行时出现了错误，详细信息如下：');
				console.log(error);
			}
			try {
				if (windowFinger) {
					WindowFinger = windowFinger.get();
				} else {
					console.error('windowFinger 未定义');
				}
			} catch (error) {
				console.error('windowFinger.get 执行时出现了错误，详细信息如下：');
				console.log(error);
			}
			this.extend(WindowFinger, NavigatorFinger);
			return WindowFinger;
		},
		createKey: function(key1, key2) {
			var key = key1;
			if (key2) key += key2;
			try {
				key = sha256_digest(key);
				key = key.substr(4, key.length - 8);
				return key;
			} catch (error) {
				console.error('生成秘钥时出现异常，详细信息如下：');
				console.log(error);
				return "";
			}
		},
		DES3encrypt: function(key, str) {
			var des3en = "";
			// var base64en = "";
			try {
				des3en = DES3.encrypt(key, str);
			} catch (error) {
				console.error('加密时出现异常，详细信息如下：');
				console.log(error);
				return "";
			}
			// try {
			// 	base64en = BASE64.encoder(des3en);
			// } catch (error) {
			// 	console.error('Base64转换时出现异常，详细信息如下：');
			// 	console.log(error);
			// }
			return des3en;
		},
		DES3decrypt: function(key, str) {
			var des3en = "";
			// var base64en = "";
			// try {
			// 	base64en = BASE64.decoder(str)
			// } catch (error) {
			// 	console.error('Base64转换时出现异常，详细信息如下：');
			// 	console.log(error);
			// 	return "";
			// }
			try {
				des3en = DES3.decrypt(key, str);
			} catch (error) {
				console.error('解密时出现异常，详细信息如下：');
				console.log(error);
			}
			return des3en;
		},
		setBlockStyle: function(style) {
			if (typeof style == "object" && (style.length == 4 || style.length == 0)) {
				this.opts.blockStyle = style;
			} else {
				this.opts.blockStyle = [-1, 1, 0, -1];
				console.error('函数 setBlockStyle 的参数必须是一个长度为4的数字数组或空数组，例如[-1, 1, 0, -1]或[]');
			}
			if (this.imageObject) {
				if (this.opts.useCanvas) {
					this.drawCaptcha(this.imageObject);
				} else {
					this.drawCaptcha_NoCanvas(this.imageObject);
				}
			}
		},
		getDeviceType: function() {	
			var platform = navigator.platform;
			if (platform.indexOf('Win') >= 0) {
				this.deviceType = 'Windows';
			} else if (platform.indexOf('Linux') >= 0) {
				this.deviceType = 'Android';
			} else if (platform.indexOf('iPhone') >= 0) {
				this.deviceType = 'iPhone';
			} else {
				this.deviceType = 'Unknown';
			}
		},
		isMobileDevice: function() {
			var platform = navigator.platform;
			if (platform.indexOf('Linux') >= 0 || platform.indexOf('iPhone') >= 0) {
				return true;
			} else {
				return false;
			}
		},
		checkBrowser: function() {
			var DEFAULT_VERSION = 8.0;
			var ua = navigator.userAgent.toLowerCase();
			if (ua.indexOf("msie") > -1) {
				var safariVersion = ua.match(/msie ([\d.]+)/)[1];
				if(safariVersion <= DEFAULT_VERSION ){
					this.opts.useCanvas = false;
				};
			}
		},
		createCaptchaBox: function(captchaBox) {
			var html = "";
			html += '<div id="slice-body" class="slice-border-radius" style="background-color: rgb(229, 229, 229); position: relative;">';//width: 300px; height: 200px; 
			html += '  <div id="slice-loading" style="width: 100%; height: 100%; display: none;">';
			html += '    <div style="height: 50%;"></div><div id="slice-loadingMsg" class="slice-noselect" style="text-align: center;"></div>';
			html += '  </div>';
			html += '  <div id="slice-canvas-panel" style="width: 100%; height: 100%; display: block; position: relative;">';
			html += '    <div id="slice-refresh" style="z-index: 3; display: block;"></div>';
			html += '    <div id="slice-canvasbox" style="width: 100%; height: 100%;">';
			html += '      <canvas id="slice-canvas" width="100%" height="100%"></canvas>';// width="300" height="200"
			// html += '      <div id="slice-canvas" class="slice-background-size" ';
			// html += '        style="width: 100%; height: 100%; background-image: url(&quot;' + this.opts.imageUrl + '&quot;); background-size: 100% 100%;"> ';
			// html += '      </div>'
			html += '    </div>';
			html += '    <div id="slice-clipblock" style="left: 10px; top: 57px; position: absolute;">';
			html += '      <canvas id="slice-clipcanvas" class="drag-slider" width="50" height="50"></canvas>';
			// html += '      <div id="slice-clipcanvas" class="slice-background-size" ';
			// html += '        style="width: 100%; height: 100%; background-image: url(&quot;' + this.opts.imageUrl + '&quot;); background-size: 100% 100%;"> ';
			// html += '      </div>'
			html += '    </div>';
			html += '  </div>';
			html += '  <div id="slice-result" class="slice-result slice-noselect" style="text-align: center;"></div>';
			html += '</div>';
			html += '<div id="slice-dragbar" style="position: relative;">';
			html += '  <div id="slice-drag-track" class="slice-border-radius slice-noselect" style="width: 100%; height: 13px; position: relative; text-align: center; line-height: 24px; font-size: 12px; border-radius: 7px; border: 1px solid #ddd;"></div>';
			// html += '  <div type="button" id="slice-drag-slider" class="slice-background-size" readonly="" style="left: 18px;background-image: url(&quot;./icon/slider.png&quot;);background-size: 50%"></div>';//width: 34px; height: 24px; 
			html += '  <div id="slice-drag-slider" class="slice-border-radius" style="left: 18px;top:1px">';// class="slice-border-radius"
			html += '    <div id="slice-drag-slider-img" style="position:relative; left:9px; top:6px; width:12px; height:12px; background-image: url(&quot;./icon/slider.png&quot;);background-size: 100%"></div>';
			html += '  </div>';
			html += '</div>';
			captchaBox.innerHTML = html;
			captchaBox.align = "left";//防止使用者在最外层加 align="center" 影响内部样式
			captchaBox.style.position = "relative";
			
			if (!this.opts.useCanvas) {
				// var htmlsrc = '<div id="slice-canvas"';// class="slice-background-size" 
				// htmlsrc += 'style="display:block;width: 100%; height: 100%; background-image: url(&quot;' + this.opts.imageUrl + '&quot;); background-size: 100% 100%;"> ';
				// htmlsrc += '</div>'
				var htmlsrc = '<img id="slice-canvas" width="0" height="0" src="" style="display:none"></img>';
				var canvasdiv = document.getElementById('slice-canvasbox');
				canvasdiv.innerHTML = htmlsrc;
				
				// var htmlsrc = '<div id="slice-clipcanvas"';
				// htmlsrc += 'style="width: 100%; height: 100%; background-image: url(&quot;' + this.opts.sliceImageUrl + '&quot;); background-size: 100% 100%;"> ';
				// htmlsrc += '</div>'
				var htmlsrc = '<img id="slice-clipcanvas" class="drag-slider" width="0" height="0" src=""></img>';
				var clipblock = document.getElementById('slice-clipblock');
				clipblock.innerHTML = htmlsrc;
			}

			this.captchaDOM.slicebody = document.getElementById('slice-body');
			this.captchaDOM.loading = document.getElementById('slice-loading');
			this.captchaDOM.loadMsg = document.getElementById('slice-loadingMsg');
			this.captchaDOM.canvasPanel = document.getElementById('slice-canvas-panel');
			this.captchaDOM.track = document.getElementById('slice-drag-track');
			this.captchaDOM.slider = document.getElementById('slice-drag-slider');
			this.captchaDOM.sliderImg = document.getElementById('slice-drag-slider-img');
			this.captchaDOM.clipblock = document.getElementById('slice-clipblock');
			this.captchaDOM.result = document.getElementById('slice-result');
			this.captchaDOM.refresh = document.getElementById('slice-refresh');
			this.captchaDOM.dragbar = document.getElementById('slice-dragbar');
			this.captchaDOM.canvas = document.getElementById('slice-canvas');
			this.captchaDOM.clipcanvas = document.getElementById('slice-clipcanvas');
			this.captchaDOM.resultClass = this.captchaDOM.result.className;

			captchaBox.style.padding = '0px';
			captchaBox.style.width = (this.opts.bgWidth + this.opts.bgMarginW*2) + 'px';
			// captchaBox.style.height = (this.opts.bgHeight + this.opts.bgMarginW*2) + 'px';

			// if (!this.opts.useCanvas) {
			// 	this.captchaDOM.canvas.style.width = this.opts.bgWidth + 'px';
			// 	this.captchaDOM.canvas.style.height = this.opts.bgHeight + 'px';
			// 	this.captchaDOM.clipcanvas.style.width = this.opts.cw + 'px';
			// 	this.captchaDOM.clipcanvas.style.height = this.opts.ch + 'px';
			// } else {
				this.captchaDOM.canvas.width = this.opts.bgWidth;
				this.captchaDOM.canvas.height = this.opts.bgHeight;
				this.captchaDOM.clipcanvas.width = this.opts.cw;
				this.captchaDOM.clipcanvas.height = this.opts.ch;
			// }
			this.captchaDOM.slicebody.style.width = this.opts.bgWidth + 'px';
			this.captchaDOM.slicebody.style.height = this.opts.bgHeight + 'px';
			this.captchaDOM.slicebody.style.padding = this.opts.bgMarginW + 'px';
			this.captchaDOM.slicebody.style.borderRadius = this.opts.bgMarginW + 'px';
			this.captchaDOM.slicebody.style.backgroundColor = this.opts.bgColor;
			this.captchaDOM.clipblock.style.width = this.opts.cw + 'px';
			this.captchaDOM.clipblock.style.height = this.opts.ch + 'px';
			this.captchaDOM.dragbar.style.width = this.opts.bgWidth + 'px';
			this.captchaDOM.dragbar.style.height = this.opts.barHeight + 'px';
			this.captchaDOM.dragbar.style.left = this.opts.bgMarginW + 'px';
			this.captchaDOM.dragbar.style.paddingTop = this.opts.barBgDistance + 'px';
			this.captchaDOM.track.style.height = this.opts.barHeight + 'px';
			this.captchaDOM.track.style.lineHeight = this.opts.barHeight + 'px';
			this.captchaDOM.track.style.backgroundColor = this.opts.bgColor;
			this.captchaDOM.slider.style.width = this.opts.dragWidth + 'px';
			this.captchaDOM.slider.style.height = this.opts.dragHeight + 'px';
			this.captchaDOM.slider.style.borderRadius = this.opts.dragBorderR + 'px';
			this.captchaDOM.slider.style.top = this.opts.barBgDistance+1+this.opts.barHeight/2-this.opts.dragHeight/2 + 'px';
			this.captchaDOM.slider.style.backgroundColor = this.opts.dragColor;
			// this.captchaDOM.slider.style.top = 1 + 'px';
			this.captchaDOM.sliderImg.style.left = (this.opts.dragWidth-12)/2 + 'px';
			this.captchaDOM.sliderImg.style.top = (this.opts.dragHeight-12)/2 + 'px';
			this.captchaDOM.result.style.width = this.opts.bgWidth + 'px';
			this.captchaDOM.result.style.left = this.opts.bgMarginW + 'px';

			this.captchaDOM.canvas.onmousedown = this.captchaDOM.canvas.onmousemove = function(e) {//禁止浏览器对图片的默认拖拽效果
				var e = e||window.event;
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			}
			this.setEleCannotselect(this.captchaDOM.track);
			this.setEleCannotselect(this.captchaDOM.loadMsg);
		},
		showLoading: function(isShow) {
			var ele_loading = this.captchaDOM.loading;
			var ele_panel = this.captchaDOM.canvasPanel;
			if (isShow) {
				ele_loading.style.display = "block";
				ele_panel.style.display = "none";
				// ele_panel.style.width = '0px';
			} else {
				ele_loading.style.display = "none";
				ele_panel.style.display = "block";
				// ele_panel.style.width = this.opts.bgWidth + 'px';
			}
		},
		//设置显示的消息
		setMessage : function(msg) {
			this.captchaDOM.track.innerHTML = msg;//firefox10不支持innerText
		},
		setFloatMessage : function(msg) {//浮动条提示
			this.captchaDOM.result.innerHTML = msg;
		},
		setLoadMessage : function(msg) {
			this.captchaDOM.loadMsg.innerHTML = msg;
		},
		setUserEvent: function() {
			var _this = this;
			function mouseDown(e) {
				_this.moveStart(e);
			};
			var mouseMove = function (e) {
				_this.move(e);
			};
			var mouseUp = function (e) {
				setTimeout(function() {//延迟一点验证 等mousetrack获取mouseup的鼠标信息
					_this.moveEnd(e);
				}, 100);
			};
			var refresh = function (e) {
				_this.refreshMethod(e);
			};
			//对应手机端
			if (this.captchaDOM.slider.addEventListener) {                    // 所有主流浏览器，除了 IE8 及更早版本
				if (this.opts.dragClip) {
					this.captchaDOM.clipblock.addEventListener('touchstart', mouseDown);
				}
				this.captchaDOM.slider.addEventListener("touchstart", mouseDown);
				this.captchaDOM.captchaBox.addEventListener("touchmove", mouseMove);
				this.captchaDOM.captchaBox.addEventListener("touchend", mouseUp);
			} else if (this.captchaDOM.slider.attachEvent) {                  // IE8 及更早版本
				if (this.opts.dragClip) {
					this.captchaDOM.clipblock.attachEvent('ontouchstart', mouseDown);
				}
				this.captchaDOM.slider.attachEvent("ontouchstart", mouseDown);
				this.captchaDOM.captchaBox.attachEvent("ontouchmove", mouseMove);
				this.captchaDOM.captchaBox.attachEvent("ontouchend", mouseUp);
			}
			//对应PC端
			if (this.opts.dragClip) {
				// this.captchaDOM.clipblock.ontouchstart = mouseDown;//ontouchstart是实验性API
				this.captchaDOM.clipblock.onmousedown = mouseDown;
				this.captchaDOM.clipcanvas.onmousemove = function(e) {
					var e = e||window.event;
					e.preventDefault ? e.preventDefault() : e.returnValue = false;
				};
			} else {
				this.captchaDOM.clipblock.onmousedown = this.captchaDOM.clipblock.onmousemove = function(e) {
					var e = e||window.event;
					e.preventDefault ? e.preventDefault() : e.returnValue = false;
				};
			}
			// this.captchaDOM.slider.ontouchstart = mouseDown;
			// this.captchaDOM.captchaBox.ontouchmove = mouseMove;
			// this.captchaDOM.captchaBox.ontouchend = mouseUp;
			this.captchaDOM.slider.onmousedown = mouseDown;
			// this.captchaDOM.captchaBox.onmousemove = mouseMove;
			// this.captchaDOM.captchaBox.onmouseup = mouseUp;
			window.document.onmousemove = mouseMove;
			window.document.onmouseup = mouseUp;

			this.captchaDOM.refresh.onmousedown = refresh;
		},
		//设置用户是否可以操作
		setUserCanOperation: function(isCan) {
			if (isCan) {
				this.captchaDOM.refresh.style.display = 'block';
			} else {
				this.captchaDOM.refresh.style.display = 'none';
			}
			this.userIsCan = isCan;
		},
		loadBGImage: function(imgurl) {
			try {
				var img = new Image();
				img.src = imgurl;
				// img.onload = this.drawCaptcha;
				var _this = this;
				this.imageObject = img;
				if (!_this.opts.useCanvas) {
					_this.drawCaptcha_NoCanvas(img);
				} else {
					if (img.complete) {
						_this.drawCaptcha(img);
					} else {
						// $(img).on('load', function(e) {//JQuery1.4 不支持这个方法
						$(img).load(function(e) {
							_this.drawCaptcha(this);
						});
					}
				}
			} catch (error) {
				console.error('加载图片出错，错误信息如下：');
				console.log(error);
			}
		},
		refreshMethod: function() {
			try {
				if (!this.opts.requestData) {
					console.error('必须定义 requestData() 函数，以便向服务器请求数据。');
					return;
				}
				var _this = this;
				this.errorNum = 0;
				this.showLoading(true);
				this.setUserCanOperation(false);
				this.setLoadMessage(this.opts.message.loading);
				this.setMessage(this.opts.message.loading);
				var paramObj = {
					captchaType: 0,//0表示图片流 a表示canvas
					width: this.opts.bgWidth,
					height: this.opts.bgHeight,
					cw: this.opts.cw,
					ch: this.opts.ch
				}
				this.requestDataDone = false;
				this.opts.requestData(paramObj, function(data){
					_this.analysisParam(data);

					_this.loadBGImage(_this.opts.imageUrl);
					// _this.showLoading(false);//2019.4.18 加载完图片再将状态置为可操作
					// _this.setMessage(_this.opts.message.tip);
					_this.reset();

					_this.requestDataDone = true;
					if (_this.intervalDone) {
						_this.setUserCanOperation(true);
					}
					
					try {
						_this.opts.ready();
					} catch(error) {
						console.error('执行 ready() 函数时出错，错误信息如下：');
						console.log(error);
					}
				}, function(error) {
					_this.setLoadMessage(this.opts.message.error);
					_this.setMessage(this.opts.message.error);
				}, this);
			} catch (error) {
				console.error('执行 requestData() 函数时出错，错误信息如下：');
				console.log(error);
			}
		},
		//解析从服务器获取的参数
		analysisParam : function(res) {
			try {
				var jsonData = JSON.parse(res);
				if (this.opts.useDES3) {
					jsonData.data = this.DES3decrypt(this.createKey(this.opts.clientID), jsonData.data);
				}
				jsonData.data = JSON.parse(jsonData.data);
			} catch(error) {
				console.error('JSON解析服务器参数出错。');
				return;
			}
			this.keys = jsonData.data.keys;
			this.opts.imageUrl = jsonData.imageUrl;
			this.opts.sliceImageUrl = jsonData.sliceImageUrl;
			if (!this.opts.imageUrl) {
				console.error("imageUrl 不能为空");
				return;
			}
			if (!this.opts.sliceImageUrl && !this.opts.useCanvas) {
				console.error("不使用Canvas时, sliceImageUrl 不能为空");
				return;
			}
			if (this.opts.useCanvas) {
				if (jsonData.data.pointX < this.opts.cw/2 || jsonData.data.pointX > (this.opts.bgWidth - this.opts.cw/2) ||
						jsonData.data.pointY < this.opts.ch/2 || jsonData.data.pointY > (this.opts.bgHeight - this.opts.ch/2)) {
					console.error("抠图中心点(" + jsonData.data.pointX + "," + jsonData.data.pointY + ")不可以靠近边界");
					return;
				}
			}
			this.opts.posx = jsonData.data.pointX;
			this.opts.posy = jsonData.data.pointY;
		},
		//弹出式
		showImg: function() {
			this.captchaDOM.slicebody.style.display = 'block';
			// opts.captchaBox.lastChild.style.display = 'block';
		},
		//固定式
		hideImg: function() {
			this.captchaDOM.slicebody.style.display = 'none';
			// opts.captchaBox.lastChild.style.display = 'none';
		},
		isArray: function(obj) {
			return Object.prototype.toString.call(obj) === '[object Array]';
		},
		createCanvas: function(w, h) {
			var canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			return canvas;
		},
	
		clipPath: function(ctx, startx, starty, blockStyle) {//isTu标识 抠图的半圆是内凹还是外凸
			// startx = startx + 0.2;
			// starty = starty + 0.2;
			if (!ctx || typeof blockStyle != 'object' || (blockStyle.length != 4 && blockStyle.length != 0)) {
				return;
			}

			// var subw = parseInt((this.opts.cw - 1) / 6);
			// var subh = parseInt((this.opts.ch - 1) / 6);
			// var radius = Math.min(subw, subh);
			// var radius = Math.min(subw, subh);
			// var clipw = subw * 4;
			// var cliph = subh * 4;// subh*5+0.5
			var minW = Math.min(this.opts.cw, this.opts.ch);
			var radius = this.opts.cRadius;
			if (radius < 4) radius = 4;//半径最小为4
			if (radius > (minW/2-5)/2) radius = (minW/2-5)/2;//半径外的边长至少为5
			var clipw = this.opts.cw - radius*2;
			var cliph = this.opts.ch - radius*2;

			startx = startx + radius;
			starty = starty + radius;

			var arcList = [];
			// blockStyle = [1, 1, 1, 1];
			for (var i = 0; i < blockStyle.length; i++) {
				var item = blockStyle[i];
				arcList.push({
					isArc: item == -1 || item == 1,
					isTu: item == 1
				});
			}
			
			ctx.beginPath()
			ctx.moveTo(startx, starty);
			if (arcList[0].isArc) {
				ctx.lineTo(startx + parseInt(clipw / 2) - radius, starty);
				if (arcList[0].isTu) {
					ctx.arc(startx + parseInt(clipw / 2), starty, radius, -Math.PI, 0, false);
				} else {
					ctx.arc(startx + parseInt(clipw / 2), starty, radius, -Math.PI, 0, true);
				}
				ctx.lineTo(startx + clipw, starty);
			} else {
				ctx.lineTo(startx + clipw, starty);
			}
	
			if (arcList[1].isArc) {
				ctx.lineTo(startx + clipw, starty + parseInt(cliph / 2) - radius);
				if (arcList[1].isTu) {
					ctx.arc(startx + clipw, starty + parseInt(cliph / 2), radius, -Math.PI / 2, Math.PI / 2, false);
				} else {
					ctx.arc(startx + clipw, starty + parseInt(cliph / 2), radius, -Math.PI / 2, Math.PI / 2, true);
				}
				ctx.lineTo(startx + clipw, starty + cliph);
			} else {
				ctx.lineTo(startx + clipw, starty + cliph);
			}
	
			if (arcList[2].isArc) {
				ctx.lineTo(startx + (parseInt(clipw / 2) + radius), starty + cliph);
				if (arcList[2].isTu) {
					ctx.arc(startx + parseInt(clipw / 2), starty + cliph, radius, 0, Math.PI, false);
				} else {
					ctx.arc(startx + parseInt(clipw / 2), starty + cliph, radius, 0, Math.PI, true);
				}
				ctx.lineTo(startx, starty + cliph);
			} else {
				ctx.lineTo(startx, starty + cliph);
			}
	
			if (arcList[3].isArc) {
				ctx.lineTo(startx, starty + parseInt(cliph / 2) + radius);
				if (arcList[3].isTu) {
					ctx.arc(startx, starty + parseInt(cliph / 2), radius, Math.PI / 2, -Math.PI / 2, false);
				} else {
					ctx.arc(startx, starty + parseInt(cliph / 2), radius, Math.PI / 2, -Math.PI / 2, true);
				}
				ctx.lineTo(startx, starty);
			} else {
				ctx.lineTo(startx, starty);
			}
			ctx.closePath();
		},
	
		fillClip: function(canvas, startx, starty, blockStyle, alpha) {
			var ctx = canvas.getContext("2d")
			this.clipPath(ctx, startx, starty, blockStyle);
			
			ctx.fillStyle = "rgba(99,99,99, " + alpha + ")";
			ctx.fill();
		},
	
		strokeClip: function(canvas, startx, starty, blockStyle) {
			var ctx = canvas.getContext('2d');
			this.clipPath(ctx, startx, starty, blockStyle);
			
			ctx.strokeStyle = "#fff";
			ctx.stroke();
		},
	
		randomNum: function(min, max){
			var rangeNum = max - min;
			var num = min + Math.round(Math.random() * rangeNum);
			return num;
		},
	
		getStartPoint: function(w, h) {
			var startw = this.opts.padding + this.opts.cw/2;
			var starth = this.opts.padding + this.opts.ch/2;
			if (w < startw * 2 || h < starth * 2) return {centerX: w/2, centerY: h/2};
			
			return {
				centerX: randomNum(startw, w - startw),
				centerY: randomNum(starth, h - starth)
			};
		},
	
		getStartPoint_MIX: function(w, h, x, y) {
			var startw = this.opts.padding + this.opts.cw/2;
			var starth = this.opts.padding + this.opts.ch/2;
			if (w < startw * 2 || h < starth * 2) return {centerX: w/2, centerY: h/2};
			
			var count = 0;
			while(true) {
				count++;
				var startPoint = {
					centerX: this.randomNum(startw, w - startw),
					centerY: this.randomNum(starth, h - starth)
				};
				if (startPoint.centerX < x + this.opts.cw
					&& startPoint.centerX > x - this.opts.cw
					&& startPoint.centerY < y + this.opts.ch
					&& startPoint.centerY > y - this.opts.ch) {
					continue;
				} else {
					break;
				}
				if (!this.opts.allowSameRow) {//如果不允许同行
					if (startPoint.centerY < y + 20
						&& startPoint.centerY > y - 20) {
						continue;
					} else {
						break;
					}
				}

				if (count > 10) {
					console.error('计算混淆点超过10次');
					startPoint = {centerX: x, centerY: y};
					break;
				}
			}
			return startPoint;
		},
	
		checkStartPoint: function(posx, posy, w, h) {
			var startw = opts.cw/2 + opts.padding;
			var starth = opts.ch/2 + opts.padding;
			if (posx < startw || posx > w - startw) return false;
			if (posy < opts.padding || posy > h - starth) return false;
			return true;
		},
		createSlice_Canvas: function(img, canvasW, canvasH, startx, starty, blockStyle) {
			var sourceCanvas = this.createCanvas(canvasW, canvasH);
			var sctx = sourceCanvas.getContext('2d');
			sctx.drawImage(img, 0, 0, canvasW, canvasH);
			sctx.globalCompositeOperation = 'destination-in';
	
			var destCanvas = this.createCanvas(this.opts.cw, this.opts.ch);
			this.fillClip(destCanvas, 0, 0, blockStyle, 1);
	
			sctx.drawImage(destCanvas, startx, starty);
			
			var clipCanvas = this.captchaDOM.clipcanvas;
			// var clipCanvas = this.createCanvas(this.opts.cw, this.opts.ch);
			// clipCanvas.id = 'slice-clipcanvas';
			var imgdata = sctx.getImageData(startx, starty, this.opts.cw, this.opts.ch);
			clipCanvas.getContext('2d').putImageData(imgdata, 0, 0);
	
			this.strokeClip(clipCanvas, 0, 0, blockStyle);
			return clipCanvas;
		},
		updateSlice: function(img, startx, starty, blockStyle) {
			var clipblock = this.captchaDOM.clipblock;

			if (this.opts.useCanvas) {
				this.createSlice_Canvas(img, this.opts.bgWidth, this.opts.bgHeight, startx, starty, blockStyle);
			// 	clipblock.appendChild(clipCanvas);
			} else {
				this.captchaDOM.clipcanvas.className = 'slice-background-size';
				// this.captchaDOM.clipcanvas.style.backgroundImage = "url('" + this.opts.sliceImageUrl + "')";//'url(&quot;' + this.opts.sliceImageUrl + '&quot;);';
				// if (this.opts.imageType == 'path') {
					this.captchaDOM.clipcanvas.src = this.opts.sliceImageUrl;
				// } else {
				// 	this.captchaDOM.clipcanvas.src = this.getStreamInterface(2);
				// }
				// var clipCanvas = this.createSlice_NoCanvas(this.opts.sliceImageUrl);
				// clipblock.innerHTML = clipCanvas;
			}
			clipblock.style.top = starty + 'px';
			clipblock.style.left = this.opts.padding+'px';
		},
		drawCaptcha: function(newImage) {
			if (this.opts.posx == 0 || this.opts.posy == 0) return;
			
			var startPoint = {startx: this.opts.posx - this.opts.cw/2, starty: this.opts.posy - this.opts.ch/2};
			if (!startPoint) {
				console.error("can not get the start point");
				return;
			}
			this.showLoading(false);
			this.setMessage(this.opts.message.tip);
			
			var canvas = this.captchaDOM.canvas;
			var context = canvas.getContext("2d");
			context.drawImage(newImage, 0, 0, this.opts.bgWidth, this.opts.bgHeight);
			
			var styleblock = this.opts.blockStyle;
			if (styleblock.length == 0) {
				var s1 = Math.round(Math.random() * 3) - 1;
				var s2 = Math.round(Math.random() * 3) - 1;
				var s3 = Math.round(Math.random() * 3) - 1;
				var s4 = Math.round(Math.random() * 3) - 1;
				styleblock = [s1, s2, s3, s4];
			}
			this.fillClip(canvas, startPoint.startx, startPoint.starty, styleblock, this.opts.cTransparency);
			
			if (this.opts.useMixBlock) {
				var rectMIX = this.getStartPoint_MIX(this.opts.bgWidth, this.opts.bgHeight, startPoint.startx, startPoint.starty);

				this.fillClip(canvas, rectMIX.centerX, rectMIX.centerY, styleblock, this.opts.cMixTransparency);
			}
	
			this.updateSlice(newImage, startPoint.startx, startPoint.starty, styleblock);
		},
		drawCaptcha_NoCanvas: function(newImage) {
			// if (this.opts.posx == 0 || this.opts.posy == 0) return;

			var startPoint = {startx: this.opts.posx - this.opts.cw/2, starty: this.opts.posy - this.opts.ch/2};
			if (!startPoint) {
				console.error("can not get the start point");
				return;
			}
			// this.captchaDOM.canvas.style.backgroundImage = "url('" + this.opts.imageUrl + "')";//'url(&quot;' + this.opts.sliceImageUrl + '&quot;);';
			this.captchaDOM.canvas.src = this.opts.imageUrl;
			this.captchaDOM.canvas.className = 'slice-background-size';//for ie7 ie8
			
			var _this = this//背景图片加载完成后，图片才显示，防止背景图片一点一点加载 防止滑块图片先显示
			this.captchaDOM.canvas.style.display = 'none';
			this.captchaDOM.clipcanvas.style.display = 'none';
			this.captchaDOM.canvas.onload = function() {
				_this.captchaDOM.canvas.style.display = 'block'
				_this.captchaDOM.clipcanvas.style.display = 'block'
				_this.showLoading(false);
				_this.setMessage(_this.opts.message.tip);
			}
			
			this.updateSlice(newImage, startPoint.startx, startPoint.starty);
		},
		captchaShake: function() {
			var boxClassName = this.captchaDOM.result.className;
			this.captchaDOM.result.className += ' shake';
			var _this = this;
			setTimeout( function(){
				_this.captchaDOM.result.className = boxClassName;
			}, 500)
		},
		setResultStatus: function(res, succesMsg) {
			if (res == 'success') {
				this.setMessage(succesMsg + ',' + this.opts.message.seccess);
				this.setFloatMessage(this.opts.message.seccess);
				// this.captchaDOM.result.innerHTML = this.opts.message.seccess;
				this.captchaDOM.result.className = this.captchaDOM.resultClass + ' success';
				this.captchaDOM.track.style.color = '#4cae4c';
				this.captchaDOM.track.style.borderColor = '#4cae4c';
			} else if (res == 'fail') {
				this.setMessage(this.opts.message.fail);
				// this.captchaDOM.result.innerHTML = this.opts.message.fail;
				this.captchaDOM.result.className = this.captchaDOM.resultClass + ' fail';
				this.captchaDOM.track.style.color = '#d9534f';
				this.captchaDOM.track.style.borderColor = '#d9534f';
			} else {
				this.setMessage(this.opts.message.forbidden);
				// this.captchaDOM.result.innerHTML = this.opts.message.forbidden;
				this.captchaDOM.result.className = this.captchaDOM.resultClass + ' fail';
				this.captchaDOM.track.style.color = '#d953ff';
				this.captchaDOM.track.style.borderColor = '#d953ff';
			}
			// this.captchaShake();
			var _this = this;
			var interval = this.opts.interval;
			this.intervalDone = false;
			function intervalS () {
				var msg = (res == 'fail' ? _this.opts.message.fail : _this.opts.message.forbidden) + ', ' + interval + 's 后重试';
				_this.setFloatMessage(msg);
				var int = setInterval(function(){
					interval--;
					var msg = (res == 'fail' ? _this.opts.message.fail : _this.opts.message.forbidden) + ', ' + interval + 's 后重试';
					_this.setFloatMessage(msg);
					if (interval <= 0) {
						_this.intervalDone = true;
						if (_this.requestDataDone) {
							_this.setUserCanOperation(true);
						}

						_this.resetTrack();
						clearInterval(int);
					}
				}, 1000);
			}
			if (res != 'success') {
				intervalS();
			}
		},
		resetTrack: function() {
			this.captchaDOM.track.style.color = '#000';
			this.captchaDOM.track.style.borderColor = '#ddd';
			this.captchaDOM.result.className = this.captchaDOM.resultClass;
		},
		setSlicePos: function(centerX) {
			this.captchaDOM.slider.style.left = (centerX - this.opts.dragWidth/2) + "px";
			this.captchaDOM.clipblock.style.left = (centerX - this.opts.cw/2) + "px";
		},
		reset: function() {
			this.clearMouseTrack();
			this.setSlicePos(this.opts.padding + this.opts.cw/2);
		},
		test: function(e) {
			console.log(e)
			var target = e.targetTouches[0];
			var dd = "force:"+target.force
			dd += "<br/>,radiusX:"+target.radiusX;
			dd += "<br/>,radiusY:"+target.radiusY;
			// dd += "<br/>,clientX:"+target.clientX;
			dd += "<br/>,rotationAngle:"+target.rotationAngle;
			
			var target = e.changedTouches[0];
			dd += "<br/>,force:"+target.force
			dd += "<br/>,radiusX:"+target.radiusX;
			dd += "<br/>,radiusY:"+target.radiusY;
			dd += "<br/>,rotationAngle:"+target.rotationAngle;
			
			var target = e.touches[0];
			dd += "<br/>,force:"+target.force
			dd += "<br/>,radiusX:"+target.radiusX;
			dd += "<br/>,radiusY:"+target.radiusY;
			dd += "<br/>,rotationAngle:"+target.rotationAngle;
			document.getElementById("ppp").innerHTML = dd
		},

		moveStart: function(e){
			var e = e||window.event;
			if (!this.userIsCan) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				return;
			}
			this.startTime = new Date().getTime();
			this.setMessage("");
			this.opts.eventinfo.flag = true;
			if (e.touches) {
				this.opts.eventinfo.currentX = e.touches[0].clientX;
			} else {
				this.opts.eventinfo.currentX = e.clientX;
			}
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		},
		move: function(e) {
			var e = e||window.event;
			if (!this.userIsCan) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				return;
			}
			if (this.opts.eventinfo.flag) {
				if (e.touches) {
					var disX = e.touches[0].clientX - this.opts.eventinfo.currentX;
				} else {
					var disX = e.clientX - this.opts.eventinfo.currentX;
				}
				var startX = this.opts.padding + this.opts.cw/2;
				disX += startX;
				if (disX < startX || disX > (this.opts.bgWidth - this.opts.padding - this.opts.cw/2)) {//限制滑块不能超出范围
					return false
				}
				this.setSlicePos(disX);

				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				return false;
			}
		},
		getStyle: function(elem, name) {
			if (elem.style[name]) {//如果该属性存在于style[]中，则它最近被设置过(且就是当前的)
				return elem.style[name];
			} else if (elem.currentStyle) {//尝试IE的方式
				return elem.currentStyle[name];
			} else if (document.defaultView && document.defaultView.getComputedStyle) {//或者W3C的方法，如果存在的话
				//它使用传统的"text-Align"风格的规则书写方式，而不是"textAlign"
				// name = name.replace(/([A-Z])/g,"-$1");
				// name = name.toLowerCase();
				//获取style对象并取得属性的值(如果存在的话)
				var s = document.defaultView.getComputedStyle(elem,"");
				return s && s.getPropertyValue(name);
				//否则，就是在使用其它的浏览器
			} else {
				return null;
			}
		},
		setEleCannotselect: function(element) {
			if (typeof(element.onselectstart) != "undefined") {
				// IE下禁止元素被选取
				element.onselectstart = new Function("return false");
			} else {
				// firefox下禁止元素被选取的变通办法 ---目前用CSS样式控制 不需要这个方法
				// element.onmousedown = new Function("return false");
				// element.onmouseup = new Function("return true");
			}
		},
		moveEnd: function(e) {
			var e = e||window.event;
			if (!this.userIsCan) {
				return;
			}
			if (this.opts.eventinfo.flag){
				this.opts.eventinfo.flag = false;

				var disX = parseFloat(this.getStyle(this.captchaDOM.clipblock, 'left'));
				disX += this.opts.cw/2;
				
				var resData = {
					deviceInfo: this.opts.useDeviceInfo ? this.getDeviceInfo() : undefined,
					mouseInfo: this.getMouseTrack(),
					isMobile: this.isMobileDevice(),
					left: disX,
					captchaType: 'slice_check'
				}
				resData = JSON.stringify(resData);
				if (this.opts.useDES3) {
					resData = this.DES3encrypt(this.createKey(this.opts.clientID, this.keys), resData);
				}
				var totalTime = new Date().getTime() - this.startTime;
				var successMsg = Math.round(totalTime/100)/10 + '秒完成';
				var _this = this;
				this.setUserCanOperation(false);
				this.setMessage(this.opts.message.checking);
				try {
					this.opts.sendData && this.opts.sendData(resData, function(serverRes) {
						// ERROR_1距离无效   ERROR_2轨迹无效   ERROR_3超时   SUCCESS
						var obj = {Data: 'success'};
						if (serverRes == 'SUCCESS') {
							obj.Data = 'success';
						} else if (serverRes == 'ERROR_1') {
							obj.Data = 'fail';
						} else if (serverRes == 'ERROR_2') {//被怪兽吃掉
							obj.Data = 'forbid';
						} else {
							obj.Data = 'forbid';
						}
						try {
							// var resObj = JSON.parse(serverRes);
							var resStr = obj.Data;
						} catch (error) {
							console.error('解析服务器端返回的数据出错，错误信息如下：');
							console.log(error);
							return;
						}
						_this.setResultStatus(resStr, successMsg);
						if (resStr !== 'success') {
							_this.errorNum = _this.errorNum + 1;
							setTimeout(function () {
								if (_this.opts.needAgainNum <= _this.errorNum) {
									_this.refreshMethod();
								} else {
									_this.requestDataDone = true;//此时没有调requestData 算做调用完成
									_this.reset();
									// _this.setUserCanOperation(true);//等opts.interval秒后 再让用户操作
									_this.setMessage(_this.opts.message.tip);
								}
							}, 500);
						} else {
							// setTimeout(function () {//////////////
							// 	_this.refreshMethod();
							// }, 500);
						}
						try {
							_this.opts.checkResult(resStr);
						} catch(error) {
							console.error('执行 checkResult() 函数时出错，错误信息如下：');
							console.log(error);
						}
					});
				} catch (error) {
					console.error('执行 sendData() 函数时出错，错误信息如下：');
					console.log(error);
				}
			}
		}
	}


	if(typeof exports == "object") {
		module.exports = SliceCaptcha;
	} else if(typeof define == "function" && define.amd) {
		define([], function() {
			return SliceCaptcha;
		});
	} else if(window) {
		window.SliceCaptcha = SliceCaptcha;
		window._CaptchaObj = _CaptchaObj;
	}
})();