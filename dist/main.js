'use strict';

var _lunchbot = require('./lib/lunchbot');

var _lunchbot2 = _interopRequireDefault(_lunchbot);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var token = process.env.slack_token || _config2.default.slack_token;
var name = process.env.bot_name || _config2.default.bot_name;

var lunchbot = new _lunchbot2.default({
    token: token,
    name: name
});

lunchbot.run();