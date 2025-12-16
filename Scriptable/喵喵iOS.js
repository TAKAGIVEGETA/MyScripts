// ==Scriptable==
// mmios.net 自动签到
// @description  自动登录并每日签到，获取积分
// @author       Takagivegeta
// ==/Scriptable===

const USERNAME = "2946590137@qq.com";
const PASSWORD = "2946590137a";

const LOGIN_URL = "https://www.mmios.net/wp-admin/admin-ajax.php";
const TUIGUANG_URL = "https://www.mmios.net/tuiguang";
const QIAND_AO_URL = "https://www.mmios.net/wp-admin/admin-ajax.php";

async function main() {
  let request = new Request(LOGIN_URL);
  request.method = "POST";
  request.headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Origin": "https://www.mmios.net",
    "Referer": "https://www.mmios.net/user"
  };
  request.body = `action=user_login&username=${encodeURIComponent(USERNAME)}&password=${encodeURIComponent(PASSWORD)}&rememberme=1`;
  let loginResponse = await request.loadJSON();
  if (loginResponse.status !== "1") {
    await notify("mmios.net-登录失败", loginResponse.msg);
    return;
  }
  await notify("mmios.net-登录成功", "开始获取签到 nonce");
  let pageRequest = new Request(TUIGUANG_URL);
  pageRequest.headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
  };
  let html = await pageRequest.loadString();
  let nonceMatch = html.match(/data-nonce\s*=\s*["']([a-f0-9]{10})["']/i);
  if (!nonceMatch || !nonceMatch[1]) {
    await notify("mmios.net-获取 nonce 失败", "页面中未找到 data-nonce");
    return;
  }
  let nonce = nonceMatch[1];
  await notify("mmios.net-获取 nonce 成功", nonce);
  let qianRequest = new Request(QIAND_AO_URL);
  qianRequest.method = "POST";
  qianRequest.headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Origin": "https://www.mmios.net",
    "Referer": TUIGUANG_URL
  };
  qianRequest.body = `action=user_qiandao&nonce=${nonce}`;
  let qianResponse = await qianRequest.loadJSON();
  if (qianResponse.status === "1") await notify("mmios.net-签到成功 🎉", qianResponse.msg);
  else await notify("mmios.net-签到失败", qianResponse.msg);
}

async function notify(title, body) {
  let notification = new Notification();
  notification.title = title;
  notification.body = body;
  await notification.schedule();
}

await main();