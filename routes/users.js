var express = require('express');
var router = express.Router();
//引入数据库模块
const connection = require('./conn');
//调用连接方法
  connection.connect(()=>{
    console.log('数据库已连接上');
  });
 /* 接收添加用户账号的请求 */
router.post('/userAdd', function(req, res) {
  let {username,password,groups} =req.body;
  //构造数据库语句
  const sqlStr = 'insert into users(username,password,groups) values (?,?,?)';
  // 接收到的数据参数
  const sqlParams = [username, password, groups]
  connection.query(sqlStr,sqlParams,(err,data)=>{
    //如果有错就抛出错误
    if(err){
      throw err;
    }else{
      // 否则 检查是否插入成功
      // 判断 如果受影响的行数 > 0 就是插入成功了
      if(data.affectedRows>0){
        //返回一个成功的数据回去
        res.send({'errcode':0,'msg':'添加成功！'});
      }else{
        //返回一个成功的数据回去
        res.send({'errcode':1,'msg':'添加失败！'});
      }
    }
  })
});
/* 接收显示所有用户账号的请求 */
router.get('/userList',function(req,res){
  //接收前段传过来的页面尺寸和当前页
  let{pageSize,currentPage}=req.query;
  //console.log(pageSize,currentPage);
  //构造数据库语句,查询所有账号并且保护这个id的用不被查询到而被删除
  let sqlStr ='select * from users where id <> 59'; 
  //const sqlStr ='select * from users  order by ctime desc;';
  connection.query(sqlStr,(err,data)=>{
    //如果有错就抛出错误
    if(err){
      throw err;
    }else{
      //计算总数
      let totalcount = data.length;
      //console.log("weqwe",totalcount)
      //计算跳过多少条
      let n = (currentPage-1)*pageSize;
      sqlStr+= ` order by ctime desc limit ${n},${pageSize}`;
      //console.log(sqlStr)
      //执行sql语句
      connection.query(sqlStr,(err,data)=>{
        if(err){
          throw err;
        }else{
          // 把查询到的数据返回给前端
          res.send({'totalcount':totalcount,'pagedata':data});
        }
      })
    }
  })
})
/* 接收单条删除的请求 */
router.get('/userDeleteone',(req,res)=>{
  //接收id
  let id = req.query.id;
  //构造sql语句
  const sqlStr= `delete from users where id = ${id}`;
  connection.query(sqlStr,(err,data)=>{
    //如果有错就抛出错误
    if(err){
      throw err;
    }else{
      // 判断 如果受影响的行数 > 0 返回给前端删除成功的数据对象
      if(data.affectedRows>0){
        res.send({"errcode":0,"msg":"删除成功！"});
      }else{
        res.send({"errcode":1,"msg":"删除失败！"});
      }
    }
  })
})
/* 修改用户账号-把原来的数据查询出来 返回给前端 */
router.get('/useredit',(req,res)=>{
  //保存id
  let {id} =req.query;
  //构造查询语句
  const sqlStr= `select username,password,groups from users where id=${id}`;
  //执行sql语句
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
      res.send(data);
    }
  })
})
/*接收修改你请求 */
router.post('/usersave',(req,res)=>{
  //接收前端传过来的值
  let {username,password,groups,id}=req.body;
  //构造更新语句
  const sqlStr =`update users set username='${username}', password='${password}', groups='${groups}' where id=${id}`;
  //执行sql语句
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{

      if(data.affectedRows>0){
        res.send({'errcode':0,'msg':"修改成功"})
      }else{
        res.send({'errcode':0,'msg':"修改成功"})
      }
    }
  })
})
//接收批量请求
router.post('/batchesdel',(req,res)=>{
  //接收数据
  let idArr= req.body['idArr[]'];
  //构造sql语句
  const sqlStr =`delete from users where id in(${idArr})`;
  connection.query(sqlStr,(err,data)=>{
  if(err){
    throw err;
  }else{
    if(data.affectedRows>0){

      res.send({"errcode":0,"msg":"批量删除成功！"})
    }else{
      res.send({"errcode":1,"msg":"批量删除失败！"})
    }
  }
  })
})
/* 检查用户名和密码是否正确 */
router.post('/login',(req,res)=>{
  //接收数据
  let {username,password}= req.body;
  //构造查询语句
  const sqlStr =`select * from users where username='${username}' and password='${password}'`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
     if(data.length){
       // 登录成功 设置cookie (在res.send()之前设置)
       res.cookie('username', data[0].username);
       res.cookie('id', data[0].id);
       res.cookie('groups', data[0].groups);
      res.send({'errcode':0,'msg':'登录成功！'})
     }else{
       res.send({'errcode':1,'msg':'登录失败，请检查用户名或密码是否正确！'})
     }
    }
  })
})
/* 检查用户是否已经登录 */
router.get('/checkIsLogin',(req,res)=>{
  //从浏览器获取cookie里的数据
  let username = req.cookies.username;
  let password = req.cookies.password;
  let id = parseInt(req.cookies.id);
  if(id!=NaN){
    //构造sql语句
  const sqlStr =`select * from users where username = '${username}' and id ='${id}'`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
      if(data.length){
        res.send('')
      }else{
        res.send('alert("请登录后,再操作"); location.href="http://localhost:666/login.html";');
      }
    }
  })
  }else{
    res.send('alert("请登录后,再操作"); location.href="http://localhost:666/login.html";');
  }
})
/*退出登录请求*/
router.get('/logout',(req,res)=>{
  //清理cookie
  res.clearCookie('username');
  res.clearCookie('id');
  res.clearCookie('groups');
  res.send('<script>alert("欢迎下次登录！"); location.href="http://localhost:666/login.html";</script>')
}) 
/*修改密码请求 */
//获取原始密码
router.post('/sqlpwd',(req,res)=>{
  //从浏览器获取cookie里的数据
  var username=req.cookies.username;
  var id=req.cookies.id;
  //构造sql语句
  const sqlStr = `select password from users where username='${username}' and id=${id}`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
        res.send(data);
    }
  })
})
//接收修改密码请求
router.post('/changepwd',(req,res)=>{
  //接收修改的密码
  let password = req.body.newpass;
  //从浏览器获取cookie里的数据
  var username=req.cookies.username;
  //构造sql语句
  const sqlStr = `update users set password='${password}' where username='${username}'`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
      if(data.affectedRows>0){
        //清理cookie
        res.clearCookie('username');
        res.clearCookie('id');
        res.clearCookie('groups');
        res.send({'errcode':0,'msg':'修改密码成功！请重新登录'})
      }else{
        res.send({'errcode':1,'msg':'修改密码失败！'})
      }
    }
  })
})
/*请求检查用户名是否被注册了*/
router.post('/checkname',(req,res)=>{
  //接收用户名
  let username =req.body.checkname;
  //构造sql语句
  const sqlStr = `select username from users where username='${username}'`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
      if(!data.length){
        res.send({'errcode':0,'msg':'用户名未注册！'})
      }else{
        res.send({'errcode':1,'msg':'用户名已经被注册了！'})
      }
    }
  })
})
module.exports = router;
