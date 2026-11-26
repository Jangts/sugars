/**
 * `@sugars/highlight` 内置的 `verilog` 词法。
 *
 * 识别 Verilog 规格属性、系统函数、数字格式与预处理标记。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.verilog = {
    'comment': /\/\/.*|\/\*[\w\W]*?\*\//,
    'string': /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    // 匹配系统函数，例如 $display()。
    'property': /\B\$\w+\b/,
    // 匹配用户定义的常量指令，例如 `define。
    'constant': /\B`\w+\b/,
    // 带美元前缀的系统函数用专门候选，以免与普通用户标识符混淆。
    'function': /[a-z\d_]+(?=\()/i,
    // 包括 Verilog 和 SystemVerilog 的关键字。
    'keyword': /\b(?:alias|and|assert|assign|assume|automatic|before|begin|bind|bins|binsof|bit|break|buf|bufif0|bufif1|byte|class|case|casex|casez|cell|chandle|clocking|cmos|config|const|constraint|context|continue|cover|covergroup|coverpoint|cross|deassign|default|defparam|design|disable|dist|do|edge|else|end|endcase|endclass|endclocking|endconfig|endfunction|endgenerate|endgroup|endinterface|endmodule|endpackage|endprimitive|endprogram|endproperty|endspecify|endsequence|endtable|endtask|enum|event|expect|export|extends|extern|final|first_match|for|force|foreach|forever|fork|forkjoin|function|generate|genvar|highz0|highz1|if|iff|ifnone|ignore_bins|illegal_bins|import|incdir|include|initial|inout|input|inside|instance|int|integer|interface|intersect|join|join_any|join_none|large|liblist|library|local|localparam|logic|longint|macromodule|matches|medium|modport|module|nand|negedge|new|nmos|nor|noshowcancelled|not|notif0|notif1|null|or|output|package|packed|parameter|pmos|posedge|primitive|priority|program|property|protected|pull0|pull1|pulldown|pullup|pulsestyle_onevent|pulsestyle_ondetect|pure|rand|randc|randcase|randsequence|rcmos|real|realtime|ref|reg|release|repeat|return|rnmos|rpmos|rtran|rtranif0|rtranif1|scalared|sequence|shortint|shortreal|showcancelled|signed|small|solve|specify|specparam|static|string|strong0|strong1|struct|super|supply0|supply1|table|tagged|task|this|throughout|time|timeprecision|timeunit|tran|tranif0|tranif1|tri|tri0|tri1|triand|trior|trireg|type|typedef|union|unique|unsigned|use|uwire|var|vectored|virtual|void|wait|wait_order|wand|weak0|weak1|while|wildcard|wire|with|within|wor|xnor|xor)\b/,
    // 两种语言的逻辑块关键字共用加粗标记。
    'important': /\b(?:always_latch|always_comb|always_ff|always)\b ?@?/,
    // 识别时标、向量和实数。
    'number': /\B##?\d+|(?:\b\d+)?'[odbh] ?[\da-fzx_?]+|\b\d*[._]?\d+(?:e[-+]?\d+)?/i,
    'operator': /[-+{}^~%*\/?=!<>&|]+/,
    'punctuation': /[[\];(),.:]/
};
