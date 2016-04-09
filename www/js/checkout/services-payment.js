angular.module('starter.services-payment', [])

/**
 * Factory that handles the Checkout process, consisting of the following steps:
 * ...
 */
.factory('PaymentManager', function($q, OrdersManager, StripeCharge, Settings_Fees, Indexing) {

  var self = this;
 
  self.doCheckOut = function(AuthData, Cart) {
    var qPay = $q.defer();
    var SaleObj = {}; // keeps track of the status

    // Main wrapper used throughout the form to handle the payment
    // & Static Data
    var headerData = {
      name:             "Payment",
      description:      COMPANY_NAME,
      amount:           Math.floor(Cart.CachedTotal.total_value_incl*100),  // charge handles transactions in cents
      image:            "img/ionic.png", // your company logo
      buyerId:          AuthData.uid
    };
    
    // init
    if(AuthData.hasOwnProperty('uid')) {
      getDestinationAccountIds();
    } else {
      handleError("ERROR_UNAUTH");
    };
    
    
    /**
    * [0] Get the destination account id's
    *     i.e. who is going to receive the money?
    *     The SCDatas is an object with as keys the product ids
    *     
    *   SCDatas: {
          $productId: {
            stripe_user_id: "abc"
          },
          ...
        }
    */
    
    function getDestinationAccountIds() {
      getDestinationAccountIds_fn(Cart).then(
      function(SCDatas){
        
          // filter out empty destinatin account ids
          // replace with an account that is connected to the stripe
          SCDatas = filterEmptyDestAccountIds_fn(SCDatas);
          
          // -->
          getStripeToken(SCDatas);
        },
        function(error){
          handleError(error);
        }
      );
    };
    

    /**
    * [1] Get the stripe token using the stripe checkout module
    *     This is used to create a custom of the buyer who is purchasing the Cart
    */
    function getStripeToken(SCDatas) {
      updateStatus('Initializing payment');
      StripeCharge.getStripeToken(headerData).then(
        function(stripeToken){
          //
          // -->
          createCustomer(SCDatas, stripeToken);
        },
        function(error){
          handleError(error);
        }
      ); // ./ getStripeToken
    };
    
    
    /**
    * [2] Create a customer of the buyer using the stripeToken
    *     Needed to split the charge in the future
    */
    function createCustomer(SCDatas, stripeToken) {
      StripeCharge.createCustomers(stripeToken).then(
        function(customerObj){
          //
          // -->
          createTokens(SCDatas, customerObj);
        },
        function(error){
          handleError(error);
        }
      ); // ./ createCustomers
    };
    
    
    /**
    * [3] Create the tokens for charging the buyer
    *     For each productId
      
      TokenData: {
        $productId: {
          tokenData
        },
        ...
      }
      
    */
    function createTokens(SCDatas, customerObj) {
      createTokens_fn(SCDatas, customerObj).then(
        function(TokenData){
          // -->
          proceedCharge(SCDatas, TokenData);
          console.log("createTokens", TokenData)
        },
        function(error){
          console.log("createTokens", error)
          handleError(error);
        }
      );  // ./ createTokens
    };
    
    
    // fn [3] create tokens
    function createTokens_fn(SCDatas, customerObj) {
      var promises = {};
      angular.forEach(SCDatas, function(value, productId){
        
        var stripeCustomerId          = customerObj['id'];
        var stripeConnectedAccountId  = value['stripe_user_id'];
        
        console.log("---createTokens_fn---", stripeCustomerId, stripeConnectedAccountId);
        
        var promise = StripeCharge.createToken(stripeCustomerId, stripeConnectedAccountId);
        promises[productId] = promise;
      })
      return $q.all(promises);
    };


    /**
    * [4] The charge the buyer multiple times for each $productId
    * 
      StripeInvoiceData: {
        $productId: {
          ...
        }
      }
        
    */
    function proceedCharge(SCDatas, TokenData) {

      // send update
      updateStatus('Processing your payment...');
      proceedCharges_fn(SCDatas, TokenData).then(
        function(StripeInvoiceData){
          //
          // -->
          registerPayment(StripeInvoiceData)
        },
        function(error){
          
          // ...
          console.log("REGISTRATION/error", error);
          handleError(error);
        }
      );
      

    }; // ./ proceedCharge
    
    
    // fn [4a]
    function proceedCharges_fn(SCDatas, TokenData) {
      var promises = {};
      angular.forEach(SCDatas, function(value, productId){
        if(value != null) {
          
          // define the dynamic account id and token
          var stripeConnectedAccountId  = SCDatas[productId]['stripe_user_id'];
          var stripeGeneratedToken      = TokenData[productId]['id'];
          
          // extend the header data object with dynamic values (for each productId)
          var headerDataSplit                 = headerData;
          headerDataSplit['amount']           = Number(getProductPrice(productId));
          headerDataSplit['applicationFee']   = Number(calculateApplicationFee(productId));
          headerDataSplit['productId']        = productId;
          
          console.log("**CHARGING SPLIT**", headerDataSplit);
          
          // <-- charge
          var promise = charge_fn(stripeConnectedAccountId, stripeGeneratedToken, headerDataSplit);
          promises[productId] = promise;
        };
      })
      return $q.all(promises);
    };
    
    
    // fn [4b]
    function charge_fn(stripeConnectedAccountId, stripeGeneratedToken, headerDataAdj) {
      var qCharge = $q.defer();
      StripeCharge.chargeUser(stripeConnectedAccountId, stripeGeneratedToken, headerDataAdj).then(
        function(StripeInvoiceData){
          //
          // -->
          console.log("STATUS_CODE", StripeInvoiceData.statusCode)
          if(StripeInvoiceData.statusCode == 200 || StripeInvoiceData.statusCode == undefined) { // needs to be 200 to pass. See: https://stripe.com/docs/api
            qCharge.resolve(StripeInvoiceData);
          } else {
            qCharge.reject(StripeInvoiceData);
          }
        },
        function(error){
          qCharge.reject(error);
        }
      );
      return qCharge.promise;
    };
    
    // returns the product price of the item in cents
    // takes into account the buyer fees
    function getProductPrice(productId) {
      
      var CachedTotal   = Cart.CachedTotal[productId];
      var priceNominal  = CachedTotal.price;
      
      var totalFees = 0;
      if(Cart.CachedTotal.hasOwnProperty('fees')) {
        angular.forEach(Cart.CachedTotal.fees, function(feeObj, feeId){
          var perc = feeObj.perc;
          var subFee = priceNominal * (perc/100);
          totalFees = totalFees + subFee;
        })
      };
      
      var totalPrice = ((priceNominal + totalFees)*100).toFixed(0);
      return Number(totalPrice); // amount in cents
    };
    
    // calculates the seller fees in cents
    function calculateApplicationFee(productId) {
      var CachedTotal   = Cart.CachedTotal[productId];
      var totalAppFee   = (CachedTotal.price*APPLICATION_FEE_PERC*100).toFixed(0);
      return Number(totalAppFee);
    };
      


    /**
    * [5] register the payment using multi-path updates (!enhancement)
    */
    function registerPayment(StripeInvoiceData) {

      // send update
      updateStatus('Registering the order...');

      // prepare the PATH_DATA
      var PATH_DATA_obj = createPATH_DATA(StripeInvoiceData);
      var PATH_DATA = PATH_DATA_obj.data;
      var orderId   = PATH_DATA_obj.orderId;

      console.log(PATH_DATA)

      // synchronize
      var ref = new Firebase(FBURL);
      var onComplete = function(error) {
        if (error) {
          console.log('error payment', error)
          handleError(error);
        } else {
          handleSuccess(orderId);
        }
      };
      ref.update(PATH_DATA, onComplete);

    }; // ./ registerPayment
  
  
    // fn [5]
    function createPATH_DATA(StripeInvoiceData) {
      var PATH_DATA = {};
      
      console.log(Cart.all)
      
      // Store it under one orderId
      var orderId   = OrdersManager.generateOrderId();
      
      // Invoices
      PATH_DATA["/invoices/" + AuthData.uid + "/" + orderId] = StripeInvoiceData;

      // Purchases, Orders and Update Index Manager
      angular.forEach(Cart.CachedMeta, function(productObj, productId){
        
        console.log('purchased product', productId, productObj.value.price)
        
        // register the order
        var OrderData = OrdersManager.prepareOrderData(productId, Cart, StripeInvoiceData);
        PATH_DATA["/orders/" + AuthData.uid + "/" + orderId + "/" + productId] = OrderData;

        // register purchase so buyer can comment/rate products
        PATH_DATA["/purchases/" + productId + "/" + AuthData.uid] = true;

        // update sales new
        Indexing.updateDynamicIndex(productId, 'sales_new', {sales_value_new: productObj.value.price})

      })

      return {
        data: PATH_DATA,
        orderId: orderId
      }
    };


    // ===================================================================
    //  Updates and Error Handling
    // ===================================================================

    function handleSuccess(orderId) {
      SaleObj['status'] = 'success';
      SaleObj['message'] = "Payment confirmed!";
      qPay.notify(SaleObj);
      qPay.resolve(orderId);
    };

    function handleError(error) {
      switch(error) {
        case 'ERROR_CANCEL':
          //
          SaleObj = {};
          qPay.reject(SaleObj);
          break
        case 'ERROR_UNAUTH':
          //
          SaleObj['status'] = 'error';
          SaleObj['message'] = "You need to be signed in to process this payment";

          qPay.reject(SaleObj);
          break
        default:
          //
          SaleObj['status'] = 'error';
          SaleObj['message'] = "Oops.. something went wrong";

          qPay.reject(SaleObj);
          break
      }
    };

    function updateStatus(message) {
      SaleObj['status'] = 'loading';
      SaleObj['message'] = message;
      qPay.notify(SaleObj);
    };


    return qPay.promise;
  }; // ./ self.doCheckOut $qPay
  
  
  // complementary functions
  function getDestinationAccountIds_fn(Cart) {
    var promises = {};
    angular.forEach(Cart.CachedList, function(value, productId){
      var sellerId = Cart.CachedMeta[productId].value.userId;
      var promise = StripeCharge.getStripeConnectAuth_value(sellerId);
      promises[productId] = promise;
    })
    return $q.all(promises)
  };
  
  function filterEmptyDestAccountIds_fn(SCDatas) {
    var SCDatas_Adj = SCDatas;
    angular.forEach(SCDatas, function(value, productId){
      if(value == null || value == undefined) {
        SCDatas_Adj[productId] = {
          replaced: true,
          stripe_user_id: STRIPE_OWNER_ACCOUNT_ID
        };
      }
    })
    return SCDatas_Adj;
  };


  return self;
})

