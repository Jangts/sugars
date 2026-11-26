/* ES5 包的 CommonJS 入口，汇集可分别加载的 AMD 工厂和旧式 Promise。 */

'use strict';

exports.createAmdLoader = require('./amd.js');
exports.LegacyPromise = require('./promise.js');
exports.Promise = exports.LegacyPromise;
