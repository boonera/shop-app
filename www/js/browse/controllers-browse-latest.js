angular.module('starter.controllers-browse-latest', [])

.controller('BrowseLatestCtrl', function($scope, $state, $ionicPopover, Auth, Categories, Products, Wallet, Cart, Utils) {
  
  

  // communicates with the DOM
  $scope.status = {
    sortProperty: 'timestamp_creation',
    sortMethod: 'desc',
    loading: {}, // iterates over categories
    initLoading: true,
  };

  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.AuthData = Auth.AuthData;
    $scope.CartList = Cart.CachedList;
  
    loadNew();
    loadWallet();
  });
  
  
  // ---------------------------------------------------------------------------
  // Product Loading
  
  // init
  $scope.ProductsThumbnails = {};
  $scope.ProductsMeta = {};
  
  // fn load news
  function loadNew() {
    // load categories (only once)
    if (Categories.hasOwnProperty('all')) {
        $scope.Categories = Categories.all;
        $scope.$broadcast('scroll.refreshComplete');
    } else {
        Categories.get().then(function(success){
            $scope.Categories = Categories.all;
            // --> iteratively load latest productmeta from DOM
            $scope.status['initLoading'] = false;
            $scope.$broadcast('scroll.refreshComplete');
        },
        function(error){
            console.log(error);
        })
    };
  };
  
  // get the latest
  $scope.loadProducts = function(categoryId) {
    $scope.status['loading'][categoryId] = true;
    Products.filter('categoryId', categoryId, $scope.status.sortProperty, LIMITVALUE_LATEST).then(
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
  
  // fn reload
  function reloadProducts() {
    angular.forEach($scope.Categories, function(value, categoryId){
      //console.log('reloading', categoryId)
      $scope.loadProducts(categoryId);
    })  
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
    
    reloadProducts(); // x reload
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
    reloadProducts();
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