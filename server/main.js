Items = new Mongo.Collection('items');


import { Meteor } from 'meteor/meteor';
import ebay from 'ebay-api'


function findAndBuy() {
  console.log('task findAndBuy fired');

  //
  // поиск по товарам
  //
  var results = search(["art", "painting"]);
  // console.log('results', results);

  //
  // выбор одного из результатов поиска
  //
  var random = Math.floor(results.length * Math.random());
  var single = results[random];
  // console.log('single', single, random);
  console.log('single', single.title, single.galleryPlusPictureURL);

  //
  // сохраняет выбранный товар в базу данных
  //
  Items.insert(single);

  //
  // производит покупку товара
  //
  buyItem(single.itemId);
}


function buyItem(itemId) {

  console.log('item ready to buy', itemId);
  return Meteor.wrapAsync((callback, itemId = itemId) => {
    ebay.xmlRequest({
      'serviceName': 'Shopping',
      'opType': 'GetSingleItem',
      'appId': Meteor.settings.ebay.appId,
      params: {
        'ItemId': itemId
      }
    },
    function(error, data) {

      console.log('item bought!', error, data);
      callback(error, data);

    });
  });

}


//
// производит поиск по товарам с помощью api
//
function search(parameters) {

  var params = {
    keywords: parameters,
    outputSelector: ['AspectHistogram'],
    paginationInput: {
      entriesPerPage: 10
    },
    itemFilter: [
      {name: 'FreeShippingOnly', value: true},
      {name: 'MaxPrice', value: '5'},
      {name: 'buyItNowAvailable', value: true}
    ],
    domainFilter: [
      {name: 'domainName', value: 'Art'}
    ]
  };

  return Meteor.wrapAsync((callback) => {
    ebay.xmlRequest({
        serviceName: 'Finding',
        opType: 'findItemsByKeywords',
        appId: Meteor.settings.ebay.appId,
        params: params,
        parser: ebay.parseResponseJson
      },
      // gets all the items together in a merged array
      function itemsCallback(error, itemsResponse) {

        if (error) throw error;

        var items = itemsResponse.searchResult.item;
        // items.forEach((item) => {
          // console.log('item', item.title, item.galleryPlusPictureURL);
        // });

        callback(null, items);

      }
    );
  })();

}


var cron = new Meteor.Cron( {
  events:{
    "18 19 * * *" : findAndBuy
  }
});

