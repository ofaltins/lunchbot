'use strict';
const request = require('request');
const cheerio = require('cheerio');
const url = require('url');
let j = request.jar();

class Julebygda {
  constructor(username= '', password= '') {
    if (username == undefined || password == undefined) {
      console.log('Julebygda is missing credentials');
      return false;
    } else {

      this._username = username;
      this._password = password;

      this._urls = {
          raw: 'http://www.julebygda.no/',
          base: 'http://www.julebygda.no/index.cfm?tmpl=',
          login: 'butikk/incl_login2',
          addToCart: 'butikk/basket',
          listOrders: 'butikk/orders',
          getProductData: 'butikk/produkt_view&listeid=1&level=1&kategori=a',
          viewBasket: 'butikk/incl_kurv',
          search: 'sok',
          cart: 'butikk/incl_kasse',
          confirmOrder: 'butikk/incl_kasse2'
      }

      this._items = {
        milk: 165348,
        bread1: 141269, // grovt landbrød
        bread2: 140954, // mors brød
        applejuice: 110367, // 1,5l eldorado
        applejuice2: 116657, // 1l sunniva
        orangejuice: 105684, // 1,5l eldorado
        orangejuice2: 135391 // 1l sunniva
      }

      this._shoppingList = []

      this._login()
        .then(result => {
          console.log('Login successful! Cookie: ', result)
        })
        .catch(error => {
          console.log('Unable to log in!', error)
        })
    }
  }

  _generateUrl (action) {
    return this._urls.base + this._urls[action];
  }

  _login () {
    return new Promise((resolve, reject) => {
      request.post({url: this._generateUrl('login'), headers: { 'User-Agent': 'node.js'}, jar: j, form: {username:this._username, password:this._password}}, (err,httpResponse,body) => {
        if (err) {
          reject(Error(err));
        }
        if (httpResponse.headers.location !== undefined && httpResponse.headers.location.indexOf('minside') !== -1) {
          resolve(httpResponse.headers['set-cookie']);
        } else {
          reject(Error('Wrong username or password'))
        }
      })
    })
  }

  _getPage (action, queryString = '') {
    console.log('getting page', this._generateUrl(action) + queryString)
    return new Promise((resolve, reject) => {
      request({ url: this._generateUrl(action) + queryString, jar: j}, (err, httpResponse, body) => {
        if (err) {
          console.log(err)
          reject(Error(err))
        }
        resolve(body)
      })
    })
  }

  addToShoppingList (items) {
    items.forEach(item => {
      this._shoppingList.push(item)  
    })
    return this._shoppingList
  }

  removeFromShoppingList (items) {
    console.log('removing from shoppingList', items)
    let removedItems = 0
    let shoppingList = this._shoppingList
    items.forEach(item => {
        const index = shoppingList.findIndex(el => el.id === item.id)
        if (index !== undefined) {
          shoppingList.splice(index, 1)
          removedItems++
        }
    })
    this.setShoppingList(shoppingList)
    return this.getShoppingList()
  }

  setShoppingList (list) {
    this.shoppingList = list
    return this._shoppingList
  }

  getShoppingList () {
    return this._shoppingList
  }

  clearShoppingList () {
    this._shoppingList = []
    return this._shoppingList
  }

  search (what) {
    return new Promise((resolve, reject) => {
      let results = [];
      request.post({url:this._generateUrl('search'), jar: j , form: {sokfelt: what}}, (err, httpResponse, body) => {
        if (err) {
          reject(Error(err));
        }
        const $ = cheerio.load(body)
        const links = $('#main a')

        links.each((i, link) => {
          const href = $(link).attr('href')
          const title = $(link).text()

          if (href.indexOf('javascript') == -1) {
            let parts = url.parse(href, true).query;
            results.push({title: $(link).text(), href: $(link).attr('href'), id: parts.prodid});
          }
        })
        resolve(results)
      })
    })
  }

