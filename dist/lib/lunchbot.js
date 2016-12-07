'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _julebygda = require('../api/julebygda');

var _julebygda2 = _interopRequireDefault(_julebygda);

var _slackbots = require('slackbots');

var _slackbots2 = _interopRequireDefault(_slackbots);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../../config');
var username = CONFIG.julebygda_user;
var password = CONFIG.julebygda_password;

var julebygda = new _julebygda2.default(username, password);

var Lunchbot = function (_Bot) {
  _inherits(Lunchbot, _Bot);

  function Lunchbot(settings) {
    _classCallCheck(this, Lunchbot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Lunchbot).call(this, settings));

    _this.settings = settings;
    _this.settings.activeChannels = [];

    // TODO: set db path
    return _this;
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
      var _this2 = this;

      this._loadBotUser();
      this._welcomeMessage();

      this.channels.filter(function (channel) {
        return channel.is_member;
      }).forEach(function (channel) {
        _this2.settings.activeChannels.push(channel.name);
        console.log('bot is in: ' + channel.name);
      });
    }
  }, {
    key: '_onMessage',
    value: function _onMessage(message) {
      if (this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromMe(message) && this._isAdressingMe(message)) {
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
      return typeof message.channel === 'string' && message.channel[0] === 'C';
    }
  }, {
    key: '_isAdressingMe',
    value: function _isAdressingMe(message) {
      return message.text.toLowerCase().split(' ')[0] === this.settings.name;
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
    key: '_getChannelById',
    value: function _getChannelById(channelId) {
      return this.channels.filter(function (item) {
        return item.id === channelId;
      })[0];
    }
  }, {
    key: '_postMessageToChannel',
    value: function _postMessageToChannel(message) {
      return this.postMessageToChannel('lunch', message, { as_user: true });
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
      var action = this._actions()[command];
      if (action !== undefined) {
        action.func(argument, message);
      } else {
        this._postMessageToChannel('Øyh! Det skjønte jeg ikke bæret av. Si noe jeg forstår da? For å se alt du kan spørre meg om, skriv lunchbot hjelp');
      }
    }
  }, {
    key: '_actions',
    value: function _actions() {
      var _this3 = this;

      var self = this;
      return {
        finn: {
          public: true,
          doc: 'Hjelper deg med å finne de rette varene, og å legge varene inn i handlelisten.',
          func: function func(term) {
            // expects @string
            self._postMessageToChannel('Søker - vent litt!');
            julebygda.search(term).then(function (results) {
              if (results.length > 19) {
                self._postMessageToChannel('Oi der fant jeg mange varer. Kanskje du skal prøve å søke mer spesifikt? Jeg kommer tilbake med de første 20 resultatene straks.');
                results = results.slice(0, 19);
              }
              return julebygda.getProductData(results);
            }).then(function (r) {
              var output = "Her er det jeg fant:\nVarenummer\t\t\tNavn\t\t\tPris\n";
              if (r.length > 0) {
                r.forEach(function (item) {
                  output += item.id + "\t" + item.tittel + "\t" + item.price + "\n";
                });
                output += "\nFor å legge til en vare i handlelisten: 'lunchbot husk [varenummer]'";
              } else {
                output += 'INGENTING!';
              }
              self._postMessageToChannel(output);
            });
          }
        },
        kjøp: {
          public: true,
          doc: 'Når du har funnet en vare vha. finn-kommandoen, kan du bruke kjøp for å velge hvilken vare fra søkeresultatet som skal legges i handlelisten. Du kan legge inn flere varenummer på en gang. F.eks: lunchbot kjøp 205310 116744 108656',
          func: function func(items) {
            // expects space-separated @string with item ids
            var getItems = items.split(' ').map(function (item) {
              return { id: item };
            });
            julebygda.getProductData(getItems).then(function (productData) {
              var shoppingList = julebygda.addToShoppingList(productData);
              var output = "Handlelisten er oppdatert\n";
              shoppingList.forEach(function (item) {
                output += item.id + "\t" + item.tittel + "\t" + item.price + "\n";
              });
              self._postMessageToChannel(output);
            });
          }
        },
        vishandleliste: {
          public: true,
          doc: 'Viser handlelisten. Alle kan legge til varer i handlelisten, men det er kun lunsjansvarlig som kan fjerne',
          func: function func() {
            var shoppingList = julebygda.getShoppingList();
            var output = shoppingList.length > 0 ? "Her er handlelisten\n" : "Handlelisten er tom!";
            shoppingList.forEach(function (item) {
              output += item.id + "\t" + item.tittel + "\t" + item.price + "\n";
            });
            self._postMessageToChannel(output);
          }
        },
        nyhandleliste: {
          public: true,
          doc: 'Kaster den gamle handlelisten, og lager en ny blank handleliste',
          func: function func() {
            julebygda.clearShoppingList();
            self._postMessageToChannel('Handlelisten er tømt');
          }
        },
        vishandlekurv: {
          public: false,
          doc: 'Viser det som er lagret i sesjonen hos julebygda.no.',
          func: function func() {
            julebygda.viewBasket().then(function (basket) {
              var output = "Dette ligger nå i handlekurven\n";
              basket.varer.forEach(function (item) {
                output += item + "\n";
              });
              output += "\n" + basket.oppsummering;
              self._postMessageToChannel(output);
            });
          }
        },
        sendbestilling: {
          public: true,
          doc: 'Lager en ny ordre hos julebygda.no med alt som ligger i handlelisten, og viser ordresammendrag før du kan bekrefte bestilling',
          func: function func() {
            julebygda.addToCart(julebygda.getShoppingList()).then(function (response) {
              // self._postMessageToChannel(response)
              return julebygda.viewBasket();
            }).then(function (basket) {
              var output = "Dette ligger nå i handlekurven\n";
              basket.varer.forEach(function (item) {
                output += item.tittel + "\t" + item.price + "\t" + item.amount + "\t" + item.subtotal + "\n";
              });
              output += "\n" + basket.oppsummering;
              output += "\n\nBekreft bestilling med 'lunchbot bekreftbestilling'";
              self._postMessageToChannel(output);
              // send order here
            }).catch(function (error) {
              self._postMessageToChannel(error);
            });
          }
        },
        bekreftbestilling: {
          public: true,
          doc: 'For bruk etter at du har brukt sendbestilling. Denne kommandoen effektuerer bestillingen hos julebygda.no',
          func: function func() {
            julebygda.viewBasket().then(function (basket) {
              return julebygda.confirmOrder(basket.formData);
            }).then(function (result) {
              self._postMessageToChannel('Maybe it worked?');
            }).catch(function (error) {
              console.log('confirmorder error', error);
              self._postMessageToChannel(error);
            });
          }
        },
        hvemersjef: {
          public: true,
          doc: 'Forteller hvem som har lunchansvar (og dermed min gud) denne uken',
          func: function func() {
            self._postMessageToChannel(_this3.settings.admin + ' er så sykt sjef');
          }
        },
        nysjef: {
          public: true,
          doc: 'O lunch med din glede! Sett en ny lunchansvarlig slik: nysjef navn-på-stakkars-jævel',
          func: function func(user, message) {
            if (_this3._isFromAdmin(message)) {
              _this3.settings.admin = user;
              self._postMessageToChannel('Ny sjef er ' + user);
            } else {
              self._postMessageToChannel('Kun en sjef kan bestemme ny sjef!');
            }
          }
        },
        hjelp: {
          public: true,
          doc: 'Denne menyen! Duh!',
          func: function func() {
            var output = 'Her er det jeg kan hjelpe deg med:' + "\n\n";
            for (var action in _this3._actions()) {
              output += '*' + action + "*\n" + _this3._actions()[action].doc + "\n\n";
            }
            self._postMessageToChannel(output);
          }
        }
      };
    }
  }]);

  return Lunchbot;
}(_slackbots2.default);

exports.default = Lunchbot;