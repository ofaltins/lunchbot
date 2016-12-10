'use strict';

const Events = require('events')
const Actions = require('./lib/actions')
const Schedule = require('./lib/schedule')
const Lunchbot = require('./lib/lunchbot')

const CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../config')
const SETTINGS = {
  token: CONFIG.slack_token,
  name: CONFIG.bot_name,
  keyword: CONFIG.keyword,
  primary_channel: CONFIG.primary_channel  
}

class EventEmitter extends Events {}
const EVENTEMITTER = new EventEmitter()
const ACTIONS = new Actions(CONFIG, EVENTEMITTER)
const SCHEDULE = new Schedule(EVENTEMITTER)
const LUNCHBOT = new Lunchbot(SETTINGS, EVENTEMITTER, ACTIONS)

SCHEDULE.init()
LUNCHBOT.run()