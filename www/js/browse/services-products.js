angular.module('starter.services-products', [])

/**
 * Products
 *      brother of ProductManagement
 *      encompasses the filtering, search and retrieval of products data
 */
.factory('Products', function($q, ProductManagement, Utils) {
    var self = this;
    
    self.getIndexValues = function(productId){
        var qIV = $q.defer();
        var ref = new Firebase(FBURL);
        //
        //console.log(filterNode, filterValue, limitValue)
        ref.child("products_tags").child('all').child('all').child(productId).on("value", function(snapshot) {
            qIV.resolve(snapshot.val());
        }, function (errorObject) {
            qIV.reject(errorObject);
        });
        return qIV.promise;
    };
    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };
    
    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var qSort = $q.defer();
        var ref = new Firebase(FBURL);
        //
        //console.log(filterNode, filterValue, limitValue)
        ref.child("products_tags").child(method).child(tag).orderByChild(sortNode).limitToLast(limitValue).on("value", function(snapshot) {
            qSort.resolve(snapshot.val());
        }, function (errorObject) {
            qSort.reject(errorObject);
        });
        return qSort.promise;
    };
    
    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};
        
        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {
                
                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);
                
                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };
                
                
            }; // for i
        }; // w
        
        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };
        
        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */
        
        
        
        //return qSearch.promise;
        return $q.all(promises);
    };
    
    
    
    
    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        var qCat = $q.defer();
        var ref = new Firebase(FBURL);
        //
        //console.log(filterNode, filterValue, limitValue)
        ref.child("products_tags").child("categoryId").on("value", function(snapshot) {
            qCat.resolve(snapshot.val());
        }, function (errorObject) {
            qCat.reject(errorObject);
        });
        return qCat.promise;
    };
    
    
    /**
     * products_meta
     */
    self.getProductMeta = function(productId) {
        var qLoad = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("products_meta").child(productId).on("value", function(snapshot) {
            qLoad.resolve(snapshot.val());
        }, function (errorObject) {
            qLoad.reject(errorObject);
        });
        return qLoad.promise;
    };
    
    /**
     * products_images/icon
     */
    self.getProductIcon = function(productId) {
        var qIcon = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("products_images").child(productId).child("icon").on("value", function(snapshot) {
            qIcon.resolve(snapshot.val());
        }, function (errorObject) {
            qIcon.reject(errorObject);
        });
        return qIcon.promise;
    };
    
    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var qIcon = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("products_images").child(productId).child("screenshot1").on("value", function(snapshot) {
            qIcon.resolve(snapshot.val());
        }, function (errorObject) {
            qIcon.reject(errorObject);
        });
        return qIcon.promise;
    };
    
    /**
     * products_images
     */
    self.getProductScreenshots = function(productId) {
        var qScreen = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("products_images").child(productId).on("value", function(snapshot) {
            qScreen.resolve(snapshot.val());
        }, function (errorObject) {
            qScreen.reject(errorObject);
        });
        return qScreen.promise;
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    self.ProductsThumbnails = {};
    
    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var ref = new Firebase(FBURL);
        //
        ref.child("featured").child(subNode).on("value", function(snapshot) {
            var ProductList = snapshot.val();
            // --
            if(ProductList != null) {
                self.getProductMetaFromList(ProductList).then(
                    function(ProductsMeta){
                        qFea.resolve(ProductsMeta);
                    },
                    function(error){
                        qFea.reject(error);
                    }
                )
            } else {
                qFea.resolve(null);
            }
            // --
        }, function (errorObject) {
            qFea.reject(errorObject);
        })
        return qFea.promise;
    };
    
    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var ref = new Firebase(FBURL);
        ref.child("featured").child(subNode).on("value", function(snapshot) {
            var ProductList = snapshot.val();
            if(ProductList != null) {
                qFea.resolve(ProductList);
            } else {
                qFea.resolve(null);
            }
        }, function (errorObject) {
            qFea.reject(errorObject);
        })
        return qFea.promise;
    };
    self.updateFeaturedList = function(subNode, Featuredlist) {
        var qUpdate = $q.defer();
        var ref = new Firebase(FBURL);
        var onComplete = function(error) {
          if (error) {
            qUpdate.reject(error);
          } else {
            qUpdate.resolve();
          }
        };
        ref.child('featured').child(subNode).set(Featuredlist, onComplete);
        return qUpdate.promise;
    };
    
    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();
            
            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };
            
            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };
    
    // -- external
    self.submitProduct = function(ProductMeta, ProductImages, AuthData, IndexData) {
        return ProductManagement.submit(ProductMeta, ProductImages, AuthData, IndexData);
    };
    
    self.editProduct = function(ProductMeta, ProductImages, AuthData, IndexData, productId) {
        return ProductManagement.edit(ProductMeta, ProductImages, AuthData, IndexData, productId);
    };
    
    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };
  
    return self;
})


