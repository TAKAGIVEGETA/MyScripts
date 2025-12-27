/**
 * 百度贴吧签到脚本 - Scriptable版
 */

async function notify(title, body) {
  let n = new Notification();
  n.title = title;
  n.body = body;
  await n.schedule();
}

function md5(STRING) {
  function d(n, t) { var r = (65535 & n) + (65535 & t); return (n >> 16) + (t >> 16) + (r >> 16) << 16 | 65535 & r }
  function f(n, t, r, e, o, u) { return d((c = d(d(t, n), d(e, u))) << (f = o) | c >>> 32 - f, r); var c, f }
  function l(n, t, r, e, o, u, c) { return f(t & r | ~t & e, n, t, o, u, c) }
  function v(n, t, r, e, o, u, c) { return f(t & e | r & ~e, n, t, o, u, c) }
  function g(n, t, r, e, o, u, c) { return f(t ^ r ^ e, n, t, o, u, c) }
  function m(n, t, r, e, o, u, c) { return f(r ^ (t | ~e), n, t, o, u, c) }
  function i(n, t) { var r, e, o, u; n[t >> 5] |= 128 << t % 32, n[14 + (t + 64 >>> 9 << 4)] = t; for (var c = 1732584193, f = -271733879, i = -1732584194, a = 271733878, h = 0; h < n.length; h += 16)c = l(r = c, e = f, o = i, u = a, n[h], 7, -680876936), a = l(a, c, f, i, n[h + 1], 12, -389564586), i = l(i, a, c, f, n[h + 2], 17, 606105819), f = l(f, i, a, c, n[h + 3], 22, -1044525330), c = l(c, f, i, a, n[h + 4], 7, -176418897), a = l(a, c, f, i, n[h + 5], 12, 1200080426), i = l(i, a, c, f, n[h + 6], 17, -1473231341), f = l(f, i, a, c, n[h + 7], 22, -45705983), c = l(c, f, i, a, n[h + 8], 7, 1770035416), a = l(a, c, f, i, n[h + 9], 12, -1958414417), i = l(i, a, c, f, n[h + 10], 17, -42063), f = l(f, i, a, c, n[h + 11], 22, -1990404162), c = l(c, f, i, a, n[h + 12], 7, 1804603682), a = l(a, c, f, i, n[h + 13], 12, -40341101), i = l(i, a, c, f, n[h + 14], 17, -1502002290), c = v(c, f = l(f, i, a, c, n[h + 15], 22, 1236535329), i, a, n[h + 1], 5, -165796510), a = v(a, c, f, i, n[h + 6], 9, -1069501632), i = v(i, a, c, f, n[h + 11], 14, 643717713), f = v(f, i, a, c, n[h], 20, -373897302), c = v(c, f, i, a, n[h + 5], 5, -701558691), a = v(a, c, f, i, n[h + 10], 9, 38016083), i = v(i, a, c, f, n[h + 15], 14, -660478335), f = v(f, i, a, c, n[h + 4], 20, -405537848), c = v(c, f, i, a, n[h + 9], 5, 568446438), a = v(a, c, f, i, n[h + 14], 9, -1019803690), i = v(i, a, c, f, n[h + 3], 14, -187363961), f = v(f, i, a, c, n[h + 8], 20, 1163531501), c = v(c, f, i, a, n[h + 13], 5, -1444681467), a = v(a, c, f, i, n[h + 2], 9, -51403784), i = v(i, a, c, f, n[h + 7], 14, 1735328473), c = g(c, f = v(f, i, a, c, n[h + 12], 20, -1926607734), i, a, n[h + 5], 4, -378558), a = g(a, c, f, i, n[h + 8], 11, -2022574463), i = g(i, a, c, f, n[h + 11], 16, 1839030562), f = g(f, i, a, c, n[h + 14], 23, -35309556), c = g(c, f, i, a, n[h + 1], 4, -1530992060), a = g(a, c, f, i, n[h + 4], 11, 1272893353), i = g(i, a, c, f, n[h + 7], 16, -155497632), f = g(f, i, a, c, n[h + 10], 23, -1094730640), c = g(c, f, i, a, n[h + 13], 4, 681279174), a = g(a, c, f, i, n[h], 11, -358537222), i = g(i, a, c, f, n[h + 3], 16, -722521979), f = g(f, i, a, c, n[h + 6], 23, 76029189), c = g(c, f, i, a, n[h + 9], 4, -640364487), a = g(a, c, f, i, n[h + 12], 11, -421815835), i = g(i, a, c, f, n[h + 15], 16, 530742520), c = m(c, f = g(f, i, a, c, n[h + 2], 23, -995338651), i, a, n[h], 6, -198630844), a = m(a, c, f, i, n[h + 7], 10, 1126891415), i = m(i, a, c, f, n[h + 14], 15, -1416354905), f = m(f, i, a, c, n[h + 5], 21, -57434055), c = m(c, f, i, a, n[h + 12], 6, 1700485571), a = m(a, c, f, i, n[h + 3], 10, -1894986606), i = m(i, a, c, f, n[h + 10], 15, -1051523), f = m(f, i, a, c, n[h + 1], 21, -2054922799), c = m(c, f, i, a, n[h + 8], 6, 1873313359), a = m(a, c, f, i, n[h + 15], 10, -30611744), i = m(i, a, c, f, n[h + 6], 15, -1560198380), f = m(f, i, a, c, n[h + 13], 21, 1309151649), c = m(c, f, i, a, n[h + 4], 6, -145523070), a = m(a, c, f, i, n[h + 11], 10, -1120210379), i = m(i, a, c, f, n[h + 2], 15, 718787259), f = m(f, i, a, c, n[h + 9], 21, -343485551), c = d(c, r), f = d(f, e), i = d(i, o), a = d(a, u); return [c, f, i, a] }
  function a(n) { for (var t = "", r = 32 * n.length, e = 0; e < r; e += 8)t += String.fromCharCode(n[e >> 5] >>> e % 32 & 255); return t }
  function h(n) { var t = []; for (t[(n.length >> 2) - 1] = void 0, e = 0; e < t.length; e += 1)t[e] = 0; for (var r = 8 * n.length, e = 0; e < r; e += 8)t[e >> 5] |= (255 & n.charCodeAt(e / 8)) << e % 32; return t }
  function e(n) { for (var t, r = "0123456789abcdef", e = "", o = 0; o < n.length; o += 1)t = n.charCodeAt(o), e += r.charAt(t >>> 4 & 15) + r.charAt(15 & t); return e }
  function r(n) { return unescape(encodeURIComponent(n)) }
  function o(n) { return a(i(h(t = r(n)), 8 * t.length)); var t }
  function u(n, t) { return function (n, t) { var r, e, o = h(n), u = [], c = []; for (u[15] = c[15] = void 0, 16 < o.length && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1)u[r] = 909522486 ^ o[r], c[r] = 1549556828 ^ o[r]; return e = i(u.concat(h(t)), 512 + 8 * t.length), a(i(c.concat(e), 640)) }(r(n), r(t)) }
  function t(n, t, r) { return t ? r ? u(t, n) : e(u(t, n)) : r ? o(n) : e(o(n)) }
  return t(STRING)
}

