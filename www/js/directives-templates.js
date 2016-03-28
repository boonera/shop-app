angular.module('starter.directives-templates', [])


.directive('browseProducts', function() {
  return {
    templateUrl: 'templates/directives/browse-products.html'
  };
})


.directive('deliveryDetails', function() {
  return {
    templateUrl: 'templates/directives/delivery-details.html'
  };
})

.directive('checkoutCart', function() {
  return {
    templateUrl: 'templates/directives/checkout-cart.html'
  };
})

.directive('checkoutCartOverview', function() {
  return {
    templateUrl: 'templates/directives/checkout-cart-overview.html'
  };
})

.directive('stars', function(Utils) {
  return {
    restrict: 'AE',
    replace: true,
    scope: { rating: '@'},
    templateUrl: "templates/directives/stars.html",
    link: function(scope, element, attrs) {
        scope.starsObj = Utils.returnStars(attrs.rating);
        scope.$watch("rating", function(value) {
            scope.starsObj = Utils.returnStars(attrs.rating);
        })
    }
  };
})

.directive('ratingStarsSelect', function() {
  return {
    templateUrl: 'templates/directives/rating-stars-select.html'
  };
})