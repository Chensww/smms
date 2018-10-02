var express = require('express');
var router = express.Router();
//引入链接数据库模块
const connection = require('./conn');
 //链接数据库
// connection.connect(err => {
//   if (err) {
//     throw err;
//   } else {
//     console.log("数据库链接成功");
//   }
// });

/*
  在数据库中创建商品表：
  create table goods(id int primary key auto_increment,
    barcode varchar(50),
    goodsName varchar(50),
    price DECIMAL(7,2),
    marketPrice DECIMAL(7,2),
    purchasePrice DECIMAL(7,2),
    instockNum int,
    googsWeight float(7,2),
    goodsUnit varchar(50),
    vipDiscount varchar(50),
    isOnsale varchar(50),
    description varchar(200),
    type varchar(50));


    inert into goods(goodsName,barcode ,price ,marketPrice,purchasePrice,instockNum,googsWeight,goodsUnit,vipDiscount,isOnsale,description,type) 
              values('2','12' ,'23' ,'3123','','','','','享受','禁用','','龙凤呈祥');
    INSERT INTO goods(price, marketPrice, purchasePrice, instockNum, googsWeight, goodsUnit, vipDiscount, isOnsale, description, type) 
    VALUES (12, 11, 23, 44.55, 55.55, '55', '55', '55', '55', '55');
*/ 

