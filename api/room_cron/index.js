let data = require('@begin/data')
let fetch = require('node-fetch')
const https = require("https");
const { table } = require('console');
const agent = new https.Agent({
  rejectUnauthorized: false
})

async function processroom(roomdata){
//cover url is at roomdata.cover
res=await fetch('https:'+roomdata.cover+'@854w.webp',{agent:agent});
resb=await res.buffer()
resb64=resb.toString('base64')
framekey=await data.set({'table':'keyframes','data':resb64})
framekey=framekey.key
//set capt info
//取弹幕相关数据
res=await fetch('https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid='+roomdata.roomid,{agent:agent});
resjson=await res.json()
if(resjson.code!=0){
    return {'code':400,'err':'取弹幕时发生问题。',data:resjson}
}
chatdata=resjson.data
res=await data.set({
    'table':'captinfo',
    'ts':Date.now()/1000,
    'chatdata':chatdata,
    'livedata':roomdata,
    'keyframekey':framekey,
    'keyframeurl':roomdata.cover
  }
  )
  console.log('processroom=>',res)
  return {'code':0,'data':res.key}
}


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
      //新建记录
      //1.先去搜索直播间
      res=await fetch('https://api.bilibili.com/x/web-interface/wbi/search/type?__refresh__=true&order=live_time&search_type=live&keyword='+key,{agent:agent});
      resjson=await res.json()
      if(resjson.code!=0){
          return {code:502,'err':'搜索过程中出错','data':resjson}
      }
      console.log(resjson.data.result)
      if(resjson.data.result.live_room==null){
          return {code:404,err:'搜索无此结果，确认输入的是直播间id.此外短号需要改成对应的长号id,此外未在直播的用户也会是这个提示'}
      }
      for (rooms of resjson.data.result.live_room){
          if (rooms.roomid==key || rooms.short_id==key){
            //found it!
            if(rooms.live_status==1){
            captkey=await processroom(rooms)
            if (captkey.code!=0){return captkey}
            captkey=captkey.data
            captures={}
            captures[Date.now()/1000]=captkey
            res = await data.set({
                table:'liveinfo',
                captures:captures,

            })
            sessions={}
            sessions[rooms.live_time]=res.key
            res2 = await data.set({table:'roominfo',
            key:rooms.roomid,
            sessions:sessions,
            lastts:Date.now()/1000
            })
            return {'code':0,'data':res2}
            }else{
                return{
                    'code':419,'err':'这个房间存在，但是目前并未直播。为了降低复杂度暂时先不写入数据。此行为可能会在之后的更新中改变',data:rooms
                }
            }
          }
      }
      return{
          'code':404,'err':'在搜索结果中没有找到匹配roomid或短id的直播间。'
      }
      }else{
          //有记录
          roomres=res//后面res就被占用了
          if(roomres.lastts+200>Date.now()/1000){
              return {'code':429,'err':'这个房间在200秒之前已经取过数据了。之所以设这种限制是因为b站那边keyframe貌似更新是5分钟多才更新一次，请求小于5分钟keyframe还是同一个.请注意这东西不是实时服务，只是留个简单的历史。'}
          }
          res=await fetch('https://api.bilibili.com/x/web-interface/wbi/search/type?__refresh__=true&order=live_time&search_type=live&keyword='+key,{agent:agent});
      resjson=await res.json()
      console.log('1.搜索直播间=>',resjson)
      if(resjson.code!=0){
          return {code:502,'err':'搜索过程中出错','data':resjson}
      }
      if(resjson.data.result.live_room==null){
          return {code:404,err:'搜索无此结果，确认输入的是直播间id'}
      }
      //依然要去搜索:)
      for (rooms of resjson.data.result.live_room){
        if (rooms.roomid==key || rooms.short_id==key){
          //found it!
          if(rooms.live_status==1){
            captkey=await processroom(rooms)
            if (captkey.code!=0){return captkey}
            captkey=captkey.data
          //这里与之前不同的是先去拿roominfo(roomres)
          if(rooms.live_time in roomres.sessions){
              
              liveinfokey=roomres.sessions[rooms.live_time]
              console.log('in session with liveinfokey=',liveinfokey)
              //liveinfokey是同一个session（同一场直播）的liveinfokey,下面存captkey
              captures=await data.get({table:'liveinfo',key:liveinfokey})
              captures=captures.captures
              captures[Date.now()/1000]=captkey
              res = await data.set({
                  table:'liveinfo',
                  key:liveinfokey,
                  captures:captures,
                
              })
              //更新roominfo的lastts
            res2 = await data.set({table:'roominfo',
            key:rooms.roomid,
            sessions:roomres.sessions,
            lastts:Date.now()/1000
            })
            return {'code':0,'data':res2}
          }else{
              //如果还没创建到这个session的话就先创建一个到liveinfo里之后再赋值给session
              console.log('no session found,good luck debugging')
              captures={}
            captures[Date.now()/1000]=captkey
            res = await data.set({
                table:'liveinfo',
                captures:captures,

            })
            console.log('the new liveinfo is key=',res.key)
            //此处res是那个liveinfokey
            roomres.sessions[rooms.live_time]=res.key
            res2 = await data.set({table:'roominfo',
            key:rooms.roomid,
            sessions:roomres.sessions,
            lastts:Date.now()/1000
            })
            return {'code':0,'data':res2}
          }
         
          }else{
              return{
                  'code':419,'err':'这个房间存在，但是目前并未直播。为了降低复杂度暂时先不写入数据。此行为可能会在之后的更新中改变',data:rooms
              }
          }
        }
    }
      }
    
  
  }else{
    return{
      'code':400,'err':'缺少必要参数:key，这里是直播间id'
    }
  }
}
