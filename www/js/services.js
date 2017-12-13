/**
*  Module
*
* Smaart App All WebServices
*/
angular.module('smaart.services', ['ngCordova'])

.factory('appData', function($http, $ionicLoading, localStorageService, $q, $ionicPlatform, $cordovaSQLite, ApiURL){

	
	
	function loadingMedia($ionicLoading){

		   // console.log(localStorageService.get('SurveyData'));
		   var SurveyData = localStorageService.get('SurveyData');
		   angular.forEach(SurveyData, function(value, key){
		   		// console.log(value);
		   		angular.forEach(value, function(sValue, sKey){

		   			angular.forEach(sValue, function(lValue, lKey){

		   				// console.log(lValue);
		   				if(lValue.media != 'null'){

			                angular.forEach(lValue.media, function(mediaLink, mediaKey){

			                    var fileSplited = mediaLink.split('/');
			                    var fileLength = fileSplited.length;
			                    var fileName = fileSplited[fileLength-1];

			                    console.log(fileName);
			                    console.log(mediaLink);

			                    var downloadUrl = mediaLink;
			                    var relativeFilePath = fileName;  // using an absolute path also does not work
			                    document.addEventListener("deviceready", function() {
			                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
			                       fileSystem.root.getDirectory("SmaartMedia", {create: true, exclusive: false});
			                       var fileTransfer = new FileTransfer();
			                       fileTransfer.download(
			                          downloadUrl,

			                          // The correct path!
			                          fileSystem.root.toURL() + 'SmaartMedia/' + relativeFilePath,

			                          function (entry) {
			                             /*alert("Success");*/
			                          },
			                          function (error) {
			                             alert("Error during download. Code = " + error.code);
			                          }
			                       );
			                    });
			                  }, false);
			                });
			            }
		   			})
		   		})
		   });

	     $ionicLoading.hide();
	     $ionicLoading.show({
		      template: 'App Activated Successfully!',
		      noBackdrop: false,
		      duration: 2000
	     });
	}

	return {};
	
})

.factory('exportS', function($http, $ionicLoading, localStorageService, $q, ApiURL){

	return {

		exportSurvey: function(PostData){
	           // console.log(PostData);
	           $http.defaults.headers.post['Content-Type'] = undefined;
	           return $http({
						    url: ApiURL+'survey_filled_data',
						    method: 'POST',
						    data: PostData,
						})
	    },
	}

})

.factory('users', function($http, $ionicLoading, localStorageService, $q, ApiURL){

    return {

        getUsers: function(PostData){
               // console.log(PostData);
               $http.defaults.headers.post['Content-Type'] = undefined;
               return $http({
                            url: ApiURL+'organization/users',
                            method: 'POST',
                            data: PostData,
                            timeout: 5000
                        })
        },
    }

})

.factory('appActivation', function($http, $ionicLoading, localStorageService, $q, ApiURL){
	return {
		appActivate: function(PostData){
			$http.defaults.headers.post['Content-Type'] = undefined;
			return $http({
						    url: ApiURL+'survey_api',
						    method: 'POST',
						    data: PostData,
						    timeout: 5000
						});
		}


	}
}).factory('dbservice', function($ionicPlatform, $cordovaSQLite){
	return {
		runQuery: function(query,dataParams,successCb,errorCb){
    
		    $ionicPlatform.ready(function() {     
		        $cordovaSQLite.execute(db, query,dataParams).then(function(res) {
		          successCb(res);
		        }, function (err) {
		          errorCb(err);
		        });
		    }.bind(this));
		}
	}
})