/* 添加商品请求 */
router.post('/addgoods', function(req, res) {
  // 接收参数
  let {barcode,goodsName ,price ,marketPrice,purchasePrice,instockNum,googsWeight,goodsUnit,vipDiscount,isOnsale,desc,type} = req.body;
  /*
    price DECIMAL(7,2),
    marketPrice DECIMAL(7,2),
    purchasePrice DECIMAL(7,2),
    instockNum int,
    googsWeight float(7,2)
    以上字段若为空则设置为default（否则查询语句会报错）
  */
  if (!price) {
    price = "default"
  }
  if (!marketPrice) {
    marketPrice = "default"
  }
  if (!purchasePrice) {
    purchasePrice = "default"
  }
  if (!instockNum) {
    instockNum = "default"
  }
  if (!googsWeight) {
    googsWeight = "default"
  }
  //判断是否是同类的商品
  //构建SQL语句
  let sqlStr =`select instockNum from goods where barcode='${barcode}'`;
//执行语句
connection.query(sqlStr,(err,data)=>{
  if(err){
    throw err;
  }else{
    //如果查询有这个条形码存在就更新入库量
    if(data.length){
      //console.log(data[0].instockNum)
      data[0].instockNum+=parseInt(instockNum);
      //console.log('库存',data[0].instockNum)
      let sqlupnum =`update goods set instockNum =${data[0].instockNum} where barcode='${barcode}'`;
      var num =data[0].instockNum;
      connection.query(sqlupnum,(err, data) => {
        if (err) {
          throw err;
        } else {
          //console.log('更新入库量',data);
          if(data.affectedRows>0){
            //计算库存总金额
            let stockTotal = price*num;
             //计算销售总金额
             let saleTotal = marketPrice*num;
            //console.log('库存总金额',stockTotal);
            let insetstock = `update goods set stockTotal =${stockTotal},saleTotal =${saleTotal} where barcode='${barcode}'`;
            connection.query(insetstock,(err,data)=>{
              if(err){
                throw err;
              }else{
                if (data.affectedRows ===1) {
                  res.send({status:1,msg:"添加成功"});
                } else {
                  res.send({status:0,msg:"添加失败"});
                } 
              }
            })
          }else{
            res.send('');
          }
        }
      })
    }else{//如果不存在这个条形码的商品就直接存入数据库
// 构建sql插入语句
////计算库存总金额
stockTotal = price*instockNum;
//计算销售总金额
saleTotal = marketPrice*instockNum;
let insertSql = `
INSERT INTO admin.goods(barcode, goodsName, price, marketPrice, purchasePrice, instockNum, googsWeight, goodsUnit, vipDiscount, isOnsale, description, type,stockTotal,saleTotal)
VALUES ('${barcode}' ,'${goodsName}',${price} ,${marketPrice},${purchasePrice},${instockNum},${googsWeight},'${goodsUnit}','${vipDiscount}','${isOnsale}','${desc}','${type}',${stockTotal},${saleTotal})
`;
// console.log(insertSql);

connection.query(insertSql,(err, data) => {
  if (err) {
    throw err;
  } else {

    if (data.affectedRows ===1) {
      res.send({status:1,msg:"添加成功"});
    } else {
      res.send({status:0,msg:"添加失败"});
    }
    
  }
});
    }
  }
})
  
});
/* 接收显示所有用户账号的请求 */
router.get('/goodsList',function(req,res){
  //接收前段传过来的页面尺寸和当前页、分类、商品名称或条形码
  let{pageSize,currentPage,searchCateName,searchKeyWord}=req.query;
  //console.log(pageSize,currentPage);
  //构造数据库语句,查询所有账号
  let sqlStr ='select * from goods where 1=1'; 
  //const sqlStr ='select * from users  order by ctime desc;';
  //如果选择分类不为空或选择不是全部
  if(searchCateName!=='' && searchCateName!=='全部'){
    sqlStr+=` and type='${searchCateName}'`
  }
  //如果商品名称或条形码不为空
  if(searchKeyWord!==''){
    sqlStr+=` and (barcode like '%${searchKeyWord}%' or goodsName like '%${searchKeyWord}%')`
  }
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
      sqlStr+= ` limit ${n},${pageSize}`;
      //console.log(sqlStr)
      //执行sql语句
      connection.query(sqlStr,(err,data)=>{
        if(err){
          throw err;
        }else{
          res.send({'totalcount':totalcount,'pagedata':data});
        }
      })
    }
  })
})
/* 接收单条删除的请求 */
router.get('/goodsDeleteone',(req,res)=>{
  //接收id
  let id = req.query.id;
  //构造sql语句
  const sqlStr= `delete from goods where id = ${id}`;
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
router.get('/goodsedit',(req,res)=>{
  //保存id
  let {id} =req.query;
  //构造查询语句
  const sqlStr= `select * from goods where id=${id}`;
  //执行sql语句
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
     
      res.send(data);
    }
  })
})
//接收批量请求
router.post('/batchesdel',(req,res)=>{
  //接收数据
  let idArr= req.body['idArr[]'];
  //构造sql语句
  const sqlStr =`delete from goods where id in(${idArr})`;
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
});
/*请求检查条形码是否被添加了*/
router.post('/checkbarcode',(req,res)=>{
  //接收用户名
  let checkbarcode =req.body.checkbarcode;
  //构造sql语句
  const sqlStr = `select * from goods where barcode='${checkbarcode}'`;
  connection.query(sqlStr,(err,data)=>{
    if(err){
      throw err;
    }else{
      if(!data.length){
        res.send({'errcode':0,'msg':'条形码未添加过！'})
      }else{
      //console.log(data);
        res.send(data)
      }
    }
  })
})
/* 修改商品信息-把原来的数据查询出来 返回给前端 */
router.get('/editgoods',(req,res)=>{
  //保存id
  let {id} =req.query;
  //构造查询语句
  const sqlStr= `select * from goods where id=${id}`;
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
router.post('/goodssave',(req,res)=>{
  //接收前端传过来的值
  let {goodsName,price,marketPrice,purchasePrice,googsWeight,goodsUnit,vipDiscount,isOnsale,description,id,instockNum}=req.body;
  //构造更新语句
////计算库存总金额
stockTotal = price*instockNum;
//计算销售总金额
saleTotal = marketPrice*instockNum;
  const sqlStr =`update goods set goodsName='${goodsName}', price=${price}, marketPrice=${marketPrice},
  purchasePrice=${purchasePrice}, purchasePrice=${purchasePrice}, googsWeight=${googsWeight},
  goodsUnit='${goodsUnit}', vipDiscount='${vipDiscount}', isOnsale='${isOnsale}',
  stockTotal=${stockTotal},saleTotal=${saleTotal},
  description='${description}' where id=${id}`;
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
module.exports = router;
