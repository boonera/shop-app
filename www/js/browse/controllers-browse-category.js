angular.module('starter.controllers-browse-category', [])

.controller('BrowseCategoryCtrl', function(
  $scope, $state, $stateParams, 
  $ionicPopover, 
  Auth, Categories, Products, Wallet, Cart, Utils) {
  
  // communicates with the DOM
  $scope.status = {
    sortProperty: 'timestamp_creation',
    sortMethod: 'desc',
    loading: {}, // iterates over categories
    initLoading: true,
  };

  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.Categories = Categories.all;
    $scope.AuthData = Auth.AuthData;
    $scope.CartList = Cart.CachedList;
    
    $scope.categoryId = $stateParams.categoryId;
    if($scope.categoryId) {
        loadWallet();
        $scope.loadProducts($scope.categoryId);
    } else {
        $state.go('app.browse')
    }
  });
  
  // ---------------------------------------------------------------------------
  // Product Loading
  
  // init
  $scope.ProductsThumbnails = {};
  $scope.ProductsMeta = {};
  
  // get the latest
  $scope.loadProducts = function(categoryId) {
    $scope.status['loading'][categoryId] = true;
    Products.filter('categoryId', categoryId, $scope.status.sortProperty, LIMITVALUE).then(
        function(ProductsMeta){
            if(ProductsMeta == null) {$scope.status['loading'][categoryId] = null;}
            else {
                $scope.status['loading'][categoryId] = false;
                $scope.ProductsMeta[categoryId] = Utils.sortArray(Utils.arrayValuesAndKeysProducts(ProductsMeta), $scope.status.sortMethod, $scope.status.sortProperty);
                
                // @dependencies
                loadThumbnails(ProductsMeta);
            }
        },
        function(error){
            if(error == null) {$scope.status['loading'][categoryId] = null;} else {$scope.status['loading'][categoryId] = false;}
            console.log(error);
        }
    )
  };
  
  // fn load thumbnail
  function loadThumbnails(ProductsMeta) {
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
    
    $scope.loadProducts($scope.categoryId); // x reload
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
    $scope.loadProducts($scope.categoryId);
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