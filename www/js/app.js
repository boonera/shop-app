/**
 * Ionic Shop ++
 * 
 * @version: v2.0
 * @date: 2016-02-26
 * @author: Noodlio <noodlio@seipel-ibisevic.com>
 * @website: www.noodl.io
 * 
 * versions: {
 *  ionic:        1.2.4
 *  firebase:     2.4.0
 *  angularfire:  1.1.3
 * }
 * 
 * To edit the SASS, please install gulp first:
 * npm install -g gulp
 * 
 * If you are packaging this project with Phonegap Build (or other), make sure
 * that you have added all the Cordova dependencies in your config.xml. You can 
 * find an overview in the folder /plugins
 * 
 * To edit the design, it is recommended to use SASS. To setup SASS in your workspace
 * follow these instructions: http://ionicframework.com/docs/cli/sass.html
 * 
 */
 
// !important settings
// Please fill in the following constants to get the project up and running
// You might need to create an account for some of the constants.
// Useful link: https://dashboard.stripe.com/account/apikeys
//
var FBURL                       = 'https://boonera.firebaseio.com';  
var SERVER_SIDE_URL             = 'https://shop-server-boonera.c9users.io';    // https://boonera.herokuapp.com // https://shop-server-boonera.c9users.io
var STRIPE_API_PUBLISHABLE_KEY  = 'pk_test_BFpVnroY1MeVBLhd0VrtLHtj'; // pk_live_Dalb47kvY9zKHd5DvsWHXiq7 pk_test_BFpVnroY1MeVBLhd0VrtLHtj
 
// Other settings
var COMPANY_NAME                = "Boonera";
var LIMITVALUE                  = 100000;
var LIMITVALUE_LATEST           = 4; // show only the X latest given the sortMethod

var STRIPE_URL_CHARGE               = SERVER_SIDE_URL + "/charge";
var STRIPE_URL_CHARGE_NODESTINATION = SERVER_SIDE_URL + "/charge/nodestination";
var STRIPE_URL_CHARGE_SPLIT         = SERVER_SIDE_URL + "/charge/split";
var STRIPE_FIREBASE_GEN_TOKEN       = SERVER_SIDE_URL + "/firebase/generatetoken";
var STRIPE_URL_AUTHORIZE            = SERVER_SIDE_URL + "/authorize";
var STRIPE_CREATE_CUSTOMER          = SERVER_SIDE_URL + "/savecustomer";
var STRIPE_CREATE_TOKEN             = SERVER_SIDE_URL + "/createtoken";

var STRIPE_OWNER_ACCOUNT_ID         = 'acct_16bvtBHW84OuTX9V';

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
  'ionic', 
  'ngCordova',
  'firebase',
  'stripe.checkout',
  
  // ionic pre-defined
  'starter.controllers',
  
  // product
  'starter.controllers-product',
  'starter.services-products-ratings',
  'starter.services-products-comments',
  
  // browse
  'starter.controllers-browse-latest',
  'starter.controllers-browse-category',
  'starter.controllers-wallet',
  'starter.controllers-search',
  'starter.services-products',
  'starter.services-categories',
  'starter.services-wallet',
  
  // checkout
  'starter.controllers-checkout',
  'starter.services-cart',
  'starter.services-payment',
  
  // other
  'starter.controllers-orders',
  'starter.services-orders',
  
  // auth and profile
  'starter.controllers-account',
  'starter.services-auth',
  'starter.services-profile',
  
  // seller
  'starter.controllers-connect',
  'starter.controllers-seller',
  'starter.controllers-submit',
  
  // cordova
  'starter.services-cordova-camera',
  
  // helpers
  'starter.services-codes',
  'starter.services-utils',
  'starter.services-fb-functions',
  'starter.directives-templates'
  ]
)

.run(function($ionicPlatform, $rootScope, $ionicHistory, $state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
  
  // Redirect the user to the login state if unAuthenticated
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    console.log("$stateChangeError", error);
    event.preventDefault(); // http://goo.gl/se4vxu
    if(error == "AUTH_LOGGED_OUT") {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $state.go('app.account');
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, StripeCheckoutProvider) {
  
  // Define your STRIPE_API_PUBLISHABLE_KEY
  StripeCheckoutProvider.defaults({key: STRIPE_API_PUBLISHABLE_KEY});
  
  // Define the resolve function, which checks whether the user is Authenticated
  // It fires $stateChangeError if not the case
  var authResolve = function (Auth) {
    return Auth.getAuthState();
  };
  
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  
  .state('app.product', {
    url: '/product/:productId',
    views: {
      'menuContent': {
        templateUrl: 'templates/product/product.html',
        controller: 'ProductCtrl'
      }
    }
  })
  .state('app.browse', {
    url: '/browse',
    views: {
      'menuContent': {
        templateUrl: 'templates/browse/browse-latest.html',
        controller: 'BrowseLatestCtrl'
      }
    }
  })
  .state('app.browse-category', {
    url: '/browse/:categoryId',
    views: {
      'menuContent': {
        templateUrl: 'templates/browse/browse-category.html',
        controller: 'BrowseCategoryCtrl'
      }
    }
  })
    
  .state('app.search', {
    url: '/search/:q/:searchType',
    views: {
      'menuContent': {
        templateUrl: 'templates/browse/search.html',
        controller: 'SearchCtrl'
      }
    }
  })
  
  .state('app.wallet', {
    url: '/wallet',
    views: {
      'menuContent': {
        templateUrl: 'templates/browse/wallet.html',
        controller: 'WalletCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })
  
  .state('app.cart', {
    url: '/cart',
    views: {
      'menuContent': {
        templateUrl: 'templates/checkout/cart.html',
        controller: 'AppCtrl',
      }
    }
  })
  .state('app.checkout', {
    url: '/checkout/:modeIter',
    views: {
      'menuContent': {
        templateUrl: 'templates/checkout/checkout.html',
        controller: 'CheckoutCtrl',
        resolve: {
          // checkout.js isn't fetched until this is resolved.
          stripe: StripeCheckoutProvider.load
        }
      }
    }
  })
  
  .state('app.account', {
    url: '/account/:nextState',
    views: {
      'menuContent': {
        templateUrl: 'templates/auth/account.html',
        controller: 'AccountCtrl'
      }
    }
  })
  
  .state('app.orders', {
    url: '/orders',
    views: {
      'menuContent': {
        templateUrl: 'templates/other/orders.html',
        controller: 'OrdersCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })
  .state('app.order-detail', {
    url: '/orders/:orderId',
    views: {
      'menuContent': {
        templateUrl: 'templates/other/order-detail.html',
        controller: 'OrderDetailCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })
  
  // ---- 
  // seller
  
  .state('app.connect', {
    url: '/connect',
    views: {
      'menuContent': {
        templateUrl: 'templates/seller/connect.html',
        controller: 'ConnectCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })
  
  .state('app.seller', {
    url: '/seller',
    views: {
      'menuContent': {
        templateUrl: 'templates/seller/seller.html',
        controller: 'SellerCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })
  
  .state('app.submit', {
    url: '/submit/:productId',
    views: {
      'menuContent': {
        templateUrl: 'templates/seller/submit.html',
        controller: 'SubmitCtrl',
        resolve: {authResolve: authResolve}
      }
    }
  })

  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/browse');
});
