
let data = require('@begin/data')

exports.handler = async function create(req) {
//console.log(req)
  if('queryStringParameters' in req && 'key' in req.queryStringParameters && req.queryStringParameters.key !=''){
    key=parseInt(req.queryStringParameters.key).toString() //确保key是个数字
    if(key<=0){
        return{
            'code':400,'err':'这个key需要是一串大于0的数字。'
        }
    }
    res=await data.get({table:'roominfo',key:key})
      if (!res){
        return{
          'code':404,'err':'无此room,请先执行room_cron来创建记录。注意要自己跑定时任务，此服务不主动获取数据。间隔以5-10分钟为宜，太短关键帧不会更新。'
        }
      }
    
    return{
      'code':0,
      'data':res
    }
  }else{
    return{
      'code':400,'err':'缺少必要参数:key，这里是直播间id'
    }
  }
}