/**
 * ProductManagement
 *      brother of Products
 *      encompasses submit, edit and delete of products
 */
.factory('ProductManagement', function($q, $http, Utils) {
    var self = this;
    
    /**
     * Submit (with indexing)
     */
    self.submit = function(ProductMeta, ProductImages, AuthData, IndexData) {
        var qSubmit     = $q.defer();
        var productId   = generateProductId();

        var ref = new Firebase(FBURL);
            
        // create the paths (object if fill, null if delete)
        var INDEX_VALUES = getINDEX_VALUES_NEW(ProductMeta, IndexData);
        var PATH_DATA = createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES);
        var NEW_PATHS = Object.keys(PATH_DATA);
        PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;
        
        // synchronize
        var onComplete = function(error) {
            if (error) {
                console.log("Error updating data:", error);
                qSubmit.reject(error)
            } else {
                //console.log("success")
                qSubmit.resolve(productId);
            }
        };
        //qSubmit.reject();
        ref.update(PATH_DATA, onComplete);
        return qSubmit.promise;
    }; 
    
    
    
    /**
     * Edit (with indexing)
     */
    self.edit   = function(ProductMeta, ProductImages, AuthData, IndexData, productId) {
        var qEdit = $q.defer();
        
        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {
                    
                    var INDEX_VALUES    = EDIT_DATA.INDEX_VALUES;
                    var OLD_PATHS       = EDIT_DATA.OLD_PATHS;
                    
                    // -->
                    proceedEditSubmission(INDEX_VALUES, OLD_PATHS)
                    
                } else {
                    qEdit.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                qEdit.reject(error);
            }
        ); // ./ get edit data
        
        // ---------------------------------------------------------------------
        // fn edit multi-location update
        function proceedEditSubmission(INDEX_VALUES, OLD_PATHS) {
            var ref = new Firebase(FBURL);
            
            // update index values with possible new
            if(INDEX_VALUES != null){
                INDEX_VALUES = getINDEX_VALUES_EDIT(ProductMeta, IndexData, INDEX_VALUES);
            };
            
            // create the path data and prepare new paths
            // @EDIT_MODE: check for overlap and handle accordingly (put null if no overlap)
            var NEW_PATH_DATA = createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES);
            var NEW_PATHS = Object.keys(NEW_PATH_DATA);
            NEW_PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;
            NEW_PATH_DATA = checkOverlapPATH_DATA(NEW_PATHS, OLD_PATHS, NEW_PATH_DATA);
            
            // synchronize
            var onComplete = function(error) {
                if (error) {
                    console.log("Error updating data:", error);
                    qEdit.reject(error)
                } else {
                    //console.log("success")
                    qEdit.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
                }
            };
            //qEdit.reject('temp')
            ref.update(NEW_PATH_DATA, onComplete);
        };
        
        return qEdit.promise;
    };
    
    
    /**
     * Delete
     */
    self.delete = function(productId, AuthData) {
        var qDelete     = $q.defer();
        
        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {
                    
                    // -->
                    var OLD_PATHS       = EDIT_DATA.OLD_PATHS;
                    proceedDeleteSubmission(OLD_PATHS);
                    
                } else {
                    qDelete.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                console.log(error)
                qDelete.reject(error);
            }
        ); // ./ get edit data
        
        // ---------------------------------------------------------------------
        // fn proceed
        function proceedDeleteSubmission(OLD_PATHS) {
            
            // get the null paths
            var DELETE_PATH_DATA = getDELETE_PATH_DATA(OLD_PATHS, productId);
            
            var ref = new Firebase(FBURL);
            var onComplete = function(error) {
                if (error) {
                    console.log("Error updating data:", error);
                    qDelete.reject(error)
                } else {
                    console.log("success")
                    qDelete.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
                }
            };
            ref.update(DELETE_PATH_DATA, onComplete)
        };
        
        return qDelete.promise;
    }; // qdelete
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    function getINDEX_VALUES_NEW(ProductMeta, IndexData) {
        var INDEX_VALUES = {
            timestamp_creation:     Firebase.ServerValue.TIMESTAMP,             // meta
            timestamp_update:       Firebase.ServerValue.TIMESTAMP,             // meta
            price:                  ProductMeta.price,                          // meta
            sales_count:            0,                                          // dynamic
            sales_value_total:      0,                                          // dynamic
            comments_count:         0,                                          // dynamic
            ratings_count:          0,                                          // dynamic
            ratings_avg:            0,                                          // dynamic
            ratings_overall:        0,                                          // dynamic
            inventory_nb_items:     IndexData.inventory_nb_items,               // dynamic
        };
        return INDEX_VALUES;
    };
    
    function getINDEX_VALUES_EDIT(ProductMeta, IndexData, INDEX_VALUES) {
        // timestamp_creation and dynamic field are not overriden
        INDEX_VALUES['timestamp_update']    = Firebase.ServerValue.TIMESTAMP;   // override meta
        INDEX_VALUES['price']               = ProductMeta.price;                // override meta
        INDEX_VALUES['inventory_nb_items']  = IndexData.inventory_nb_items;     // override dynamic
        return INDEX_VALUES;
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    // fn get edit data
    function getEDIT_DATA(productId) {
        var ref = new Firebase(FBURL);
        var qPath = $q.defer();
        
        var INDEX_VALUES    = {};
        var OLD_PATHS       = {};
        
        // get the latest INDEX_VALUES
        ref.child("products_tags").child("all").child("all").child(productId).on("value", function(snapshot) {
            INDEX_VALUES = snapshot.val();
            // -->
            getOldPaths();
        }, function (error) {
            qPath.reject(error)
        });
        
        // get OLD_PATHS
        function getOldPaths() {
            ref.child("products_tags").child("paths").child("all").child(productId).on("value", function(snapshot) {
              OLD_PATHS = snapshot.val();
              // resolve -->
              qPath.resolve({
                  INDEX_VALUES: INDEX_VALUES,
                  OLD_PATHS: OLD_PATHS
              })
            }, function (error) {
              qPath.reject(error)
            });
        };
        return qPath.promise;
    };
    
    // fn check overlap, set null
    function checkOverlapPATH_DATA(NEW_PATHS, OLD_PATHS, NEW_PATH_DATA) {
        var newInOld = false;
        for (var o=0; o<OLD_PATHS.length; o++) {
            newInOld = false;
            for (var n=0; n<NEW_PATHS.length; n++) {
                if(NEW_PATHS[n] == OLD_PATHS[o]) {
                    newInOld = true;
                    break
                }
            } // loop over n
            if(!newInOld){
                NEW_PATH_DATA[OLD_PATHS[o]] = null;
            };
        }; //loop over o
        return NEW_PATH_DATA;
    };
    
    // fn set all paths to null
    function getDELETE_PATH_DATA(OLD_PATHS, productId) {
        var DELETE_PATH_DATA = {};
        for (var o=0; o<OLD_PATHS.length; o++) {
            DELETE_PATH_DATA[OLD_PATHS[o]] = null;
        }; //loop over o
        DELETE_PATH_DATA["/products_tags/paths/all/" + productId] = null;
        return DELETE_PATH_DATA;
    };
    
    // fn create path data
    function createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES){
        
        // standard
        var PATH_DATA = {};
        PATH_DATA["/products_tags/all/all/" + productId]                                    = INDEX_VALUES;
        PATH_DATA["/products_tags/userId/" + ProductMeta.userId + "/" + productId]          = INDEX_VALUES;
        PATH_DATA["/products_tags/categoryId/" + ProductMeta.categoryId + "/" + productId]  = INDEX_VALUES;

        // ** displayname and username are to be linked to userId
        
        // tags
        var tagsRaw = ProductMeta["tagsString"].split(',');
        var tag = null;
        for(var i=0; i<tagsRaw.length; i++) {
            tag = Utils.alphaNumericWide(tagsRaw[i]);
            if(tag != undefined && tag != "" && tag != null) {
                PATH_DATA["/products_tags/tag/" + tag + "/" + productId] = INDEX_VALUES;
            }
        };
        
        // words
        var titleRaw = ProductMeta["title"].split(/\W+/);
        var titleWord = null;
        for(var j=0; j<titleRaw.length; j++) {
            titleWord = Utils.alphaNumericWide(titleRaw[j]);
            if(titleWord != undefined && titleWord != "" && titleWord != null) {
                PATH_DATA["/products_tags/words/" + titleWord + "/" + productId] = INDEX_VALUES;
            }
        };
        
        // meta and images
        PATH_DATA["/products_meta/" + productId]    = ProductMeta;
        PATH_DATA["/products_images/" + productId]  = ProductImages;
        

        return PATH_DATA;
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    function generateProductId() {
        var d = new Date();
        
        var wordString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var letterPart = "";
        for (var i=0; i<3; i++) {
            letterPart = letterPart + wordString[Math.floor(26*Math.random())]
        };
        
        var fyear = d.getFullYear();
        var fmonth = d.getMonth()+1;
        var fday = d.getDate();
        var fhour = d.getHours();
        var fminute = d.getMinutes();
        
        fmonth = fmonth < 10 ? '0'+fmonth : fmonth;
        fday = fday < 10 ? '0'+fday : fday;
        fhour = fhour < 10 ? '0'+fhour : fhour;
        fminute = fminute < 10 ? '0'+fminute : fminute;
        
        var ftime = d.getTime();
        
        d = d.getTime();
        d = d.toString();
        
        return "P" + fyear + fmonth + fday + fhour + fminute + d.substr(d.length-3,d.length-1);
    };
    
    return self;
})
    
    
/**
 * Factory that manages the indexing (i.e. when someone comments, rates, or downloads a product)
 * of index_values, stored in products_tags/$method/$tag/property
 */
