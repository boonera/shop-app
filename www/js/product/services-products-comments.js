angular.module('starter.services-products-comments', [])


.factory('ProductComments', function($q, Utils, Profile, Indexing) {
    var self = this;
    
    
    /**
     * GET
     */
    self.load = function(productId) {
        var qLoad = $q.defer();
        var ref = new Firebase(FBURL);
        ref.child("products_comments").child(productId).on("value", function(snapshot) {
            qLoad.resolve(snapshot.val());
        }, function (errorObject) {
            qLoad.reject(errorObject);
        });
        return qLoad.promise;
    };
    
    /**
     * SET
     */
    self.post = function(productId, userId, commentObj) {
        var qPost = $q.defer();
        var ref = new Firebase(FBURL);
        var onComplete = function(error) {
            if (error) {
                qPost.reject({
                    error: error,
                    productId: productId
                });
            } else {
                // -->
                handleUpdates(productId);
                qPost.resolve(productId)
            }
        };
        ref.child("products_comments").child(productId).child(userId).push(
            commentObj, 
            onComplete
        )
        return qPost.promise;
    };
    
    // dynamic updates and indexing for comments
    function handleUpdates(productId) {
        Indexing.updateDynamicIndex(productId, 'comment_new');
    };
    
    /**
     * GET and FILL
     * Loads the profiles of the users commented on a certain productId
     * 
     * @param: Comments Array
     */
    self.loadProfiles = function(Comments) {
        var promises = {};
        for (var i=0; i<Comments.length; i++) {
            var promise = Profile.get(Comments[i].userId).then(
                function(ProfileData){
                    return ProfileData;
                },
                function(error){
                    return error;
                }
            );
            promises[Comments[i].userId] = promise;
        }
        return $q.all(promises)
    };
    
  
    return self;
})