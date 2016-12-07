'use strict';

var _lunchbot = require('./lib/lunchbot');

var _lunchbot2 = _interopRequireDefault(_lunchbot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env) {
  var _token = process.env.slack_token;
  var _name = process.env.bot_name;
} else {
  var CONFIG = require('../config');
  var _token2 = CONFIG.slack_token;
  var _name2 = CONFIG.bot_name;
}

var lunchbot = new _lunchbot2.default({
  token: token,
  name: name
});

lunchbot.run();