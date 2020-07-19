const path = require('path');//定义变量，该path属于模块，需要在工程目录下使用npm init初始化
module.exports = {
    entry: './src/main.js', /*添加要解析的文件*/
    output:{
        path:path.resolve(__dirname,  'dist'),/*使用特殊语法拼接的绝对路径*/
        filename:'bundle.js'/*文件名*/
    }/*添加要解析的文件*/
}