
let data = require('@begin/data')
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false
})
let fetch = require('node-fetch')
exports.handler = async function create(req) {
//console.log(req)
  if('queryStringParameters' in req && 'key' in req.queryStringParameters && req.queryStringParameters.key !=''){
    key=req.queryStringParameters.key
    if(key.startsWith('keyframe')){
      try{
        console.log('try orig link')
res=await fetch('https://i0.hdslb.com/bfs/live-key-frame/'+key+'.jpg',{agent:agent});

      resb=await res.buffer()

resb64=resb.toString('base64')
return{
        
  body:resb64,
  statusCode:200,
  headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=31536000'},
  isBase64Encoded:true

}
      }
      catch (e){
        console.log(e)
        console.log('fallback')
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
      }
    }
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
