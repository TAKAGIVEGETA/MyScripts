from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

# ===== 仅保留占位，不建议在文件里直接写入真实凭据 =====
BASE_URL = ""
ACCESS_TOKEN = ""
USER_ID = ""
TURNSTILE_TOKEN = ""
COOKIE = ""
# ================================================

ENV_BASE_URL = "NEW_API_CHECKIN_BASE_URL"
ENV_ACCESS_TOKEN = "NEW_API_CHECKIN_ACCESS_TOKEN"
ENV_USER_ID = "NEW_API_CHECKIN_USER_ID"
ENV_TURNSTILE_TOKEN = "NEW_API_CHECKIN_TURNSTILE_TOKEN"
ENV_COOKIE = "NEW_API_CHECKIN_COOKIE"

DEFAULT_QUOTA_PER_UNIT = 500000.0
DEFAULT_QUOTA_DISPLAY_TYPE = "USD"
DEFAULT_USD_EXCHANGE_RATE = 1.0
DEFAULT_CUSTOM_CURRENCY_SYMBOL = "¤"
DEFAULT_CUSTOM_CURRENCY_EXCHANGE_RATE = 1.0

EXIT_OK = 0
EXIT_CONFIG_ERROR = 1
EXIT_CHECKIN_DISABLED = 2
EXIT_TURNSTILE_REQUIRED = 3
EXIT_API_FAILURE = 4
EXIT_UNEXPECTED_ERROR = 10

ROOT_DIR = Path(__file__).resolve().parent
DEFAULT_ENV_FILE = ROOT_DIR / ".env"
DEFAULT_LOG_FILE = ROOT_DIR / "checkin_log_7d.jsonl"
RECENT_LOG_DAYS = 7


@dataclass
class RunContext:
    base_url: str
    access_token: str
    user_id: str
    turnstile_token: str
    cookie: str


@dataclass
class RunResult:
    timestamp: str
    status: str
    action: str
    message: str
    checkin_date: str = ""
    total_checkins: str = ""
    reward_today: str = ""
    reward_total: str = ""
    current_quota: str = ""
    display_type: str = DEFAULT_QUOTA_DISPLAY_TYPE
    exit_code: int = EXIT_OK

    def to_log_record(self, ctx: RunContext) -> dict[str, object]:
        return {
            "timestamp": self.timestamp,
            "status": self.status,
            "action": self.action,
            "site": ctx.base_url,
            "user_id": ctx.user_id,
            "message": self.message,
            "checkin_date": self.checkin_date,
            "total_checkins": self.total_checkins,
            "reward_today": self.reward_today,
            "reward_total": self.reward_total,
            "current_quota": self.current_quota,
            "display_type": self.display_type,
            "exit_code": self.exit_code,
        }


def now_local() -> datetime:
    return datetime.now().astimezone()


def iso_now() -> str:
    return now_local().isoformat(timespec="seconds")


def normalize_base_url(base_url: str) -> str:
    return base_url.strip().rstrip("/")


def env_or_default(env_name: str, default: str) -> str:
    value = os.getenv(env_name, "")
    return value if value else default


def strip_wrapped_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_dotenv_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = strip_wrapped_quotes(value.strip())
        if not key:
            continue

        os.environ.setdefault(key, value)


def build_headers(base_url: str, access_token: str, user_id: str, cookie: str) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {access_token.strip()}",
        "New-Api-User": str(user_id).strip(),
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/135.0.0.0 Safari/537.36"
        ),
    }
    if base_url:
        headers["Referer"] = normalize_base_url(base_url) + "/"
    if cookie.strip():
        headers["Cookie"] = cookie.strip()
    return headers


def format_non_json_error(body: str) -> str:
    snippet = body.strip().replace("\n", " ")[:300]
    lowered = body.lower()

    if "error code: 1010" in lowered or "cloudflare" in lowered:
        return (
            "被 Cloudflare/WAF 拦截。"
            f" 片段: {snippet}"
        )

    return f"接口返回非 JSON: {snippet}"