class Tieba {
  constructor(bduss) {
    this.bduss = bduss
    this._tbs = null
  }

  async request(url, method = "GET", data = null) {
    const req = new Request(url)
    req.method = method
    req.headers = {
      "Cookie": `BDUSS=${this.bduss}`,
      "Host": "tieba.baidu.com",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      "Referer": "https://tieba.baidu.com/"
    }
    if (method === "POST" && data) {
      req.headers["Content-Type"] = "application/x-www-form-urlencoded"
      let bodyComponents = []
      for (let key in data) bodyComponents.push(`${key}=${encodeURIComponent(data[key])}`)
      req.body = bodyComponents.join("&")
    }
    return req
  }

  async getTbs() {
    if (this._tbs) return this._tbs
    try {
      const req = await this.request("http://tieba.baidu.com/dc/common/tbs")
      const json = await req.loadJSON()
      if (json.is_login === 0) {
        await notify("错误", "Cookie已失效，请检查BDUSS")
        return ""
      }
      this._tbs = json.tbs
      return this._tbs
    } catch (e) {
      await notify("错误", "getTbs Error: " + e)
      return ""
    }
  }

  signature(data) {
    const keys = Object.keys(data).sort()
    let str = ""
    for (const key of keys) str += `${key}=${data[key]}`
    str += "tiebaclient!!!"
    return md5(str).toUpperCase()
  }

