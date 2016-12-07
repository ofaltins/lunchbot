'use strict';

import Lunchbot from './lib/lunchbot';

if (process.env) {
  const token = process.env.slack_token
  const name = process.env.bot_name
} else {
  const CONFIG = require('../config')
  const token = CONFIG.slack_token;
  const name = CONFIG.bot_name;
}

var lunchbot = new Lunchbot({
    token: token,
    name: name
});

lunchbot.run();