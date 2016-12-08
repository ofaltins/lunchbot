'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var j = request.jar();

var Julebygda = function () {
  function Julebygda() {
    var username = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var password = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, Julebygda);

    if (username == undefined || password == undefined) {
      console.log('Julebygda is missing credentials');
      return false;
    } else {

      this._username = username;
      this._password = password;

      this._urls = {
        base: 'http://www.julebygda.no/index.cfm?tmpl=',
        login: 'butikk/incl_login2',
        addToCart: 'butikk/basket',
        listOrders: 'butikk/orders',
        getProductData: 'butikk/produkt_view&listeid=1&level=1&kategori=a',
        viewBasket: 'butikk/incl_kurv',
        search: 'sok',
        cart: 'butikk/incl_kasse',
        confirmOrder: 'butikk/incl_kasse2'
      };

      this._items = {
        milk: 165348,
        bread1: 141269, // grovt landbrød
        bread2: 140954, // mors brød
        applejuice: 110367, // 1,5l eldorado
        applejuice2: 116657, // 1l sunniva
        orangejuice: 105684, // 1,5l eldorado
        orangejuice2: 135391 // 1l sunniva
      };

      this._shoppingList = [];

      this._login().then(function (result) {
        console.log('Login successful! Cookie: ', result);
      }).catch(function (error) {
        console.log('Unable to log in!', error);
      });
    }
  }

  _createClass(Julebygda, [{
    key: '_generateUrl',
    value: function _generateUrl(action) {
      return this._urls.base + this._urls[action];
    }
  }, {
    key: '_login',
    value: function _login() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        request.post({ url: _this._generateUrl('login'), headers: { 'User-Agent': 'node.js' }, jar: j, form: { username: _this._username, password: _this._password } }, function (err, httpResponse, body) {
          if (err) {
            reject(Error(err));
          }
          if (httpResponse.headers.location !== undefined && httpResponse.headers.location.indexOf('minside') !== -1) {
            resolve(httpResponse.headers['set-cookie']);
          } else {
            reject(Error('Wrong username or password'));
          }
        });
      });
    }
  }, {
    key: '_getPage',
    value: function _getPage(action) {
      var _this2 = this;

      var queryString = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      console.log('getting page', this._generateUrl(action) + queryString);
      return new Promise(function (resolve, reject) {
        request({ url: _this2._generateUrl(action) + queryString, jar: j }, function (err, httpResponse, body) {
          if (err) {
            console.log(err);
            reject(Error(err));
          }
          resolve(body);
        });
      });
    }
  }, {
    key: 'addToShoppingList',
    value: function addToShoppingList(items) {
      var _this3 = this;

      items.forEach(function (item) {
        _this3._shoppingList.push(item);
      });
      return this._shoppingList;
    }
  }, {
    key: 'getShoppingList',
    value: function getShoppingList() {
      return this._shoppingList;
    }
  }, {
    key: 'clearShoppingList',
    value: function clearShoppingList() {
      this._shoppingList = [];
      return this._shoppingList;
    }
  }, {
    key: 'search',
    value: function search(what) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var results = [];
        request.post({ url: _this4._generateUrl('search'), jar: j, form: { sokfelt: what } }, function (err, httpResponse, body) {
          if (err) {
            reject(Error(err));
          }
          var $ = cheerio.load(body);
          var links = $('#main a');

          links.each(function (i, link) {
            var href = $(link).attr('href');
            var title = $(link).text();

            if (href.indexOf('javascript') == -1) {
              var parts = url.parse(href, true).query;
              results.push({ title: $(link).text(), href: $(link).attr('href'), id: parts.prodid });
            }
          });
          resolve(results);
        });
      });
    }
  }, {
    key: 'getProductData',
    value: function getProductData(items) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        var getProducts = items.map(function (item) {
          return _this5._getPage('getProductData', '&prodid=' + item.id);
        });
        Promise.all(getProducts).then(function (products) {
          var output = products.map(function (item) {
            var $ = cheerio.load(item);
            var hiddenInputFields = $('form[action="index.cfm?tmpl=butikk/basket"] > input[type="hidden"]');
            var productData = {};
            for (var key in hiddenInputFields) {
              if (hiddenInputFields.hasOwnProperty(key) && hiddenInputFields[key].attribs !== undefined) {
                productData[hiddenInputFields[key].attribs.name] = hiddenInputFields[key].attribs.value;
              }
            }
            return productData;
          });
          resolve(output);
        }).catch(function (err) {
          console.log(err);
        });
      });
    }
  }, {
    key: 'addToCart',
    value: function addToCart(items) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        var puts = items.map(function (item) {
          var h = item;
          h['User-Agent'] = 'node.js'; // motherfucker
          return new Promise(function (resolve, reject) {
            request.post({ url: _this6._generateUrl('addToCart'), jar: j, headers: h }, function (err, httpResponse, body) {
              if (err) {
                console.log(err);
                reject(Error(err));
              }
              resolve({ status: httpResponse.statusCode, redirect: httpResponse.headers.location });
            });
          });
        });
        Promise.all(puts).then(function (responses) {
          resolve('added ' + responses.length + ' items to cart');
        }).catch(function (error) {
          reject('Unable to add items to cart', error);
        });
      });
    }
  }, {
    key: 'confirmOrder',
    value: function confirmOrder(formData) {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        var headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'node.js'
        };

        console.log('------------ SENDING CONFIRM ORDER ------------------', headers, formData);

        request.post({ url: _this7._generateUrl('confirmOrder'), jar: j, form: formData, headers: headers }, function (err, httpResponse, body) {
          if (err) {
            reject(Error(err));
          }
          console.log('confirmOrder httpResponse', httpResponse);

          _this7._getPage(httpResponse.headers.location).then(function (html) {
            return console.log('----------------------- ERROR KASSE? ---------------', html);
          });

          resolve('Julebygda sier: ' + httpResponse.headers.location);
        });
      });
    }
  }, {
    key: 'viewBasket',
    value: function viewBasket() {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        _this8._getPage('cart').then(function (html) {
          var $ = cheerio.load(html);
          var varer = [];
          var oppsummering = '';

          $('.vareliste').eq(1).children('tr').each(function (index, element) {
            var item = {
              tittel: $(element).children().eq(0).text(),
              price: $(element).children().eq(1).text(),
              amount: $(element).children().eq(2).text(),
              subtotal: $(element).children().eq(3).text()
            };
            varer.push(item);
          });

          oppsummering += $('.vareliste').eq(2).find('strong').text();
          oppsummering += "\nUtlevering: " + $('#hentvaren').val();
          oppsummering += "\nBetalingsmetode: " + $('#betaling').val();
          oppsummering += "\nLeveringsdato: " + $('#datepicker').val();
          oppsummering += "\nGodta erstatningsvare: Ja";

          var formData = $('form[name="form1"]').serializeArray();
          var parsedFormData = {};

          formData.forEach(function (el) {
            parsedFormData[el.name] = el.value;
          });
          parsedFormData['checkbox'] = '1';

          resolve({ varer: varer, oppsummering: oppsummering, parsedFormData: parsedFormData });
        }).catch(function (error) {
          reject(error);
        });
      });
    }
  }]);

  return Julebygda;
}();

module.exports = Julebygda;