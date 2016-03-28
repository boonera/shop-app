angular.module('starter.controllers-checkout', [])

.controller('CheckoutCtrl', function(
  $scope, $state, $stateParams, 
  $ionicHistory, 
  Auth, Profile, Codes, PaymentManager, Settings_Fees, Cart, Utils) {
  
  
  // all cached data used in the checkout
  $scope.status = {
    nextUpdateProfile: true,
  };
  $scope.$on('$ionicView.enter', function(e) {
    
    $scope.status['modeIter'] = $stateParams.modeIter;
    initData();
    
  })
  $scope.$on('$ionicView.leave', function(e) {
    $scope.status['modeIter'] = 0;
  })

  function initData() {

    // auth and meta
    $scope.AuthData       = Auth.AuthData;
    $scope.Cart           = Cart; // CachedList, CachedMeta, CachedTotal

    // prevent doing a checkout if basket is empty
    if($scope.Cart.CachedTotal.total_count == 0){$state.go('app.browse'); $ionicHistory.nextViewOptions({disableAnimate: true, disableBack: true});};

    // delivery details
    loadProfileData();
    
    // load fee settings
    loadFeeSettings();

    // mode handling
    $scope.modes = ['Delivery', 'Confirmation', 'Order placed']; // tracks the progress
    $scope.status['mode'] = $scope.modes[$scope.status.modeIter];

  };
  
  /**
   * Depreciated
  $scope.prevMode = function() {
    $scope.status['modeIter'] = $scope.status['modeIter'] - 1;
    if($scope.status['modeIter'] <0){$ionicHistory.nextViewOptions({disableBack: true}); $scope.status['modeIter']=0; $state.go('app.overview')}
    else {$scope.status['mode'] = $scope.modes[$scope.status['modeIter']];}
  };
  */
  $scope.nextMode = function() {
    switch($scope.status.mode) {
      case $scope.modes[0]:
        //
        if(validateDelivery()) {
          updateProfile();
          var nextModeIter = Number($scope.status['modeIter']) + 1;
          $state.go('app.checkout', {modeIter: nextModeIter})
        };
        break
      case $scope.modes[1]:
        //
        doCheckOut();
        break
    };
  };
  
  function validateDelivery() {
    if($scope.ProfileData.other.name 
      && $scope.ProfileData.other.address1 
      && $scope.ProfileData.other.postcode 
      && $scope.ProfileData.other.city) {
      return true
    } else {
      Utils.showMessage('Please fill in all required (*) fields', 1500);
    }
  };


  /**
  * ---------------------------------------------------------------------------------------
  * Update profile (delivery details in this exercise)
  * ---------------------------------------------------------------------------------------
  */

  $scope.ProfileData = {};
  function loadProfileData() {
    console.log('load profiledata')
    if($scope.AuthData.hasOwnProperty('uid')){
      $scope.status['loadingProfile'] = true;
      Profile.get($scope.AuthData.uid).then(
        function(ProfileData) {
          if(ProfileData != null) {
            console.log(ProfileData)
            $scope.ProfileData = ProfileData;
          }
          $scope.status['loadingProfile'] = false;
        }
      ),
      function(error){
        console.log(error);
        $scope.status['loadingProfile'] = false;
      }
    };
  };

  function updateProfile() {
    if($scope.AuthData.hasOwnProperty('uid') && $scope.status.nextUpdateProfile){
      Profile.setGlobal($scope.AuthData.uid, 'other', $scope.ProfileData.other)
    };
  };

  /**
  * ---------------------------------------------------------------------------------------
  * Checkout with Stripe
  * ---------------------------------------------------------------------------------------
  */

  $scope.SaleObj = {};
  function doCheckOut() {

    // do checkout
    // make the payment and handle status updates
    PaymentManager.doCheckOut($scope.AuthData, $scope.Cart).then(
      function(orderId){
        $scope.status['orderId'] = orderId;
        handleSuccess();
        console.log('success', orderId)
      },
      function(SaleObj){
        $scope.SaleObj = SaleObj;
        console.log('error', SaleObj)
      },
      function(SaleObj){
        $scope.SaleObj = SaleObj;
        console.log('update', SaleObj)
      }
    );

    // fnSuccess
    function handleSuccess() {
      $scope.status['modeIter'] = Number($scope.status['modeIter']) + 1;
      $scope.status['mode']     = $scope.modes[$scope.status['modeIter']];
      
      // http://ionicframework.com/docs/api/service/$ionicHistory/
      $ionicHistory.clearHistory();
      $ionicHistory.nextViewOptions({
        disableBack: true
      });

      // clear the Cart and SaleObj
      $scope.SaleObj = {};
      Cart.clearCart();
    };


  };
  
  // -----
  function loadFeeSettings(){
    Settings_Fees.get().then(
      function(Settings_Fees) {
        Cart.calculateFees(Settings_Fees);
      },
      function(error){
        console.log('something went wrong');
        Codes.handleError(error);
      }
    )
  };


  // finish the checkout and go to orders
  $scope.finishCheckOut = function() {
    $ionicHistory.nextViewOptions({disableBack: true});
    $state.go('app.orders');
  };
  
  $scope.goTo = function(nextState) {
    $state.go(nextState);
  };

})