.factory('StripeCharge', function($q, $http, StripeCheckout) {
  var self = this;

  /**
   * Connects with the backend (server-side) to charge the customer
   *
   * # Note on the determination of the price in prepareCurlData()
   * In this example we base the $stripeAmount on the object ProductMeta which has been
   * retrieved on the client-side. For safety reasons however, it is recommended to
   * retrieve the price from the back-end (thus the server-side). In this way the client
   * cannot write his own application and choose a price that he/she prefers
   */

  
  /**
   * Charge a part of the amount to the individual account
   */
  self.chargeUser = function(stripeConnectedAccountId, stripeGeneratedToken, headerDataSplit) {
    var qCharge = $q.defer();
    
    // prepare the parameters/variables used on the server to process the charge
    prepareCurlData_split(stripeConnectedAccountId, stripeGeneratedToken, headerDataSplit).then(
      function(curlData){
        // -->
        proceed(curlData);
      },
      function(error){
        qCharge.reject(error);
      }
    );
    // proceed -->
    // we use a simple HTTP post to send the curlData to the server and process
    // the charge
    function proceed(curlData) {
      
      // stripeConnectedAccountId == STRIPE_OWNER_ACCOUNT_ID
      // This holds true when:
      // - the seller is the owner
      // - the seller has not setup Stripe Connect
      // stripeConnectedAccountId =/= STRIPE_OWNER_ACCOUNT_ID
      // This holds truen when:
      // - the seller is not the owner
      // - the seller has setup Stripe Connect
      var stripe_url;
      if(stripeConnectedAccountId == STRIPE_OWNER_ACCOUNT_ID) {
        console.log('CHARGE/NODESTINATION/', headerDataSplit.productId)
        stripe_url = STRIPE_URL_CHARGE_NODESTINATION;
      } else {
        console.log('CHARGE/', headerDataSplit.productId)
        stripe_url = STRIPE_URL_CHARGE;
      };
      
      $http.post(stripe_url, curlData)
      .success(
        function(StripeInvoiceData){
          qCharge.resolve(StripeInvoiceData);
        }
      )
      .error(
        function(error){
          console.log(error)
          qCharge.reject(error);
        }
      );
    };

    return qCharge.promise;
  };

  // fn prepare
  function prepareCurlData_split(stripeConnectedAccountId, stripeGeneratedToken, headerDataSplit) {
    var qPrepare = $q.defer();

    // init
    var curlData = {
      stripeConnectedAccountId:   stripeConnectedAccountId,
      stripeSource:               stripeGeneratedToken,
      stripeCurrency:             "usd",
      stripeAmount:               headerDataSplit.amount,
      stripeDescription:          COMPANY_NAME + ",purchase," + headerDataSplit.productId + "," + headerDataSplit.name,
      stripeBuyerId:              headerDataSplit['buyerId'],
      stripeProductId:            headerDataSplit['productId'],
      applicationFee:             headerDataSplit.applicationFee,
    };

    // optionally, retrieve other details async here (such as profiledata of user)
    // in this exercise it has been left out
    qPrepare.resolve(curlData);
    return qPrepare.promise;
  };

  /**
   * Get a stripe token through the checkout handler
   */
  self.getStripeToken = function(headerData) {
    var qToken = $q.defer();

    var handler = StripeCheckout.configure({
        name: headerData.name,
        token: function(token, args) {
          //console.log(token.id)
        }
    })

    handler.open(headerData).then(
      function(result) {
        var stripeToken = result[0].id;
        if(stripeToken != undefined && stripeToken != null && stripeToken != "") {
            //console.log("handler success - defined")
            qToken.resolve(stripeToken);
        } else {
            //console.log("handler success - undefined")
            qToken.reject("ERROR_STRIPETOKEN_UNDEFINED");
        }
      }, function(error) {
        if(error == undefined) {
            qToken.reject("ERROR_CANCEL");
        } else {
            qToken.reject(error);
        }
      } // ./ error
    ); // ./ handler
    return qToken.promise;
  };
  
  
  /**
   * =========================================================================
   * 
   * Stripe Connect
   * 
   * =========================================================================
   */
    
  self.getStripeConnectAuth_value = function(userId) {
      var qConnect = $q.defer();
      var ref = new Firebase(FBURL);
      ref.child("stripe_connect_auth").child(userId).on("value", function(snapshot) {
          qConnect.resolve(snapshot.val());
      }, function (errorObject) {
          qConnect.reject(errorObject);
      });
      return qConnect.promise;
  };
    
    
  /**
   * Used in Authentication on the Server-Side
   */
  self.generateFBAuthToken = function(userId) {
    var qGen = $q.defer();
    $http.post(STRIPE_FIREBASE_GEN_TOKEN, {userId: userId})
    .success(
        function(fbAuthToken){
            if(fbAuthToken != null) {
                qGen.resolve(fbAuthToken);
            } else {
                qGen.reject("ERROR_NULL");
            }
        }
    )
    .error(
        function(error){
            qGen.reject(error);
        }
    );
    return qGen.promise;
  };
  
  /**
   * Storing Stripe customers
   */
  self.createCustomers = function(stripeToken) {
    var qCreate = $q.defer();
    $http.post(STRIPE_CREATE_CUSTOMER, {stripeToken: stripeToken})
    .success(
      function(response){
        
        console.log('createCustomers', response);
        
        if(response != null) {
          qCreate.resolve(response);
        } else {
          qCreate.reject("ERROR_NULL");
        }
        
      }
    )
    .error(
      function(error){
        qCreate.reject(error);
      }
    );
    return qCreate.promise;
  };
  
  
  /**
   * Create a Token from the existing customer on the platform's account
   */
  self.createToken = function(stripeCustomerId, stripeConnectedAccountId, stopNext) {
    var qCreate = $q.defer();
    $http.post(STRIPE_CREATE_TOKEN, 
    {
      stripeCustomerId: stripeCustomerId,
      stripeConnectedAccountId: stripeConnectedAccountId,
    })
    .success(
      function(responseToken){
        
        console.log('createToken', responseToken);
        
        // did it pass?
        if(responseToken != null) {
          
          // response with stripe_user_id:
          //    pass
          // response with id
          //    token only (?)
          if(responseToken.hasOwnProperty('stripe_user_id') || responseToken.hasOwnProperty('id')) {
            // ... pass
            handleSuccess(responseToken);
          } else {
            handleError("ERROR_INVALID");
          };
          
        } else {
          handleError("ERROR_NULL");
        };
        
        // fn handle success
        function handleSuccess(responseTokenFinal) {
          qCreate.resolve(responseTokenFinal);
        };
        
        // fn handle error
        function handleError(error) {
          
          if(stopNext != true) {
            console.log("WARNING! Using CUSTOM ACCOUNT ID");
            self.createToken(stripeCustomerId, STRIPE_OWNER_ACCOUNT_ID, true).then(
              function(responseTokenAdj){
                handleSuccess(responseTokenAdj);
              },
              function(error){
                qCreate.reject(error);
              }
            )
          } else {
            qCreate.reject(error);
          };
          
        };
      } // ./ success
    )
    .error(
      function(error){
        qCreate.reject(error);
      }
    );
    return qCreate.promise;
  };

  return self;
})
