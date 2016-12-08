'use strict';

const Bot = require('slackbots')
const Actions = require('./actions')
const Schedule = require('./schedule')
const Events = require('events')

class EventEmitter extends Events {}
const eventEmitter = new EventEmitter()

const ACTIONS = new Actions(eventEmitter)
const SCHEDULE = new Schedule(eventEmitter)

class Lunchbot extends Bot {
  constructor (settings) {
    super (settings);

    this.settings = settings;
    this.settings.activeChannels = [];
    this.settings.bot_id = (process.env.NODE_ENV === 'production' ? 'production' : 'dev' )+ '' + Date.now()
    this.settings.active = true
    this.settings.attendees = []

    eventEmitter.emit('setState', this.settings)

    eventEmitter.on('say', (payload, origin) => {
      console.log('got event', payload, origin)

      if (origin === undefined || this._isChannelConversation(origin)) {
        this._postMessageToChannel(payload, origin)
      } else if (this._isDirectMessage(origin)) {
        this._postMessageToUser(payload, origin)
      } else {
        console.log('Payload without target: ', payload, origin)
      }
    })

    eventEmitter.on('setadmin', user => {
      this.settings.admin = user
      eventEmitter.emit('setState', this.settings)
    })

    eventEmitter.on('activate', () => {
      this.settings.active = true
      eventEmitter.emit('setState', this.settings)
    })

    eventEmitter.on('deactivate', () => {
      this.settings.active = false
      eventEmitter.emit('setState', this.settings)
    })

    eventEmitter.on('addAttendee', attendee => {
      this.settings.attendees.push(attendee)
      eventEmitter.emit('setState', this.settings)
    })

    eventEmitter.on('dryRunSchedule', () => {
      SCHEDULE.actions()['dryRunSchedule']()
    })
  }

  run () {
    this.on('start', this._onStart)
    this.on('message', this._onMessage)
  }
  _onStart () {
    this._loadBotUser()
    this._welcomeMessage()

    this.channels.filter((channel) => {
      return channel.is_member
    }).forEach((channel) => {
      this.settings.activeChannels.push(channel.name)
      console.log('bot is in: ' + channel.name)
    });
  }
  _onMessage (message) {
    if (this._isChatMessage(message)
        && !this._isFromMe(message)
        && this._isAdressingMe(message)
        && (this._botIsActive() || this._isAnswerAlways(message))
    ) {
        console.log('got message: ', message.text)
        this._parseCommand(message)
    }
  }
  _welcomeMessage () {
    // this._postMessageToChannel('lunch', 'Lunchbot is alive!', {as_user: true})
  }
  _loadBotUser () {
    const self = this;
    this.user = this.users.filter((user) => {
      return user.name === self.name
    })[0];
  }
  _botIsActive () {
    return this.settings.active
  }
  _isAnswerAlways (message) {
    const msg = message.text.toLowerCase()
    return msg.indexOf('ping') !== -1
      || msg.indexOf('aktiver') !== -1
      || msg.indexOf('deaktiver') !== -1
  }
  _isChatMessage (message) {
    return message.type === 'message' && Boolean(message.text)
  }
  _isChannelConversation (message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C' || message.channel[0] === 'G'
  }
  _isDirectMessage (message) {
    return typeof message.channel === 'string' && message.channel[0] === 'D'
  }
  _isAdressingMe (message) {
    const first = message.text.toLowerCase().split(' ')[0]
    return first === this.settings.keyword || first === this.settings.name
  }
  _isFromMe (message) {
    return message.user === this.user.id
  }
  _isBotAdmin (userId) {
    const user = this.users.filter(u => u.is_admin === true)[0]
    return user === undefined ? false : userId === user.id
  }
  _getUserName (userId) {
    const user = this.users.filter(u => u.id === userId)[0]
    return user === undefined ? undefined : user.name
  }
  _isFromAdmin (message) {
    const username = this._getUserName(message.user)
    return username === this.settings.admin || this._isBotAdmin(message.user) === true
  }
  _getChannelNameById (channelId) {
    const channel = this.channels.filter(item => item.id === channelId)[0] || this.groups.filter(item => item.id === channelId)[0]
    return channel === undefined ? false : channel.name
  }
  _postMessageToChannel (message, origin) {
    const channel = origin === undefined ? this.settings.primary_channel : this._getChannelNameById(origin.channel)
    return this.postTo(channel, message, {as_user: true})
  }
  _postMessageToUser (message, origin) {
    let username = this._getUserName(origin.user)
    if (username === undefined) {
      username = origin.username
    }
    return this.postMessageToUser(username, message)
  }
  _parseCommand(message) {
    let input = message.text.toLowerCase().split(' ')
    input.shift();
    console.log('input', input)
    const command = input.shift()
    const argument = input.join(' ')

    message.username = this._getUserName(message.user)

    console.log('command:' + command + ' arg: ' + argument)

    // if command matches a function name in the _actions method, run it and pass one argument
    const action = ACTIONS.actions()[command];
    if (action !== undefined) {
      if ((action.restricted === true && this._isFromAdmin(message)) || action.restricted !== true) {
        action.func(message, argument)
      } else {
        this._postMessageToChannel('Du har ikke tilgang til denne funksjonen.', message)
      }
    } else {
      this._postMessageToChannel('Øyh! Det skjønte jeg ikke bæret av. Si noe jeg forstår da? For å se alt du kan spørre meg om, skriv lunchbot hjelp', message)
    }
  }
  _actions() {
    return new Actions()
  }
}

module.exports = Lunchbot;