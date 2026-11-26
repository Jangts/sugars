/**
 * `@sugars/highlight` 内置的 `git` 词法。
 *
 * 标记 Git 输出与交互式命令中的变更行、命令和区块坐标。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.git = {
    /*
     * 标记 git status 里的井号说明行。
     * 例如
     * $ git status
     * # On branch infinite-scroll
     * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
     * # and have 1 and 2 different commits each, respectively.
     * nothing to commit (working directory clean)
     */
    'comment': /^#.*/m,

    /*
     * 区分 git diff 中的删除与新增行。
     */
    // 区块坐标或 Git 输出中的变更行只按文本样式高亮，规则不推断仓库状态。
    'deleted': /^[-–].*/m,
    'inserted': /^\+.*/m,

    /*
     * 字符串可以用单引号或双引号包裹。
     */
    'string': /("|')(\\?.)*?\1/m,

    /*
     * 行中出现终端提示符和 git 命令时，继续识别其参数。
     * 例如
     * $ git add file.txt
     */
    'command': {
        pattern: /^.*\$ git .*$/m,
        inside: {
            /*
             * 参数支持单连字符与双连字符开头。
             * 例如
             * $ git diff --cached
             * $ git log -p
             */
            'parameter': /\s(--|-)\w+/m
        }
    },

    /*
     * 匹配 git diff 的区块坐标。
     * 例如
     * $ git diff
     * diff --git file.txt file.txt
     * index 6214953..1d54a52 100644
     * --- file.txt
     * +++ file.txt
     * @@ -1 +1,2 @@
     * -Here's my tetx file
     * +Here's my text file
     * +And this is the second line
     */
    'coord': /^@@.*@@$/m,

    /*
     * 识别 git log 的 commit 行及四十位提交标识。
     * 例如
     * $ git log
     * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
     * Author: lgiraudel
     * Date:   Mon Feb 17 11:18:34 2014 +0100
     *
     *     Add of a new line
     */
    'commit_sha1': /^commit \w{40}$/m
};
