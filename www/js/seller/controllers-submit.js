angular.module('starter.controllers-submit', [])

.controller('SubmitCtrl', function(
  $scope, $state, $timeout, $stateParams,
    Auth, Products, Utils, Categories) {
      
      // controller variables
    var currentProductId = null;   
    
    // init variables 
    $scope.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: true,
        loadingCategories: true,
    };
    $scope.AuthData         = Auth.AuthData;
    $scope.Categories       = Categories;
    $scope.ProductMeta      = {};
    $scope.ProductImages    = {};
    $scope.ErrorMessages    = {};
    $scope.IndexData        = {};
    
    
    $scope.$on('$ionicView.enter', function(e) {
        currentProductId = $stateParams.productId;
        redirectView();
        loadCategories();
    });
    
    function loadCategories() {
        Categories.get().then(
            function(success){
                $scope.status['loadingCategories'] = false;
                if($scope.Categories.all != null) {
                    $scope.Categories = $scope.Categories.all;
                }
            },
            function(error){
                console.log(error);
                $scope.status['loadingCategories'] = false;
            }
        );
    };
    
    
    /**
     * Edit mode verification and redirection:
     * - is it in the edit mode?
     * - does product excist?
     * - does author have the right to edit?
     * - submit with new productId or existing
     */
    function redirectView() {
        if($scope.AuthData.hasOwnProperty('uid')){
            if(currentProductId != undefined && currentProductId != null && currentProductId != "") {
                // load product
                Products.getProductMeta(currentProductId).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            // validate rights
                            //console.log("EDIT RIGHTS NOT WORKING", ProductMeta.userId, $scope.AuthData.uid)
                            if(ProductMeta.userId == $scope.AuthData.uid) {
                                $scope.ProductMeta = ProductMeta;   // bind the data
                                initEditMode();                     // load images and screenshots
                            } else {
                                initNewSubmission();
                            }
                        } else {
                            currentProductId = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            console.log('new submission');
            
            $scope.status["generalView"]    = "new";
            $scope.status["editMode"]       = false;
            currentProductId                = null; 
            
            // init productmeta
            $scope.ProductMeta = {
                userId: $scope.AuthData.uid,
                categoryId: 'other',
            };
            
            // init indexdata
            $scope.IndexData = {
                inventory_nb_items: -1
            };
            
            $scope.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
        
            console.log('edit submission', currentProductId);
        
            $scope.status["generalView"]    = "edit";
            $scope.status["editMode"]       = true;
            
            // -->
            console.log($scope.ProductMeta)
            if($scope.ProductMeta.hasOwnProperty('discount_date_end')) {
                $scope.ProductMeta["discount_date_end_raw"] = new Date($scope.ProductMeta["discount_date_end"]);
            };
            
            // -->
            getIndexValues()
            
            // -->
            loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            $scope.status["generalView"] = "error";     //console.log("error")
        };
        
    };
    
    // -------------------------------------------------------------------------
    // Load editable data
    function loadScreenshots() {
        // load images
        Products.getProductScreenshots(currentProductId).then(
            function(ScreenshotsData){
                processScreenshotsData(ScreenshotsData);
            },
            function(error){
                //console.log(error);
                $scope.status["generalView"] = "error";
            }
        );
    };
    
    // fn index values (inventory_count)
    function getIndexValues() {
        Products.getIndexValues(currentProductId).then(
            function(IndexValues){
                $scope.IndexData = IndexValues;
            },
            function(error){
                console.log(error)
            }
        )
    };
    
    
    // -------------------------------------------------------------------------
    $scope.simulateSubmit = function() {
        
        $scope.ProductMeta = {
            'categoryId': 'first',
            'tagsString': 'semin, test, hello',
            'title': 'Hello world',
            'price': 5,
            'userId': $scope.AuthData.uid,
            'discount_date_end_raw': new Date("February 27, 2016 11:13:00"),
            'discount_perc': 50,
        };
        $scope.OtherData = {
            'inventory_nb_items': 14
        }
        
        //$scope.submitForm();
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    $scope.status['submitLoading'] = false;
    $scope.submitForm = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        // validate
        if(validateProductMeta()){
            
            // referential
            addReferentialData();
            
            // psubmit
            $scope.status['submitLoading']      = true;
            
            switch ($scope.status['editMode']) {
                case true:
                    //
                    Products.editProduct($scope.ProductMeta, $scope.ProductImages, Auth.AuthData, $scope.IndexData, currentProductId).then(
                        function(success){
                            handleSuccess(currentProductId);
                        },
                        function(error){
                            handleError(error)
                        }
                    );
                    break
                case false:
                    //
                    Products.submitProduct($scope.ProductMeta, $scope.ProductImages, Auth.AuthData, $scope.IndexData).then(
                        function(productId){
                            handleSuccess(productId);
                        },
                        function(error){
                            handleError(error)
                        }
                    );
                    break
            } // ./ switch
            
        };
        
        // fn error
        function handleError(error) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $scope.ErrorMessages['general']     = "Ooops Something went wrong... try again or contact us with reference code " + error;
        };
        
        // fn success
        function handleSuccess(productId) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $state.go('app.seller');
        };
        
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        $scope.ProductMeta["timestamp_update"] = Firebase.ServerValue.TIMESTAMP;
        if(!$scope.ProductMeta.hasOwnProperty('timestamp_creation')) {
            $scope.ProductMeta["timestamp_creation"] = Firebase.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if($scope.ProductMeta["discount_date_end_raw"]) {
            $scope.ProductMeta["discount_date_end"] = $scope.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    $scope.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    $scope.onLoad9 = function (e, reader, file, fileList, fileOjects, fileObj) {
        Utils.resizeImage("canvas9", fileObj.base64, $scope.dimensions["screenshot"].w, $scope.dimensions["screenshot"].h).then(
            function(resizedBase64){
                ProductImagesArray.push(resizedBase64);
                transformArrayToScreenshot();
            }, function(error){
                //console.log(error)
            }
        )
    };
    
    $scope.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      $scope.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          $scope.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach($scope.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        $scope.ProductImages = ScreenshotsData;
        initProductArray();
        $scope.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    $scope.addAttributeType = function() {
        var aType = $scope.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if($scope.ProductMeta.hasOwnProperty('attributes')){
                $scope.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[$scope.status.newAttributeType] = {};
                $scope.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log($scope.ProductMeta['attributes'])
    };
    $scope.deleteAttributeType = function(aType) {
        delete $scope.ProductMeta['attributes'][aType]
    };
    
    $scope.addAttributeValue = function() {
        var aValue = $scope.status.newAttributeValue;
        var aType = $scope.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            $scope.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    $scope.deleteAttributeValue = function(aType, aValue) {
        delete $scope.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        // ...
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    $scope.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    function validateProductMeta() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;
        //
        // submission - categoryId
        if(!$scope.ProductMeta.hasOwnProperty("categoryId")) {
            $scope.ErrorMessages["categoryId"] = 
                "Please select a categoryId";
                $scope.status['containsNoError'] = false;
        };
        if( $scope.ProductMeta["categoryId"] == "" || 
            $scope.ProductMeta["categoryId"] == null ||
            $scope.ProductMeta["categoryId"] == undefined) {
            $scope.ErrorMessages["categoryId"] = 
                "Please select a categoryId";
                $scope.status['containsNoError'] = false;
        };
        //
        // tags string
        if(!$scope.ProductMeta.hasOwnProperty("tagsString")) {
            $scope.ErrorMessages["tagsString"] = 
                "Add at least one tag. Tags should be seperated by comma";
                $scope.status['containsNoError'] = false;
        };
        //
        // product details - title
        if(!$scope.ProductMeta.hasOwnProperty("title")) {
            $scope.ErrorMessages["title"] = 
                "Title missing";
                $scope.status['containsNoError'] = false;
        };
        if( $scope.ProductMeta["title"] == "" || 
            $scope.ProductMeta["title"] == null ||
            $scope.ProductMeta["title"] == undefined) {
            $scope.ErrorMessages["title"] = 
                "Title missing";
                $scope.status['containsNoError'] = false;
        };
        //
        // product details - price
        if(!$scope.ProductMeta.hasOwnProperty("price")) {
            $scope.ErrorMessages["price"] = 
                "Price missing";
                $scope.status['containsNoError'] = false;
        };
        if( $scope.ProductMeta["price"] == "" || 
            $scope.ProductMeta["price"] == null ||
            $scope.ProductMeta["price"] == undefined) {
            $scope.ErrorMessages["price"] = 
                "Price missing";
                $scope.status['containsNoError'] = false;
        };
        
        
        
        
        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = 
            "There are some errors in your submission. Please check all fields in red";
        };
        
        return $scope.status['containsNoError'];
    };
    

});
