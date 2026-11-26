/**
 * `@sugars/highlight` 内置的 `smarty` 词法。
 *
 * 在标记高亮阶段暂存 Smarty 标签，再把已分词的模板内容放回原位置。
 */

import { highlighter as highlight } from '../core.js'

var smarty_pattern = /\{\*[\w\W]+?\*\}|\{[\w\W]+?\}/g;
var smarty_litteral_start = '{literal}';
var smarty_litteral_end = '{/literal}';

highlight.languages.smarty = highlight.languages.extend('markup', {
    'smarty': {
        pattern: smarty_pattern,
        inside: {
            'delimiter': {
                pattern: /^\{|\}$/i,
                alias: 'punctuation'
            },
            'string': /(["'])(?:\\?.)*?\1/,
            'number': /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee][-+]?\d+)?)\b/,
            'variable': [
                /\$(?!\d)\w+/,
                /#(?!\d)\w+#/,
                {
                    pattern: /(\.|->)(?!\d)\w+/,
                    lookbehind: true
                },
                {
                    pattern: /(\[)(?!\d)\w+(?=\])/,
                    lookbehind: true
                }
            ],
            'function': [{
                    pattern: /(\|\s*)@?(?!\d)\w+/,
                    lookbehind: true
                },
                /^\/?(?!\d)\w+/,
                /(?!\d)\w+(?=\()/
            ],
            'attr-name': {
                // 值为可选匹配，它可能已被分词。
                pattern: /\w+\s*=\s*(?:(?!\d)\w+)?/,
                inside: {
                    "variable": {
                        pattern: /(=\s*)(?!\d)\w+/,
                        lookbehind: true
                    },
                    "operator": /=/
                }
            },
            'punctuation': [
                /[\[\]().,:`]|\->/
            ],
            'operator': [
                /[+\-*\/%]|==?=?|[!<>]=?|&&|\|\|?/,
                /\bis\s+(?:not\s+)?(?:div|even|odd)(?:\s+by)?\b/,
                /\b(?:eq|neq?|gt|lt|gt?e|lt?e|not|mod|or|and)\b/
            ],
            'keyword': /\b(?:false|off|on|no|true|yes)\b/
        }
    }
});

// 优先匹配注释，让注释可以包住标记文本。
highlight.languages.insertBefore('smarty', 'tag', {
    'smarty-comment': {
        pattern: /\{\*[\w\W]*?\*\}/,
        alias: ['smarty', 'comment']
    }
});

// 暂存要在标记之外单独分词的 Smarty 表达式。
highlight.hooks.add('before-highlight', function(env) {
    if (env.language !== 'smarty') {
        return;
    }

    var smarty_litteral_mode = false;
    // 外围标记阶段只保留模板位置，Smarty 片段之后单独高亮。literal 块中的疑似标签应保留原样。
    const tokenStack: string[] = env.tokenStack = [];

    env.backupCode = env.code;
    env.code = env.code.replace(smarty_pattern, function(match) {

        // literal 块内的 Smarty 标签保持原文。
        if (match === smarty_litteral_end) {
            smarty_litteral_mode = false;
        }

        if (!smarty_litteral_mode) {
            if (match === smarty_litteral_start) {
                smarty_litteral_mode = true;
            }
            tokenStack.push(match);

            return '___SMARTY' + tokenStack.length + '___';
        }
        return match;
    });
});

// 恢复原始 env.code，供行号等其他插件使用。
highlight.hooks.add('before-insert', function(env) {
    if (env.language === 'smarty') {
        env.code = env.backupCode ?? env.code;
        delete env.backupCode;
    }
});

// 外围高亮完成后，将模板片段按对应词法插回。
highlight.hooks.add('after-highlight', function(env) {
    if (env.language !== 'smarty') {
        return;
    }

    for (const [i, t] of (env.tokenStack ?? []).entries()) {
        // 通过替换回调插入内容，避免其中的 $ 组合被解释为替换模板。
        env.highlightedCode = env.highlightedCode.replace('___SMARTY' + (i + 1) + '___', highlight.highlight(t, env.grammar, 'smarty').replace(/\$/g, '$$$$'));
    }

    env.element.innerHTML = env.highlightedCode;
});
