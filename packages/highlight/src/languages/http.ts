/**
 * `@sugars/highlight` 内置的 `http` 词法。
 *
 * 分别标记 HTTP 请求行、状态行、头字段和不同媒体类型的消息体。
 */

import { highlighter as highlight } from '../core.js'
import type { Grammar } from '../grammar.js'

highlight.languages.http = {
    // 先锁定完整请求行，再在内部拆方法、路径和协议版本，避免头字段规则抢占请求路径。
    'request-line': {
        pattern: /^(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b\shttps?:\/\/\S+\sHTTP\/[0-9.]+/m,
        inside: {
            // HTTP 方法。
            property: /^(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b/,
            // 路径与查询参数。
            'attr-name': /:\w+/
        }
    },
    'response-status': {
        pattern: /^HTTP\/1.[01] [0-9]+.*/m,
        inside: {
            // 响应状态，例如 200 OK。
            property: {
                pattern: /(^HTTP\/1.[01] )[0-9]+.*/i,
                lookbehind: true
            }
        }
    },
    // HTTP 头字段名。
    'header-name': {
        pattern: /^[\w-]+:(?=.)/m,
        alias: 'keyword'
    }
};

// 将媒体类型关联到响应体词法。
const httpLanguages: Record<string, Grammar | undefined> = {
    'application/json': highlight.languages.javascript,
    'application/xml': highlight.languages.markup,
    'text/xml': highlight.languages.markup,
    'text/html': highlight.languages.markup
};

// 只启用目标语言已经登记的媒体类型。
for (var contentType in httpLanguages) {
    if (httpLanguages[contentType]) {
        const options: Grammar = {};
        options[contentType] = {
            pattern: new RegExp('(content-type:\\s*' + contentType + '[\\w\\W]*?)(?:\\r?\\n|\\r){2}[\\w\\W]*', 'i'),
            lookbehind: true,
            inside: {
                rest: httpLanguages[contentType]
            }
        };
        highlight.languages.insertBefore('http', 'header-name', options);
    }
};
