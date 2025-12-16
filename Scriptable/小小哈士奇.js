// ==Scriptable==
// @name         小小哈士奇自动签到
// @description  自动登录并每日签到（ASP.NET 站点）
// @author       Takagivegeta
// ==/Scriptable===

const USERNAME = "15528182191";
const PASSWORD = "2946590137a";

const BASE_URL = "https://www.xiaohaios.com";
const LOGIN_URL = `${BASE_URL}/aspx3/mobile/login.aspx?action=index&t=`;
const QIAND_AO_URL = `${BASE_URL}/aspx3/mobile/qiandao.aspx`;
const STATUS_URL = `${BASE_URL}/ashx/Honor.ashx`;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1";
const CURRENT_MONTH = new Date().getMonth() + 1;

async function extractViewState(html) {
  let viewStateMatch = html.match(/name=["']__VIEWSTATE["'].*?value=["'](.*?)["']/i);
  let viewGenMatch = html.match(/name=["']__VIEWSTATEGENERATOR["'].*?value=["'](.*?)["']/i);
  if (!viewStateMatch || !viewGenMatch) throw new Error("未能提取 __VIEWSTATE 或 __VIEWSTATEGENERATOR");
  return {
    viewState: viewStateMatch[1],
    viewGen: viewGenMatch[1]
  };
}

async function checkSignStatus() {
  let req = new Request(STATUS_URL);
  req.method = "POST";
  req.headers = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": BASE_URL,
    "Referer": QIAND_AO_URL
  };
  req.body = `control=list&nowmonth=${CURRENT_MONTH}`;
  try {
    let json = await req.loadJSON();
    if(json.signedToday === "True") {
      await notify("今日已签到 ✅", `已经连续签到${json.continuousDays}天`);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function main() {
  let loginPageReq = new Request(LOGIN_URL);
  loginPageReq.headers = { 
    "User-Agent": USER_AGENT,
    "Cookie": ""
  };
  let loginHtml = await loginPageReq.loadString();
  let loginVs = await extractViewState(loginHtml);
  await notify("获取登录页面成功", "准备登录");
  let loginReq = new Request(LOGIN_URL);
  loginReq.method = "POST";
  loginReq.headers = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": BASE_URL,
    "Referer": LOGIN_URL
  };
  let loginBody = `__EVENTTARGET=btnLogin&__EVENTARGUMENT=&__VIEWSTATE=${encodeURIComponent(loginVs.viewState)}&__VIEWSTATEGENERATOR=${loginVs.viewGen}&txtUser_sign_in=${encodeURIComponent(USERNAME)}&txtPwd_sign_in=${encodeURIComponent(PASSWORD)}&save_pass=`;
  loginReq.body = loginBody;
  await loginReq.load();
  await notify("登录成功", "开始签到流程");
  let alreadySigned = await checkSignStatus();
  if (alreadySigned === true) return;
  await notify("今日未签到", "开始签到");
  let qdPageReq = new Request(QIAND_AO_URL);
  qdPageReq.headers = { "User-Agent": USER_AGENT, "Referer": `${BASE_URL}/aspx3/mobile/usercenter.aspx?action=index` };
  let qdHtml = await qdPageReq.loadString();
  let qdVs = await extractViewState(qdHtml);
  let signReq = new Request(QIAND_AO_URL);
  signReq.method = "POST";
  signReq.headers = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": BASE_URL,
    "Referer": QIAND_AO_URL
  };
  let signBody = `__EVENTTARGET=_lbtqd&__EVENTARGUMENT=&__VIEWSTATE=${encodeURIComponent(qdVs.viewState)}&__VIEWSTATEGENERATOR=${qdVs.viewGen}`;
  signReq.body = signBody;
  let signResp = await signReq.load();
  let maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let finalSigned = await checkSignStatus();
    if (finalSigned === true) {
      await notify("签到成功 🎉", `第 ${attempt} 次检查成功，积分已到账`);
      return;
    }
    if (attempt < maxAttempts) sleep(4000);
  }
  await notify("签到可能失败", `经过 ${maxAttempts} 次检查仍未成功，建议手动检查`);
}

function sleep(ms) {
  let start = Date.now();
  while (Date.now() - start < ms) {}
}

async function notify(title, body) {
  let n = new Notification();
  n.title = title;
  n.body = body;
  await n.schedule();
}

await main();