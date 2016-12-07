'use strict';

import Lunchbot from './lib/lunchbot';

var token = process.env.BOT_API_KEY || require('../config').slackToken;
var dbPath = process.env.BOT_DB_PATH || '';
var name = process.env.BOT_NAME || 'lunchbot';

var lunchbot = new Lunchbot({
    token: token,
    dbPath: dbPath,
    name: name
});

lunchbot.run();