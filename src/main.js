'use strict';

const Lunchbot = require('./lib/lunchbot')

const CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../config')
const token = CONFIG.slack_token
const name = CONFIG.bot_name
const keyword = CONFIG.keyword

var lunchbot = new Lunchbot({
    token: token,
    name: name,
    keyword: keyword
});

lunchbot.run();