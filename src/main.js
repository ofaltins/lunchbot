'use strict';

import Lunchbot from './lib/lunchbot';

const CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../config')
const token = CONFIG.slack_token
const name = CONFIG.bot_name

var lunchbot = new Lunchbot({
    token: token,
    name: name
});

lunchbot.run();