def request_json(method: str, url: str, headers: dict[str, str]) -> tuple[int, dict]:
    req = urllib.request.Request(url=url, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            status = resp.getcode()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        status = exc.code
    except urllib.error.URLError as exc:
        raise RuntimeError(f"请求失败: {exc}") from exc

    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError as exc:
        raise RuntimeError(format_non_json_error(body)) from exc

    return status, data


def try_get_status(base_url: str, headers: dict[str, str]) -> dict:
    try:
        status_code, data = request_json("GET", f"{base_url}/api/status", headers)
        if status_code != 200:
            return {}
        return data.get("data") or data
    except RuntimeError:
        return {}


def get_self(base_url: str, headers: dict[str, str]) -> dict:
    status_code, data = request_json("GET", f"{base_url}/api/user/self", headers)
    if status_code != 200:
        raise RuntimeError(f"查询用户信息失败，HTTP {status_code}: {data}")
    if not data.get("success"):
        raise RuntimeError(f"查询用户信息失败: {data.get('message') or data}")
    return data.get("data") or {}


def get_checkin_status(base_url: str, headers: dict[str, str]) -> dict:
    status_code, data = request_json("GET", f"{base_url}/api/user/checkin", headers)
    if status_code != 200:
        raise RuntimeError(f"查询签到状态失败，HTTP {status_code}: {data}")
    if not data.get("success"):
        raise RuntimeError(f"查询签到状态失败: {data.get('message') or data}")
    return data.get("data") or {}


def do_checkin(base_url: str, headers: dict[str, str], turnstile_token: str) -> dict:
    url = f"{base_url}/api/user/checkin"
    if turnstile_token.strip():
        query = urllib.parse.urlencode({"turnstile": turnstile_token.strip()})
        url = f"{url}?{query}"

    status_code, data = request_json("POST", url, headers)
    if status_code != 200:
        raise RuntimeError(f"执行签到失败，HTTP {status_code}: {data}")
    return data


def get_display_type(status_data: dict) -> str:
    return str(status_data.get("quota_display_type") or DEFAULT_QUOTA_DISPLAY_TYPE).upper()


def format_display_quota(quota: int | float, status_data: dict, digits: int = 6) -> str:
    quota_per_unit = float(status_data.get("quota_per_unit") or DEFAULT_QUOTA_PER_UNIT)
    quota_display_type = get_display_type(status_data)
    usd_amount = float(quota) / quota_per_unit

    if quota_display_type == "TOKENS":
        return str(int(quota))
    if quota_display_type == "CNY":
        rate = float(status_data.get("usd_exchange_rate") or DEFAULT_USD_EXCHANGE_RATE)
        return f"¥{usd_amount * rate:.{digits}f}"
    if quota_display_type == "CUSTOM":
        symbol = str(
            status_data.get("custom_currency_symbol") or DEFAULT_CUSTOM_CURRENCY_SYMBOL
        )
        rate = float(
            status_data.get("custom_currency_exchange_rate")
            or DEFAULT_CUSTOM_CURRENCY_EXCHANGE_RATE
        )
        return f"{symbol}{usd_amount * rate:.{digits}f}"
    return f"${usd_amount:.{digits}f}"


def load_recent_records(path: Path, days: int) -> list[dict[str, object]]:
    cutoff = now_local() - timedelta(days=days)
    records: list[dict[str, object]] = []

    if not path.exists():
        return records

    with path.open("r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                row_dt = datetime.fromisoformat(str(record.get("timestamp", "")))
            except (ValueError, json.JSONDecodeError, TypeError):
                continue
            if row_dt >= cutoff:
                records.append(record)

    return records


def write_recent_jsonl(path: Path, records: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def write_logs(ctx: RunContext, result: RunResult) -> None:
    record = result.to_log_record(ctx)
    records = load_recent_records(DEFAULT_LOG_FILE, RECENT_LOG_DAYS)
    records.append(record)
    write_recent_jsonl(DEFAULT_LOG_FILE, records)


def build_console_summary(result: RunResult) -> str:
    parts = [result.timestamp, f"[{result.status}]", result.message]
    if result.total_checkins:
        parts.append(f"累计签到 {result.total_checkins} 次")
    if result.reward_today:
        parts.append(f"本次奖励 {result.reward_today}")
    if result.reward_total:
        parts.append(f"累计奖励 {result.reward_total}")
    if result.current_quota:
        parts.append(f"当前额度 {result.current_quota}")
    return " | ".join(parts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="new-api 签到脚本")
    parser.add_argument(
        "--base-url",
        default=env_or_default(ENV_BASE_URL, BASE_URL),
        help=f"站点地址，默认读取 {ENV_BASE_URL}",
    )
    parser.add_argument(
        "--access-token",
        default=env_or_default(ENV_ACCESS_TOKEN, ACCESS_TOKEN),
        help=f"系统访问令牌，默认读取 {ENV_ACCESS_TOKEN}",
    )
    parser.add_argument(
        "--user-id",
        default=env_or_default(ENV_USER_ID, USER_ID),
        help=f"用户 ID，默认读取 {ENV_USER_ID}",
    )
    parser.add_argument(
        "--turnstile-token",
        default=env_or_default(ENV_TURNSTILE_TOKEN, TURNSTILE_TOKEN),
        help=f"Turnstile token，默认读取 {ENV_TURNSTILE_TOKEN}",
    )
    parser.add_argument(
        "--cookie",
        default=env_or_default(ENV_COOKIE, COOKIE),
        help=f"可选，站点 Cookie，默认读取 {ENV_COOKIE}",
    )
    return parser.parse_args()


def build_context(args: argparse.Namespace) -> RunContext:
    return RunContext(
        base_url=normalize_base_url(args.base_url),
        access_token=args.access_token.strip(),
        user_id=str(args.user_id).strip(),
        turnstile_token=args.turnstile_token.strip(),
        cookie=args.cookie.strip(),
    )


def validate_context(ctx: RunContext) -> str:
    missing = [
        name
        for name, value in (
            ("BASE_URL", ctx.base_url),
            ("ACCESS_TOKEN", ctx.access_token),
            ("USER_ID", ctx.user_id),
        )
        if not value
    ]
    return ", ".join(missing)


def create_result(
    *,
    status: str,
    action: str,
    message: str,
    exit_code: int,
    checkin_date: str = "",
    total_checkins: str = "",
    reward_today: str = "",
    reward_total: str = "",
    current_quota: str = "",
    display_type: str = DEFAULT_QUOTA_DISPLAY_TYPE,
) -> RunResult:
    return RunResult(
        timestamp=iso_now(),
        status=status,
        action=action,
        message=message,
        checkin_date=checkin_date,
        total_checkins=str(total_checkins) if total_checkins != "" else "",
        reward_today=reward_today,
        reward_total=reward_total,
        current_quota=current_quota,
        display_type=display_type,
        exit_code=exit_code,
    )


def run(ctx: RunContext) -> RunResult:
    missing = validate_context(ctx)
    if missing:
        return create_result(
            status="CONFIG_ERROR",
            action="validate",
            message=f"缺少配置: {missing}",
            exit_code=EXIT_CONFIG_ERROR,
        )

    headers = build_headers(ctx.base_url, ctx.access_token, ctx.user_id, ctx.cookie)
    status_data = try_get_status(ctx.base_url, headers)
    display_type = get_display_type(status_data)

    try:
        self_data = get_self(ctx.base_url, headers)
        current = get_checkin_status(ctx.base_url, headers)
        stats = current.get("stats") or {}
        current_quota = format_display_quota(self_data.get("quota", 0), status_data, 6)
        total_reward = format_display_quota(stats.get("total_quota", 0), status_data, 6)
        total_checkins = stats.get("total_checkins", "")

        if stats.get("checked_in_today"):
            return create_result(
                status="ALREADY_CHECKED_IN",
                action="query",
                message="今天已经签到过了",
                total_checkins=total_checkins,
                reward_total=total_reward,
                current_quota=current_quota,
                display_type=display_type,
                exit_code=EXIT_OK,
            )

        result = do_checkin(ctx.base_url, headers, ctx.turnstile_token)
        if not result.get("success"):
            message = result.get("message") or str(result)
            if "Turnstile token 为空" in message:
                return create_result(
                    status="TURNSTILE_REQUIRED",
                    action="checkin",
                    message="站点开启了 Turnstile，需要提供 turnstile token",
                    total_checkins=total_checkins,
                    reward_total=total_reward,
                    current_quota=current_quota,
                    display_type=display_type,
                    exit_code=EXIT_TURNSTILE_REQUIRED,
                )
            return create_result(
                status="API_ERROR",
                action="checkin",
                message=f"签到失败: {message}",
                total_checkins=total_checkins,
                reward_total=total_reward,
                current_quota=current_quota,
                display_type=display_type,
                exit_code=EXIT_API_FAILURE,
            )

        data = result.get("data") or {}
        self_after = get_self(ctx.base_url, headers)
        reward_today = format_display_quota(data.get("quota_awarded", 0), status_data, 6)
        reward_total = format_display_quota(
            stats.get("total_quota", 0) + data.get("quota_awarded", 0),
            status_data,
            6,
        )
        current_quota = format_display_quota(self_after.get("quota", 0), status_data, 6)

        return create_result(
            status="CHECKED_IN",
            action="checkin",
            message=result.get("message") or "签到成功",
            checkin_date=str(data.get("checkin_date") or ""),
            total_checkins=str((stats.get("total_checkins") or 0) + 1),
            reward_today=reward_today,
            reward_total=reward_total,
            current_quota=current_quota,
            display_type=display_type,
            exit_code=EXIT_OK,
        )
    except RuntimeError as exc:
        message = str(exc)
        exit_code = EXIT_UNEXPECTED_ERROR
        status = "ERROR"
        action = "request"

        if "签到功能未启用" in message:
            exit_code = EXIT_CHECKIN_DISABLED
            status = "CHECKIN_DISABLED"
            action = "query"
        elif "Turnstile token 为空" in message:
            exit_code = EXIT_TURNSTILE_REQUIRED
            status = "TURNSTILE_REQUIRED"
            action = "checkin"
            message = "站点开启了 Turnstile，需要提供 turnstile token"
        elif "签到失败" in message or "查询" in message or "请求失败" in message:
            exit_code = EXIT_API_FAILURE
            status = "API_ERROR"

        return create_result(
            status=status,
            action=action,
            message=message,
            display_type=display_type,
            exit_code=exit_code,
        )

# ================= 新增：对接 main.py 的接口 =================
def main_task() -> str:
    """供 main.py 调用的任务入口"""
    load_dotenv_file(DEFAULT_ENV_FILE)
    
    # 构造上下文 (直接读取环境变量，不使用 argparse 以免冲突)
    ctx = RunContext(
        base_url=normalize_base_url(env_or_default(ENV_BASE_URL, BASE_URL)),
        access_token=env_or_default(ENV_ACCESS_TOKEN, ACCESS_TOKEN).strip(),
        user_id=str(env_or_default(ENV_USER_ID, USER_ID)).strip(),
        turnstile_token=env_or_default(ENV_TURNSTILE_TOKEN, TURNSTILE_TOKEN).strip(),
        cookie=env_or_default(ENV_COOKIE, COOKIE).strip(),
    )

    result = run(ctx)
    write_logs(ctx, result)

    # 格式化通知文本
    title = "<b>New API 签到</b>"
    
    # 状态图标
    status_icon = "✅"
    if result.status == "ALREADY_CHECKED_IN":
        status_icon = "ℹ️"
    elif result.exit_code != EXIT_OK:
        status_icon = "❌"

    res_str = f"{title}\n{status_icon} {result.message}"
    
    if result.reward_today:
        res_str += f"\n🎁 本次奖励: {result.reward_today}"
    if result.reward_total:
        res_str += f"\n📈 累计奖励: {result.reward_total}"
    if result.total_checkins:
        res_str += f"\n🔢 累计签到: {result.total_checkins} 次"
    if result.current_quota:
        res_str += f"\n💰 当前额度: {result.current_quota}"

    return res_str
# ==========================================================

def main() -> int:
    load_dotenv_file(DEFAULT_ENV_FILE)
    args = parse_args()
    ctx = build_context(args)
    result = run(ctx)
    write_logs(ctx, result)

    summary = build_console_summary(result)
    stream = sys.stderr if result.exit_code != EXIT_OK else sys.stdout
    print(summary, file=stream)

    return result.exit_code


if __name__ == "__main__":
    # 为了方便你单独运行调试 main_task 输出，可以在此修改：
    # print(main_task()) 
    # 或者保持原状：
    raise SystemExit(main())