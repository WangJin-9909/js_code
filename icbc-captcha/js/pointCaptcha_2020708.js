/*! author: qihailong*/

;(function ($, window, document) {
    "use strict";
    //定义Points的构造函数
    var PointCaptcha = function (divID, opt) {
        this.$element = $('#' + divID);

        this.defaults = {
            mode: 'fixed',//弹出式pop，固定fixed
            wordList: [],//图片上的文字信息 从服务器获取
            imageUrl: 'bgimg/demo1.jpeg',//背景图片URL 从服务器获取
            msgImageUrl: 'bgimg/demo1.jpeg',//提示信息图片URL 从服务器获取
            bgWidth: 300, //验证码背景图片的宽，宽度如果是% 是相对于手机屏幕宽
            bgHeight: 200,//验证码背景图片的高，高度如果是% 是相对于宽度
            barHeight: 24,//提示栏的高度
            bgMarginW: 12,//图片边缘留白的宽度
            barBgDistance: 2,//滑动条和验证框的距离
            bgColor: '#e4e4e4',//背景颜色
            message: {
                loading: '加载中...',
                checking: '正在验证 请稍等...',
                tip: '请顺序点击',//提示信息
                seccess: '验证成功',
                fail: '位置不正确',
                forbidden: '操作异常',
                error: '网络错误'
            },
            tipCanvas: false,//提示点击的文字 是否使用Canvas，如果是按语序点击文字 设置为false
            clientID: null,//用于加密
            useCanvas: true,//是否使用Canvas
            pointShape: 'circle',//点击标志的形状 circle square
            pointH: 20,//点击标志的圆圈直径 或 方形边长
            pointColor: '#1abd6c',//点击标志的颜色
            wordProperty: {
                textH: [15, 40],//最小/大文字高度
                alpha: [0.7, 0.9],//最小/大文字透明度
                rotate: [-Math.PI / 2, Math.PI / 2],//最小/大文字旋转角度
                usefuzzy: false,//模糊
                fontstyle: 'oblique',//是否斜体 normal不使用斜体 ---random随机
                bold: 'normal',//bold normal bolder 400 ---random随机
                fontfamily: ['microsoft yahei', 'arial'],//字体列表
                colorMode: 'autoColor',//selectColor选择一种颜色 autoColor从背景颜色选取 gradientColor颜色渐变
                selectColor: ['#FF0033', '#006699'],//colorMode=='selectColor'时有效，选取颜色列表
                autoColor: [90, 0, 0],//colorMode=='autoColor'时有效，和背景颜色的差异
                gradientColor: {direction: 8, colorList: ['#FF00FF', '#FFFF00', '#00FF00']}//colorMode=='gradientColor'时有效，颜色渐变
            },
            useDES3: true,//是否使用3DES加密
            useDeviceInfo: true,//是否获取设备信息
            needAgainNum: 2,//用户验证失败几次，需要重新拉取数据
            requestData: null,//请求初始化数据的函数
            sendData: null, //发送用户点选数据的函数
            ready: function () {
            },//验证码准备好了的回调函数
            checkResult: function (res) {
            }//用户验证结果的回调函数
            // success: function(){},//用户验证通过的回调函数
            // fail: function(){}//用户验证失败的回调函数
        },
            this.divID = divID;
        this.options = $.extend({}, this.defaults, opt);
        this.deviceType = 'Windows';
        this.choosePosList = [];
        this.htmlDoms = {};
        this.userIsCan = false;//用户是否可以操作，比如当加载中等时机 不能操作
        this.msgFontsize = 12;//提示文字的大小
        this.defaultNum = 4;//默认的文字数量
        this.checkNum = 3;//校对的文字数量
        this.errorNum = 0;//验证错误的次数
        this.keys = '';
        this.startTime = new Date().getTime();

        //对应ie6 ie7浏览器不支持 window.console
        if (!window.console) {
            window.console = {
                log: function () {
                },
                warn: function () {
                },
                error: function () {
                },
                info: function () {
                }
            };
        }

        this.init();
        this.code_color = ['#FF0033', '#006699', '#993366', '#FF9900', '#66CC66', '#FF33CC'];
    };

    //定义pointsVerify的方法
    PointCaptcha.prototype = {
        getVersion: function () {
            return '1.0.0';
        },
        init: function () {
            //检查参数数据有效性
            // var parentWidth = this.$element.parent().width() || $(window).width();
            if (typeof this.options.bgWidth == 'string') {
                if (this.options.bgWidth.indexOf('%') != -1) {
                    if (!this.isMobileDevice()) {
                        console.error('非移动端 宽度不可以使用百分比的方式！');
                        return;
                    }
                    // var screanW = document.documentElement.clientWidth || document.body.clientWidth;
                    var screanW = window.screen.width;//在webview中，如果预加载页面，webview没有显示，此时文档宽为0
                    screanW = screanW / window.devicePixelRatio;
                    this.options.bgWidth = parseInt(this.options.bgWidth) / 100 * screanW;
                } else {
                    this.options.bgWidth = parseInt(this.options.bgWidth);
                }
            }
            if (typeof this.options.bgHeight == 'string') {
                if (this.options.bgHeight.indexOf('%') != -1) {
                    this.options.bgHeight = parseInt(this.options.bgHeight) / 100 * this.options.bgWidth;
                } else {
                    this.options.bgHeight = parseInt(this.options.bgHeight);
                }
            }

            if (typeof this.options.wordProperty != 'object') {
                console.error('wordProperty 参数必须是对象！');
            }
            if (!this.options.wordProperty.textH || this.options.wordProperty.textH.length != 2) {
                console.error('textH 参数必须是长度为2的整型数组！');
            }
            if (!this.options.wordProperty.alpha || this.options.wordProperty.alpha.length != 2) {
                console.error('alpha 参数必须是长度为2的数组！');
            }
            if (!this.options.wordProperty.rotate || this.options.wordProperty.rotate.length != 2) {
                console.error('rotate 参数必须是长度为2的数组！');
            }
            if (!this.options.wordProperty.fontfamily || this.options.wordProperty.fontfamily.length <= 0) {
                console.error('fontfamily 参数必须是长度大于0的数组！');
            }
            if (this.options.wordProperty.colorMode == 'autoColor' && this.options.wordProperty.autoColor.length != 3) {
                console.error('colorMode为"autoColor"时，autoColor 参数必须是长度为3的数组！');
            }
            if (this.options.wordProperty.colorMode == 'selectColor' && this.options.wordProperty.selectColor.length <= 0) {
                console.error('colorMode为"selectColor"，selectColor 参数必须是长度大于0的数组！');
            }
            if (this.options.wordProperty.colorMode == 'gradientColor' && this.options.wordProperty.gradientColor.colorList.length < 2) {
                console.error('colorMode为"gradientColor"时，gradientColor.colorList 参数必须是长度大于1的数组！');
            }
            if (!this.options.clientID) {
                console.error('clientID 不能为空。');
                return "";
            }

            this.getDeviceType();
            this.checkBrowser();

            //加载页面
            this.loadDom();
            this.setUserEvent();

            this.initMouseTrack();

            this.refresh();

            var _this = this;
            if (this.options.mode == 'pop' && !this.isMobileDevice()) {
                this.$element[0].onmouseenter = function (e) {
                    _this.showImg();
                };
                this.$element[0].onmouseleave = function (e) {
                    _this.hideImg();
                };
                // this.$element.on('mouseenter', function(e){
                // 	_this.showImg();
                // });
                // this.$element.on('mouseleave', function(e){
                // 	_this.hideImg();
                // });

                // this.htmlDoms.ele_body.on('mouseover', function(e){
                // 	_this.showImg();
                // });
                // this.htmlDoms.ele_body.on('mouseout', function(e){
                // 	_this.hideImg();
                // });
            }
        },
        // setClientID: function(id) {
        // 	this.options.clientID = id;
        // },
        initMouseTrack: function () {
            try {
                if (mouseTrack) {
                    mouseTrack.initMouseTrack(this.divID);
                } else {
                    console.error('mouseTrack 未定义');
                }
            } catch (error) {
                console.error('mouseTrack.initMouseTrack 执行时出现了错误，详细信息如下：');
                console.log(error);
            }
        },
        clearMouseTrack: function () {
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
        getMouseTrack: function () {
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
            if (source == null) {
                return target
            }
            for (var k in source) {
                if (source[k] != null && target[k] !== source[k]) {
                    target[k] = source[k]
                }
            }
            return target
        },
        getDeviceInfo: function () {
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
        createKey: function (key1, key2) {
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
        DES3encrypt: function (key, str) {
            var des3en = "";
            // var base64en = "";
            try {
                des3en = DES3.encrypt(key, str);//已经自带了Base64转换 当IE8时 不支持btoa 则使用BASE64.js
            } catch (error) {
                console.error('加密时出现异常，详细信息如下：');
                console.log(error);
                return "";
            }
            // console.log(des3en)
            // try {
            // 	base64en = BASE64.encoder(des3en);
            // } catch (error) {
            // 	console.error('Base64转换时出现异常，详细信息如下：');
            // 	console.log(error);
            // }
            return des3en;
        },
        DES3decrypt: function (key, str) {
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
        getDeviceType: function () {
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
        isMobileDevice: function () {
            var platform = navigator.platform;
            if (platform.indexOf('Linux') >= 0 || platform.indexOf('iPhone') >= 0) {
                return true;
            } else {
                return false;
            }
        },
        checkBrowser: function () {
            var DEFAULT_VERSION = 8.0;
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("msie") > -1) {
                var safariVersion = ua.match(/msie ([\d.]+)/)[1];
                if (safariVersion <= DEFAULT_VERSION) {
                    this.options.useCanvas = false;
                }
                ;
            }
        },
        //加载页面
        loadDom: function () {
            var panelHtml = '';
            panelHtml += '<div id="verify-body" class="verify-border-radius" style="background-color: #e5e5e5">';
            panelHtml += '  <div id="verify-loading" style="width:100%; height:100%;">';
            panelHtml += '    <div style="height: 50%;"></div><div id="verify-loadingMsg" class="verify-noselect" style="text-align: center;"></div>';
            panelHtml += '  </div>';
            panelHtml += '  <div id="verify-img-panel" style="position: relative; margin:0;">';
            panelHtml += '    <div id="verify-refresh" style="z-index:3">';
            // panelHtml += '      <i class="iconfont"></i>';// icon-refresh
            panelHtml += '    </div>';
            panelHtml += '    <div id="verify-canvasbox" style="width: 100%; height: 100%;">';
            panelHtml += '      <canvas id="verify-canvas" width="' + this.options.bgWidth + '" height="' + this.options.bgHeight + '"></canvas>';
            panelHtml += '    </div>';
            panelHtml += '  </div>';
            panelHtml += '</div>';
            panelHtml += '<div id="verify-bar-area" style="position: relative;">';
            panelHtml += '  <div id="verify-track" class="verify-border-radius" style="width:100%; height:100%;">';
            panelHtml += '    <div id="verify-msg-left" class="verify-noselect" style="float:left;width:50%;"></div>';
            panelHtml += '    <div id="verify-msg-right" style="float:right;">';
            panelHtml += '      <canvas id="verify-msg-canvas" width="100" height="30"></canvas>';
            panelHtml += '    </div>';
            panelHtml += '  </div>';
            panelHtml += '</div>';

            this.$element.append(panelHtml);
            this.$element.attr("align", "left");//防止使用者在最外层加 align="center" 影响内部样式

            if (!this.options.useCanvas) {
                // var htmlsrc = '<div id="verify-canvas"';// class="verify-background-size"
                // htmlsrc += 'style="display:block;width: 100%; height: 100%; background-image: url(&quot;' + this.options.imageUrl + '&quot;); background-size: 100% 100%;"> ';
                // htmlsrc += '</div>'
                //var htmlsrc = '<img id="verify-canvas" width="' + this.options.bgWidth + '" height="' + this.options.bgHeight + '" src=""></img>';
                //var canvasdiv = document.getElementById('verify-canvasbox');
                //canvasdiv.innerHTML = htmlsrc;

                var htmlsrc = '<img id="verify-msg-canvas" width="100" height="30" src=""></img>';
                var msgRight = document.getElementById('verify-msg-right');
                msgRight.innerHTML = htmlsrc;
            }

            this.htmlDoms = {
                ele_loading: this.$element.find('#verify-loading'),
                ele_loadMsg: this.$element.find('#verify-loadingMsg'),
                ele_refresh: this.$element.find('#verify-refresh'),
                ele_body: this.$element.find('#verify-body'),
                ele_panel: this.$element.find('#verify-img-panel'),
                ele_canvas: this.$element.find('#verify-canvas')[0],
                ele_bar: this.$element.find('#verify-bar-area'),
                ele_track: this.$element.find('#verify-track'),
                ele_msgLeft: this.$element.find('#verify-msg-left'),
                ele_msgRight: this.$element.find('#verify-msg-right'),
                ele_msgCanvas: this.$element.find('#verify-msg-canvas')
            };

            this.$element.css('position', 'relative');
            this.$element.css({'width': (this.options.bgWidth + this.options.bgMarginW * 2) + 'px'});
            // 'height': (this.options.bgHeight+this.options.bgMarginW*2) + 'px'});
            if (this.options.mode == 'pop' && !this.isMobileDevice()) {
                this.htmlDoms.ele_body.css({
                    'display': 'none',
                    'position': 'absolute',
                    'bottom': (this.options.barHeight + this.options.barBgDistance) + 'px'
                });
            } else {
                this.htmlDoms.ele_body.css({'position': 'relative'});
                // this.$element.css({'padding': this.options.bgMarginW + 'px',
                // 									'border-radius': this.options.bgMarginW + 'px',
                // 									'background-color': this.options.bgColor + 'px'});
            }
            this.htmlDoms.ele_body.css({
                'height': parseInt(this.options.bgHeight) + 'px',
                'width': this.options.bgWidth + 'px',
                'padding': this.options.bgMarginW + 'px',
                'border-radius': this.options.bgMarginW + 'px',
                'background-color': this.options.bgColor
            });
            this.htmlDoms.ele_panel.css({
                'width': this.options.bgWidth + 'px',
                'height': this.options.bgHeight + 'px',
                'background-size': this.options.bgWidth + 'px ' + this.options.bgHeight + 'px',
                'margin-bottom': '0px'
            });
            this.htmlDoms.ele_bar.css({
                'left': this.options.bgMarginW + 'px',
                'width': this.options.bgWidth + 'px',
                'height': this.options.barHeight + 'px',
                'padding-top': this.options.barBgDistance + 'px',
                'line-height': this.options.barHeight + 'px'
            });
            // 'background-color': this.options.bgColor});
            this.htmlDoms.ele_track.css({'background-color': this.options.bgColor});
            this.htmlDoms.ele_msgLeft.css({'font-size': this.msgFontsize + 'px'});

            //禁止浏览器对图片的默认拖拽效果 IE7时onmousemove有效 其他浏览器onmousedown有效
            this.htmlDoms.ele_canvas.onmousedown = this.htmlDoms.ele_canvas.onmousemove = function (e) {
                var e = e || window.event;
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }
            this.setEleCannotselect(this.htmlDoms.ele_loadMsg[0]);
            this.setEleCannotselect(this.htmlDoms.ele_msgLeft[0]);
        },
        showLoading: function (isShow) {
            if (isShow) {
                this.htmlDoms.ele_loading.show();
                this.htmlDoms.ele_panel.hide();
                // this.htmlDoms.ele_panel.css({'height': '0px'});
            } else {
                this.htmlDoms.ele_loading.hide();
                this.htmlDoms.ele_panel.show();
                // this.htmlDoms.ele_panel.css({'height': this.options.bgHeight + 'px'});
            }
        },
        //设置显示的消息
        setMessage: function (msg1, msg2) {
            if (msg2) {
                this.htmlDoms.ele_msgLeft.css({'width': '50%', 'text-align': 'right'});
                this.htmlDoms.ele_msgCanvas.css({'display': 'block'});
                this.htmlDoms.ele_msgLeft.text(msg1);
                if (this.options.useCanvas) {
                    var ctx = this.htmlDoms.ele_msgCanvas[0].getContext("2d");
                    ctx.clearRect(0, 0, this.options.bgWidth / 2, this.options.barHeight);
                    var font = 'italic small-caps bold {0}px microsoft yahei';
                    ctx.font = font.replace("{0}", this.msgFontsize);
                    ctx.fillStyle = this.code_color[1];
                    ctx.fillText(msg2, 0, this.options.barHeight / 2 + this.msgFontsize / 2);
                } else {
                    var msgImage = this.htmlDoms.ele_msgCanvas[0];
                    msgImage.src = this.options.msgImageUrl;
                }
            } else {
                this.htmlDoms.ele_msgLeft.css({'width': '100%', 'text-align': 'center', 'margin-left': ''});
                this.htmlDoms.ele_msgCanvas.css({'display': 'none'});
                this.htmlDoms.ele_msgLeft.text(msg1);
            }
        },
        setLoadMessage: function (msg) {
            this.htmlDoms.ele_loadMsg.text(msg);
        },
        //设置点选 刷新 响应事件
        setUserEvent: function () {
            var _this = this;
            //点击事件比对
            _this.htmlDoms.ele_panel.on('click', function (e) {
                if (!_this.userIsCan) return;

                var pos = _this.getMousePos(this, e);
                var indexPos = _this.isPointChoose(pos);
                if (indexPos >= 0) {
                    _this.deletePoint(indexPos);
                } else {
                    _this.choosePosList.push(pos);
                    _this.createPoint(pos);
                }
                if (indexPos < 0 && _this.choosePosList.length == 1) {//是 添加选点 并且选点列表中仅一个元素
                    _this.startTime = new Date().getTime();
                }

                if (_this.choosePosList.length >= _this.checkNum) {
                    try {
                        if (!_this.options.sendData) {
                            console.error('必须定义 sendData() 函数，以便向服务器发送数据。');
                            return;
                        }
                        var totalTime = new Date().getTime() - _this.startTime;
                        var successMsg = Math.round(totalTime / 100) / 10 + '秒完成';
                        // var jsonRes = JSON.stringify(_this.choosePosList);
                        _this.setUserCanOperation(false);
                        _this.setMessage(_this.options.message.checking);
                        if (_this.isMobileDevice()) {
                            try {
                                var sensorData = sensor.getData();
                                sensor.destroySensor();
                            } catch (error) {
                                console.error('sensor.js 获取传感器信息出错');
                            }
                        }
                        var resData = {
                            deviceInfo: _this.options.useDeviceInfo ? _this.getDeviceInfo() : undefined,
                            mouseInfo: _this.getMouseTrack(),
                            motion: _this.isMobileDevice() ? sensorData : undefined,
                            isMobile: _this.isMobileDevice(),
                            captchaInfo: _this.choosePosList,
                            captchaType: 'point_check'
                        }
                        resData = JSON.stringify(resData);
                        if (_this.options.useDES3) {
                            resData = _this.DES3encrypt(_this.createKey(_this.options.clientID, _this.keys), resData);
                        }
                        _this.options.sendData(resData, function (res) {
                            var resObj = {
                                Data: 'success'
                            }
                            if (res == 'SUCCESS') {
                                resObj.Data = 'success';
                            } else if (res == 'ERROR_1') {
                                resObj.Data = 'fail';
                            } else if (res == 'ERROR_2') {
                                resObj.Data = 'forbid';
                            } else {
                                resObj.Data = 'forbid';
                            }
                            // var resJson = JSON.stringify(resObj);

                            try {
                                // var resObj = JSON.parse(res);
                                var flag = resObj.Data;
                            } catch (error) {
                                console.error('解析服务器端返回的数据出错，错误信息如下：');
                                console.log(error);
                                return;
                            }
                            _this.checkSuccessOrFail(flag, successMsg);
                        });
                    } catch (error) {
                        console.error('执行 sendData() 函数时出错，错误信息如下：');
                        console.log(error);
                    }
                }
            });
            //刷新
            // _this.htmlDoms.ele_refresh.show();
            _this.htmlDoms.ele_refresh.on('click', function () {
                // if (!_this.userIsCan) return;
                _this.refresh();
            });
            // } else {
            // 	// _this.htmlDoms.ele_refresh.hide();
            // 	_this.htmlDoms.ele_refresh.unbind('click');
            // 	_this.htmlDoms.ele_panel.unbind('click');
            // }
        },
        //设置用户是否可以操作
        setUserCanOperation: function (isCan) {
            if (isCan) {
                //点击事件比对
                this.htmlDoms.ele_refresh.show();
            } else {
                this.htmlDoms.ele_refresh.hide();
            }
            this.userIsCan = isCan;
        },
        //更新背景图片
        updateBGImage: function (imgUrl) {
            try {
                var _this = this;
                var img = new Image();
                console.log("imgUrl = " + imgUrl);
                img.src = imgUrl;

                console.dir(this);
                var sequence = "";
                //---------

                //增加canvas
                img.onload = function () {
                    $.ajax({
                        type: 'get',
                        url: serverUrl + '?param=' + JSON.stringify({
                            captchaType: 'point_image_seq',
                            timeStamp: new Date()
                        }),
                        timeout: 5000,
                        success: function (res) {
                            console.log("获取图片顺序成功    " + res);
                            sequence = res;
                            console.log("图片顺序是：  = " + sequence);
                            // 加载完成开始绘制
                            if (!_this.options.useCanvas) {
                                // _this.drawImage_NoCanvas(img);
                                _this.drawImageOnCanvas(img, sequence);
                            } else {
                                if (img.complete) {
                                    //       _this.drawImage(img);
                                    //_this.drawImageOnCanvas(img);

                                } else {
                                    $(img).on('load', function (e) {
                                        //         _this.drawImage(this);
                                        //   _this.drawImageOnCanvas(img);
                                        //  _this.showLoading(false);
                                    });
                                }
                            }


                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log("获取图片顺序失败");
                        }
                    });


                    /* // 加载完成开始绘制
                     if (!_this.options.useCanvas) {
                         // _this.drawImage_NoCanvas(img);
                         _this.drawImageOnCanvas(img, sequence);
                     } else {
                         if (img.complete) {
                             //       _this.drawImage(img);
                             //_this.drawImageOnCanvas(img);

                         } else {
                             $(img).on('load', function (e) {
                                 //         _this.drawImage(this);
                                 //   _this.drawImageOnCanvas(img);
                                 //  _this.showLoading(false);
                             });
                         }
                     }*/
                };


            } catch (error) {
                console.error('加载图片出错，错误信息如下：');
                console.log(error);
            }
        },

        //绘制合成的图片
        drawImage_NoCanvasNew: function (img) {
            var canvasbox = document.getElementById('verify-canvas');
            canvasbox.src = this.options.imageUrl;
            // canvasbox.style.backgroundImage = "url('" + img.src + "')";//'url(&quot;' + img.src + '&quot;);';
            canvasbox.className = "verify-background-size";
            var canvasmsg = document.getElementById('verify-msg-canvas');
            canvasmsg.src = this.options.msgImageUrl;
            canvasmsg.className = "verify-background-size";
        },

        drawImageOnCanvas: function (img, sequence) {
            //准备canvas环境
            var canvas = document.getElementById('verify-canvas');
            console.dir(canvas);
            canvas.width = 300;
            canvas.height = 200;
            var context = canvas.getContext("2d");
            context.rect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "#fff";
            context.fill();
            console.log("seq = " + sequence);
            for (var i = 0; i < 10; i++) {
                //des 根据sequence决定
                var des_x = Math.floor(sequence.charAt(i) / 2) * 60;
                var des_y = (sequence.charAt(i) % 2) * 100;
                //src，根据当前 i 决定
                var src_x = Math.floor(i / 2) * 60;
                var src_y = (i % 2) * 100;
                context.drawImage(img, src_x, src_y, 60, 100, des_x, des_y, 60, 100);
            }

            //绘制提示文字
            var canvasmsg = document.getElementById('verify-msg-canvas');
            canvasmsg.src = this.options.msgImageUrl;
            canvasmsg.className = "verify-background-size";

        },
        //------------
        //更新背景图片的备份代码
        /*updateBGImage : function(imgUrl) {
            try {
                var _this = this;
                var img = new Image();
                img.src = imgUrl;
                // 加载完成开始绘制
                if (!_this.options.useCanvas) {
                    _this.drawImage_NoCanvas(img);
                } else {
                    if (img.complete) {
                        _this.drawImage(img);
                    } else {
                        $(img).on('load', function(e) {
                            _this.drawImage(this);
                            // _this.showLoading(false);
                        });
                    }
                }
            } catch (error) {
                console.error('加载图片出错，错误信息如下：');
                console.log(error);
            }
        },*/
        //------------
        //根据从服务器获取的数据 更新界面
        updateDataFromServer: function () {
            try {
                if (!this.options.requestData) {
                    console.error('必须定义 requestData() 函数，以便从服务器获取数据。');
                    return;
                }
                this.errorNum = 0;
                this.setUserCanOperation(false);
                this.setLoadMessage(this.options.message.loading);
                this.setMessage(this.options.message.loading);
                var paramObj = {
                    width: this.options.bgWidth,
                    height: this.options.bgHeight
                }
                var _this = this;
                this.options.requestData(paramObj, function (res) {
                    _this.analysisParam(res);

                    _this.initWordList();
                    _this.showLoading(false);
                    _this.updateBGImage(_this.options.imageUrl);
                    _this.setUserCanOperation(true);
                    _this.setUserOperationMsg();

                    try {
                        _this.options.ready();
                    } catch (error) {
                        console.error('执行 ready() 函数时出错，错误信息如下：');
                        console.log(error);
                    }
                }, function (error) {
                    _this.setLoadMessage(this.options.message.error);
                    _this.setMessage(this.options.message.error);
                });
            } catch (error) {
                console.error('执行 requestData() 函数时出错，错误信息如下：');
                console.log(error);
            }
        },

        //解析从服务器获取的参数
        analysisParam: function (res) {
            try {
                var jsonData = JSON.parse(res);
                if (this.options.useDES3) {
                    jsonData.data = this.DES3decrypt(this.createKey(this.options.clientID), jsonData.data);
                }
                jsonData.data = JSON.parse(jsonData.data);
            } catch (error) {
                console.error('JSON解析服务器参数出错。');
                return;
            }
            this.keys = jsonData.data.keys;
            this.options.imageUrl = jsonData.imageUrl;
            this.options.msgImageUrl = jsonData.msgImageUrl;
            if (!this.options.imageUrl) {
                console.error("imageUrl 不能为空");
                return;
            }
            if (!this.options.msgImageUrl && this.options.tipCanvas && !this.options.useCanvas) {
                console.error("msgImageUrl 不能为空");
                return;
            }
            this.checkNum = 0;
            var jsonObjArray = [];
            var _this = this;
            var textH = this.options.wordProperty.textH[1] / 2;
            // jsonData.pointArray
            // jsonData.pointArray.forEach(function(word) {
            for (var i = 0; i < jsonData.data.pointArray.length; i++) {
                var word = jsonData.data.pointArray[i];
                if (this.options.useCanvas) {
                    if (_this.options.bgHeight - textH < word.pointY || textH > word.pointY ||
                        _this.options.bgWidth - textH < word.pointX || textH > word.pointX) {
                        console.error('该点范围不可以超出边界：' + word.txt + '(' + word.pointX + ',' + word.pointY + ')');
                    }
                }
                var obj = {
                    isUse: word.isCheck == 1,
                    posx: word.pointX,
                    posy: word.pointY,
                    text: word.txt
                }
                jsonObjArray.push(obj);

                _this.checkNum = obj.isUse ? _this.checkNum + 1 : _this.checkNum;
            }
            ;
            this.options.wordList = jsonObjArray;
        },

        //判断一个点是否已经被选中
        isPointChoose: function (pos) {
            for (var i = 0; i < this.choosePosList.length; i++) {
                if (Math.abs(pos.x - this.choosePosList[i].x) < this.options.pointH / 3 * 2 &&
                    Math.abs(pos.y - this.choosePosList[i].y) < this.options.pointH / 3 * 2) {
                    return i;
                }
            }
            ;
            return -1;
        },

        //验证成功或失败的动作
        checkSuccessOrFail: function (res, successMsg) {
            if (res == 'success') {	//验证成功
                this.htmlDoms.ele_track.css({'color': '#4cae4c', 'border-color': '#5cb85c'});
                this.setMessage(successMsg + ',' + this.options.message.seccess);
            } else if (res == 'fail') {	//验证失败
                this.htmlDoms.ele_track.css({'color': '#d9534f', 'border-color': '#d9534f'});
                this.setMessage(this.options.message.fail);
            } else {
                this.htmlDoms.ele_track.css({'color': '#d953ff', 'border-color': '#d953ff'});
                this.setMessage(this.options.message.forbidden);
            }

            try {
                this.options.checkResult(res);
            } catch (error) {
                console.error('执行 checkResult() 函数时出错，错误信息如下：');
                console.log(error);
            }
            if (res == 'success') {
                //成功时 什么都不做
            } else {
                this.errorNum = this.errorNum + 1;
                var _this = this;
                setTimeout(function () {
                    _this.htmlDoms.ele_track.css({'color': '#000', 'border-color': '#ddd'});
                    if (_this.options.needAgainNum <= _this.errorNum) {
                        _this.refresh();
                    } else {
                        _this.deletePoint(0);
                        _this.setUserOperationMsg();
                        _this.setUserCanOperation(true);
                    }
                }, 1000);
            }
        },

        //如果没有传文字，随机选择几个文字
        initWordList: function () {
            if (this.options.wordList.length > 0) {
                return;
            }
            var avg = Math.floor(parseInt(this.options.bgWidth) / (parseInt(this.defaultNum) + 1));
            var fontStr = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩体率宾归王';	//不重复的汉字
            var fontChars = [];
            for (var i = 1; i <= this.defaultNum; i++) {
                var text = this.getChars(fontStr, fontChars);
                var tmp_index = Math.floor(Math.random() * 3);

                if (Math.floor(Math.random() * 2) == 1) {
                    var tmp_y = Math.floor(parseInt(this.options.bgHeight) / 2) + tmp_index * 20 + 20;
                } else {
                    var tmp_y = Math.floor(parseInt(this.options.bgHeight) / 2) - tmp_index * 20;
                }
                var tmp_x = avg * i;
                fontChars.push({
                    text: text,
                    posx: tmp_x,
                    posy: tmp_y,
                    isUse: i == 2
                });
            }
            this.options.wordList = fontChars;
        },

        //绘制合成的图片
        drawImage: function (img) {
            //准备canvas环境
            var canvas = this.htmlDoms.ele_canvas;
            var ctx = canvas.getContext("2d");

            ctx.clearRect(0, 0, parseInt(this.options.bgWidth), parseInt(this.options.bgHeight));
            // 绘制图片
            ctx.drawImage(img, 0, 0, parseInt(this.options.bgWidth), parseInt(this.options.bgHeight));

            // 绘制水印
            // var fontSizeArr = ['italic small-caps bold 20px microsoft yahei', 'small-caps normal 25px arial', '34px microsoft yahei'];
            var fontTypeArr = ['italic small-caps bold {0}px microsoft yahei', 'small-caps normal {0}px arial', '{0}px microsoft yahei'];

            for (var i = 0; i < this.options.wordList.length; i++) {
                // if(!this.options.wordList[i].isUse)
                // 	continue;
                ctx.save();//先保存状态
                var word = this.options.wordList[i];

                //字体：斜体 加粗 字号 字体
                var fontsize = this.options.wordProperty.textH[0] + Math.floor(Math.random() * (this.options.wordProperty.textH[1] - this.options.wordProperty.textH[0]));
                var tmp_index = Math.floor(Math.random() * 3);
                var font = fontTypeArr[tmp_index].replace("{0}", fontsize);
                if (this.options.wordProperty.fontstyle == 'random') {
                    var style = Math.random() > 0.5 ? 'oblique ' : 'normal ';
                } else {
                    var style = this.options.wordProperty.fontstyle + ' ';
                }
                if (this.options.wordProperty.bold == 'random') {
                    var bold = Math.random() > 0.5 ? 'bold ' : 'normal ';
                } else {
                    var bold = this.options.wordProperty.bold + ' ';
                }
                var fontfamily = this.options.wordProperty.fontfamily[Math.floor(Math.random() * this.options.wordProperty.fontfamily.length)];
                font = style;//italic oblique
                font += 'normal ';//small-caps小型大写字母字体
                font += bold;//bold bolder lighter 数字(400等同于normal,700等同于bold)
                font += fontsize + 'px ';//字号
                font += fontfamily;//字体
                ctx.font = font;
                //透明度
                var alpha = this.options.wordProperty.alpha[0] + Math.random() * (this.options.wordProperty.alpha[1] - this.options.wordProperty.alpha[0]);
                ctx.globalAlpha = alpha;
                //旋转
                ctx.translate(word.posx, word.posy);
                var rotate = this.options.wordProperty.rotate[0] + Math.random() * (this.options.wordProperty.rotate[1] - this.options.wordProperty.rotate[0])
                ctx.rotate(rotate);//0.01*Math.PI

                //颜色
                if (this.options.wordProperty.colorMode == 'gradientColor') {
                    var grd = ctx.createLinearGradient(-fontsize / 2,
                        fontsize / 2,
                        fontsize / 2,
                        -fontsize / 2);
                    grd.addColorStop(0, this.options.wordProperty.gradientColor.colorList[0]);
                    if (this.options.wordProperty.gradientColor.colorList.length == 2) {
                        grd.addColorStop(1, this.options.wordProperty.gradientColor.colorList[1]);
                    } else {
                        grd.addColorStop(0.5, this.options.wordProperty.gradientColor.colorList[1]);
                        grd.addColorStop(1, this.options.wordProperty.gradientColor.colorList[2]);
                    }
                    ctx.fillStyle = grd;//strokeStyle空心
                } else if (this.options.wordProperty.colorMode == 'selectColor') {
                    var colorIndex = Math.floor(Math.random() * this.options.wordProperty.selectColor.length);
                    ctx.fillStyle = this.options.wordProperty.selectColor[colorIndex];
                } else {//if (this.options.wordProperty.colorMode == 'autoColor') {
                    var num = 4;//选取num个点
                    var range = this.options.wordProperty.textH[0];
                    var red = 0;
                    var green = 0;
                    var blue = 0;
                    for (var n = 0; n < num; n++) {
                        var randomX = Math.random() * range - range / 2;
                        var randomY = Math.random() * range - range / 2;
                        var c = ctx.getImageData(word.posx + randomX, word.posy + randomY, 1, 1).data;
                        red += c[0];
                        green += c[1];
                        blue += c[2];
                    }
                    red = red / num;
                    green = green / num;
                    blue = blue / num;

                    // var change = this.options.wordProperty.autoColor;
                    var red2 = red > 128 ? red - this.options.wordProperty.autoColor[0] : red + this.options.wordProperty.autoColor[0];
                    var green2 = green > 128 ? green - this.options.wordProperty.autoColor[1] : green + this.options.wordProperty.autoColor[1];
                    var blue2 = blue > 128 ? blue - this.options.wordProperty.autoColor[2] : blue + this.options.wordProperty.autoColor[2];
                    ctx.fillStyle = "RGB(" + red2 + ", " + green2 + ", " + blue2 + ")";
                }
                // ctx.transform(1, 0, 0.5, 1, 1 ,1);

                // ctx.rect(word.posx - fontsize/2, word.posy - fontsize/2, fontsize, fontsize);
                // ctx.stroke();
                ctx.fillText(word.text, -fontsize / 2, fontsize / 2);
                //模糊
                if (this.options.wordProperty.usefuzzy) {
                    ctx.globalAlpha = alpha / 1.5;
                    ctx.fillText(word.text, -fontsize / 2 - 2, fontsize / 2 - 2);
                    ctx.globalAlpha = alpha / 2.5;
                    ctx.fillText(word.text, -fontsize / 2 - 4, fontsize / 2 - 4);
                    ctx.globalAlpha = alpha / 5;
                    ctx.fillText(word.text, -fontsize / 2 - 8, fontsize / 2 - 8);
                }
                ctx.restore(); //还原到保存前的状态
            }
        },
        //绘制合成的图片
        drawImage_NoCanvas: function (img) {
            var canvasbox = document.getElementById('verify-canvas');
            canvasbox.src = this.options.imageUrl;
            // canvasbox.style.backgroundImage = "url('" + img.src + "')";//'url(&quot;' + img.src + '&quot;);';
            canvasbox.className = "verify-background-size";
            var canvasmsg = document.getElementById('verify-msg-canvas');
            canvasmsg.src = this.options.msgImageUrl;
            canvasmsg.className = "verify-background-size";
        },
        //--------------------
        /*//绘制合成的图片
        drawImage_NoCanvas: function (img) {
            var canvasbox = document.getElementById('verify-canvas');
            canvasbox.src = this.options.imageUrl;
            // canvasbox.style.backgroundImage = "url('" + img.src + "')";//'url(&quot;' + img.src + '&quot;);';
            canvasbox.className = "verify-background-size";
            var canvasmsg = document.getElementById('verify-msg-canvas');
            canvasmsg.src = this.options.msgImageUrl;
            canvasmsg.className = "verify-background-size";
        },*/
        //--------------------
        setUserOperationMsg: function () {
            var msgStr = '';
            for (var i = 0; i < this.options.wordList.length; i++) {
                if (this.options.wordList[i].isUse) {
                    msgStr += this.options.wordList[i].text + ',';
                }
            }
            if (this.options.tipCanvas) {
                this.setMessage(this.options.message.tip, '【' + msgStr.substring(0, msgStr.length - 1) + '】');
                // this.htmlDoms.ele_msgLeft.text('请顺序点击【' + msgStr.substring(0,msgStr.length-1) + '】');
            } else {
                this.setMessage(this.options.message.tip);
                this.htmlDoms.ele_msgLeft.css({'width': '', 'margin-left': '20%'});
                this.htmlDoms.ele_msgCanvas.css({'display': '', 'margin-top': '-8px'});
                this.htmlDoms.ele_msgRight.css({'float': 'left'});
                //this.setMessage(this.options.message.tip + '【' + msgStr.substring(0,msgStr.length-1) + '】');
                // this.setMessage('请按语序点击下图文字');
            }
        },

        //获取坐标
        getMousePos: function (obj, event) {
            var e = event || window.event;
            var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
            var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
            var x = e.clientX - ($(obj).offset().left - $(window).scrollLeft());
            var y = e.clientY - ($(obj).offset().top - $(window).scrollTop());
            return {'x': x, 'y': Math.round(y)};
        },

        //递归去重
        getChars: function (fontStr, fontChars) {
            var tmp_rand = parseInt(Math.floor(Math.random() * fontStr.length));
            if (tmp_rand > 0) {
                tmp_rand = tmp_rand - 1;
            }

            var tmp_char = fontStr.charAt(tmp_rand);
            if ($.inArray(tmp_char, fontChars) == -1) {
                return tmp_char;
            } else {
                return PointCaptcha.prototype.getChars(fontStr, fontChars);
            }
        },

        //洗牌数组
        shuffle: function (arr) {
            var m = arr.length, i;
            var tmpF;
            while (m) {
                i = (Math.random() * m--) >>> 0;
                tmpF = arr[m];
                arr[m] = arr[i];
                arr[i] = tmpF;
                //[arr[m], arr[i]] = [arr[i], arr[m]];	//低版本浏览器不支持此写法
            }
            return arr;
        },

        //创建坐标点
        createPoint: function (pos) {
            var num = this.choosePosList.length;
            var pointHtml = '<div class="verify-area verify-border-radius verify-noselect" style="color:#fff; z-index:9999; text-align:center; position:absolute; border:1.5px solid #ffffff;';
            pointHtml += this.options.pointShape == 'square' ? '' : 'border-radius:50%;';//border-radius:50%;
            pointHtml += 'background-color:' + this.options.pointColor + ';';//background-color:#1abd6c;
            pointHtml += 'width:' + this.options.pointH + 'px;';
            pointHtml += 'height:' + this.options.pointH + 'px;';
            pointHtml += 'line-height:' + this.options.pointH + 'px;';
            pointHtml += 'top:' + parseInt(pos.y - this.options.pointH / 2) + 'px;';
            pointHtml += 'left:' + parseInt(pos.x - this.options.pointH / 2) + 'px;';
            pointHtml += '">' + num + '</div>';
            this.htmlDoms.ele_panel.append(pointHtml);
            // var pointList = document.getElementsByClassName('verify-area');
            // this.setEleCannotselect(pointList[pointList.length-1]);
        },

        //清除坐标点
        deletePoint: function (index) {
            if (index < 0) index = 0;
            for (; this.choosePosList.length >= index + 1;) {
                this.choosePosList.pop();
            }
            var findList = this.$element.find('.verify-area');//document.getElementsByClassName('verify-area');
            for (var i = findList.length - 1; i >= 0; i--) {
                var element = findList[i];
                if (element.innerHTML >= index + 1) {
                    element.parentNode.removeChild(element);
                }
            }
            ;
        },

        //清除所有坐标点
        clearPoint: function () {
            this.$element.find('.verify-area').remove();
        },

        //弹出式
        showImg: function () {
            this.htmlDoms.ele_body.css({'display': 'block'});
        },
        //固定式
        hideImg: function () {
            this.htmlDoms.ele_body.css({'display': 'none'});
        },

        //刷新
        refresh: function () {
            if (this.isMobileDevice()) {
                try {
                    sensor.initSensor();
                    sensor.start();
                } catch (error) {
                    console.error('sensor.js 增加传感器监听出错');
                }
            }
            this.deletePoint(0);
            this.clearMouseTrack();

            this.showLoading(true);
            this.updateDataFromServer();
        },
        setEleCannotselect: function (element) {
            if (typeof(element.onselectstart) != "undefined") {
                // IE下禁止元素被选取
                element.onselectstart = new Function("return false");
            } else {
                // firefox下禁止元素被选取的变通办法 ---目前用CSS样式控制 不需要这个方法
                // element.onmousedown = new Function("return false");
                // element.onmouseup = new Function("return true");
            }
        }
    };

    if (typeof exports == "object") {
        module.exports = PointCaptcha;
    } else if (typeof define == "function" && define.amd) {
        define([], function () {
            return PointCaptcha;
        });
    } else if (window) {
        window.PointCaptcha = PointCaptcha;
    }

    // //在插件中使用clickVerify对象
    // $.fn.PointCaptcha = function(divID, options) {
    // 	var points = new Points(divID, options);
    // 	points.init();
    // };
})(jQuery, window, document);
