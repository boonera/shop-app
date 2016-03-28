angular.module('starter.controllers-wallet', [])

.controller('WalletCtrl', function($scope, $state, $stateParams, $ionicPopover, Auth, Categories, Products, Utils, Wallet) {
  
  // global variables
  $scope.AuthData = Auth.AuthData;

  // communicates with the DOM
  $scope.status = {
    sortProperty: 'timestamp_creation',
    sortMethod: 'desc',
    loading: {}, // iterates over categories
    initLoading: true,
  };
  
  // pre-loaded
  $scope.Categories = Categories.all;

  $scope.$on('$ionicView.enter', function(e) {
    $scope.categoryId = 'wallet';
    loadWalletMeta($scope.categoryId);
    loadWallet();
  });
  
  // ---------------------------------------------------------------------------
  // Product Loading
  
  // init
  $scope.ProductsThumbnails = {};
  $scope.ProductsMeta = {};
  
  // get the latest from the wallet
  function loadWalletMeta(categoryId) {
    $scope.status['loading'][categoryId] = true;
    
    if($scope.AuthData.hasOwnProperty('uid')) {
      Wallet.getProductsMeta($scope.AuthData.uid).then(
        function(ProductsMeta){
          console.log('loading wallet', ProductsMeta)
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
      ); // wallet
    }; // if
    
    
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
    loadWalletMeta($scope.categoryId);
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
  // Other
  $scope.doRefresh = function() {
    loadWalletMeta($scope.categoryId);
    $scope.$broadcast('scroll.refreshComplete');
  };
  
  $scope.goTo = function(nextState) {
    $state.go(nextState)
  };
  
  $scope.goToProduct = function(productId) {
    $state.go('app.product', {productId: productId})
  };
  
})