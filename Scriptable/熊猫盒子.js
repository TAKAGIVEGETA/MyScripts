// ==Scriptable==
// 熊猫iOS游戏盒子 一键获取积分
// @description  熊猫iOS游戏盒子 自动登录 + 每日签到 + 看视频领积分（最多3次）
// @author       Takagivegeta
// ==/Scriptable===

const baseUrl = "https://api.ioshz.com";
let deepLink = "";
let ticket = "";
let token = "";

// 忙等待 sleep 函数（Scriptable 不支持 setTimeout，必须用 busy wait）
function sleep(ms) {
  let start = Date.now();
  while (Date.now() - start < ms) {}
}

function notify(title, subtitle = "", body = "") {
  let n = new Notification();
  n.title = title;
  n.subtitle = subtitle;
  n.body = body;
  n.sound = "default";
  n.schedule();
}

async function generateLoginLink() {
  try {
    let request = new Request(`${baseUrl}/v3/wechat/webLogin`);
    request.method = "POST";
    request.headers = {
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://ioshz.com",
      "Referer": "https://ioshz.com/",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1"
    };
    let response = await request.loadJSON();
    if (response.code !== 200) {
      notify("熊猫盒子-异常", "生成链接失败", response.message);
      return false;
    }
    ticket = response.data.ticket;
    deepLink = response.data.link;
    Safari.open(deepLink);
    return true;
  } catch (error) {
    notify("熊猫盒子-异常", "生成登录链接出错");
    console.error("generateLoginLink error: " + error);
    return false;
  }
}

async function pollLoginCheck() {
  if (!ticket) {
    notify("熊猫盒子-异常", "ticket 为空，无法检查登录");
    return false;
  }
  let maxAttempts = 5;
  let attempt = 1;
  while (attempt <= maxAttempts) {
    sleep(5000);
    try {
      let request = new Request(`${baseUrl}/v3/wechat/webLoginCheck`);
      request.method = "POST";
      request.headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://ioshz.com",
        "Referer": "https://ioshz.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1"
      };
      request.body = JSON.stringify({ ticket: ticket });
      let response = await request.loadJSON();
      if (response.code === 200 && response.data && response.data.token) {
        token = response.data.token;
        notify("熊猫盒子登录成功 🎉", "Token 已获取", `轮询第 ${attempt} 次成功`, token.substring(0, 20) + "...");
        return true;
      }
    } catch (error) {
      console.error(`轮询第 ${attempt} 次出错: ${error}`);
    }
    attempt++;
  }
  notify("熊猫盒子-登录超时", "未检测到登录成功", "请检查是否已在微信确认");
  return false;
}

async function dailySign() {
  if (!token) return false;
  try {
    let request = new Request(`${baseUrl}/v2/credit-task/dailySign`);
    request.method = "POST";
    request.headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.64(0x18004034) NetType/WIFI Language/zh_CN"
    };
    request.body = JSON.stringify({});
    let response = await request.loadJSON();
    if (response.code === 0) {
      notify("熊猫盒子-签到成功", response.message, `当前积分: ${response.data.balance}`);
      return true;
    } else {
      notify("熊猫盒子-签到失败", response.message);
      return false;
    }
  } catch (error) {
    notify("熊猫盒子-签到异常", "请求出错");
    console.error("dailySign error: " + error);
    return false;
  }
}

async function rewardVideo(times = 3) {
  if (!token) return;
  let successCount = 0;
  for (let i = 1; i <= times; i++) {
    try {
      let request = new Request(`${baseUrl}/v2/credit-task/rewardVideo`);
      request.method = "POST";
      request.headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.64(0x18004034) NetType/WIFI Language/zh_CN"
      };
      request.body = JSON.stringify({});
      let response = await request.loadJSON();
      if (response.code === 0) {
        successCount++;
        notify(`熊猫盒子-视频${i}成功`, response.message, `当前积分: ${response.data.balance}`);
      } else {
        notify(`熊猫盒子-视频${i}失败`, response.message);
        break;
      }
    } catch (error) {
      notify(`熊猫盒子-视频${i}异常`, "请求出错");
      console.error(`rewardVideo ${i} error: ` + error);
      break;
    }
    sleep(4000);
  }
  if (successCount > 0) notify("熊猫盒子-视频任务完成", `成功领取 ${successCount} 次`);
}

async function main() {
  notify("熊猫盒子-开始运行", "正在生成登录链接 即将打开微信");
  let success = await generateLoginLink();
  if (!success) return;
  let loginSuccess = await pollLoginCheck();
  if (!loginSuccess) return;
  await dailySign();
  await rewardVideo(3);
  notify("熊猫盒子-全部完成", "今日任务已执行完毕");
}

await main();