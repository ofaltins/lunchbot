'use strict';

const Julebygda = require('../api/julebygda');

class Actions {
  constructor (settings, emitter) {
    this.julebygda = new Julebygda(settings.julebygda_user, settings.julebygda_password);
    this.state = {}
    this.eventEmitter = emitter
    this.eventEmitter.on('setState', state => { this.state = state }) 
  }
  actions() {
    return {
      finn: {
        public: true,
        doc: 'Hjelper deg med å finne de rette varene, og å legge varene inn i handlelisten.',
        func: (origin, term) => { // expects @string
          this.eventEmitter.emit('say', 'Søker - vent litt!', origin)
          this.julebygda.search(term).then(results => {
            if (results.length > 19) {
              this.eventEmitter.emit('say', 'Oi der fant jeg mange varer. Kanskje du skal prøve å søke mer spesifikt? Jeg kommer tilbake med de første 20 resultatene straks.', origin)
              results = results.slice(0,19)
            }
            return this.julebygda.getProductData(results)
          })
          .then(r => {
            let output = "Her er det jeg fant:\nVarenummer\t\t\tNavn\t\t\tPris\n"
            if (r.length > 0) {
              r.forEach((item) => {
                output += item.id + "\t\t\t" + item.tittel + "\t\t\t" + item.price + "\n"
              })
            output += "\nFor å legge til en vare i handlelisten: 'lunchbot kjøp [varenummer]'"
            } else {
              output += 'INGENTING!'
            }
            this.eventEmitter.emit('say', output, origin)
          })
        }
      },
      kjøp: {
        public: true,
        doc: 'Når du har funnet en vare vha. finn-kommandoen, kan du bruke kjøp for å velge hvilken vare fra søkeresultatet som skal legges i handlelisten. Du kan legge inn flere varenummer på en gang. F.eks: lunchbot kjøp 205310 116744 108656',
        func: (origin, items) => { // expects space-separated @string with item ids
          const getItems = items.split(' ').map(item => { return {id: item}})
          this.julebygda.getProductData(getItems)
            .then(productData => {
              const shoppingList = this.julebygda.addToShoppingList(productData)
              let output = "Handlelisten er oppdatert\n"
              shoppingList.forEach(item => {
                output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
              })
              this.eventEmitter.emit('say', output, origin)
            })
        }
      },
      ikkekjøp: {
        public: true,
        restricted: true,
        doc: 'Fjern en vare fra handlelisten. F.eks: ikkekjøp 205310.',
        func: (origin, items) => { // expects space-separated @string with item ids
          const getItems = items.split(' ').map(item => { return {id: item}})
          const shoppingList = this.julebygda.removeFromShoppingList(getItems)
          let output = "Handlelisten er oppdatert\n"
          shoppingList.forEach(item => {
            output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
          })
          this.eventEmitter.emit('say', output, origin)
        }
      },
      vishandleliste: {
        public: true,
        doc: 'Viser handlelisten. Alle kan legge til varer i handlelisten, men det er kun lunsjansvarlig som kan fjerne',
        func: origin => {
          const shoppingList = this.julebygda.getShoppingList()
          let output = shoppingList.length > 0 ? "Her er handlelisten\n" : "Handlelisten er tom!"
          shoppingList.forEach(item => {
            output += item.id + "\t" + item.tittel + "\t" + item.price + "\n"
          })
          this.eventEmitter.emit('say', output, origin)
        }
      },
      nyhandleliste: {
        public: true,
        doc: 'Kaster den gamle handlelisten, og lager en ny blank handleliste',
        func: origin => {
          this.julebygda.clearShoppingList()
          this.eventEmitter.emit('say', 'Handlelisten er tømt', origin)
        }
      },
      vishandlekurv: {
        public: true,
        doc: 'Viser det som er lagret i sesjonen hos julebygda.no.',
        func: origin => {
          this.julebygda.viewBasket()
            .then(basket => {
              let output = "Dette ligger nå i handlekurven\n"
              basket.varer.forEach(item => {
                output += item + "\n"
              })
              output += "\n" + basket.oppsummering
              this.eventEmitter.emit('say', output, origin)
            })
        }
      },
      nyhandlekurv: {
        public: true,
        doc: 'Tømmer handlekurven hos Julebygda',
        func: origin => {
          this.julebygda.clearBasket().then(response => {
            this.eventEmitter.emit('say', response, origin)
            console.log('clearbasket response', response)
          })
          .catch(error => {
            this.eventEmitter.emit('say', 'Feil? ' + error, origin)
            console.log(error)
          })
        }
      },
      sendbestilling: {
        public: true,
        doc: 'Lager en ny ordre hos julebygda.no med alt som ligger i handlelisten, og viser ordresammendrag før du kan bekrefte bestilling',
        func: origin => {
          this.julebygda.addToCart(this.julebygda.getShoppingList())
            .then(response => {
              // this.eventEmitter.emit('say', response)
              return this.julebygda.viewBasket()
            }).then(basket => {
              let output = "Dette ligger nå i handlekurven\n"
              basket.varer.forEach(item => {
                output += item.tittel + "\t" + item.price + "\t" + item.amount + "\t" + item.subtotal + "\n"
              })
              output += "\n" + basket.oppsummering
              output += "\n\nBekreft bestilling med 'lunchbot bekreftbestilling'"
              this.eventEmitter.emit('say', output, origin)
              // send order here
            }).catch(error => {
              this.eventEmitter.emit('say', error, origin)
            })
        }
      },
      bekreftbestilling: {
        public: true,
        restricted: true,
        doc: 'For bruk etter at du har brukt sendbestilling. Denne kommandoen effektuerer bestillingen hos julebygda.no',
        func: origin => {
          this.julebygda.viewBasket()
            .then(basket => {
              return this.julebygda.confirmOrder(basket.parsedFormData)
            })
            .then(result => {
              this.eventEmitter.emit('say', result, origin)
            })
            .catch(error => {
              console.log('confirmorder error', error)
              this.eventEmitter.emit('say', error, origin)
            })
        }
      },
      hvemersjef: {
        public: true,
        doc: 'Forteller hvem som har lunchansvar (og dermed min gud) denne uken',
        func: origin => {
          console.log('STATE', this.state)
          this.eventEmitter.emit('say', this.state.admin + ' er så sykt sjef', origin)
        }
      },
      nysjef: {
        public: true,
        restricted: true,
        doc: 'O lunch med din glede! Sett en ny lunchansvarlig slik: nysjef navn-på-stakkars-jævel',
        func: (origin, user) => {
          this.eventEmitter.emit('setadmin', user)
          this.eventEmitter.emit('say', 'Ny sjef er ' + user, origin)
          this.eventEmitter.emit('say', 'Hei din stakkars jævel! Du er med dette utpekt som min bestyrer. Bruk "lb hjelp" for full liste over kommandoer.', {username: user, channel: 'D'})
        }
      },
      kommer: {
        public: true,
        doc: 'På forespørsel fra lunchbot kan du si i fra at du kommer til lunch, og samtidig si ifra om du ønsker egg. F.eks: lunchbot kommer egg',
        func: (origin, egg) => {
          this.eventEmitter.emit('addAttendee', {name: origin.username, egg: (egg === 'egg' ? 1 : 0) })
          this.eventEmitter.emit('say', (egg === 'egg' ? ' Eggcellent, ' : 'Herlig, ') + origin.username + '!' )
        }
      },
      ping: {
        public: true,
        doc: 'Returnerer lunchbot sin instans ID',
        func: origin => {
          this.eventEmitter.emit('say', 'Pong! ' + this.state.bot_id + ' - Status: ' + (this.state.active === true ? 'aktiv' : inaktiv), origin)
        }
      },
      aktiver: {
        public: true,
        restricted: true,
        doc: 'Aktiver lunchbot. Bruk lunchbot ping for å finne instans',
        func: (origin, id) => {
          if (id === this.state.bot_id) {
            this.eventEmitter.emit('activate')
            this.eventEmitter.emit('say', this.state.bot_id + ' til tjeneste!', origin)
          }
        }
      },
      deaktiver: {
        public: true,
        restricted: true,
        doc: 'Deaktiver lunchbot. Bruk lunchbot ping for å finne instans',
        func: (origin, id) => {
          if (id === this.state.bot_id) {
            this.eventEmitter.emit('deactivate')
            this.eventEmitter.emit('say', this.state.bot_id + ' trer av.', origin)
          }
        }
      },
      dryrun: {
        public: true,
        restricted: true,
        doc: 'Kjører gjennom alle planlagte announcements',
        func: origin => {
          this.eventEmitter.emit('dryRunSchedule')
        }
      },
      hjelp: {
        public: true,
        doc: 'Denne menyen! Duh!',
        func: origin => {
          let output = 'Her er det jeg kan hjelpe deg med:' + "\n\n"
          for (let action in this.actions()) {
            if (this.actions()[action].public === true) {
              output += '*' + action + "*\n" + this.actions()[action].doc + "\n\n"
            }
          }
          this.eventEmitter.emit('say', output, origin)
        }
      }
    }
  }
}

module.exports = Actions