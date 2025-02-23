/**
 * 领京豆-任务
 * 助力：内部 -> HW
 * cron: 1 0,9,12,18 * * *
 */

import axios from 'axios'
import USER_AGENT, {requireConfig, wait} from './TS_USER_AGENTS'

let cookie: string = '', res: any = '', UserName: string, index: number, uuid: string
let shareCodeSelf: { shareCode: string, groupCode: string, activeId: string }[] = [], shareCode: { shareCode: string, groupCode: string, activeId: string }[] = [], shareCodeHW: { shareCode: string, groupCode: string, activeId: string }[] = []

!(async () => {
  let cookiesArr: any = await requireConfig()
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i]
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    index = i + 1
    console.log(`\n开始【京东账号${index}】${UserName}\n`)

    res = await initForTurntableFarm()
    let times: number = res.remainLotteryTimes
    console.log('剩余抽奖机会:', times)
    for (let j = 0; j < times; j++) {
      console.log('开始抽奖...')
      res = await initForTurntableFarm(1)
      if (res.code === '0') {
        if (res.type === 'thanks') {
          console.log('抽奖成功，获得：狗屁')
        } else {
          console.log('抽奖成功，获得:', res.type)
        }
      } else {
        console.log('抽奖失败', res)
      }
      await wait(5000)
    }

    uuid = randomString(40)
    for (let j = 0; j < 4; j++) {
      console.log(`Round:${j + 1}`)
      res = await api('beanTaskList', {"viewChannel": "AppHome"})
      try {
        for (let t of res.data.taskInfos) {
          if (t.status === 1) {
            console.log(t.taskName)
            res = await api('beanDoTask', {
              "actionType": t.taskType === 3 ? 0 : 1,
              "taskToken": t.subTaskVOS[0].taskToken
            })
            res.data?.bizMsg ? console.log(res.data.bizMsg) : console.log(res)
            await wait(t.waitDuration * 1000 || 2000)

            if (t.taskType !== 3) {
              res = await api('beanDoTask', {
                "actionType": 0,
                "taskToken": t.subTaskVOS[0].taskToken
              })
              if (res.data?.bizMsg)
                console.log(res.data.bizMsg)
            }
            await wait(1000)
          }
        }
      } catch (e) {
        console.log('Error!', e)
      }
      await wait(2000)
    }

    // 抢京豆
    res = await qjd('signBeanGroupStageIndex', {"monitor_refer": "", "rnVersion": "3.9", "fp": "-1", "shshshfp": "-1", "shshshfpa": "-1", "referUrl": "-1", "userAgent": "-1", "jda": "-1", "monitor_source": "bean_m_bean_index"})
    if (!res.data.shareCode) {
      console.log('抢京豆 init...')
      res = await qjd('signGroupHit', {"activeType": 2})
      await wait(1000)
      res = await qjd('signBeanGroupStageIndex', {"monitor_refer": "", "rnVersion": "3.9", "fp": "-1", "shshshfp": "-1", "shshshfpa": "-1", "referUrl": "-1", "userAgent": "-1", "jda": "-1", "monitor_source": "bean_m_bean_index"})
    }
    console.log('助力码', res.data.shareCode)
    shareCodeSelf.push({shareCode: res.data.shareCode, groupCode: res.data.groupCode, activeId: res.data.jklInfo.keyId})
    await wait(2000)
  }

  console.log('内部助力', shareCodeSelf)
  for (let i = 0; i < cookiesArr.length; i++) {
    if (shareCodeHW.length === 0) {
      await getShareCodeHW()
    }
    shareCode = [...shareCodeSelf, ...shareCodeHW]
    uuid = randomString(40)
    cookie = cookiesArr[i]
    UserName = decodeURIComponent(cookie.match(/pt_pin=([^;]*)/)![1])
    for (let code of shareCode) {
      console.log(`${UserName} 去助力 ${code.shareCode}`)
      res = await qjd('signGroupHelp', {"activeType": 2, "groupCode": code.groupCode, "shareCode": code.shareCode, "activeId": code.activeId, "source": "guest"})
      console.log(res.data?.helpToast)
      if (res.data.respCode === 'SG209')
        break
      await wait(2000)
    }
  }
})()

async function api(fn: string, body: object) {
  let {data}: any = await axios.post(`https://api.m.jd.com/client.action?functionId=${fn}`,
    `body=${encodeURIComponent(JSON.stringify(body))}&appid=ld&client=apple&clientVersion=10.0.8&uuid=${uuid}&openudid=${uuid}`, {
      headers: {
        'Host': 'api.m.jd.com',
        'content-type': 'application/x-www-form-urlencoded',
        'referer': '',
        'user-agent': 'JD4iPhone/167863%20(iPhone;%20iOS;%20Scale/3.00)',
        'Cookie': cookie
      }
    })
  return data
}

async function qjd(fn: string, body?: object) {
  let {data} = await axios.get(`https://api.m.jd.com/client.action?functionId=${fn}&body=${encodeURIComponent(JSON.stringify(body))}&appid=ld&client=apple&clientVersion=10.0.8&uuid=${uuid}&openudid=${uuid}`, {
    headers: {
      'Host': 'api.m.jd.com',
      'User-Agent': USER_AGENT,
      'Referer': 'https://h5.m.jd.com/rn/3MQXMdRUTeat9xqBSZDSCCAE9Eqz/index.html',
      'Cookie': cookie
    }
  })
  return data
}

function randomString(e: number) {
  e = e || 32
  let t = '0123456789', a = t.length, n = ""
  for (let i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a))
  return n
}

async function initForTurntableFarm(type: number = 0) {
  let url = type === 0
    ? 'https://api.m.jd.com/client.action?functionId=initForTurntableFarm&body=%7B%22version%22%3A4%2C%22channel%22%3A1%7D&appid=wh5'
    : 'https://api.m.jd.com/client.action?functionId=lotteryForTurntableFarm&body=%7B%22type%22%3A1%2C%22version%22%3A4%2C%22channel%22%3A1%7D&appid=wh5'
  let {data} = await axios.get(url, {
    headers: {
      'Host': 'api.m.jd.com',
      'Origin': 'https://h5.m.jd.com',
      'User-Agent': USER_AGENT,
      'Referer': 'https://h5.m.jd.com/',
      'Cookie': cookie
    }
  })
  return data
}

async function getShareCodeHW() {
  try {
    let {data}: any = await axios.get(`https://api.jdsharecode.xyz/api/HW_CODES`)
    console.log('获取HW_CODES成功(api)')
    shareCodeHW = data['qjd']
  } catch (e: any) {
    console.log('获取HW_CODES失败(api)')
  }
}