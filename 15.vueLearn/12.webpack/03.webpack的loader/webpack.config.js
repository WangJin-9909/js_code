const path = require('path');//定义变量，该path属于模块，需要在工程目录下使用npm init初始化
module.exports = {
    entry: './src/main.js', /*添加要解析的文件*/
    output: {
        path: path.resolve(__dirname, 'dist'), /*使用特殊语法拼接的绝对路径*/
        filename: 'bundle.js'/*文件名*/
    }, /*添加要解析的文件*/
    //添加css的支持
    module: {
        rules: [
            {
                test: /\.css$/,//正则表达式匹配css文件
                //css-loader只负责css文件加载，不负责解析，要解析需要使用style-loader
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader'
                }


                ]//使用loader
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                strictMath: true,
                            },
                        },
                    }]
            },
            {
                test: /\.(png|jpg|gif)$/,//匹配png/jpg/gif格式图片
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,//图片小于8KB时候将图片转成base64字符串，大于8KB需要使用file-loader
                            name: 'img/[name].[hash:8].[ext]'//img表示文件父目录，[name]表示文件名,[hash:8]表示将hash截取8位[ext]表示后缀
                        }
                    }
                ]
            },

        ]


    }


}