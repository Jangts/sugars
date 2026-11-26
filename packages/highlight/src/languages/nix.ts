/**
 * `@sugars/highlight` 内置的 `nix` 词法。
 *
 * 识别 Nix 的路径、字符串和插值，插值内部重新使用 Nix 词法。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, insideGrammar } from '../grammar.js'

highlight.languages.nix = {
    'comment': /\/\*[\s\S]*?\*\/|#.*/,
    // 插值允许在字符串内部递归应用 Nix 规则。转义前缀会阻止相应的插值候选。
    'string': {
        pattern: /"(?:[^"\\]|\\[\s\S])*"|''(?:(?!'')[\s\S]|''(?:'|\\|\$\{))*''/,
        inside: {
            'interpolation': {
                // 后顾排除带反斜线或双单引号前缀的插值候选。
                pattern: /(^|(?:^|(?!'').)[^\\])\$\{(?:[^}]|\{[^}]*\})*}/,
                lookbehind: true,
                inside: {
                    'antiquotation': {
                        pattern: /^\$(?=\{)/,
                        alias: 'variable'
                    }
                    // 嵌套规则在下方补入。
                }
            }
        }
    },
    'url': [/\b(?:[a-z]{3,7}:\/\/)[\w\-+%~\/.:#=?&]+/, {
        pattern: /([^\/])(?:[\w\-+%~.:#=?&]*(?!\/\/)[\w\-+%~\/.:#=?&])?(?!\/\/)\/[\w\-+%~\/.:#=?&]*/,
        lookbehind: true
    }],
    'antiquotation': {
        pattern: /\$(?=\{)/,
        alias: 'variable'
    },
    'number': /\b\d+\b/,
    'keyword': /\b(?:assert|builtins|else|if|in|inherit|let|null|or|then|with)\b/,
    'function': /\b(?:abort|add|all|any|attrNames|attrValues|baseNameOf|compareVersions|concatLists|currentSystem|deepSeq|derivation|dirOf|div|elem(?:At)?|fetch(?:url|Tarball)|filter(?:Source)?|fromJSON|genList|getAttr|getEnv|hasAttr|hashString|head|import|intersectAttrs|is(?:Attrs|Bool|Function|Int|List|Null|String)|length|lessThan|listToAttrs|map|mul|parseDrvName|pathExists|read(?:Dir|File)|removeAttrs|replaceStrings|seq|sort|stringLength|sub(?:string)?|tail|throw|to(?:File|JSON|Path|String|XML)|trace|typeOf)\b|\bfoldl'\B/,
    'boolean': /\b(?:true|false)\b/,
    'operator': /[=!<>]=?|\+\+?|\|\||&&|\/\/|->?|[?@]/,
    'punctuation': /[{}()[\].,:;]/
};

insideGrammar(insideGrammar(highlight.languages.nix!.string).interpolation).rest = cloneGrammar(highlight.languages.nix);
