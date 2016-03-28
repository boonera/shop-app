angular.module('starter.controllers-product', [])

.controller('ProductCtrl', function(
  $scope, $state, $stateParams, 
  $ionicSlideBoxDelegate,
  Products, ProductComments, ProductRatings,
  Profile, Utils, Auth, Cart, Wallet, Categories) {
  
  // global variables
  $scope.AuthData = Auth.AuthData;
  $scope.CartList = Cart.CachedList;
    
  // communicates with the DOM
  $scope.status = {
    loading: true,
    productId: $stateParams.productId,
    productSizeCSS: 'product small',
    activeTab: false,
    loadingComments: false,
    loadingRatings: false,
    loadingPurchaseBoolean: false,
    purchaseBoolean: null, // records whether user has bought this product
  };

  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.AuthData = Auth.AuthData;
    $scope.CartList = Cart.CachedList;
  
    $scope.status['productId'] = $stateParams.productId;
    loadProduct();
    loadIndexValues();
    loadWallet();
    initAttributeSelection();
  });
  

  // ---------------------------------------------------------------------------
  // Product Loading
  
  // init
  $scope.ProductImages      = {};
  $scope.ProductMeta        = {};
  $scope.ProductIndexValues = {};
  $scope.ProductComments    = {};
  $scope.ProductCommentsProfiles = {};
  $scope.ProductRatings     = {};
  $scope.ProductRatingsProfiles = {};
  $scope.FormData           = {};

  // load the product
  function loadProduct() {
    $scope.status['loading'] = true;
    
    Products.getProductMeta($scope.status.productId).then(
      function(ProductMeta){
        if(ProductMeta == null) {$scope.status['loading'] = null;}
        else {
          $scope.status['loading'] = false;
          $scope.ProductMeta = ProductMeta;
          
          // @dependencies
          prepareMeta();
          loadAuthor();
          loadImages();
        }
      },
      function(error){
        if(error == null) {$scope.status['loading'] = null;} else {$scope.status['loading'] = false;}
        console.log(error);
      }
    )
  };

  // --> @d fn load images
  function loadImages() {
    $scope.status['loadingImages'] = true;
    Products.getProductScreenshots($scope.status.productId).then(
      function(ProductImages){
        if(ProductImages != null) {
          $scope.ProductImages = ProductImages;
        }
        $scope.status['loadingImages'] = false;
        $ionicSlideBoxDelegate.update();
      },
      function(error){
        $scope.status['loadingImages'] = false;
        console.log(error);
      }
    )
  };
  
  // --> @d fn load index values
  function loadIndexValues() {
    $scope.status['loadingIndex'] = true;
    Products.getIndexValues($scope.status.productId).then(
      function(ProductIndexValues){
        $scope.ProductIndexValues = ProductIndexValues;
        $scope.status['loadingIndex'] = false;
      },
      function(error){
        $scope.status['loadingIndex'] = false;
        console.log(error);
      }
    )
  };
  
  // --> @d fn helper 
  function prepareMeta() {
    $scope.ProductMeta['tags'] = Utils.formatTagsString($scope.ProductMeta.tagsString);
  };
  
  // --> @d fn author
  function loadAuthor() {
    $scope.status['loadingAuthor'] = true;
    Profile.get($scope.ProductMeta.userId).then(
      function(AuthorData){
        $scope.AuthorData = AuthorData;
        $scope.status['loadingAuthor'] = false;
    },
      function(error){
        $scope.status['loadingAuthor'] = false;
        console.log(error);
    })
  };
  
  
  // ---------------------------------------------------------------------------
  // Attributes
  function initAttributeSelection() {
    if(Cart.CachedMeta.hasOwnProperty($scope.status.productId)) {
      if(Cart.CachedMeta[$scope.status.productId].hasOwnProperty('selection')) {
        $scope.selection = Cart.CachedMeta[$scope.status.productId]['selection'];
      } else {$scope.selection = {};}
    } else {$scope.selection = {};};
    console.log('attributes select', $scope.selection)
  };
  $scope.attributeChanged = function() {
    Cart.attributeChanged($scope.status.productId, $scope.selection);
  };
  
  // ---------------------------------------------------------------------------
  // Interaction
  $scope.activateTab = function(tabName) {
    $scope.status['activeTab'] = tabName;
  };
  
  
  // ---------------------------------------------------------------------------
  // Comments
  
  // fn load
  $scope.loadComments = function() {
    $scope.status['loadingComments'] = true;
    ProductComments.load($scope.status.productId).then(
      function(loadedProductComments) {
          if(ProductComments != null) {$scope.ProductComments = Utils.formatComments(loadedProductComments);}
          $scope.status['loadingComments'] = false;
          
          // @dependencies
          loadCommentsProfiles();
      }, 
      function(error){
          console.log(error);
          $scope.status['loadingComments'] = false;
      }
    )
  };
  
  // <-- 
  $scope.getCommentProfile = function(userId) {
    return $scope.ProductCommentsProfiles[userId]
  };
  
  // --> @d fn comments profiles
  function loadCommentsProfiles() {
    $scope.ProductCommentsProfiles = {};
    ProductComments.loadProfiles($scope.ProductComments).then(
      function(CommentsProfiles){
        $scope.ProductCommentsProfiles = CommentsProfiles;
      },
      function(error){
        console.log(error);
      }
    );
  };
  
  // fn add
  $scope.addComment = function() {
    if ($scope.AuthData.hasOwnProperty('uid') && $scope.FormData.commentValue) {
      var commentObj = {
        timestamp: Firebase.ServerValue.TIMESTAMP,
        message: $scope.FormData.commentValue,
      };
      ProductComments.post($scope.status.productId, $scope.AuthData.uid, commentObj).then(
        function(success){
          $scope.FormData['commentValue'] = "";
          
          // --> refresh
          $scope.loadComments();
          loadIndexValues();
        },
        function(error){
          console.log(error);
        }
      )
    }
  };
  
  // ---------------------------------------------------------------------------
  // Ratings
  
  $scope.selectRatingStar = function(value) {
    $scope.FormData['ratingValue'] = value;
    console.log($scope.FormData['ratingValue'])
  };
  
  // fn rating
  $scope.loadRatings = function() {
    $scope.status['loadingRatings'] = true;
    ProductRatings.load($scope.status.productId).then(
      function(loadedProductRatings) {
          if(ProductRatings != null) {$scope.ProductRatings = loadedProductRatings}
          $scope.status['loadingRatings'] = false;
          
          // @dependencies
          loadRatingsProfiles();
      }, 
      function(error){
          console.log(error);
          $scope.status['loadingRatings'] = false;
      }
    )
  };
  
  // --> @d fn ratings profiles
  function loadRatingsProfiles() {
    $scope.ProductRatingsProfiles = {};
    ProductRatings.loadProfiles($scope.ProductRatings).then(
      function(RatingsProfiles){
        $scope.ProductRatingsProfiles = RatingsProfiles;
      },
      function(error){
        console.log(error);
      }
    );
  };
  
  // <-- 
  $scope.getRatingProfile = function(userId) {
    return $scope.ProductRatingsProfiles[userId]
  };
  
  // fn add
  $scope.addRating = function() {
    if ($scope.AuthData.hasOwnProperty('uid') && $scope.FormData.ratingMessage && $scope.FormData.ratingValue) {
      var ratingObj = {
        timestamp:  Firebase.ServerValue.TIMESTAMP,
        message:    $scope.FormData.ratingMessage,
        value:      $scope.FormData.ratingValue
      };
      ProductRatings.post($scope.status.productId, $scope.AuthData.uid, ratingObj).then(
        function(success){
          $scope.FormData['ratingMessage'] = "";
          $scope.FormData['ratingValue'] = null;
          
          // --> refresh
          $scope.loadRatings();
          loadIndexValues();
        },
        function(error){
          console.log(error);
        }
      )
    } else {
      Utils.showMessage('Please fill in all fields', 1500);
    }
  };
  
  // fn purchase
  $scope.loadPurchase = function() {
    if($scope.AuthData.hasOwnProperty('uid') && $scope.status.hasOwnProperty('productId')) {
      $scope.status['loadingPurchaseBoolean'] = true;
      ProductRatings.loadPurchase($scope.status.productId, $scope.AuthData.uid).then(
        function(purchaseBoolean){
          $scope.status['purchaseBoolean'] = purchaseBoolean; //xtest
          $scope.status['loadingPurchaseBoolean'] = false;
        },
        function(error){
          console.log(error);
          $scope.status['loadingPurchaseBoolean'] = false;
        }
      )
    }
  };
  
  
  // ---------------------------------------------------------------------------
  // Formattings
  
  $scope.changeImageSize = function() {
    if($scope.status.productSizeCSS == "product small") {
      $scope.status['productSizeCSS'] = "product";
    } else {
      $scope.status['productSizeCSS'] = "product small";
    }
  };
  
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
  
  // ** custom addToCart()
  $scope.addToCart = function(productId) {
    $scope.ProductMetaAdj = {
      value: $scope.ProductMeta,
      key: productId,
      index: $scope.ProductIndexValues
    };
    var ProductImagesAdj = null;
    if($scope.ProductImages.hasOwnProperty('screenshot1')){ProductImagesAdj= $scope.ProductImages['screenshot1']};
    Cart.buttonPressed(productId, $scope.ProductMetaAdj, ProductImagesAdj, $scope.selection)
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

  $scope.goTo = function(nextState) {
    $state.go(nextState)
  };
  
  $scope.goToTag = function(tag) {
    $state.go('app.search', {q: tag})
  };
  
  $scope.loadAuthorProducts = function(uid) {
    $state.go('app.search', {q: uid, searchType: 'author'})
  };
  
  $scope.goToCategory = function(categoryId) {
    $state.go('app.browse-category', {categoryId: categoryId})
  };
  
})
