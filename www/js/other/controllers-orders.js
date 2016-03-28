angular.module('starter.controllers-orders', [])

.controller('OrdersCtrl', function($scope, $state, Utils, Auth, OrdersManager) {

  // global variables
  $scope.status = {
    'loading': true,
  };

  $scope.$on('$ionicView.enter', function(e) {
    loadOrders();
  });
  $scope.doRefresh = function() {
    loadOrders();
  };

  /**
  * ---------------------------------------------------------------------------------------
  * Orders Management
  * ---------------------------------------------------------------------------------------
  */
  function loadOrders() {
    if($scope.AuthData.hasOwnProperty('uid')){ // should be as we used resolve()
      $scope.status['loading'] = true;
      OrdersManager.getOrders($scope.AuthData.uid).then(
        function(OrdersDataArray){
          
          console.log('orders loaded', OrdersDataArray)
          $scope.OrdersDataArray  = OrdersDataArray;
          $scope.status['loading'] = false;
          $scope.$broadcast('scroll.refreshComplete');

          if($scope.OrdersDataArray == null) {
            $scope.status['loading'] = null;
          }
        },
        function(error){
          $scope.status['loading'] = false;
          console.log(error);
        }
      );
    };
  };

  // helper functions
  $scope.formatTimestamp = function(timestamp) {
    return Utils.formatTimestamp(timestamp);
  };
  $scope.goToOrder = function(orderId) {
    $state.go('app.order-detail', {orderId: orderId})
  };

})

.controller('OrderDetailCtrl', function($scope, $state, $stateParams, Utils, OrdersManager) {

  $scope.status = {
    loading: true
  };

  $scope.$on('$ionicView.enter', function(e) {
    if($stateParams.orderId != undefined && $stateParams.orderId != null && $stateParams.orderId != "") {
      if(OrdersManager.OrdersData.hasOwnProperty($stateParams.orderId)) {
        //
        var OrderData            = OrdersManager.OrdersData[$stateParams.orderId];
        $scope.Cart              = OrderData
        $scope.orderId              = $stateParams.orderId;

        $scope.status['loading'] = false;

        //
      } else {
        $state.go('app.orders');
      }
    } else {
      $state.go('app.orders');
    };
  });

  // helper functions
  $scope.formatTimestamp = function(timestamp) {
    return Utils.formatTimestamp(timestamp);
  };
})
