'use strict'

angular.module('smaart.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, localStorageService, $ionicLoading, dbservice, exportS, $ionicPlatform) {

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

    setExportInterval();
    var exportInterval;
    function setExportInterval(){
        exportInterval = setInterval(startInterval,1200000);
    }
    function startInterval(){
        exportSurveyRecords();
    }

    function exportSurveyRecords(){
        clearInterval(exportInterval);
        var getAllSurveys = 'SELECT * FROM survey_data';
        dbservice.runQuery(getAllSurveys, [],(res)=>{
            var surveyCount = 0;
            exportOneByOne(surveyCount,res);
            function exportOneByOne(surveyCount,res){
                if(surveyCount < res.rows.length){
                    var getSurveyResults = 'SELECT * FROM survey_result_'+res.rows.item(surveyCount)['survey_id'];
                    dbservice.runQuery(getSurveyResults,[],(response)=>{
                        if(response.rows.length != 0){
                            var row = {};
                            for(var i=0; i<response.rows.length; i++) {
                                 row[i] = res.rows.item(i);
                            }
                            var formData = new FormData;
                            formData.append('survey_data',JSON.stringify(row));
                            formData.append('survey_id',res.rows.item(surveyCount)['survey_id']);
                            formData.append('activation_code',localStorageService.get('ActivationCode'));
                            formData.append('lat_long',JSON.stringify({lat: window.lat, long: window.long}));
                            formData.append('lat_long',JSON.stringify({lat: window.lat, long: window.long}));
                            try{
                                cordova.getAppVersion(function(version) {
                                    formData.append('app_version',version);
                                });
                            }catch(e){
                                formData.append('app_version','Unable to get app version');
                            }
                            $ionicPlatform.ready(function() {
                                if(window.Connection) {
                                    if(navigator.connection.type != Connection.NONE) {
                                        exportS.exportSurvey(formData).then((result)=>{
                                            console.log('Called Api');
                                            surveyCount++;
                                            exportOneByOne(surveyCount,res);
                                        });
                                    }else{
                                        console.log('Trying to export, but internet not available');
                                    }
                                }else{
                                    console.log('Trying to export, but internet not available');
                                }
                            });
                        }else{
                            surveyCount++;
                            exportOneByOne(surveyCount,res);
                        }
                    },(error)=>{
                        console.log(error);
                    });
                }else{
                    console.log('No Records Exists');
                    setExportInterval();
                }
            }
        },(error)=>{
            console.log(error)
        });
    }

  

    
}).controller('LoginCtrl', function($scope, $ionicLoading, localStorageService, $state, appData, $ionicNavBarDelegate, dbservice, appActivation, $ionicPlatform){
    // Fetch User on Login Page
    $ionicPlatform.ready(function() {
        if(window.Connection) {
            if(navigator.connection.type != Connection.NONE) {
                if(localStorageService.get('ActivationCode') != null && localStorageService.get('ActivationCode') != ''){
                    var formData = new FormData;
                    formData.append('activation_key',localStorageService.get('ActivationCode'));
                    $ionicLoading.show({
                      template: 'Loading app data..',
                      noBackdrop: false
                    });
                    appActivation.appActivate(formData).then(function(res){
                        $ionicLoading.show({
                          template: 'Loading database..',
                          noBackdrop: false
                        });
                        var countIndex = 0;
                        var updateUserQuery = 'UPDATE users SET app_password = ?, email = ?, name = ?, role = ?, updated_at = ?, organization_id = ? WHERE email = ?';
                        updateUserDetails(countIndex);
                        function updateUserDetails(countIndex){
                            var user = res.data.users[countIndex];
                            dbservice.runQuery(updateUserQuery,[user.app_password, user.email, user.name, JSON.stringify(user.user_roles), user.updated_at, user.org_id, user.email], (result)=>{
                                console.log(result);
                                countIndex++;
                                if(countIndex == res.data.users.length){
                                    $ionicLoading.hide();
                                }else{
                                    updateUserDetails(countIndex);
                                }
                            },(error)=>{
                                console.log(error);
                            });
                        }
                    });     
                }
            }
        }
    });
    // End here
	var getSettings = 'SELECT * FROM settings';
    dbservice.runQuery(getSettings,[], function(res){
      	var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[res.rows.item(i).key] = res.rows.item(i).value
      	}
      	$scope.application_title = row['login_page_title_text'];
      	$scope.application_description = row['login_page_description_text'];
      	localStorageService.set('settings',row);
      	$scope.link_to_register_page = row['link_to_register_page'];
      	console.log(row);
        $scope.registerLink = function(){
	    	window.open($scope.link_to_register_page,'_system');
	    }  
    }); 
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
   $scope.activation = {};
    $scope.Activate = function() {
      	if($scope.activation.code == undefined){
      		$ionicLoading.show({
		      template: 'Invalid Activation Code',
		      noBackdrop: false,
		      duration: 1000
		    });
      	}else{
  		  	var formData = new FormData;
            formData.append('activation_key',$scope.activation.code);
            $ionicLoading.show({
                  template: '<ion-spinner class="spinner-energized"></ion-spinner>',
                  noBackdrop: false
                });
            appActivation.appActivate(formData).then(function(res){

                if(res.data.status == 'error'){
                  $ionicLoading.show({
                    template: 'Invalid Activation Code',
                    noBackdrop: false,
                    duration: 1000
                  });
                }else{
                  var activation_date = new Date;
                  activation_date = activation_date.getFullYear()+'-'+(activation_date.getMonth()+1)+'-'+activation_date.getDate();
                  localStorageService.set('activation_date',activation_date);
                  var questionsColumn = '';
                  var insertQuestionMark = '';
                  var insertColumnsName = '';
                  var questionsList = res.data.questions;
                  var users = res.data.users;
                  var surveys = res.data.surveys;
                  var surveySections = res.data.groups;
                  var AppSettings = res.data.settings;
                  
                  var dropArray = [
                        'DROP TABLE IF EXISTS survey_data',
                        'DROP TABLE IF EXISTS survey_questions',
                        'DROP TABLE IF EXISTS survey_sections',
                        'DROP TABLE IF EXISTS users',
                        'DROP TABLE IF EXISTS settings',
                    ];
                  angular.forEach(dropArray, function(val,key){
                      dbservice.runQuery(val, [], function(res){
                          console.log(val+' table dropped!');
                      }, function(err){
                          console.log(err);
                      });
                  });
                  //create settings
               		var createSettionsTable = 'CREATE TABLE IF NOT EXISTS settings(id integer primary key, key text, value text)';
					dbservice.runQuery(createSettionsTable, [], function(res){
						angular.forEach(AppSettings, function(val, key){
                            var insertSettingsData = 'INSERT INTO settings(key, value) VALUES(?,?)';
                            dbservice.runQuery(insertSettingsData,[key, val], function(res){
								
							},function(error){
								console.log(error);
							});
						});
					},function(error){
						console.log(error);
					});
                //end sections


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
                            var Query = 'CREATE TABLE IF NOT EXISTS survey_result_'+value.id+'(id integer primary key,'+surveyResulColumns+' ip_address text, survey_started_on text, survey_completed_on text, survey_submitted_by text, survey_submitted_from text, mac_address text, imei text, unique_id text, device_detail text, created_by text, created_at text, last_field_id integer, last_group_id integer, completed_groups text, survey_status text, incomplete_name text, survey_sync_status text, record_type text)'
                            dbservice.runQuery(Query,[],function(res) {
                            	//console.log(res);
                            },function(error){
                            	console.log(error);
                            });
                      	});
                  });
					//create survey table results end
					
					//create user table if not exists
					var createUserTable = 'CREATE TABLE IF NOT EXISTS users(id integer primary key, name text, email text, api_token text, created_at text, updated_at text, role text, organization_id integer, approved integer, app_password text)';
					dbservice.runQuery(createUserTable,[],function(userResp){
						angular.forEach(users, function(v,k){
							var insertUser = 'INSERT INTO users(name, email, api_token, created_at, updated_at, role, organization_id, approved, app_password) VALUES(?,?,?,?,?,?,?,?,?)';
                                dbservice.runQuery(insertUser,[
                                v.name,v.email,v.api_token,v.created_at,v.updated_at,JSON.stringify(v.user_roles),v.org_id,v.approved,v.app_password], function(res){

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
                                            if($.inArray(key, ['answers','fields','field_validations','field_conditions']) != -1){
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
                                var insertQuestion = 'INSERT INTO survey_questions('+insertColumnsName+') VALUES('+insertQuestionMark+')';
                                dbservice.runQuery(insertQuestion,dataArray, function(res){
                                    console.log(res);
                                },function(error){
                                    console.log(error);
                                    console.log(insertQuestion,k);
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
                                    //console.log(res);
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
                  localStorageService.set('ActivationCode',$scope.activation.code);
                  //localStorageService.set('SurveyMedia',res.data.media);

                  if(res.data.media != 'null'){

                    angular.forEach(res.data.media, function(mediaLink, mediaKey){
                        if(mediaLink != null){
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
                                         //alert("Error during download. Code = " + error.code);
                                      }
                                   );
                                });
                            }, false);
                        }
                    });
                  }
                  setTimeout(function(){
                  	  $ionicLoading.hide();
	                  $ionicLoading.show({
	                    template: 'Activated Successfully',
	                    noBackdrop: false,
	                    duration: 1000
	                  });
	                  $state.go('login');
                  },35000);
                }
                
            },(error) => {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: 'Request timeout, check your internet connection',
                    noBackdrop: false,
                    duration: 1000
                });
            });
      	}
      	
     };

});

//function crea