  async getLikes(page_no = 1, retry_times = 0) {
    const tbs = await this.getTbs()
    const data = {
      "BDUSS": this.bduss,
      "_client_type": "2",
      "_client_id": "wappc_1534235498291_488",
      "_client_version": "9.7.8.0",
      "_phone_imei": "000000000000000",
      "from": "1008621y",
      "page_no": String(page_no),
      "page_size": "200",
      "model": "MI+5",
      "net_type": "1",
      "timestamp": String(Math.floor(Date.now() / 1000)),
      "vcode_tag": "11"
    }
    data["sign"] = this.signature(data)
    try {
      const req = await this.request("http://c.tieba.baidu.com/c/f/forum/like", "POST", data)
      const json = await req.loadJSON()
      if (json.error_code && json.error_code !== "0") {
        await notify("错误", "获取关注贴吧错误: " + JSON.stringify(json))
        if (retry_times < 3) return await this.getLikes(page_no, retry_times + 1)
        return []
      }
      const hasNext = json.has_more === "1"
      let forumList = []
      if (json.forum_list) {
        if (json.forum_list["non-gconforum"]) forumList = forumList.concat(json.forum_list["non-gconforum"])
        if (json.forum_list["gconforum"]) forumList = forumList.concat(json.forum_list["gconforum"])
      }
      if (hasNext) {
        const nextList = await this.getLikes(page_no + 1)
        forumList = forumList.concat(nextList)
      }
      return forumList
    } catch (e) {
      await notify("网络错误", "Get Likes Network Error: " + e)
      return []
    }
  }

  async sign(fid, name) {
    const tbs = await this.getTbs()
    const data = {
      "_client_type": "2",
      "_client_id": "wappc_1534235498291_488",
      "_client_version": "9.7.8.0",
      "_phone_imei": "000000000000000",
      "model": "MI+5",
      "net_type": "1",
      "timestamp": String(Math.floor(Date.now() / 1000)),
      "vcode_tag": "11",
      "BDUSS": this.bduss,
      "fid": String(fid),
      "kw": name,
      "tbs": tbs
    }
    data["sign"] = this.signature(data)
    try {
      const req = await this.request("http://c.tieba.baidu.com/c/c/forum/sign", "POST", data)
      const json = await req.loadJSON()
      const errorCode = parseInt(json.error_code || 0)
      if (errorCode !== 0) return false
      return true
    } catch (e) {
      await notify("签到异常", `[${name}] ${e}`)
      return false
    }
  }
}

async function runTask(bduss) {
  if (!bduss || bduss.length < 10) {
    await notify("配置错误", "请设置有效的 BDUSS")
    return
  }
  await notify("脚本运行", "开始获取关注列表...")
  const tieba = new Tieba(bduss)
  const forums = await tieba.getLikes()
  await notify("进度提示", `共获取到 ${forums.length} 个关注的贴吧`)
  if (forums.length === 0) {
    await notify("提示", "未获取到贴吧列表，脚本结束")
    return
  }
  let successCount = 0
  let failCount = 0
  for (const forum of forums) {
    const isSuccess = await tieba.sign(forum.id, forum.name)
    if (isSuccess) successCount++
    else failCount++
  }
  const resultMsg = `成功: ${successCount}\n失败: ${failCount}`
  await notify("贴吧签到完成", resultMsg)
}

const BDUSS = "DF3OU5taVNBMmhROEQydkFIbmVMcmh4T3BCU0NPazFHR2k0RWxpcllROFhEYXhvSVFBQUFBJCQAAAAAAQAAAAEAAABYLjiDt6i6jI7ssM0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABeAhGgXgIRod"
await runTask(BDUSS)
return 0
