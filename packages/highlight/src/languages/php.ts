/**
 * `@sugars/highlight` 内置的 `php` 词法。
 *
 * 既能直接高亮 PHP 源码，也能在标记高亮过程中取出并恢复 PHP 代码片段。
 */

import { highlighter as highlight } from '../core.js'


/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * 从 C 风格词法扩展，加入 PHP 5.3 及后续语法中的命名空间、trait 等，并细分常量与函数。
 *
 * 新增标记类型包括
 * 		constant, delimiter, variable, function, package
 */

highlight.languages.php = highlight.languages.extend('clike', {
    'keyword': /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
    'constant': /\b[A-Z0-9_]{2,}\b/,
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\w\W]*?\*\/|\/\/.*)/,
        lookbehind: true
    }
});

// 井号注释放在字符串之后匹配，避免抢占字符串中的井号。
highlight.languages.insertBefore('php', 'class-name', {
    'shell-comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        alias: 'comment'
    }
});

highlight.languages.insertBefore('php', 'keyword', {
    'delimiter': /\?>|<\?(?:php)?/i,
    'variable': /\$\w+\b/i,
    'package': {
        pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
        lookbehind: true,
        inside: {
            punctuation: /\\/
        }
    }
});

// 这条规则须放在函数匹配之后。
highlight.languages.insertBefore('php', 'operator', {
    'property': {
        pattern: /(->)[\w]+/,
        lookbehind: true
    }
});

// 已登记标记词法时启用嵌入 PHP 高亮。
if (highlight.languages.markup) {

    // 先提取 PHP 起止标记之间的代码，以便分别高亮 PHP 和外围标记。
    highlight.hooks.add('before-highlight',
        function(env) {
            if (env.language !== 'php') {
                return;
            }

            // 暂存 PHP 片段，让外围标记分词不碰 PHP 内容。输出阶段用相同索引恢复并高亮原片段。
            const tokenStack: string[] = env.tokenStack = [];

            env.backupCode = env.code;
            env.code = env.code.replace(/(?:<\?php|<\?)[\w\W]*?(?:\?>)/ig,
                function(match) {
                    tokenStack.push(match);

                    return '{{{PHP' + tokenStack.length + '}}}';
                });
        });

    // 恢复原始 env.code，供行号等其他插件使用。
    highlight.hooks.add('before-insert',
        function(env) {
            if (env.language === 'php') {
                env.code = env.backupCode ?? env.code;
                delete env.backupCode;
            }
        });

    // 外围高亮完成后，将模板片段按对应词法插回。
    highlight.hooks.add('after-highlight',
        function(env) {
            if (env.language !== 'php') {
                return;
            }

            for (const [i, t] of (env.tokenStack ?? []).entries()) {
                // 通过替换回调插入内容，避免其中的 $ 组合被解释为替换模板。
                env.highlightedCode = env.highlightedCode.replace('{{{PHP' + (i + 1) + '}}}', highlight.highlight(t, env.grammar, 'php').replace(/\$/g, '$$$$'));
            }

            env.element.innerHTML = env.highlightedCode;
        });

    // 为缺少样式类的标记补上类名。
    highlight.hooks.add('wrap',
        function(env) {
            if (env.language === 'php' && env.type === 'markup') {
                env.content = env.content.replace(/(\{\{\{PHP[0-9]+\}\}\})/g, "<span class=\"token php\">$1</span>");
            }
        });

    // 把嵌入规则插入词法表首位。
    highlight.languages.insertBefore('php', 'comment', {
        'markup': {
            pattern: /<[^?]\/?(.*?)>/,
            inside: highlight.languages.markup
        },
        'php': /\{\{\{PHP[0-9]+\}\}\}/
    });
};
highlight.languages.insertBefore('php', 'variable', {
    'this': /\$this\b/,
    'global': /\$(?:_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)|GLOBALS|HTTP_RAW_POST_DATA|argc|argv|php_errormsg|http_response_header)/,
    'scope': {
        pattern: /\b[\w\\]+::/,
        inside: {
            keyword: /(static|self|parent)/,
            punctuation: /(::|\\)/
        }
    }
});
