'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slackbots = require('slackbots');

var _slackbots2 = _interopRequireDefault(_slackbots);

var _actions2 = require('./actions');

var _actions3 = _interopRequireDefault(_actions2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = function (_Events) {
  _inherits(EventEmitter, _Events);

  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(EventEmitter).apply(this, arguments));
  }

  return EventEmitter;
}(_events2.default);

var eventEmitter = new EventEmitter();

var ACTIONS = new _actions3.default(eventEmitter);

var Lunchbot = function (_Bot) {
  _inherits(Lunchbot, _Bot);

  function Lunchbot(settings) {
    _classCallCheck(this, Lunchbot);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Lunchbot).call(this, settings));

    _this2.settings = settings;
    _this2.settings.activeChannels = [];
    _this2.settings.bot_id = (process.env.NODE_ENV === 'production' ? 'production' : 'dev') + '' + Date.now();

    ACTIONS.setState(_this2.settings);

    eventEmitter.on('say', function (payload, origin) {
      console.log('got event', payload, origin);
      if (_this2._isChannelConversation(origin)) {
        _this2._postMessageToChannel(payload, origin);
      } else if (_this2._isDirectMessage(origin)) {
        _this2._postMessageToUser(payload, origin);
      } else {
        console.log('Payload without target: ', payload, origin);
      }
    });

    eventEmitter.on('setadmin', function (user) {
      _this2.settings.admin = user;
      ACTIONS.setState(_this2.settings);
    });
    return _this2;
  }

  _createClass(Lunchbot, [{
    key: 'run',
    value: function run() {
      this.on('start', this._onStart);
      this.on('message', this._onMessage);
    }
  }, {
    key: '_onStart',
    value: function _onStart() {
      var _this3 = this;

      this._loadBotUser();
      this._welcomeMessage();

      this.channels.filter(function (channel) {
        return channel.is_member;
      }).forEach(function (channel) {
        _this3.settings.activeChannels.push(channel.name);
        console.log('bot is in: ' + channel.name);
      });
    }
  }, {
    key: '_onMessage',
    value: function _onMessage(message) {
      if (this._isChatMessage(message) && !this._isFromMe(message) && this._isAdressingMe(message)) {
        console.log('got message: ', message.text);
        this._parseCommand(message);
      }
    }
  }, {
    key: '_welcomeMessage',
    value: function _welcomeMessage() {
      // this._postMessageToChannel('lunch', 'Lunchbot is alive!', {as_user: true})
    }
  }, {
    key: '_loadBotUser',
    value: function _loadBotUser() {
      var self = this;
      this.user = this.users.filter(function (user) {
        return user.name === self.name;
      })[0];
    }
  }, {
    key: '_isChatMessage',
    value: function _isChatMessage(message) {
      return message.type === 'message' && Boolean(message.text);
    }
  }, {
    key: '_isChannelConversation',
    value: function _isChannelConversation(message) {
      return typeof message.channel === 'string' && message.channel[0] === 'C' || message.channel[0] === 'G';
    }
  }, {
    key: '_isDirectMessage',
    value: function _isDirectMessage(message) {
      return typeof message.channel === 'string' && message.channel[0] === 'D';
    }
  }, {
    key: '_isAdressingMe',
    value: function _isAdressingMe(message) {
      var first = message.text.toLowerCase().split(' ')[0];
      return first === this.settings.keyword || first === this.settings.name;
    }
  }, {
    key: '_isFromMe',
    value: function _isFromMe(message) {
      return message.user === this.user.id;
    }
  }, {
    key: '_isBotAdmin',
    value: function _isBotAdmin(userId) {
      var user = this.users.filter(function (u) {
        return u.is_admin === true;
      })[0];
      return user === undefined ? false : userId === user.id;
    }
  }, {
    key: '_getUserName',
    value: function _getUserName(userId) {
      var user = this.users.filter(function (u) {
        return u.id === userId;
      })[0];
      return user === undefined ? false : user.name;
    }
  }, {
    key: '_isFromAdmin',
    value: function _isFromAdmin(message) {
      var username = this._getUserName(message.user);
      return username === this.settings.admin || this._isBotAdmin(message.user) === true;
    }
  }, {
    key: '_getChannelNameById',
    value: function _getChannelNameById(channelId) {
      var channel = this.channels.filter(function (item) {
        return item.id === channelId;
      })[0] || this.groups.filter(function (item) {
        return item.id === channelId;
      })[0];
      return channel === undefined ? false : channel.name;
    }
  }, {
    key: '_postMessageToChannel',
    value: function _postMessageToChannel(message, origin) {
      var channel = origin === undefined ? this.settings.primary_channel : this._getChannelNameById(origin.channel);
      return this.postTo(channel, message, { as_user: true });
    }
  }, {
    key: '_postMessageToUser',
    value: function _postMessageToUser(message, origin) {
      var username = this._getUserName(origin.user);
      return this.postMessageToUser(username, message);
    }
  }, {
    key: '_parseCommand',
    value: function _parseCommand(message) {
      var input = message.text.toLowerCase().split(' ');
      input.shift();
      console.log('input', input);
      var command = input.shift();
      var argument = input.join(' ');

      console.log('command:' + command + ' arg: ' + argument);

      // if command matches a function name in the _actions method, run it and pass one argument
      var action = ACTIONS.actions()[command];
      if (action !== undefined) {
        if (action.restricted === true && this._isFromAdmin(message) || action.restricted !== true) {
          action.func(message, argument);
        } else {
          this._postMessageToChannel('Du har ikke tilgang til denne funksjonen.');
        }
      } else {
        this._postMessageToChannel('Øyh! Det skjønte jeg ikke bæret av. Si noe jeg forstår da? For å se alt du kan spørre meg om, skriv lunchbot hjelp');
      }
    }
  }, {
    key: '_actions',
    value: function _actions() {
      return new _actions3.default();
    }
  }]);

  return Lunchbot;
}(_slackbots2.default);

exports.default = Lunchbot;