angular.module('starter.controllers-seller', [])

.controller('SellerCtrl', function(
  $scope, $state, Auth, Products, Utils) {
    
    
    
    $scope.status = {
        loading: true,
    };
    
    $scope.$on('$ionicView.enter', function(e) {
        
        $scope.AuthData          = Auth.AuthData;
        $scope.ProductsMeta      = {};
        $scope.ProductsIcons     = {};
    
        loadLatestItems();
    });
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // ITEM MANAGEMENT
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    
    function loadLatestItems() {
        $scope.ProductsMeta = {};
        $scope.status['loading'] = true;
        if($scope.AuthData.hasOwnProperty('uid')) {
            Products.filter('userId', $scope.AuthData.uid, 'timestamp_update', LIMITVALUE).then(
                function(ProductsMeta){ 
                    // Init view
                    if(ProductsMeta != null) {
                        $scope.ProductsMeta = Utils.arrayValuesAndKeysProducts(ProductsMeta);
                        $scope.status['loading'] = false;
                    } else {
                        $scope.status['loading'] = null;
                    };
                },
                function(error){
                    if(error == null) {
                        $scope.status['loading'] = null;
                    } else {
                        $scope.status['loading'] = false;
                    }
                    console.log(error)
                }
            )
        }
    };
    
    // fn delete
    $scope.deleteItem = function(key) {
        Products.deleteProduct(key, $scope.AuthData).then(
            function(success){
                loadLatestItems();
            },
            function(error){
                console.log(error)
                $scope.status['generalmessage'] = 'Something went wrong...'
            }
        )
    };

    // custom functions to avoid Lexer error
    // https://docs.angularjs.org/error/$parse/lexerr?p0=Unterminated
    $scope.getProductsMeta = function() {
        return $scope.ProductsMeta;
    };
    $scope.getProductIcon = function(productId) {
        return $scope.ProductsIcons[productId];
    };
    
    $scope.editItem = function(productId) {
        $state.go('admin.submit', {productId: productId})
    };
    
    
    
    $scope.formatTimestamp = function(timestamp) {
        return Utils.formatTimestamp(timestamp);
    };
    
    $scope.goTo = function(nextState) {
        $state.go(nextState);  
    };
    
    $scope.editProduct = function(productId) {
      $state.go('app.submit', {productId: productId})  
    };
 

});
