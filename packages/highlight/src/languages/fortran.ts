/**
 * `@sugars/highlight` 内置的 `fortran` 词法。
 *
 * 处理 Fortran 字符串、带类型写法的数字及语句关键字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.fortran = {
    // 带引号的数字须先于通用字符串识别，以保留数值类别。
    'quoted-number': {
        pattern: /[BOZ](['"])[A-F0-9]+\1/i,
        alias: 'number'
    },
    'string': {
        pattern: /(?:\w+_)?(['"])(?:\1\1|&(?:\r\n?|\n)(?:\s*!.+(?:\r\n?|\n))?|(?!\1).)*(?:\1|&)/,
        inside: {
            'comment': {
                pattern: /(&(?:\r\n?|\n)\s*)!.*/,
                lookbehind: true
            }
        }
    },
    'comment': /!.*/,
    'boolean': /\.(?:TRUE|FALSE)\.(?:_\w+)?/i,
    'number': /(?:\b|[+-])(?:\d+(?:\.\d*)?|\.\d+)(?:[ED][+-]?\d+)?(?:_\w+)?/i,
    'keyword': [
        // 类型。
        /\b(?:INTEGER|REAL|DOUBLE ?PRECISION|COMPLEX|CHARACTER|LOGICAL)\b/i,
        // END 语句。
        /\b(?:END ?)?(?:BLOCK ?DATA|DO|FILE|FORALL|FUNCTION|IF|INTERFACE|MODULE(?! PROCEDURE)|PROGRAM|SELECT|SUBROUTINE|TYPE|WHERE)\b/i,
        // 语句。
        /\b(?:ALLOCATABLE|ALLOCATE|BACKSPACE|CALL|CASE|CLOSE|COMMON|CONTAINS|CONTINUE|CYCLE|DATA|DEALLOCATE|DIMENSION|DO|END|EQUIVALENCE|EXIT|EXTERNAL|FORMAT|GO ?TO|IMPLICIT(?: NONE)?|INQUIRE|INTENT|INTRINSIC|MODULE PROCEDURE|NAMELIST|NULLIFY|OPEN|OPTIONAL|PARAMETER|POINTER|PRINT|PRIVATE|PUBLIC|READ|RETURN|REWIND|SAVE|SELECT|STOP|TARGET|WHILE|WRITE)\b/i,
        // 其余关键字。
        /\b(?:ASSIGNMENT|DEFAULT|ELEMENTAL|ELSE|ELSEWHERE|ELSEIF|ENTRY|IN|INCLUDE|INOUT|KIND|NULL|ONLY|OPERATOR|OUT|PURE|RECURSIVE|RESULT|SEQUENCE|STAT|THEN|USE)\b/i
    ],
    'operator': [
        /\*\*|\/\/|=>|[=\/]=|[<>]=?|::|[+\-*=%]|\.(?:EQ|NE|LT|LE|GT|GE|NOT|AND|OR|EQV|NEQV)\.|\.[A-Z]+\./i, {
            // 使用后顾避免和数组构造的 (/ /) 混淆。
            pattern: /(^|(?!\().)\/(?!\))/,
            lookbehind: true
        }
    ],
    'punctuation': /\(\/|\/\)|[(),;:&]/
};
