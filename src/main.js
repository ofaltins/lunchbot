'use strict';

import Lunchbot from './lib/lunchbot';
import CONFIG from '../config'

var token = process.env.slack_token || CONFIG.slack_token;
var name = process.env.bot_name || CONFIG.bot_name;

var lunchbot = new Lunchbot({
    token: token,
    name: name
});

lunchbot.run();