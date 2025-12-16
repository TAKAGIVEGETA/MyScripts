// ==Scriptable==
// @name         雨晨分享站自动签到
// @description  自动登录并每日签到，获取积分
// @author        Takagivegeta
// ==/Scriptable===

const USERNAME = "2946590137@qq.com";
const PASSWORD = "2946590137a";

const BASE_URL = "https://yc.yuchengyouxi.com";
const LOGIN_PAGE_URL = `${BASE_URL}/login`;
const AJAX_URL = `${BASE_URL}/wp-admin/admin-ajax.php`;
const REDIRECT_URL = `${BASE_URL}/users?tab=membership&unpf=1`;
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X; zh-cn) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/22D72 Quark/5.6.0.1303 Mobile";

async function main() {
  let pageRequest = new Request(LOGIN_PAGE_URL);
  pageRequest.headers = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
  let html = await pageRequest.loadString();
  let tokenMatch = html.match(/name=["']token["']\s+value=["']([a-f0-9]{10})["']/i);
  if (!tokenMatch || !tokenMatch[1]) {
    await notify("雨晨分享站-获取 token 失败", "登录页面中未找到 token");
    return;
  }
  let token = tokenMatch[1];
  await notify("雨晨分享站-获取 token 成功", token);
  let loginRequest = new Request(AJAX_URL);
  loginRequest.method = "POST";
  loginRequest.headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": USER_AGENT,
    "Origin": BASE_URL,
    "Referer": LOGIN_PAGE_URL
  };
  let loginBody = `user_login=${encodeURIComponent(USERNAME)}&password=${encodeURIComponent(PASSWORD)}&rememberme=1&redirect=${encodeURIComponent(REDIRECT_URL)}&action=userlogin_form&token=${token}`;
  loginRequest.body = loginBody;
  let loginResponse = await loginRequest.loadJSON();
  if (loginResponse.success !== "success") {
    await notify("雨晨分享站-登录失败", loginResponse.msg);
    return;
  }
  await notify("雨晨分享站-登录成功", "开始签到");
  let signRequest = new Request(AJAX_URL);
  signRequest.method = "POST";
  signRequest.headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": USER_AGENT,
    "Origin": BASE_URL,
    "Referer": REDIRECT_URL
  };
  signRequest.body = "action=daily_sign";
  let signResponse = await signRequest.loadJSON();
  if (signResponse.success === "success") await notify("雨晨分享站-签到成功 🎉", signResponse.msg);
  else await notify("雨晨分享站-签到失败", signResponse.msg);
}

async function notify(title, body) {
  let notification = new Notification();
  notification.title = title;
  notification.body = body;
  await notification.schedule();
}

await main();