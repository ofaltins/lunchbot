'use strict';
const cron = require('node-cron')

class Schedule {
  constructor(emitter) {
    this.state = {}
    this.eventEmitter = emitter
    this.eventEmitter.on('setState', state => { this.state = state })
    this.eventEmitter.on('dryRunSchedule', () => { this.trigger('dryRunSchedule') })
    this.schedule = {
      announceAttendees: '0 30 10 * * 1-5',
      announceLunch: '0 30 11 * * 1-5',
      announceSetTable: '0 0 11 * * 1-5',
      announceLunchOrderAll: '0 10 12 * * 1-5',
      announceLunchOrderMaster: '0 15 14 * * 1-5'
    }

    for (let action in this.schedule) {
      cron.schedule(this.schedule[action], this.trigger(action))
    }
  }
  trigger (action) {
    if (this.state.active === true) {
      this.actions()[action]
    }
  }
  actions () {
    return {
      announceAttendees: () => {
        const output = 'Ahoy! Nå nærmer det seg dagens mest givende halvtime! Kommer du til lunch? Og vil du i så fall ha egg? Skriv "lunchbot kommer egg" hvis du stiller OG vil ha egg. Hvis du ikke vil ha egg skriver du bare "lunchbot kommer"'
        this.eventEmitter.emit('say', announceAttendees)
      },
      announceLunch: () => {
        const output = [
          '"Bli lunch!" sa han - og så ble det lunch',
          'Lunchtime!!',
          'Føl dykk ingaleis åtsøken, kom med eldhug til bords!',
          'I røynda er det ikkje naudsynt å vekkje åtgaum - velkommen til lunch!',
          'Nær hoggestabben finn ein lett trespon. Lunch!',
          'Ein får vel la vere å kivast med nesten om bagatellane. Lunchtime!',
          'Ein kan ikkje støtt spinne silke! Kom og få lunch!',
          'Fram og tilbake er jamt like langt. Lunch!',
          'Gjort gjerning står ofte ikkje til å vende. Lunch!',
          'Gode dagar kostar pengar. Men det gjør ikke lunchen! Kom så!'
        ]
        this.eventEmitter.emit('say', output[Math.floor(Math.random()*output.length)] + ' :knife_fork_plate:')
      },
      announceSetTable: () => {
        const output = 'Dekk bord Victoria, dekk bord! Eller ' + (this.state.admin === undefined ? 'du' : this.state.admin) + ' da.. '
        this.eventEmitter.emit('say', output, {username: this.state.admin, channel: 'D'})
      },
      announceLunchOrderAll: () => {
        const output = 'Noen som vil ha noe spesielt til lunch neste gang? Husk at du gi tips til innhandling ved å skrive f.eks. "lunchbot finn leverpostei"'
        this.eventEmitter.emit('say', output)
      },
      announceLunchOrderMaster: () => {
        const output = 'Husk å bestille lunch!'
        this.eventEmitter.emit('say', output, {username: this.state.admin, channel: 'D'})
      },
      dryRunSchedule: () => {
        console.log('DRYRUN!')
        let output = ''
        for (let action in this.schedule) {
          output += '*' + action + '* - ' + this.schedule[action] + "\n"
          this.actions()[action]()
        }
        this.eventEmitter.emit('say', output)
      }
    }
  }
}

module.exports = Schedule