console.log("++++++++程序启动++++++++");

/*2.commonJs导入函数*/
const {add, mul} = require('./mathUtils')
/*2.使用es6导入*/
import {name} from './info'
/*3.调用commonJs导入的函数*/
console.log('调用commonJs导入的函数，结果为' + add(3, 4));
console.log('导入的name = ' + name);
