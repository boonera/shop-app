angular.module('starter.controllers-connect', [])

.controller('ConnectCtrl', function(
  $scope, $state,
  Auth, StripeCharge) {

  // communicates with the DOM
  $scope.status = {
    loading: true,
    setupStripeConnect: true,
    setupStripeConnectMode: false,
    loadingStripeConnect: true,
    generateNewToken: false,
    loadingAuthToken: true,
  };
  
  $scope.$on('$ionicView.enter', function(e) {
    // global variables
    $scope.AuthData = Auth.AuthData;
  
    getStripeConnectAuth();
    generateFBAuthToken();
  });

  function getStripeConnectAuth() {
    StripeCharge.getStripeConnectAuth_value($scope.AuthData.uid)
      .then(function(SCData) {
        
        // bind to DOM
        $scope.SCData = SCData;
        $scope.status['loadingStripeConnect']    = false;
        
        // process the result
        if(SCData == null) {
          // stripe not setup, generate a new token
          $scope.status['setupStripeConnect']  = false; 
          $scope.status['generateNewToken']    = true;
        } else {
          if(SCData.hasOwnProperty('stripe_user_id')) {
            // stripe connect has been setup, resolve
            $scope.status['setupStripeConnect']  = true;
            $scope.status['generateNewToken']    = false;
          } else {
            // stripe not setup, generate a new token
            $scope.status['setupStripeConnect']  = false; 
            $scope.status['generateNewToken']    = true;
          };
        };
      })
      .catch(function(error) {
        console.log(error)
        $scope.status['setupStripeConnect']     = false;
        $scope.status['loadingStripeConnect']    = false;
        $scope.status['generateNewToken']        = true;
      }
    );
  };
    
  // generate the link to setup stripe connect
  function generateFBAuthToken() {
    StripeCharge.generateFBAuthToken($scope.AuthData.uid).then(
      function(fbAuthToken){
        // update the dynamic url for stripe connect
        $scope.status['authorize_url'] = STRIPE_URL_AUTHORIZE + "?userId=" + $scope.AuthData.uid + "&token=" + fbAuthToken;
        $scope.status['loadingAuthToken']    = false;
      },
      function(error){
        $scope.status['loadingAuthToken']    = false;
      }
    );
  };
  
  $scope.connectWithStripe = function() {
    $scope.setupSubNavCSS = "back-lightblue"
    $scope.status['setupStripeConnectMode'] = true;
  };
  
  $scope.refreshStripeConnectAuth = function() {
    getStripeConnectAuth();
    $scope.status['setupStripeConnectMode'] = false;
  };

  $scope.goTo = function(nextState) {
    $state.go(nextState);
  };

});
