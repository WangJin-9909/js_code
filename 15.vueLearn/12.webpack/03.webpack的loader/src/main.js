console.log("++++++++程序启动++++++++");

/*2.commonJs导入函数*/
const {add, mul} = require('./js/mathUtils')
/*2.使用es6导入*/
import {name} from './js/info'
/*3.调用commonJs导入的函数*/
console.log('调用commonJs导入的函数，结果为' + add(3, 4));
console.log('导入的name = ' + name);



//设置依赖css,需要为css添加Loader哦
require('./css/normal.css');
//或者使用es6提供的语法支持
//import css from './css/normal.css'



//设置依赖less文件
// require('./css/special.less');