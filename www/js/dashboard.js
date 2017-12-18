'use strict'

angular.module('smaart.dashboard', ['ngCordova'])
.filter('htmlToPlaintext', function() {
    return function(text) {
      	return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
    };
  }).directive('dynamic', function ($compile) {
		  return {
		    restrict: 'A',
		    replace: true,
		    link: function (scope, ele, attrs) {
		      scope.$watch(attrs.dynamic, function(html) {
		        ele.html(html);
		        $compile(ele.contents())(scope);
		      });
		    }
		  };
		})
.controller('dashboardCtrl', function($rootScope, $compile, dbservice, $scope, $ionicLoading, localStorageService,$ionicModal, $ionicPopup, $ionicPopover, $state, $ionicActionSheet, $timeout, $ionicBackdrop, appData, $ionicHistory){
	if(localStorageService.get('userId') == undefined || localStorageService.get('userId') == null){
        $state.go('login');
    }
    var settings = localStorageService.get('settings');
    try{
        $scope.description = settings['android_application_description'];
        $scope.link_to_start_survey_text = settings['link_to_start_survey_text'];
        $scope.start_survey_button_text = settings['start_survey_button_text'];
        $scope.link_to_manage_survey_text = settings['link_to_manage_survey_text'];
        $scope.link_to_sync_survey_text = settings['link_to_sync_survey_text'];
        $scope.link_to_update_app_text = settings['link_to_update_app_text'];
        $scope.android_application_footer_text = settings['android_application_footer_text'];
        $scope.link_to_dashboard = settings['link_to_dashboard'];
        $scope.link_to_start_survey_text = settings['link_to_start_survey_text'];
        $scope.manage_survey_button_text = settings['manage_survey_button_text'];
        $scope.link_to_sync_survey_text = settings['link_to_sync_survey_text'];
        $scope.link_to_update_app_text = settings['link_to_update_app_text'];
        $scope.sidenav_header_text = settings['sidenav_header_text'];
        $scope.about_page_content = settings['about_page_content'];
        $scope.help_page_content = settings['help_page_content'];
        $scope.section_submitted_text = settings['section_submitted_text'];
        $scope.section_discarded_text = settings['section_discarded_text'];
        $scope.page = {
            title: settings['android_application_title']
        }
    }catch(e){
        console.warn(e);
    }
    
    
   $scope.openList =function() {
   		$state.go('app.ListSurvey');
   }
  
  

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
            }, function(error){
                console.warn(error);
            });
        // console.log(survey_ids);
	}, function(error){
        console.warn(error);
    });



	/*angular.forEach(allSurveys, function(value, key){
		// var text = value.name;
		var text = {text: value.name};
		buttonsArray.push(text);
	});*/

	$scope.completedSurvey = 0;
	$scope.inCompletedSurvey = 0;


	

	/*$ionicModal.fromTemplateUrl('suvlist.html', {
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
	  };*/
	  // Cleanup the modal when we're done with it!
	  /*$scope.$on('$destroy', function() {
	    $scope.modal.remove();
	  });*/
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
  		localStorageService.set('uniqueSerial',null);
        localStorageService.set('discarded_groups',null);
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
		}, function(error){
            console.warn(error);
        });

		/*########################### DON'T DELETE THIS CODE, THIS IS BACKUP CODE BEFORE SET HARD CODE IN APP #########################*/
    	
    	/*$scope.startSurvey = function(surveyid, groupid){
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
              $state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
            });
    	}*/

    	$scope.startSurvey = function(surveyid, groupid){
    		var groupsArray = {};
    		groupsArray[2] = 5;
    		groupsArray[5] = 19;
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
	    				if(groupsArray[surveyid] != undefined){
		    				if(groupid != groupsArray[surveyid]){
		    					if($.inArray(groupsArray[surveyid], JSON.parse(res.rows.item(0).completed_groups)) !== 0){
			    					$ionicLoading.show({
					                  template: 'Please fill Personal Identification First',
					                  noBackdrop: false,
					                  duration: 2000
					                });
					                return false;
			    				}
		    				}
		    			}
		    			//localStorageService.set('uniqueSerial',null);
                        localStorageService.set('filled_questions',null);
	    				$ionicHistory.clearCache().then(function(){
		    				$state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
		    			});
	    			}
    			}else{
    				if(groupsArray[surveyid] != undefined){
    					if(groupid != groupsArray[surveyid]){
	    					$ionicLoading.show({
			                  template: 'Please fill Personal Identification First',
			                  noBackdrop: false,
			                  duration: 2000
			                });
			                return false;
	    				}
    				}
    				//localStorageService.set('uniqueSerial',null);
                    localStorageService.set('filled_questions',null);
    				$ionicHistory.clearCache().then(function(){
	    				$state.go('app.survey',{surveyId:surveyid,groupId:groupid,QuestId:''});
	    			});
    			}
            }, function (err) {
            	//localStorageService.set('uniqueSerial',null);
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

        $scope.checkGroupDiscarded = function(groupID){
            if(localStorageService.get('discarded_groups') != undefined){
                var discarded_groups = localStorageService.get('discarded_groups');
                if($.inArray(groupID, discarded_groups) !== -1){
                    return true;
                }else{
                    return false;
                }
            }
        }
}).controller('about',function($scope){

	//about
});