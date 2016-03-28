angular.module('starter.services-wallet', [])

/**
* Wallet Management
*/
.factory('Wallet', function($q, Products, Utils, Codes) {
  var self = this;
  
  self.CachedList = {};
  self.CachedMeta = {};
  
  // LOAD
  // Generic wrapper to load the list
  // Prevents duplicate loading
  self.load = function(AuthData) {
    
    // reset if authdata unauth
    if(!AuthData.hasOwnProperty('uid')) {
      self.CachedList = {};
      self.CachedMeta = {};
    };
    
    var qLoad = $q.defer();
    if(Object.keys(self.CachedList).length > 0) {
      qLoad.resolve(self.CachedList);
    } else {
      if(AuthData.hasOwnProperty('uid')){
        self.getList(AuthData.uid).then(
          function(WalletList){
            qLoad.resolve(self.CachedList);
          },
          function(error){
            //console.log(error);
            qLoad.reject(error);
          })
      } else {
        qLoad.reject('WALLET_UNAUTH');
      }
    }
    return qLoad.promise;
  };
  

  // SET
  self.save = function(uid, productId) {
    var qUpdate = $q.defer();
    var ref = new Firebase(FBURL);
    var onComplete = function(error) {
      if (error) {
        qUpdate.reject(error);
      } else {
        qUpdate.resolve();
      }
    };
    ref.child('wallet').child(uid).child(productId).set(true, onComplete);
    return qUpdate.promise;
  };
  
  // REMOVE
  self.remove = function(uid, productId) {
    var qUpdate = $q.defer();
    var ref = new Firebase(FBURL);
    var onComplete = function(error) {
      if (error) {
        qUpdate.reject(error);
      } else {
        qUpdate.resolve();
      }
    };
    ref.child('wallet').child(uid).child(productId).set(null, onComplete);
    return qUpdate.promise;
  };
  
  // PRESS
  // handles the logic when the wallet button is pressed
  var tempPressed = false; // prevents multiple actions at once
  self.buttonPressed = function(AuthData, productId) {
    var qPress = $q.defer();
    
    if(!AuthData.hasOwnProperty('uid')) {
      Utils.showMessage('Please sign in to save items', 1750);
    };
    
    if(AuthData.hasOwnProperty('uid') && !tempPressed) {
      tempPressed = true;
      
      if(!self.CachedList[productId]){ // add
        
        self.save(AuthData.uid, productId).then(
          function(success){
            self.CachedList[productId] = true;
            tempPressed = false;
            qPress.resolve(self.CachedList);
          },
          function(error){
            tempPressed = false;
            qPress.reject();
          }
        )
        
      } else { // remove
      
        self.remove(AuthData.uid, productId).then(
          function(success){
            self.CachedList[productId] = false;
            tempPressed = false;
            qPress.resolve(self.CachedList);
          },
          function(error){
            tempPressed = false;
            qPress.reject();
          }
        )
        
      } // end if
      
      
      
    } // end auth and tempPressed
    else {
      qPress.resolve(self.CachedList)
    }
    return qPress.promise;
  };
  
  
  // ---------------------------------------------------------------------------
  
  // GET  wallet/$uid
  self.getList = function(uid) {
    var qGet = $q.defer();
    var ref = new Firebase(FBURL);
    ref.child("wallet").child(uid).on("value", function(snapshot) {
        var WalletList = snapshot.val();
        if(WalletList != null) {
          //console.log(WalletList)
          self.CachedList =  WalletList;
          qGet.resolve(WalletList);
        } else {
          qGet.reject(null);
        } // walletlist null
    }, function (error) {
        qGet.reject(error);
    }); // walletlist error
    return qGet.promise;
  };

  
  // GET  wallet/$uid   
  // FILL products_meta/$productId
  self.getProductsMeta = function(uid) {
    var qGet = $q.defer();
    var ref = new Firebase(FBURL);
    ref.child("wallet").child(uid).on("value", function(snapshot) {
        var WalletList = snapshot.val();
        if(WalletList != null) {
          Products.getProductMetaFromList(WalletList).then(
            function(ProductsMeta){
              if(ProductsMeta != null) {
                  self.CachedMeta =  ProductsMeta;
                  qGet.resolve(ProductsMeta);
              } else {
                qGet.reject(null);
              } // productsmeta null
            },
            function(error){
              qGet.reject(error);
            }
          ) // products meta error
        } else {
          qGet.reject(null);
        } // walletlist null
    }, function (error) {
        qGet.reject(error);
    }); // walletlist error
    
    return qGet.promise;
  };
  
  
  
  
  return self;
});

