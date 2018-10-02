//引入mysql模块
const mysql = require('mysql');
//创建连接
const connection = mysql.createConnection({
    host: 'localhost', // 主机名
    user: 'root', // 用户名
    password: 'root', // 密码
    database: 'admin' // 数据库的名字
});
//暴露出去
module.exports = connection;