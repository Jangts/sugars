/**
 * `@sugars/highlight` 内置的 `handlebars` 词法。
 *
 * 把模板表达式临时取出后高亮外围标记，再按原位置恢复模板标记。
 */

import { highlighter as highlight } from '../core.js'

var handlebars_pattern = /\{\{\{[\w\W]+?\}\}\}|\{\{[\w\W]+?\}\}/g;

highlight.languages.handlebars = highlight.languages.extend('markup', {
    'handlebars': {
        pattern: handlebars_pattern,
        inside: {
            'delimiter': {
                pattern: /^\{\{\{?|\}\}\}?$/i,
                alias: 'punctuation'
            },
            'string': /(["'])(\\?.)*?\1/,
            'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee][+-]?\d+)?)\b/,
            'boolean': /\b(true|false)\b/,
            'block': {
                pattern: /^(\s*~?\s*)[#\/]\S+?(?=\s*~?\s*$|\s)/i,
                lookbehind: true,
                alias: 'keyword'
            },
            'brackets': {
                pattern: /\[[^\]]+\]/,
                inside: {
                    punctuation: /\[|\]/,
                    variable: /[\w\W]+/
                }
            },
            'punctuation': /[!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~]/,
            'variable': /[^!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~\s]+/
        }
    }
});

// 优先匹配注释，让注释可以包住标记文本。
highlight.languages.insertBefore('handlebars', 'tag', {
    'handlebars-comment': {
        pattern: /\{\{![\w\W]*?\}\}/,
        alias: ['handlebars', 'comment']
    }
});

// 取出双花括号或三花括号包裹的表达式，便于分别高亮外围标记。
highlight.hooks.add('before-highlight', function(env) {
    if (env.language !== 'handlebars') {
        return;
    }

    // 占位符与 tokenStack 中的位置一一对应。保留原始源码供后续钩子使用，恢复时再按模板词法着色。
    const tokenStack: string[] = env.tokenStack = [];

    env.backupCode = env.code;
    env.code = env.code.replace(handlebars_pattern, function(match) {
        tokenStack.push(match);

        return '___HANDLEBARS' + tokenStack.length + '___';
    });
});

// 恢复原始 env.code，供行号等其他插件使用。
highlight.hooks.add('before-insert', function(env) {
    if (env.language === 'handlebars') {
        env.code = env.backupCode ?? env.code;
        delete env.backupCode;
    }
});

// 外围高亮完成后，将模板片段按对应词法插回。
highlight.hooks.add('after-highlight', function(env) {
    if (env.language !== 'handlebars') {
        return;
    }

    for (const [i, t] of (env.tokenStack ?? []).entries()) {
        // 通过替换回调插入内容，避免其中的 $ 组合被解释为替换模板。
        env.highlightedCode = env.highlightedCode.replace('___HANDLEBARS' + (i + 1) + '___', highlight.highlight(t, env.grammar, 'handlebars').replace(/\$/g, '$$$$'));
    }

    env.element.innerHTML = env.highlightedCode;
});
