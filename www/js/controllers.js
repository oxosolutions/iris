'use strict'

angular.module('smaart.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, localStorageService, $ionicLoading) {

    $scope.logout = function(){

      $ionicLoading.show({
        template: '<ion-spinner icon="android"></ion-spinner>',
        noBackdrop: false
      });

      localStorageService.set('userDet',null);
      localStorageService.set('userId',null);
      $state.go('login');
      $ionicLoading.hide();
    }

    $scope.delete = function(){

        localStorageService.set('startStamp','');
        localStorageService.set('SurveyList','');
        localStorageService.set('CurrentSurveyNameID','');
        $ionicLoading.show({
          template: 'Data Deleted Successfully!!',
          noBackdrop: false,
          duration: 1000
        });
    }

    
}).controller('LoginCtrl', function($scope, $ionicLoading, localStorageService, $state, appData, $ionicNavBarDelegate, dbservice){

    $ionicNavBarDelegate.showBackButton(false);

    if(localStorageService.get('ActivationCode') == null){

        //appData.activate();
        $state.go('index');
    }else if(localStorageService.get('userId') != undefined || localStorageService.get('userId') != null){
        $state.go('app.dashboard');
    }

    $scope.data = {email:'', password: ''};
    $scope.doLogin = function(){
        $ionicLoading.show({
              	template: '<ion-spinner icon="android"></ion-spinner>',
              	noBackdrop: false
            });
        var UserEmail = $scope.data.email.trim();
        var UserPass = $scope.data.password.trim();
        
        var errorStatus = false;
        
        if(UserEmail == ''){

            jQuery('input[name=email]').addClass('loginErr');
            errorStatus = true;
        }

        if(UserPass == ''){

            jQuery('input[name=password]').addClass('loginErr');
            errorStatus = true;
        }
        
        if(errorStatus == false){
            jQuery('input[name=password]').removeClass('loginErr');
            jQuery('input[name=email]').removeClass('loginErr');
            $ionicLoading.show({
              template: '<ion-spinner icon="android"></ion-spinner>',
              noBackdrop: false
            });
            
            var checkLogin = 'SELECT * FROM users WHERE email = ? and app_password = ?';
            dbservice.runQuery(checkLogin,[UserEmail, UserPass], function(res){
                if(res.rows.length == 1){
                  var row = {};
                  for(var i=0; i<res.rows.length; i++) {
                      row[i] = res.rows.item(i)
                  } 
                  localStorageService.set('userId',row[0].id);
                  localStorageService.set('userName',row[0].name);
                  localStorageService.set('userRole',row[0].user_role);
                  $ionicLoading.hide();
                  $state.go('app.dashboard');
                  return true;
                }else{
                  $ionicLoading.show({
                    template: 'Wrong user details!',
                    noBackdrop: false, 
                    duration: 2000
                  });
                }
            });            
        }else{

            $ionicLoading.hide();
        }
    }
}).controller('RegisterCtrl',function($scope, $ionicLoading, localStorageService, $state, appData){

    
}).controller('surveyGroupCtrl',function($scope, $ionicLoading, localStorageService, $state, appData){

    
}).controller('IndexCtrl',function($scope,$state,$ionicPopup, $timeout,appActivation,$ionicLoading,localStorageService, dbservice){


    if(localStorageService.get('ActivationCode') != null){
        $state.go('login');
    }
   
    $scope.Activate = function() {
      $scope.data = {};
      console.log('Button Click');
      var index = 1;
      // An elaborate, custom popup
      $ionicPopup.show({
        templateUrl: 'templates/activation-dialog.html',
        title: 'Enter Activation Code',
        subTitle: 'Contact Admin for this code',
        scope: $scope,
        buttons: [
          { text: 'Cancel', onTap: function(e) { return true; } },
          {
            text: '<b>Activate</b>',
            type: 'button-positive',
            onTap: function(e) {
              if(index > 1){
                  return false;
              }
              index++;
              if (!$scope.data.wifi) {
                $ionicLoading.show({
                  template: 'Please fill code!',
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
                    if(res.data.status == 'error'){
                      $ionicLoading.show({
                        template: 'invalid Activation code',
                        noBackdrop: false,
                        duration: 1000
                      });
                    }else{
                      var questionsColumn = '';
                      var insertQuestionMark = '';
                      var insertColumnsName = '';
                      var questionsList = res.data.questions;
                      var users = res.data.users;
                      var surveys = res.data.surveys;
                      var surveySections = res.data.groups;

                      var dropArray = [
                            'DROP TABLE IF EXISTS survey_data',
                            'DROP TABLE IF EXISTS survey_questions',
                            'DROP TABLE IF EXISTS survey_sections',
                            'DROP TABLE IF EXISTS users',
                        ];
                      angular.forEach(dropArray, function(val,key){
                          dbservice.runQuery(val, [], function(res){
                              console.log(val+' table dropped!');
                          }, function(err){
                              console.log(err);
                          });
                      });

                      angular.forEach(res.data.questions[0], function(value, key){
                          if(key != 'created_at' && key != 'updated_at' && key != 'deleted_at'){
                              questionsColumn += key+' text, ';
                              insertQuestionMark += '?,';
                              insertColumnsName += key+', ';
                          }
                      });

                      questionsColumn = questionsColumn.replace(/,\s*$/, "");
                      insertQuestionMark = insertQuestionMark.replace(/,\s*$/, "");
                      insertColumnsName = insertColumnsName.replace(/,\s*$/, "");

                      //create survey results table
                      var surveyQuestions = '';
                      angular.forEach(surveys, function(value, key) {
	                      	surveyQuestions = $.grep(questionsList,function(grepVal){
	                      		return grepVal.survey_id == value.id;
	                      	});
	                      	var surveyResulColumns = '';
	                      	angular.forEach(surveyQuestions, function(val){
	                        	surveyResulColumns += val.question_key+ ' text, ';
	                      	});
	                      	var Query = 'DROP TABLE IF EXISTS survey_result_'+value.id;
	                      	dbservice.runQuery(Query,[],function(res) {
	                            var Query = 'CREATE TABLE IF NOT EXISTS survey_result_'+value.id+'(id integer primary key,'+surveyResulColumns+' ip_address text, survey_started_on text, survey_completed_on text, survey_submitted_by text, survey_submitted_from text, mac_address text, imei text, unique_id text, device_detail text, created_by text, created_at text, last_field_id integer, last_group_id integer, completed_groups text, survey_status text, incomplete_name text, survey_sync_status text)'
	                            dbservice.runQuery(Query,[],function(res) {
	                            	//console.log(res);
	                            },function(error){
	                            	console.log(error);
	                            });
	                      	});
                      });
						//create survey table results end
						
						//create user table if not exists
						var createUserTable = 'CREATE TABLE IF NOT EXISTS users(id integer primary key, name text, email text, api_token text, created_at text, updated_at text, role_id integer, organization_id integer, approved integer, app_password text)';
						dbservice.runQuery(createUserTable,[],function(userResp){
							angular.forEach(users, function(v,k){
								var insertUser = 'INSERT INTO users(name, email, api_token, created_at, updated_at, role_id, organization_id, approved, app_password) VALUES(?,?,?,?,?,?,?,?,?)';
                                    dbservice.runQuery(insertUser,[
                                    v.name,v.email,v.api_token,v.created_at,v.updated_at,v.role_id,v.organization_id,v.approved,v.app_password], function(res){

									},function(error){
										console.log(error);
									});
							});
						});
						//end user table create
						
						//create question table table if not exists
							var createQuestionTable = 'CREATE TABLE IF NOT EXISTS survey_questions(id integer primary key,'+questionsColumn+')';
							dbservice.runQuery(createQuestionTable,[],function(res){
								angular.forEach(questionsList, function(question, k){
									var dataArray = [];
                                      angular.forEach(question, function(val, key){
                                          if(key != 'created_at' && key != 'updated_at' && key != 'deleted_at'){
                                              if(key == 'answers'){
                                                dataArray.push(JSON.stringify(val));
                                              }else if(key == 'fields'){
                                              	dataArray.push(JSON.stringify(val));
                                              }else{
                                                try{
                                                  dataArray.push(val.toString());
                                                }catch(e){
                                                  dataArray.push(val);
                                                }
                                              }
                                          }
                                      });
                                      //console.log(insertColumnsName);
                                      // console.log(dataArray);
                                      //console.log(insertQuestionMark);
                                      var insertQuestion = 'INSERT INTO survey_questions('+insertColumnsName+') VALUES('+insertQuestionMark+')';
										dbservice.runQuery(insertQuestion,dataArray, function(res){

										},function(error){
											console.log(error);
										});
								});
							},function(error){
								console.log(error);
							});
						//end question table create
						
						//create survey data 
							var createSurveyDatatable = 'CREATE TABLE IF NOT EXISTS survey_data(id integer primary key , survey_id integer, survey_table text, name text, created_by integer, description text, status integer)';
                            dbservice.runQuery(createSurveyDatatable,[],function(res){
	                        	angular.forEach(surveys, function(val, key){
                                    var insertSurveyData = 'INSERT INTO survey_data(survey_id, survey_table, name, created_by, description, status) VALUES(?,?,?,?,?,?)';
                                    dbservice.runQuery(insertSurveyData,[val.id, val.survey_table, val.name, val.created_by, val.description, val.status], function(res){

                                      },function (error) {
                                      	console.log(error);
                                      });
                                });
                            },function (error) {
                            	console.log(error);
                            });	
                        //end create survey data
                        
                        //create section
                       		var createSectionsTable = 'CREATE TABLE IF NOT EXISTS survey_sections(id integer primary key, group_id integer, survey_id integer, title text, description text, group_order integer)';
							dbservice.runQuery(createSectionsTable, [], function(res){
								angular.forEach(surveySections, function(val, key){
                                    var insertSectionsData = 'INSERT INTO survey_sections(group_id, survey_id, title, description, group_order) VALUES(?,?,?,?,?)';
                                    dbservice.runQuery(insertSectionsData,[parseInt(val.id), parseInt(val.survey_id), val.title, val.description, val.group_order], function(res){
										
									},function(error){
										console.log(error);
									});
								});
							},function(error){
								console.log(error);
							});
                        //end sections



                      //localStorageService.set('UsersData',res.data.users);
                      //localStorageService.set('SurveyData',res.data.surveys);
                      //localStorageService.set('GroupsData',res.data.groups);
                      //localStorageService.set('QuestionData',res.data.questions);
                      localStorageService.set('ActivationCode',$scope.data.wifi);
                      //localStorageService.set('SurveyMedia',res.data.media);

                      if(res.data.media != 'null'){

                        angular.forEach(res.data.media, function(mediaLink, mediaKey){

                            var fileSplited = mediaLink.split('/');
                            var fileLength = fileSplited.length;
                            var fileName = fileSplited[fileLength-1];

                            // console.log(fileName);
                            // console.log(mediaLink);

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

                      $ionicLoading.hide();
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
      });
     };

});

//function crea

