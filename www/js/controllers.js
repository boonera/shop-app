angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $state, Auth, Cart, Categories) {
  
  $scope.goTo = function(nextState) {
    $state.go(nextState);
  };
  
  $scope.Categories = Categories.all;
  $scope.Cart = Cart;
  $scope.AuthData = Auth.AuthData;
  
  
  $scope.$on('$ionicView.enter', function(e) {
    $scope.current = $state.current.name;
  });
  
  $scope.changeAmount = function(productId, newAmount) {
    Cart.changeAmount(productId, newAmount);
  };
  
  $scope.goToCheckout = function() {
    console.log('goToCheckout')
    if(validateAttributes()) {
      if(Auth.AuthData.hasOwnProperty('uid')) {
        $state.go('app.checkout', {modeIter: 0});
      } else {
        $state.go('app.account', {nextState: 'app.checkout'});
      }
    }
  };
  
  // check if some products have attributes
  // if so, check if the user has made a selection
  function validateAttributes() {
    return Cart.validateAttributes();
  };
  
  // Use to dynamically disable dragging of this side-menu.
  // http://ionicframework.com/docs/angularjs/controllers/side-menu/
  $scope.canDrag = function() {
    if($state.current.name == 'app.product') {
      return false;
    } else {
      return true;
    }
  };
  
})
