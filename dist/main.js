'use strict';

var _lunchbot = require('./lib/lunchbot');

var _lunchbot2 = _interopRequireDefault(_lunchbot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../config');
var token = CONFIG.slack_token;
var name = CONFIG.bot_name;
var keyword = CONFIG.keyword;

var lunchbot = new _lunchbot2.default({
    token: token,
    name: name,
    keyword: keyword
});

lunchbot.run();