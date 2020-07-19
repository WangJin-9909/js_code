
/*定义在其它文件中的函数*/
function add(num1, num2) {
    return num1 + num2;
}


function mul(num1, num2) {
    return num1 * num2;
}

/*1.使用commonJs导出相关函数*/
module.exports = {
    add,
    mul
}
