angular.module('starter.services-utils', [])

/**
 * All other complementary functions
 */
.factory('Utils', function($ionicLoading, $timeout, $q) {
  var self = this;

  //
  // ionic loading notification
  self.showMessage = function(message, optHideTime) {
    if(optHideTime != undefined && optHideTime > 100) {
      // error message or notification (no spinner)
      $ionicLoading.show({
          template: message
      });
      $timeout(function(){
          $ionicLoading.hide();
      }, optHideTime)
    } else {
      // loading (spinner)
      $ionicLoading.show({
          template: message + '<br><br>' + '<ion-spinner class="spinner-modal"></ion-spinner>'
      });
      
      $timeout(function(){    // close if it takes longer than 10 seconds
          $ionicLoading.hide();
          //self.showMessage("Timed out", 2000);
      }, 20000)
      
    }
  };

  self.arrayValuesAndKeys = function(targetObject) {
    return Object.keys(targetObject).map(
      function (key) {
        return {
          key: key,
          value: targetObject[key]
        }
      }
    );
  };
  
  self.arrayValuesAndKeysProducts = function(targetObject) {
        return Object.keys(targetObject).map(
            function (key) {
                if(targetObject[key] != null) {
                    return {
                        key: key, 
                        value: targetObject[key].meta,
                        index: targetObject[key].index
                    }
                }
            }
        );
    };

  self.arrayValues = function(targetObject) {
    return Object.keys(targetObject).map(
      function (key) {
        return targetObject[key]
      }
    );
  };

  self.arrayKeys = function(targetObject) {
    return Object.keys(targetObject).map(
      function (key) {
        return key;
      }
    );
  };

  self.sortArray = function(targetObject, sortMethod, sortProperty) {
    /**
    var sortProperty = sortOptions.property.toLowerCase();
    if(sortProperty == 'date') {
      sortProperty = "timestamp_creation";
    }
    */
    switch(sortMethod){
      case 'asc':
        //
        return targetObject.sort(compareAsc);
      break
      case 'desc':
        //
        return targetObject.sort(compareDesc);
      break
    }
    function compareAsc(a,b) {
        a = a['index'];
        b = b['index'];
        //console.log(a[sortProperty], b[sortProperty], a[sortProperty]-b[sortProperty])
        if (a[sortProperty] < b[sortProperty])
            return -1;
        else if (a[sortProperty] > b[sortProperty])
            return 1;
        else
            return 0;
    };
    function compareDesc(a,b) {
        a = a['index'];
        b = b['index'];
        if (a[sortProperty] > b[sortProperty])
            return -1;
        else if (a[sortProperty] < b[sortProperty])
            return 1;
        else
            return 0;
    };
  };
  
  // used to determine the number of slides
  self.prepareSlideRepeat = function(ProductMeta) {
    var nbSlides = Math.ceil(ProductMeta.length/2);
    var indexArray = [];
    for(var i=0; i<nbSlides; i++) {
      indexArray[i] = {
        iter: i
      };
    };
    return indexArray;
  };

  self.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  self.formatTimestamp = function(timestamp) {
    var date = new Date(timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  };
  
  self.getCurrentPrice = function(currentPrice, discountPerc) {
    if(currentPrice !=undefined) {
      if(discountPerc) {
        return (currentPrice - (currentPrice * discountPerc/100)).toFixed(2)
      } else {
        return (currentPrice).toFixed(2);
      }
    }
  };
  
  self.getOldPrice = function(currentPrice, discountPerc) {
    if(currentPrice !=undefined) {
      if(discountPerc) {
        return (currentPrice).toFixed(2)
      }
    }
  };
  
  self.isInArray = function(value, array) {
    return array.indexOf(value) > -1;
  };
  
  self.findIndexInArray = function(value, array) {
    console.log(array.length)
    var iter = null;
    for (var i=0; i<array.length; i++) {
      console.log(array[i], value)
      if(array[i] === value) {
        iter = i;
        return i;
      }
    }
    return iter;
  };
  
  
  self.timeSince = function(unix_timestamp) {
    
    var date = new Date(unix_timestamp);
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    
    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  };
  
  self.genRandomName = function() {
    return 'smart-user' + Math.floor(Math.random()*10000000000);
  };
  
  
  self.alphaNumeric = function(input){
      if(input != undefined && input != null) {
          return input.replace(/[^a-z0-9]/gi,'_').toLowerCase().trim();
      } else {
          return "nothing";
      }
  };
    
  self.alphaNumericWide = function(input){
      if(input != undefined && input != null) {
          return input.replace(/[^a-z0-9]/gi,' ').toLowerCase().trim();
      } else {
          return "nothing";
      }
  };
  
  // resize base64 strings based on their target w and h
  // use an offscreen canvas for enhanced rendering
  self.resizeImageSoft = function(canvasName, base64, targetWidth, targetHeight) {
      
      var qResize = $q.defer();
      
      var img = new Image;
      img.onload = resizeImage;
      //img.src = base64ToDataUri(base64);
      img.src = base64;
      
      function resizeImage() {
          imageToDataUri(this, targetWidth, targetHeight);
      }
      
      function base64ToDataUri(base64) {
          return 'data:image/png;base64,' + base64;
      }
      
      function imageToDataUri(img, targetWidth, targetHeight) {

          var canvas = document.getElementById(canvasName);;
          var ctx = canvas.getContext('2d');
          
          var dd = scaleDimensions(img.width, img.height, targetWidth, targetHeight);
          
          /**
           * no rescaling
          canvas.width = img.width = dd.iw;
          canvas.height = img.height = dd.ih;
          */
          canvas.width = targetHeight;
          canvas.height = targetHeight;
          
          console.log(img.height, img.width)
          console.log(targetHeight, targetHeight)
          
          var perc14 = Math.floor(img.width/4);
          console.log(perc14)
          
          ctx.drawImage(img, perc14, 0, targetHeight, img.height, 0, 0, targetHeight, targetHeight);

          //ctx.drawImage(img, 0, 0, targetHeight, targetHeight);
          
          qResize.resolve(canvas.toDataURL("image/jpeg", 1));
          
      }
      
      function scaleDimensions(imgWidth, imgHeight, targetWidth, targetHeight) {
          var scaleFactor = 1;
          var dd = {iw: imgWidth, ih: imgHeight};
          if (imgWidth < targetWidth && imgHeight < targetHeight) {
              scaleFactor = 1; // do not scale
          } else {
              if (imgWidth > imgHeight){
                  scaleFactor = targetWidth/imgWidth;
              } else {
                  scaleFactor = targetHeight/imgHeight;
              }
          }
          dd["iw"] = Math.floor(imgWidth*scaleFactor);
          dd["ih"] = Math.floor(imgHeight*scaleFactor);
          
          return dd;
      }
      
      return qResize.promise;
  };
  
  self.formatSearchResults = function(ProductsMeta) {
    // prepare
    var ProductsMetaTemp = {};
    angular.forEach(ProductsMeta, function(value, keyQuery){
        angular.forEach(ProductsMeta[keyQuery], function(value, productId){
            if(value != null) {
                ProductsMetaTemp[productId] = value;
            }
        })
    })
    // process
    if(Object.keys(ProductsMetaTemp).length == 0) {
      return null
    } else {
      return ProductsMetaTemp;
    }
  };
  
  // return arrays
  self.formatTagsString = function(tagsString) {
    return tagsString.split(',');
  };
  
  self.formatComments = function(commentsObj) {
    var formattedComments = [];
    var tempObj = {};
    if(commentsObj != undefined && commentsObj != null) {
        Object.keys(commentsObj).map(
            function (userId) {
                Object.keys(commentsObj[userId]).map(
                    function(commentId){
                        tempObj = commentsObj[userId][commentId];
                        tempObj["userId"] = userId;
                        formattedComments.push(tempObj);
                    }
                )
            }
        );
    }
    return formattedComments;
  };
  
  // pseudo directive to return the nb of stars
  self.returnStars = function(rating) {
    var starsObj = [];
    for (var i = 0; i<5; i++){
      if(i+1 <= rating) {
        starsObj[i] = {
          icon: "ion-ios-star",
          color: "star-active"
        }
      } else {
        starsObj[i] = {
          icon: "ion-ios-star-outline",
          color: "star-inactive"
        }
      }
    };
    // if it has decimals, then between x.25 and x.75 it is a half
    var decimal = rating - Math.floor(rating);
    if (decimal > 0.25 && decimal < 0.75) {
      starsObj[Math.floor(rating)] = {
        icon: "ion-ios-star-half",
        color: "star-active"
      }
    };
    return starsObj;
  };


  return self;
})
