import Julebygda from '../api/julebygda';
import Bot from 'slackbots';

const CONFIG = process.env.NODE_ENV === 'production' ? process.env : require('../../config')
const username = CONFIG.julebygda_user
const password = CONFIG.julebygda_password

const julebygda = new Julebygda(username, password);

class Lunchbot extends Bot {
  constructor (settings) {
    super (settings);
    this.settings = settings;
    this.settings.activeChannels = [];

    // TODO: set db path
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
        && this._isChannelConversation(message)
        && !this._isFromMe(message)
        && this._isAdressingMe(message)
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
  _isChatMessage (message) {
    return message.type === 'message' && Boolean(message.text)
  }
  _isChannelConversation (message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C'
  }
  _isAdressingMe (message) {
    return message.text.toLowerCase().split(' ')[0] === (this.settings.name)
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
    return user === undefined ? false : user.name
  }
  _isFromAdmin (message) {
    const username = this._getUserName(message.user)
    return username === this.settings.admin || this._isBotAdmin(message.user) === true
  }
  _getChannelById (channelId) {
    return this.channels.filter((item) => {
      return item.id === channelId
    })[0];
  }
  _postMessageToChannel (message) {
    return this.postMessageToChannel('lunch', message, {as_user: true})
  }
  _parseCommand(message) {
    let input = message.text.toLowerCase().split(' ')
    input.shift();
    console.log('input', input)
    const command = input.shift()
    const argument = input.join(' ')

    console.log('command:' + command + ' arg: ' + argument)

    // if command matches a function name in the _actions method, run it and pass one argument
    const action = this._actions()[command];
    if (action !== undefined) { 
      action.func(argument, message)
    } else {
      this._postMessageToChannel('Øyh! Det skjønte jeg ikke bæret av. Si noe jeg forstår da? For å se alt du kan spørre meg om, skriv lunchbot hjelp')
    }
  }
  _actions() {
    const self = this;
    return {
      finn: {
        public: true,
        doc: 'Hjelper deg med å finne de rette varene, og å legge varene inn i handlelisten.',
        func: term => { // expects @string
          self._postMessageToChannel('Søker - vent litt!')
          julebygda.search(term).then(results => {
            if (results.length > 19) {
              self._postMessageToChannel('Oi der fant jeg mange varer. Kanskje du skal prøve å søke mer spesifikt? Jeg kommer tilbake med de første 20 resultatene straks.')
              results = results.slice(0,19)
            }
            return julebygda.getProductData(results)
          })
          .then(r => {
            let output = "Her er det jeg fant:\nVarenummer\t\t\tNavn\t\t\tPris\n"
            if (r.length > 0) {
              r.forEach((item) => {
                output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
              })
            output += "\nFor å legge til en vare i handlelisten: 'lunchbot kjøp [varenummer]'"
            } else {
              output += 'INGENTING!'
            }
            self._postMessageToChannel(output)
          })
        }
      },
      kjøp: {
        public: true,
        doc: 'Når du har funnet en vare vha. finn-kommandoen, kan du bruke kjøp for å velge hvilken vare fra søkeresultatet som skal legges i handlelisten. Du kan legge inn flere varenummer på en gang. F.eks: lunchbot kjøp 205310 116744 108656',
        func: items => { // expects space-separated @string with item ids
          const getItems = items.split(' ').map(item => { return {id: item}})
          julebygda.getProductData(getItems)
            .then(productData => {
              const shoppingList = julebygda.addToShoppingList(productData)
              let output = "Handlelisten er oppdatert\n"
              shoppingList.forEach(item => {
                output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
              })
              self._postMessageToChannel(output)
            })
        }
      },
      vishandleliste: {
        public: true,
        doc: 'Viser handlelisten. Alle kan legge til varer i handlelisten, men det er kun lunsjansvarlig som kan fjerne',
        func: () => {
          const shoppingList = julebygda.getShoppingList()
          let output = shoppingList.length > 0 ? "Her er handlelisten\n" : "Handlelisten er tom!"
          shoppingList.forEach(item => {
            output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
          })
          self._postMessageToChannel(output)
        }
      },
      nyhandleliste: {
        public: true,
        doc: 'Kaster den gamle handlelisten, og lager en ny blank handleliste',
        func: () => {
          julebygda.clearShoppingList()
          self._postMessageToChannel('Handlelisten er tømt')
        }
      },
      vishandlekurv: {
        public: false,
        doc: 'Viser det som er lagret i sesjonen hos julebygda.no.',
        func: () => {
          julebygda.viewBasket()
            .then(basket => {
              let output = "Dette ligger nå i handlekurven\n"
              basket.varer.forEach(item => {
                output += item + "\n"
              })
              output += "\n" + basket.oppsummering
              self._postMessageToChannel(output)
            })
        }
      },
      sendbestilling: {
        public: true,
        doc: 'Lager en ny ordre hos julebygda.no med alt som ligger i handlelisten, og viser ordresammendrag før du kan bekrefte bestilling',
        func: () => {
          julebygda.addToCart(julebygda.getShoppingList())
            .then(response => {
              // self._postMessageToChannel(response)
              return julebygda.viewBasket()
            }).then(basket => {
              let output = "Dette ligger nå i handlekurven\n"
              basket.varer.forEach(item => {
                output += item.tittel + "\t" + item.price + "\t" + item.amount + "\t" + item.subtotal + "\n"
              })
              output += "\n" + basket.oppsummering
              output += "\n\nBekreft bestilling med 'lunchbot bekreftbestilling'"
              self._postMessageToChannel(output)
              // send order here
            }).catch(error => {
              self._postMessageToChannel(error)
            })
        }
      },
      bekreftbestilling: {
        public: true,
        doc: 'For bruk etter at du har brukt sendbestilling. Denne kommandoen effektuerer bestillingen hos julebygda.no',
        func: () => {
          julebygda.viewBasket()
            .then(basket => {
              return julebygda.confirmOrder(basket.formData)
            })
            .then(result => {
              self._postMessageToChannel('Maybe it worked?')
            })
            .catch(error => {
              console.log('confirmorder error', error)
              self._postMessageToChannel(error)
            })
        }
      },
      hvemersjef: {
        public: true,
        doc: 'Forteller hvem som har lunchansvar (og dermed min gud) denne uken',
        func: () => {
          self._postMessageToChannel(this.settings.admin + ' er så sykt sjef')
        }
      },
      nysjef: {
        public: true,
        doc: 'O lunch med din glede! Sett en ny lunchansvarlig slik: nysjef navn-på-stakkars-jævel',
        func: (user, message) => {
          if (this._isFromAdmin(message)) {
            this.settings.admin = user
            self._postMessageToChannel('Ny sjef er ' + user)
          } else {
            self._postMessageToChannel('Kun en sjef kan bestemme ny sjef!')
          }
        }
      },
      hjelp: {
        public: true,
        doc: 'Denne menyen! Duh!',
        func: () => {
          let output = 'Her er det jeg kan hjelpe deg med:' + "\n\n"
          for (let action in this._actions()) {
            output += '*' + action + "*\n" + this._actions()[action].doc + "\n\n"
          }
          self._postMessageToChannel(output)
        }
      }
    }
  }
}

export default Lunchbot;