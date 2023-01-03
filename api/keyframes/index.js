
let data = require('@begin/data')

exports.handler = async function create(req) {
//console.log(req)
  if('queryStringParameters' in req && 'key' in req.queryStringParameters && req.queryStringParameters.key !=''){
    key=req.queryStringParameters.key
    res=await data.get({table:'keyframes',key:key})
      if (!res){
        return{
          'code':404,'err':'无此keyframes,请先执行room_cron来创建记录。'
        }
      }
    
    return{
      
            body:res.data,
            statusCode:200,
            headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000'},
            isBase64Encoded:true
       
    }
  }else{
    return{
      'code':400,'err':'缺少必要参数:key，这里是keyframes'
    }
  }
}
