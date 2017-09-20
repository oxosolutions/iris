'use strict'

angular.module('smaart.dashboard', ['ngCordova'])
.filter('htmlToPlaintext', function() {
    return function(text) {
      	return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
    };
  })
.controller('dashboardCtrl', function($rootScope, dbservice, $scope, $ionicLoading, localStorageService,$ionicModal, $ionicPopup, $ionicPopover, $state, $ionicActionSheet, $timeout, $ionicBackdrop, appData){
	if(localStorageService.get('userId') == undefined || localStorageService.get('userId') == null){
        $state.go('login');
    }

    /*$rootScope.$on('$stateChangeStart', function (state) {
      console.log(state);
    });
   */
  
  

	var userData = localStorageService.get('UsersData');
	$scope.userdata = userData;
	$scope.name = localStorageService.get('userName');
	var allSurveys = localStorageService.get('SurveyData');
	var buttonsArray = [];

	var getSurveys = 'SELECT * FROM survey_data';
	dbservice.runQuery(getSurveys,[],function(res){

    var row = {};
    var survey_ids = [];
		var countSurveyQuestion = {};
      	for(var i=0; i < res.rows.length; i++) {
          var tempData = res.rows.item(i);
          tempData['questions'] = 0;
          row[i] = tempData;
          // console.log(res.rows.item(i))
          survey_ids.push(res.rows.item(i).survey_id);
          	
      	}
        var getSurveysCount = 'SELECT count(id) as count, survey_id FROM survey_questions where survey_id in ('+survey_ids+') group by survey_id';
        dbservice.runQuery(getSurveysCount,[],function(count){
          angular.forEach(row, function(value, key){
            for(var j = 0; j < count.rows.length; j++){
                // console.log(cVal);
                if(count.rows.item(j).survey_id == value.survey_id){
                  row[key]['questions'] = count.rows.item(j).count;
                }
            }
               
          });
         // console.log(row);
          $scope.surveyList = row;
          //console.log(count.rows);
        });
        // console.log(survey_ids);
	});



	/*angular.forEach(allSurveys, function(value, key){
		// var text = value.name;
		var text = {text: value.name};
		buttonsArray.push(text);
	});*/

	$scope.completedSurvey = 0;
	$scope.inCompletedSurvey = 0;


	

	$ionicModal.fromTemplateUrl('suvlist.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.modal = modal;
	  });
	  $scope.openModal = function() {
	    $scope.modal.show();
	  };
	  $scope.closeModal = function() {
	    $scope.modal.hide();
	  };
	  // Cleanup the modal when we're done with it!
	  $scope.$on('$destroy', function() {
	    $scope.modal.remove();
	  });
	  // Execute action on hide modal
	  $scope.$on('modal.hidden', function() {
	    // Execute action
	  });
	  // Execute action on remove modal
	  $scope.$on('modal.removed', function() {
	    // Execute action
	  });

  	
  	$scope.startSurvey = function(surveyid){
  		localStorageService.set('finishedGroups',undefined);
  		localStorageService.set('completedGroups',undefined);
  		localStorageService.set('ContinueKey',undefined);
  		localStorageService.set('RuningSurvey',null);
  		localStorageService.set('record_id',null);
  		window.currentTimeStamp = null;
  		window.surveyStatus = 'new';
  		$state.go('app.surveyGroup',{id:surveyid});
  	}
	
    /*$scope.goToSurvey = function($event){

    	 var myPopup = $ionicPopup.show({
		    templateUrl: 'templates/suvList.html',
		    title: 'Select Survey',
		    // subTitle: 'Please use normal things',
		    scope: $scope,
		    buttons: [
		      { text: 'Cancel' },
		      // {
		      //   text: '<b>Save</b>',
		      //   type: 'button-positive',
		      //   onTap: function(e) {
		      //     if (!$scope.data.wifi) {
		      //       //don't allow the user to close unless he enters wifi password
		      //       e.preventDefault();
		      //     } else {
		      //       return $scope.data.wifi;
		      //     }
		      //   }
		      // }
		    ]
		  });*/

    	 $scope.goToSurvey = function() {
    	 	
     /* $scope.data = {};

      // An elaborate, custom popup
      var myPopup = $ionicPopup.show({
        templateUrl: 'templates/activation-dialog.html',
        title: 'Enter Activation Code',
        subTitle: 'Contact Admin for this code',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Activate</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.wifi) {
                $ionicLoading.show({
                  template: 'Please fill answer!',
                  noBackdrop: false,
                  duration: 1000
                });
                e.preventDefault();
              } else {
                var formData = new FormData;
                formData.append('activation_key',$scope.data.wifi);
                $ionicLoading.show({
                      template: '<ion-spinner class="spinner-energized"></ion-spinner>',
                      noBackdrop: false
                     
                    });
                appActivation.appActivate(formData).then(function(res){
                    $ionicLoading.hide();
                    if(res.data.status == 'error'){
                      $ionicLoading.show({
                        template: 'invalid Activation code',
                        noBackdrop: false,
                        duration: 1000
                      });
                    }else{
                      localStorageService.set('UsersData',res.data.users);
                      localStorageService.set('SurveyData',res.data.surveys);
                      localStorageService.set('GroupsData',res.data.groups);
                      $ionicLoading.show({
                        template: 'Activated Successfully',
                        noBackdrop: false,
                        duration: 1000
                      });
                      $state.go('login');
                    }
                    
                });
                
              }
            }
          }
        ]
      });*/




	  //    var hideSheet = $ionicActionSheet.show({
	  //    buttons: buttonsArray,
	  //    titleText: 'Select Survey',
	  //    cancelText: 'Cancel',
	  //    cancel: function() {
	  //       },
	  //    buttonClicked: function(index, data) {
	  //    	var SurveyData = getSurveyData($state, localStorageService, index+1);
	  //    	console.log(SurveyData);
	  //    	if(SurveyData.length == 0){

			// 	$ionicLoading.show({
			// 		      template: 'Survey data empty!',
			// 		      noBackdrop: false,
			// 		      duration: 2000
			// 		    });
			// 	return true;
			// }else{

			// 	$state.go('app.survey',{'surveyId': index+1});
			// }
	       		
	  //    }
	  //  });

    }
}).controller('surveyGroup',function($scope, $ionicLoading, localStorageService, $state, appData, $ionicHistory, $ionicPlatform, dbservice){
    	$ionicPlatform.registerBackButtonAction(function (event) {
		  if($state.current.name=="app.surveyGroup"){
		    $state.go('app.dashboard');
		  }else {
		    navigator.app.backHistory();
		  }
		}, 100);
    	
		var groupsData = '';

		var getGroups = 'SELECT * FROM survey_sections WHERE survey_id = ?';
		dbservice.runQuery(getGroups, [$state.params.id], function(res){
			var row = {};
      var sectionsData = [];
	      	for(var i=0; i<res.rows.length; i++) {
	          	row[i] = res.rows.item(i);
              sectionsData.push(res.rows.item(i));
	      	}
	      	$scope.groupList = row;
          localStorageService.set('sections_data',sectionsData);
	      	// console.log(row);
		});


    	/*var selectedSurveyGroup = $.grep(groupsData, function(value){
    			return value.survey_id == $state.params.id;
    	});
    	$scope.groupList = selectedSurveyGroup;*/
    	
    	
    	//console.log(selectedSurveyGroup);
    	$scope.startSurvey = function(surveyid, groupid){
    		var Query = 'SELECT completed_groups FROM survey_result_'+$state.params.id+' WHERE id = ?';
    		dbservice.runQuery(Query,[localStorageService.get('record_id')],function(res) {
    			if(res.rows.length != 0){
    				if($.inArray(groupid, JSON.parse(res.rows.item(0).completed_groups)) !== -1){
	    				$ionicLoading.show({
		                  template: 'Section already filled!',
		                  noBackdrop: false,
		                  duration: 2000
		                });
		    			return false;
	    			}else{
	    				$ionicHistory.clearCache().then(function(){
		    				$state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
		    			});
	    			}
    			}else{
    				$ionicHistory.clearCache().then(function(){
	    				$state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
	    			});
    			}
            }, function (err) {
              // console.log(err);
              $state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
            });
    	}
    	
    	$scope.checkGroupCompleted = function(groupID){
    		// console.log(localStorageService.get('completedGroups'))
    		if(localStorageService.get('completedGroups') != undefined){
    			var completedGroups = localStorageService.get('completedGroups');
    			if($.inArray(groupID, completedGroups) !== -1){
    				return true;
    			}else{
    				return false;
    			}
    		}
    		
    	}
}).controller('about',function($scope){

	//about
});