/**
 * `@sugars/highlight` 内置的 `cpp` 词法。
 *
 * 扩展 C 的词法以识别 C++ 类型名、关键字与运算符。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.cpp = highlight.languages.extend('c', {
    'keyword': /\b(alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
    'boolean': /\b(true|false)\b/,
    'operator': /[-+]{1,2}|!=?|<{1,2}=?|>{1,2}=?|\->|:{1,2}|={1,2}|\^|~|%|&{1,2}|\|?\||\?|\*|\/|\b(and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
});
highlight.languages.insertBefore('cpp', 'keyword', {
    // 匹配 C++ 类型声明中的名称时保留声明上下文，扩展后的规则仍继承 C 的宏与字面量处理。
    'class-name': {
        pattern: /(class\s+)[a-z0-9_]+/i,
        lookbehind: true
    }
});
