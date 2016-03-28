angular.module('starter.controllers-search', [])

.controller('SearchCtrl', function(
  $scope, $state, $stateParams, 
  $ionicPopover, 
  Auth, Categories, Products, Wallet, Cart, Utils) {
  
  // communicates with the DOM
  $scope.status = {
    sortProperty: 'timestamp_creation',
    sortMethod: 'desc',
    q: ""
  };
  $scope.categoryId = 'search'; //hack

  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.Categories = Categories.all;
    $scope.AuthData = Auth.AuthData;
    $scope.CartList = Cart.CachedList;
    
    loadWallet();
    initSearchType();
  });
  
  
  // Distinguishes whether the user is looking for products by words/tags/categoryId
  // or simply is searching for items from a specific author. If the latter is the case,
  // then the searchmethod is different
  function initSearchType() {
    var searchType;
    if($stateParams.hasOwnProperty('searchType')) {
      if($stateParams.searchType != undefined && $stateParams.searchType != "" && $stateParams.searchType != null) {
        searchType = $stateParams.searchType; // most likely 'author'
      }
    };
    switch (searchType) {
      case 'author':
        //
        $scope.loadAuthorProducts($stateParams.q); // input is author uid
        $scope.status['q'] = "";
        break
      default:
        //
        if($stateParams.q != 'null' && $stateParams.q != null) {
          $scope.status['q'] = $stateParams.q;
          $scope.searchProducts();
        }
        break
    };
  };
  
  // ---------------------------------------------------------------------------
  // Product Search & Loading
  
  // init
  $scope.ProductsThumbnails = {};
  $scope.ProductsMeta = {};
  
  // searchType: default: search the latest product
  $scope.searchProducts = function() {
    console.log('searching', $scope.status.q)
    if($scope.status.q) {
      $scope.status['loading'] = true;
      Products.search($scope.status.q, LIMITVALUE).then(
          function(ProductsMeta){
            
            console.log(ProductsMeta)
            
              if(ProductsMeta == null) {$scope.status['loading'] = null;}
              else {
                  $scope.status['loading'] = false;
                  var ProductsMetaAdj = Utils.formatSearchResults(ProductsMeta); // hack
                  $scope.ProductsMeta[$scope.categoryId] = Utils.sortArray(Utils.arrayValuesAndKeysProducts(ProductsMetaAdj), $scope.status.sortMethod, $scope.status.sortProperty);
                  
                  // @dependencies
                  loadThumbnails(ProductsMetaAdj);
              }
          },
          function(error){
              if(error == null) {$scope.status['loading'] = null;} else {$scope.status['loading'] = false;}
              console.log(error);
          }
      )
    }
  };
  
  // searchType: author: get the latest products of the author
  $scope.loadAuthorProducts = function(uid) {
    console.log('loading author products', uid)
    if(uid) {
      $scope.status['loading'] = true;
      Products.filter('userId', uid, $scope.status.sortProperty, LIMITVALUE).then(
          function(ProductsMeta){
            if(ProductsMeta == null) {$scope.status['loading'] = null;}
            else {
              $scope.status['loading'] = false;
              $scope.ProductsMeta[$scope.categoryId] = Utils.sortArray(Utils.arrayValuesAndKeysProducts(ProductsMeta), $scope.status.sortMethod, $scope.status.sortProperty);

              // @dependencies
              loadThumbnails(ProductsMeta);
            }
          },
          function(error){
              if(error == null) {$scope.status['loading'] = null;} else {$scope.status['loading'] = false;}
              console.log(error);
          }
      )
    }
  };
  
  // fn load thumbnail
  function loadThumbnails(ProductsMeta) {
    console.log('load thumbnail', ProductsMeta)
    $scope.ProductsThumbnails = Products.ProductsThumbnails;
    Products.loadThumbnails(ProductsMeta);
  };
  $scope.getThumbnail = function(productId) {
    return $scope.ProductsThumbnails[productId];
  };
  
  // ---------------------------------------------------------------------------
  // Formattings
  $scope.getCurrentPrice = function(currentPrice, discountPerc) {
    return Utils.getCurrentPrice(currentPrice, discountPerc);
  };
  $scope.getOldPrice = function(currentPrice, discountPerc) {
    return Utils.getOldPrice(currentPrice, discountPerc);
  };
  $scope.formatTimestamp = function(timestamp) {
    return Utils.formatTimestamp(timestamp);
  };
  
  // ---------------------------------------------------------------------------
  // Sorting
  $ionicPopover.fromTemplateUrl('popovers/popover-sorting.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });
  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };
  $scope.selectSortProperty = function(selectedProperty, selectedSortMethod) {
    $scope.status['sortProperty']   = selectedProperty;
    $scope.status['sortMethod']     = selectedSortMethod;
    
    $scope.searchProducts(); // x reload
    $scope.closePopover();
  };
  
  // ---------------------------------------------------------------------------
  // Wallet (my saved items)
  $scope.WalletList = Wallet.CachedList;
  function loadWallet() {
    Wallet.load($scope.AuthData).then(
      function(success){
        $scope.WalletList = Wallet.CachedList;
      });
  };
  
  $scope.saveItem = function(productId) {
    Wallet.buttonPressed($scope.AuthData, productId).then(
      function(success){
        $scope.WalletList = Wallet.CachedList;
      })
  };
  
  $scope.walletPressedCSS = function(productId) {
    if($scope.WalletList.hasOwnProperty(productId)){
      if($scope.WalletList[productId]) {
        return 'button-pressed'
      }
    }
  };
  
  // ---------------------------------------------------------------------------
  // Cart
  $scope.addToCart = function(productId, ProductMeta) {
    //console.log(productId, ProductMeta)
    Cart.buttonPressed(productId, ProductMeta, $scope.getThumbnail(productId))
  };
  
  $scope.cartPressedCSS = function(productId) {
    if($scope.CartList.hasOwnProperty(productId)){
      if($scope.CartList[productId]) {
        return 'button-pressed'
      }
    }
  };
  
  // ---------------------------------------------------------------------------
  // Other
  $scope.doRefresh = function() {
    $scope.searchProducts($scope.categoryId);
    $scope.$broadcast('scroll.refreshComplete');
  };
  
  $scope.goTo = function(nextState) {
    $state.go(nextState)
  };
  
  $scope.goToCategory = function(categoryId) {
    $state.go('app.browse-category', {categoryId: categoryId})
  };
  
  $scope.goToProduct = function(productId) {
    $state.go('app.product', {productId: productId})
  };
  
})