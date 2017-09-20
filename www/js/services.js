/**
*  Module
*
* Smaart App All WebServices
*/
angular.module('smaart.services', ['ngCordova'])

.factory('appData', function($http, $ionicLoading, localStorageService, $q, $ionicPlatform, $cordovaSQLite){

	// $http.get('http://192.168.0.101/smaartframework.com/smaart-admin/public/api/v1/generate_survey/13?api_token=2xSLWcwJlhNNVWRQ8SUl')
	// 		.then(function(res){
	// 			console.log(res);
	// 		});

	/*$http.get('http://projects.fhts.ac.in/smaart/api/?action=import&apikey=CAX4RYDJBUKM8BSYQEZP&id=1')
			.then(function(res){
				console.log(res);
			});*/
	
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


	return {

		activate: function(){

			$ionicLoading.show({
		      template: '<ion-spinner icon="android"></ion-spinner><p>Loading user data..</p>'
		    });

			var ApiURL = 'http://sanaviz.com/api/';

			$http({

			    url: ApiURL,
			    method: 'POST',
			    data: 'action=activate&app_secret=986095dbbc971043bc97babb6939ffc1',
			    headers: {
			        'Content-Type': 'application/x-www-form-urlencoded'
			    }
			}).then(function(res){
				console.log(res);
				localStorageService.set('UsersData',res.data.users);
				var allSurveys = {};
				var index = 1;
				var dataLength = Object(res.data.surveys).length;
				angular.forEach(res.data.surveys, function(value, id){

					$ionicLoading.hide();

					$ionicLoading.show({
				      template: '<ion-spinner icon="android"></ion-spinner><p>Loading survey data..</p>'
				    });

					$http({

					    url: ApiURL,
					    method: 'POST',
					    data: 'action=import&app_id=1200020001&app_secret=986095dbbc971043bc97babb6939ffc1&id='+value.id,
					    // data: 'action=register&app_id=1200020001&app_secret=986095dbbc971043bc97babb6939ffc1&id='+value.id,
					    headers: {
					        'Content-Type': 'application/x-www-form-urlencoded'
					    }
					}).then(function(res){
						//allSurveys[value.name] = res.data;
						var nm = {};
						nm[value.name] = res.data
						allSurveys[value.id] = nm;
						localStorageService.set('SurveyData',allSurveys);
						if(index == dataLength){

							$ionicLoading.hide();
							$ionicLoading.show({
						      template: '<ion-spinner icon="android"></ion-spinner><p>Loading media..</p>'
						    });
							console.log(localStorageService.get('SurveyData'));
							// console.log(localStorageService.get('UsersData'));
							loadingMedia($ionicLoading);
						}
						index++;
					});
				});

			});
		},
	}
})

.factory('exportS', function($http, $ionicLoading, localStorageService, $q){

	//var ApiURL = 'http://sanaviz.com/api/';
	var ApiURL = 'http://master.adminpie.com/api/survey_filled_data';
	// var ApiURL = 'http://smaartframework.com/admin/public/api/v1/survey_filled_data';
	// var ApiURL = 'http://192.168.0.101/smaartframework.com/smaart-admin/public/api/v1/survey_filled_data';

	return {

		exportSurvey: function(PostData){
	           // console.log(PostData);
	           $http.defaults.headers.post['Content-Type'] = undefined;
	           return $http({
						    url: ApiURL,
						    method: 'POST',
						    data: PostData,
						})
	    },
	}

})

.factory('appActivation', function($http, $ionicLoading, localStorageService, $q){
	return {
		appActivate: function(PostData){
			$http.defaults.headers.post['Content-Type'] = undefined;
			return $http({
						    url: 'http://master.adminpie.com/api/survey_api',
						    // url: 'http://smaartframework.com/admin/public/api/v1/activateApp',
						    // url: 'http://192.168.0.101/smaartframework.com/smaart-admin/public/api/v1/activateApp',
						    method: 'POST',
						    data: PostData,
						    
						})
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
/*.factory('listSurvey', function($http, $ionicLoading, localStorageService, $q){
	return {
		listSurveys: function(PostData){
			$http.defaults.headers.post['Content-Type'] = undefined;
			return $http({
						    url: 'http://192.168.0.101/smaartframework.com/smaart-admin/public/api/v1/activateApp',
						    method: 'POST',
						    data: PostData,
						    
						})
		}


	}
})*/

