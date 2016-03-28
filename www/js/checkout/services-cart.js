angular.module('starter.services-cart', [])

/**
* Wallet Management
*/
.factory('Cart', function($q, Utils) {
  var self = this;
  
  self.CachedList = {};
  self.CachedMeta = {};
  self.CachedTotal = {
    total_count: 0
  };
  
  self.changeAmount = function(productId, newAmount) {
    if(self.CachedList.hasOwnProperty(productId)) {
      if(newAmount == 0) {
        delete self.CachedList[productId]
      } else {
        self.CachedList[productId] = newAmount;
      }
      calculateTotal();
      //console.log(self.CachedList)
    } else {
      console.log('ERROR_CHANGE_AMOUNT');
    }
  };
  
  // PRESS
  // handles the logic when the button is pressed
  // @selection: list of attributes that have been selected
  self.buttonPressed = function(productId, ProductMeta, ProductThumbnail, selection) {
    if(!self.CachedList[productId]){ // add
      /**
       * +Add
       */
      var tempObj = self.CachedList;
      tempObj[productId] = 1;
      self.CachedList = tempObj;
      
      var tempObj2 = self.CachedMeta;
      //tempObj2[productId]['screenshot1'] = ProductThumbnail;  comment this out if you wish to include the screenshot
      ProductMeta['productId'] = productId; // add the productId for admin purposes
      ProductMeta['selection'] = selection; // add the selected attributes
      tempObj2[productId] = JSON.parse(angular.toJson(ProductMeta));  // remove unwanted hashkeys http://stackoverflow.com/questions/18826320/what-is-the-hashkey-added-to-my-json-stringify-result
      self.CachedMeta = tempObj2;

      // -->
      calculateTotal();
      
    } else {
      /**
       * -Remove
       */
      delete self.CachedList[productId];
      
      // -->
      calculateTotal();
    }
  };
  
  /**
   * Updates the attribute selection
   */
  self.attributeChanged = function(productId, selection) {
    if(self.CachedMeta.hasOwnProperty(productId)) {
      if(self.CachedMeta[productId].hasOwnProperty('selection')) {
        self.CachedMeta[productId]['selection'] = selection;
      }
    } 
  };
  
  // check if some products have attributes
  // if so, check if the user has made a selection
  self.validateAttributes = function() {
    var passedTest = true;
    angular.forEach(self.CachedMeta, function(value, productId){
      // does product have attribute?
      if(self.CachedMeta[productId].value.hasOwnProperty('attributes')) {
        checkSelection(productId);
      }
    })
    function checkSelection(productId) {
      if(self.CachedMeta[productId].selection != undefined) {
        // for every attribute
        angular.forEach(self.CachedMeta[productId].value.attributes, function(value, testingAType) {
          search(testingAType);
        })
        // test if it is within selection
        function search(testingAType) {
          if(self.CachedMeta[productId]['selection'].hasOwnProperty(testingAType)) {
            //
          } else {
            passedTest = false;
          }
        };
      } else {
        passedTest = false;
      }
    };
    console.log('passedTest', passedTest)
    if(!passedTest) {
      Utils.showMessage('Seems you forgot to choose an attribute!', 1500);
    }
    return passedTest;
  };
  
  /**
   * Generic wrapper to calculate the totals
   * Called after each cartButtonPressed
   */
  function calculateTotal() {
    self.CachedTotal['total_count'] = 0;
    self.CachedTotal['total_value'] = 0;
    angular.forEach(self.CachedList, function(value, productId){
      
      // init
      var CachedMeta_productId = self.CachedMeta[productId];
      var amount = self.CachedList[productId];
      var currentPrice = Number(Utils.getCurrentPrice(CachedMeta_productId.value.price, CachedMeta_productId.value.discount_perc));
      
      // per product
      self.CachedTotal[productId] = {
        amount: amount,
        price: currentPrice,
        totalPrice: amount * currentPrice,
      };
      
      // total
      self.CachedTotal['total_count'] = self.CachedTotal['total_count'] +1;
      self.CachedTotal['total_value'] = self.CachedTotal['total_value'] + self.CachedTotal[productId]['totalPrice'];
      
      //console.log(self.CachedTotal['total_count'])
    })
    //console.log(self.CachedTotal)
  };
  
  // calculate all the fees based on pre-defined settings/fees
  self.calculateFees = function(Settings_Fees) {
    
    self.CachedTotal['total_fees'] = 0;
    self.CachedTotal['total_value_incl'] = self.CachedTotal['total_value'];
        
    // iterate over all buyer fees
    angular.forEach(Settings_Fees['buyer'], function(feeObj, feeId) {
      if(feeId != 'application_fee') { // application_fee goes to the seller
        // gv
        var tempObj = {};
        if(self.CachedTotal.hasOwnProperty('fees')) {
          tempObj = self.CachedTotal['fees'];
        };
        
        // sv
        var subfee_total = self.CachedTotal['total_value']*Number(feeObj.value/100);
        tempObj[feeId] = {
          title: feeObj.title,
          perc: Number(feeObj.value),
          subfee_total: Number(subfee_total)
        };
        
        // overwrite
        self.CachedTotal['fees'] = tempObj;
        self.CachedTotal['total_fees'] = self.CachedTotal['total_fees'] + subfee_total;
        self.CachedTotal['total_value_incl'] = self.CachedTotal['total_value_incl'] + subfee_total;
      };
    })
  };
  
  self.clearCart = function() {
    self.CachedList = {};
    self.CachedMeta = {};
    self.CachedTotal = {
      total_count: 0
    };
  };
  
  
  return self;
});

