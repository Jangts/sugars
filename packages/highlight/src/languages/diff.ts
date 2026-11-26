/**
 * `@sugars/highlight` 内置的 `diff` 词法。
 *
 * 先区分 diff 的区块坐标、删除行、插入行与上下文。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.diff = {
    // 区块和文件坐标在变更行之前匹配，避免文件头的加减号被当作正文。
    'coord': [
        // 匹配 +++、--- 和 *** 开头的坐标行。
        /^(?:\*{3}|-{3}|\+{3}).*$/m,
        // 匹配统一 diff 的 @@ 区块坐标。
        /^@@.*@@$/m,
        // 普通 diff 的坐标行以数字开头。
        /^\d+.*$/m
    ],

    // 插入和删除行支持 +/- 与 >/< 两种前缀。
    'deleted': /^[-<].+$/m,
    'inserted': /^[+>].+$/m,

    // 上下文 diff 用 ! 标记发生变化的行。
    'diff': {
        'pattern': /^!(?!!).+$/m,
        'alias': 'important'
    }
};