.factory("Indexing", function($q, Products){
    var self = this;
    
    /**
     * @changeType:     accepts:
     *                  - comment_new
     *                      updates properties:
     *                          - comments_count
     *                  - rating_new
     *                      optData: {'rating_value_new': $value}
     *                      updates properties:
     *                          - ratings_count
     *                          - ratings_avg
     *                          - ratings_overall
     *                  - sales_new
     *                      optData: {'sales_value_new': $value}
     *                      updates properties:
     *                          - sales_count
     *                          - sales_value_total
     *                          - inventory_count
     */
    self.updateDynamicIndex   = function(productId, changeType, optData) {
        var qEdit = $q.defer();
        
        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {
                    
                    var INDEX_VALUES    = EDIT_DATA.INDEX_VALUES;
                    var CURRENT_PATHS   = EDIT_DATA.OLD_PATHS;
                    
                    // -->
                    proceedUpdate(INDEX_VALUES, CURRENT_PATHS)
                    
                } else {
                    qEdit.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                qEdit.reject(error);
            }
        ); // ./ get edit data
        
        
        // fn edit multi-location update
        function proceedUpdate(INDEX_VALUES, CURRENT_PATHS) {
            var ref = new Firebase(FBURL);
            
            // update with the latest index values
            INDEX_VALUES = updateIndexValues(INDEX_VALUES);
            
            // prepare the paths
            var NEW_PATH_DATA = createPATH_DATA_from_OLD_PATHS(CURRENT_PATHS, INDEX_VALUES, productId)
            var NEW_PATHS = Object.keys(NEW_PATH_DATA);
            NEW_PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;
            
            // do not include meta paths in synchronization
            delete NEW_PATH_DATA["/products_meta/" + productId];
            delete NEW_PATH_DATA["/products_images/" + productId];
            
            // synchronize
            var onComplete = function(error) {
                if (error) {
                    console.log("Error updating data:", error);
                    qEdit.reject(error)
                } else {
                    //console.log("success")
                    qEdit.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
                }
            };
            ref.update(NEW_PATH_DATA, onComplete);
        };
        
        // fn update wherwe the magic happens
        function updateIndexValues(INDEX_VALUES) {
            switch(changeType){
                case 'comment_new':
                    //
                    INDEX_VALUES['comments_count']      = INDEX_VALUES['comments_count'] + 1;
                    break
                case 'rating_new':
                    //
                    INDEX_VALUES['ratings_overall']     = INDEX_VALUES['ratings_overall'] + optData.rating_value_new;
                    INDEX_VALUES['ratings_count']       = INDEX_VALUES['ratings_count'] + 1;
                    INDEX_VALUES['ratings_avg']         = INDEX_VALUES['ratings_overall']/INDEX_VALUES['ratings_count'];
                    break
                case 'sales_new':
                    //
                    INDEX_VALUES['sales_count']          = INDEX_VALUES['sales_count'] + 1;
                    INDEX_VALUES['sales_value_total']    = INDEX_VALUES['sales_value_total'] + optData.sales_value_new;
                    INDEX_VALUES['inventory_nb_items']   = INDEX_VALUES['inventory_nb_items'] -1;
                    break
            }
            return INDEX_VALUES;
        };
        
        return qEdit.promise;
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    // fn get edit data *** NOTE USED IN TWO FACTORIES (this file)
    function getEDIT_DATA(productId) {
        var ref = new Firebase(FBURL);
        var qPath = $q.defer();
        
        var INDEX_VALUES    = {};
        var OLD_PATHS       = {};
        
        // get the latest INDEX_VALUES
        ref.child("products_tags").child("all").child("all").child(productId).on("value", function(snapshot) {
            INDEX_VALUES = snapshot.val();
            // -->
            getOldPaths();
        }, function (error) {
            qPath.reject(error)
        });
        
        // get OLD_PATHS
        function getOldPaths() {
            ref.child("products_tags").child("paths").child("all").child(productId).on("value", function(snapshot) {
              OLD_PATHS = snapshot.val();
              // resolve -->
              qPath.resolve({
                  INDEX_VALUES: INDEX_VALUES,
                  OLD_PATHS: OLD_PATHS
              })
            }, function (error) {
              qPath.reject(error)
            });
        };
        return qPath.promise;
    };
    
    function createPATH_DATA_from_OLD_PATHS(OLD_PATHS, INDEX_VALUES, productId){
        var PATH_DATA = {};
        for (var i=0; i<OLD_PATHS.length; i++) {
            PATH_DATA[OLD_PATHS[i]] = INDEX_VALUES;
        };
        return PATH_DATA;
    };

    return self;
})


