function merge3() {
    var canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    var context = canvas.getContext("2d");
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.fill();
    var myImage = new Image();
    // myImage.src = "img/demo_1.png";  //背景图片 你自己本地的图片或者在线图片
    myImage.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img0.jpg";  //背景图片 你自己本地的图片或者在线图片
    /*myImage.crossOrigin = 'Anonymous';*/
    myImage.onload = function () {
        context.drawImage(myImage, 0, 0, 100, 100);
        var myImage2 = new Image();
        // myImage2.src = "img/demo_2.png";  //你自己本地的图片或者在线图片
        myImage2.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img1.jpg";  //你自己本地的图片或者在线图片
        /*myImage2.crossOrigin = 'Anonymous';*/
        myImage2.onload = function () {
            context.drawImage(myImage2, 100, 0, 100, 100);
            var myImage3 = new Image();
            // myImage3.src = "img/demo_3.png";  //你自己本地的图片或者在线图片
            myImage3.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img2.jpg";  //你自己本地的图片或者在线图片
            /*myImage3.crossOrigin = 'Anonymous';*/
            myImage3.onload = function () {
                context.drawImage(myImage3, 200, 0, 100, 100);
                var myImage4 = new Image();
                // myImage4.src = "img/demo_4.png";  //你自己本地的图片或者在线图片
                myImage4.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img3.jpg";  //你自己本地的图片或者在线图片
                /*myImage4.crossOrigin = 'Anonymous';*/
                myImage4.onload = function () {
                    context.drawImage(myImage4, 0, 100, 100, 100);
                    var myImage5 = new Image();
                    // myImage5.src = "img/demo_5.png";  //你自己本地的图片或者在线图片
                    myImage5.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img4.jpg";  //你自己本地的图片或者在线图片
                    /*myImage5.crossOrigin = 'Anonymous';*/
                    myImage5.onload = function () {
                        context.drawImage(myImage5, 100, 100, 100, 100);
                        var myImage6 = new Image();
                        //myImage6.src = "img/demo_6.png";  //你自己本地的图片或者在线图片
                        myImage6.src = "https://192.168.0.100:8443/TestHttpProtocolNew/img_out/img5.jpg";  //你自己本地的图片或者在线图片
                        /*myImage6.crossOrigin = 'Anonymous';*/
                        myImage6.onload = function () {
                            context.drawImage(myImage6, 200, 100, 100, 100);

                            var base64 = canvas.toDataURL("image/png"); //"image/png" 这里注意一下
                            var img = document.getElementById('avatar');
                            // document.getElementById('avatar').src = base64;
                            img.setAttribute('src', base64);
                        };


                    };


                };


            }

        }
    }
}


/**
 * 2张图片合成
 */
function drawAndShareImage() {
    var canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    var context = canvas.getContext("2d");
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.fill();
    var myImage = new Image();
    myImage.src = "img/demo_left.png";  //背景图片 你自己本地的图片或者在线图片

    myImage.crossOrigin = 'Anonymous';
    myImage.onload = function () {
        context.drawImage(myImage, 100, 0, 150, 200);
        //context.drawImage(myImage, 50, 20, 100, 100, 0, 0, 100, 200);
        var myImage2 = new Image();
        myImage2.src = "img/demo_rigth.png";  //你自己本地的图片或者在线图片

        myImage2.crossOrigin = 'Anonymous';
        myImage2.onload = function () {
            //context.drawImage(myImage2, 150, 0, 150, 200);
            var base64 = canvas.toDataURL("image/png"); //"image/png" 这里注意一下
            var img = document.getElementById('avatar');
            // document.getElementById('avatar').src = base64;
            img.setAttribute('src', base64);
        }
    }
}