/**
 * `@sugars/highlight` 内置的 `docker` 词法。
 *
 * 通过指令、参数字符串与注释区分 Dockerfile 的构建步骤。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.docker = {
    // 指令按行首位置识别，参数中同形的单词仍按其他规则处理。
    'keyword': {
        pattern: /(^\s*)(?:ONBUILD|FROM|MAINTAINER|RUN|EXPOSE|ENV|ADD|COPY|VOLUME|USER|WORKDIR|CMD|LABEL|ENTRYPOINT)(?=\s)/mi,
        lookbehind: true
    },
    'string': /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*?\1/,
    'comment': /#.*/,
    'punctuation': /---|\.\.\.|[:[\]{}\-,|>?]/
};
