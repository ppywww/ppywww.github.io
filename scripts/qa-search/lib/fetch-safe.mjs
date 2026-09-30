/**
 * 网络取数绝不抛异常：验收脚本遇到网络/端口/DNS 故障时，
 * 必须**记录为不通过**，而不是崩掉——崩掉就没人知道发生了什么，
 * 汇总与「产物指纹守卫」也都会被跳过。
 */
export async function safeFetchText(url) {
  try {
    const res = await fetch(url);
    if (res.status !== 200) return { ok: false, status: res.status, text: null, error: null };
    return { ok: true, status: 200, text: await res.text(), error: null };
  } catch (err) {
    return { ok: false, status: 'ERR', text: null, error: String((err && err.message) || err) };
  }
}

export async function safeFetchStatus(url) {
  const r = await safeFetchText(url);
  return r.ok ? r.status : r.status === 'ERR' ? 'ERR:' + r.error : r.status;
}
