'use strict';

var _lunchbot = require('./lib/lunchbot');

var _lunchbot2 = _interopRequireDefault(_lunchbot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var token = process.env.BOT_API_KEY || require('../config').slackToken;
var dbPath = process.env.BOT_DB_PATH || '';
var name = process.env.BOT_NAME || 'lunchbot';

var lunchbot = new _lunchbot2.default({
    token: token,
    dbPath: dbPath,
    name: name
});

lunchbot.run();