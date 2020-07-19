# webpack：

## P77：webpack基本使用

dist：目标目录，打包后的js文件一般放在此处

src：源码目录

- main.js作为js的入口文件，一般放在js根目录中，作为引用其它js文件的js主文件，main.js文件导入了其它文件中的函数，被引用其它js文件放在相应的功能目录中

- main.js中引入其它js文件中的相关函数，通过webpack将main.js打包成bundle.js(文件名任意)，一般将bundle.js打包到dist目录里，最终被html包含

### webpack打包步骤：

- 在项目根目录下，使用下面命令，使用webpack将main.js打包进bundle.js文件中，webpack会自动处理模块间的依赖

```
webpack ./src/main.js ./dist/bundle.js
```



### webpack配置

1.根目录下创建webpack.config.js

```
const path = require('path');//定义变量，该path属于模块，需要在工程目录下使用npm init初始化
module.exports = {
    entry: './src/main.js', /*添加要解析的文件*/
    output:{
        path:path.resolve(__dirname,  'dist'),/*使用特殊语法拼接的绝对路径*/
        filename:'bundle.js'/*文件名*/
    }/*添加要解析的文件*/
}
```

2.根目录下执行执行webpack，即可以打包js文件

3.在package.json中的script下创建条目

```
"test": "echo \"Error: no test specified\" && exit 1",
"build": "webpack
```

即可使用npm run build打包

4.注意此种方式的执行，webpack执行的是Local的，与环境变量中的webpack存在差异,使用下面命令进行本地的webpack安装

```
npm install webpack@3.6.0 --save-dev
```



## P78:webpack中CSS

将css当成模块打包进bundl.js中

1.在main.js中添加依赖

```
require('./css/normal.css');
```

2.设置css的loader，安装npm install --save-dev css-loader 、npm install --save-dev style-loader

后面步骤暂时 懒得记





## P79:less文件处理

less、scss、stylus为CSS预处理器也可以编写样式

安装less文件的相关工具：

```
npm install less-loader less  --save-dev
```

loader很多