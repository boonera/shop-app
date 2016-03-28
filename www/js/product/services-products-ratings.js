angular.module('starter.services-products-ratings', [])


.factory('ProductRatings', function($q, Utils, Profile, Indexing) {
    var self = this;
    
    
    /**
     * GET
     */
    self.load = function(productId) {
        var qLoad = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("products_ratings").child(productId).on("value", function(snapshot) {
            qLoad.resolve(snapshot.val());
        }, function (errorObject) {
            qLoad.reject(errorObject);
        });
        return qLoad.promise;
    };

    
    /**
     * SET
     */
    self.post = function(productId, userId, ratingObj) {
        var qPost = $q.defer();
        var ref = new Firebase(FBURL);
        var onComplete = function(error) {
            if (error) {
                qPost.reject({
                    error: error,
                    productId: productId
                });
            } else {
                // --> resolve
                handleUpdates(productId, ratingObj);
                qPost.resolve(productId);
            }
        };
        ref.child("products_ratings").child(productId).child(userId).set(
            ratingObj, 
            onComplete
        );
        return qPost.promise;
    };
    
    // dynamic updates and indexing for ratings
    function handleUpdates(productId, ratingObj) {
        Indexing.updateDynamicIndex(productId, 'rating_new', {rating_value_new: ratingObj.value});
    };
    
    
    /**
     * GET and FILL
     * Loads the profiles of the users who rated on a certain productId
     * 
     * @param: Ratings Object
     */
    self.loadProfiles = function(Ratings) {
        var promises = {};
        angular.forEach(Ratings, function(value, key){
            if(key != 'cache') {
                var promise = Profile.get(key).then(
                    function(ProfileData){
                        //var keys = Object.keys(ProfileData);
                        //return ProfileData[keys[0]];
                        return ProfileData;
                    },
                    function(error){
                        return error;
                    }
                )
            };
            promises[key] = promise;
        })
        return $q.all(promises)
    };
    
    
    /**
     * GET
     * Used to determine whether user has bought a certain item and is allowed to rate it
     */
    self.loadPurchase = function(productId, userId) {
        var qPurch = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("purchases").child(productId).child(userId).on("value", function(snapshot) {
            qPurch.resolve(snapshot.val());
        }, function (errorObject) {
            qPurch.reject(errorObject);
        });
        return qPurch.promise;
    };
  
    return self;
})