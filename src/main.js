'use strict';

const Lunchbot = require('./lib/lunchbot')

const CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../config')

var lunchbot = new Lunchbot({
    token: CONFIG.slack_token,
    name: CONFIG.bot_name,
    keyword: CONFIG.keyword,
    primary_channel: CONFIG.primary_channel
});

lunchbot.run();