  getProductData (items) {
    return new Promise ((resolve, reject) => {
      const getProducts = items.map((item) => {
        return this._getPage('getProductData', '&prodid=' + item.id)
      })
      Promise.all(getProducts)
        .then(products => {
          const output = products.map((item) => {
            const $ = cheerio.load(item)
            const hiddenInputFields = $('form[action="index.cfm?tmpl=butikk/basket"] > input[type="hidden"]')
            let productData = {}
            for ( let key in hiddenInputFields ) {
              if (hiddenInputFields.hasOwnProperty(key) && hiddenInputFields[key].attribs !== undefined) {
                productData[hiddenInputFields[key].attribs.name] = hiddenInputFields[key].attribs.value;
              }
            }
            return productData
          })
          resolve(output)
        }).catch(err => { console.log(err) })
      })
  }

  addToCart (items) {
    return new Promise((resolve, reject) => {
      const puts = items.map(item => {
        var h = item;
        h['User-Agent'] = 'node.js'; // motherfucker
        return new Promise ((resolve, reject) => {
          request.post({url:this._generateUrl('addToCart'), jar: j, headers: h}, (err, httpResponse, body) => {
            if (err) {
              console.log(err);
              reject(Error(err));
            }
            resolve({status: httpResponse.statusCode, redirect: httpResponse.headers.location});
          })
        })
      })
      Promise.all(puts)
        .then(responses => {
          resolve('added ' + responses.length + ' items to cart')
        })
        .catch(error => {
          reject('Unable to add items to cart', error)
        })
    })
  }

  confirmOrder (formData) {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'node.js'
      }

      console.log('------------ SENDING CONFIRM ORDER ------------------', headers, formData)

      request.post({url: this._generateUrl('confirmOrder'), jar: j, form: formData, headers: headers}, (err, httpResponse, body) => {
        if (err) {
          reject(Error(err))
        }
        console.log('confirmOrder httpResponse', httpResponse)

        this._getPage(httpResponse.headers.location)
          .then(html => console.log('----------------------- ERROR KASSE? ---------------', html))
        
        if (httpResponse.headers.location.indexOf('ordercomplete') !== -1) {
          this.clearShoppinglist()
          this.clearBasket()
          resolve('Bestilling er bekreftet!')
        } else {
          reject('Noe gikk galt. Sjekk loggene mine. Response location: ' + httpResponse.headers.location)
        }
      })
    })
  }

  clearBasket () {
    return new Promise((resolve, reject) => {
      this._getPage('viewBasket').then(html => {
        const $ = cheerio.load(html)
        const queries = $('img[src="bilder_losning/slett.gif"]')
                .toArray()
                .map(el => {
                  const href = el.parent.attribs.href
                  return href.substring(href.indexOf('&'))
                })

        const promises = queries.map(el => { return this._getPage('addToCart', el)})

        Promise.all(promises)
          .then(responses => {
            resolve('Removed ' + reponses.length + ' from cart')
          })
          .catch(error => {
            reject('Unable to remove elements from cart', error)
          })

      })
    })
  }

  viewBasket () {
    return new Promise((resolve, reject) => {
      this._getPage('cart').then(html => {
        const $ = cheerio.load(html)
        let varer = []
        let oppsummering = ''

        $('.vareliste').eq(1).children('tr').each((index, element) => {
          const item = {
            tittel: $(element).children().eq(0).text(),
            price: $(element).children().eq(1).text(),
            amount: $(element).children().eq(2).text(),
            subtotal: $(element).children().eq(3).text()
          }
          varer.push(item)
        })

        oppsummering += $('.vareliste').eq(2).find('strong').text()
        oppsummering += "\nUtlevering: " + $('#hentvaren').val()
        oppsummering += "\nBetalingsmetode: " + $('#betaling').val()
        oppsummering += "\nLeveringsdato: " + $('#datepicker').val()
        oppsummering += "\nGodta erstatningsvare: Ja"

        const formData = $('form[name="form1"]').serializeArray()
        let parsedFormData = {}

        formData.forEach(el => {
          parsedFormData[el.name] = el.value
        })
        parsedFormData['checkbox'] = '1'

        resolve({varer, oppsummering, parsedFormData})
      }).catch(error => { reject(error) })
    })
  }
}

module.exports = Julebygda;
