/**
 * `@sugars/highlight` 内置的 `powershell` 词法。
 *
 * 识别 PowerShell 字符串内的变量及子表达式，保留此模块内的 Processing 词法登记。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern, grammarRules, insideGrammar } from '../grammar.js'

highlight.languages.powershell = {
    'comment': [{
            pattern: /(^|[^`])<#[\w\W]*?#>/,
            lookbehind: true
        },
        {
            pattern: /(^|[^`])#.+/,
            lookbehind: true
        }
    ],
    // 字符串先保住引号区域，再处理变量与子表达式。词法的后半部补全内部规则，供嵌套表达式使用。
    'string': [{
            pattern: /"(`?[\w\W])*?"/,
            inside: {
                'function': {
                    pattern: /[^`]\$\(.*?\)/,
                    // 嵌套词法在文件末尾装入。
                    inside: {}
                }
            }
        },
        /'([^']|'')*'/
    ],
    // 匹配命名空间、类型转换与属性修饰。要求字母开头，以区别数组索引。
    'namespace': /\[[a-z][\w\W]*?\]/i,
    'boolean': /\$(true|false)\b/i,
    'variable': /\$\w+\b/i,
    // 命令先于别名匹配，避免 write 抢占 write-host。
    // Get-Command | ?{ $_.ModuleName -match "Microsoft.PowerShell.(Util|Core|Management)" }
    // Get-Alias | ?{ $_.ReferencedCommand.Module.Name -match "Microsoft.PowerShell.(Util|Core|Management)" }
    'function': [/\b(Add-(Computer|Content|History|Member|PSSnapin|Type)|Checkpoint-Computer|Clear-(Content|EventLog|History|Item|ItemProperty|Variable)|Compare-Object|Complete-Transaction|Connect-PSSession|ConvertFrom-(Csv|Json|StringData)|Convert-Path|ConvertTo-(Csv|Html|Json|Xml)|Copy-(Item|ItemProperty)|Debug-Process|Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Disconnect-PSSession|Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Enter-PSSession|Exit-PSSession|Export-(Alias|Clixml|Console|Csv|FormatData|ModuleMember|PSSession)|ForEach-Object|Format-(Custom|List|Table|Wide)|Get-(Alias|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Culture|Date|Event|EventLog|EventSubscriber|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job|Location|Member|Module|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|WmiObject)|Group-Object|Import-(Alias|Clixml|Csv|LocalizedData|Module|PSSession)|Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)|Join-Path|Limit-EventLog|Measure-(Command|Object)|Move-(Item|ItemProperty)|New-(Alias|Event|EventLog|Item|ItemProperty|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy)|Out-(Default|File|GridView|Host|Null|Printer|String)|Pop-Location|Push-Location|Read-Host|Receive-(Job|PSSession)|Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)|Remove-(Computer|Event|EventLog|Item|ItemProperty|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)|Rename-(Computer|Item|ItemProperty)|Reset-ComputerMachinePassword|Resolve-Path|Restart-(Computer|Service)|Restore-Computer|Resume-(Job|Service)|Save-Help|Select-(Object|String|Xml)|Send-MailMessage|Set-(Alias|Content|Date|Item|ItemProperty|Location|PSBreakpoint|PSDebug|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)|Show-(Command|ControlPanelItem|EventLog)|Sort-Object|Split-Path|Start-(Job|Process|Service|Sleep|Transaction)|Stop-(Computer|Job|Process|Service)|Suspend-(Job|Service)|Tee-Object|Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)|Trace-Command|Unblock-File|Undo-Transaction|Unregister-(Event|PSSessionConfiguration)|Update-(FormatData|Help|List|TypeData)|Use-Transaction|Wait-(Event|Job|Process)|Where-Object|Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning))\b/i, /\b(ac|cat|chdir|clc|cli|clp|clv|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|ebp|echo|epal|epcsv|epsn|erase|fc|fl|ft|fw|gal|gbp|gc|gci|gcs|gdr|gi|gl|gm|gp|gps|group|gsv|gu|gv|gwmi|iex|ii|ipal|ipcsv|ipsn|irm|iwmi|iwr|kill|lp|ls|measure|mi|mount|move|mp|mv|nal|ndr|ni|nv|ogv|popd|ps|pushd|pwd|rbp|rd|rdr|ren|ri|rm|rmdir|rni|rnp|rp|rv|rvpa|rwmi|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls|sort|sp|spps|spsv|start|sv|swmi|tee|trcm|type|write)\b/i],
    // 语法参考 http://technet.microsoft.com/en-US/library/hh847744.aspx
    'keyword': /\b(Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
    'operator': {
        pattern: /(\W?)(!|-(eq|ne|gt|ge|lt|le|sh[lr]|not|b?(and|x?or)|(Not)?(Like|Match|Contains|In)|Replace|Join|is(Not)?|as)\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
        lookbehind: true
    },
    'punctuation': /[|{}[\];(),.]/
};

// 字符串内的变量插值与嵌套表达式。
insideGrammar(grammarRules(highlight.languages.powershell!.string)[0]!).boolean = highlight.languages.powershell.boolean;
insideGrammar(grammarRules(highlight.languages.powershell!.string)[0]!).variable = highlight.languages.powershell.variable;
grammarPattern(insideGrammar(grammarRules(highlight.languages.powershell!.string)[0]!)['function']).inside = cloneGrammar(highlight.languages.powershell);
highlight.languages.processing = highlight.languages.extend('clike', {
    'keyword': /\b(?:break|catch|case|class|continue|default|else|extends|final|for|if|implements|import|new|null|private|public|return|static|super|switch|this|try|void|while)\b/,
    'operator': /<[<=]?|>[>=]?|&&?|\|\|?|[%?]|[!=+\-*\/]=?/
});
highlight.languages.insertBefore('processing', 'number', {
    // XML 作为一种类型处理。
    'constant': /\b(?!XML\b)[A-Z][A-Z\d_]+\b/,
    'type': {
        pattern: /\b(?:boolean|byte|char|color|double|float|int|XML|[A-Z][A-Za-z\d_]*)\b/,
        alias: 'variable'
    }
});

// 函数名与括号间允许空格。
Object.assign(highlight.languages.processing!['function']!, { pattern: /[a-z0-9_]+(?=\s*\()/i });

// 类型名默认没有专属样式，沿用已有别名样式。
grammarPattern(highlight.languages.processing!['class-name']).alias = 'variable';
highlight.languages.prolog = {
    // 语法随实现而异。
    'comment': [/%.+/, /\/\*[\s\S]*?\*\//],
    // 部分实现允许在字符串中转义换行和引号。
    'string': /(["'])(?:\1\1|\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    'builtin': /\b(?:fx|fy|xf[xy]?|yfx?)\b/,
    'variable': /\b[A-Z_]\w*/,
    // halt、trace 等无参谓词是否列入规则仍待核对。
    'function': /\b[a-z]\w*(?:(?=\()|\/\d+)/,
    'number': /\b\d+\.?\d*/,
    // 支持自定义运算符。
    'operator': /[:\\=><\-?*@\/;+^|!$.]+|\b(?:is|mod|not|xor)\b/,
    'punctuation': /[(){}\[\],]/
};
