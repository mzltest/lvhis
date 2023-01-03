
let data = require('@begin/data')

exports.handler = async function create(req) {
//console.log(req)
  if('queryStringParameters' in req && 'key' in req.queryStringParameters && req.queryStringParameters.key !=''){
    key=req.queryStringParameters.key
    res=await data.get({table:'captinfo',key:key})
      if (!res){
        return{
          'code':404,'err':'无此captinfo,请先执行room_cron来创建记录。'
        }
      }
    
    return{body:JSON.stringify({
      'code':0,
      'data':res}),
      statusCode:200,
      headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=31536000'},

    }
  }else{
    return{
      'code':400,'err':'缺少必要参数:key，这里是captinfo'
    }
  }
}
