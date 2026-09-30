/**
 * 极简断言收集器：统一「通过 / 不通过 / 无法验证」三态与证据留痕。
 * 不使用任何测试框架（项目零额外依赖）。
 */
import process from 'node:process';

export function createReporter(title) {
  const results = [];
  const t0 = Date.now();

  function add(status, id, name, detail) {
    results.push({ status, id, name, detail: detail ?? '' });
  }

  return {
    title,
    results,
    /** 通过 */
    pass: (id, name, detail) => add('PASS', id, name, detail),
    /** 不通过 */
    fail: (id, name, detail) => add('FAIL', id, name, detail),
    /** 无法验证（缺样本、缺环境、需要另一轮），必须写明原因 */
    skip: (id, name, detail) => add('UNVERIFIED', id, name, detail),
    /** 客观记录，不计入通过率 */
    note: (id, name, detail) => add('INFO', id, name, detail),
    /** 按布尔值自动落 PASS/FAIL */
    check(id, name, ok, detail) {
      ok ? add('PASS', id, name, detail) : add('FAIL', id, name, detail);
      return !!ok;
    },
    summary() {
      const count = (s) => results.filter((r) => r.status === s).length;
      return {
        title,
        pass: count('PASS'),
        fail: count('FAIL'),
        unverified: count('UNVERIFIED'),
        info: count('INFO'),
        elapsedMs: Date.now() - t0,
      };
    },
    print() {
      console.log('\n===== ' + title + ' =====');
      for (const r of results) {
        const tag = { PASS: '[通过]', FAIL: '[不通过]', UNVERIFIED: '[无法验证]', INFO: '[记录]' }[r.status];
        console.log(tag + ' ' + r.id + ' · ' + r.name);
        if (r.detail) console.log('        ' + String(r.detail).replace(/\n/g, '\n        '));
      }
      const s = this.summary();
      console.log('--- 汇总：通过 ' + s.pass + ' / 不通过 ' + s.fail + ' / 无法验证 ' + s.unverified + ' / 记录 ' + s.info + '（' + s.elapsedMs + 'ms）---');
      return s;
    },
    exitCode() {
      return results.some((r) => r.status === 'FAIL') ? 1 : 0;
    },
  };
}
