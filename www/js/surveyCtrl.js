'use strict'

angular.module('smaart.surveyCtrl', ['ngCordova'])
.directive('question', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.question, function(QuesHtml) {
        ele.html(QuesHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('description', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.description, function(DescHtml) {
        ele.html(DescHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('answers', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.answers, function(AnswerHtml) {
        ele.html(AnswerHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('image', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.image, function(imageHtml) {
        ele.html(imageHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.controller('surveyLoad', function($ionicSideMenuDelegate, dbservice, $q, $sce, $parse, $cordovaFile, $rootScope, $scope, $ionicLoading, localStorageService, $state, AppConfig, ionicDatePicker, $timeout, appData, $cordovaGeolocation, ionicTimePicker, $compile, $ionicHistory, $ionicPlatform, $ionicGesture, $mdpTimePicker, $cordovaCamera){
    
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.nextStatus = false;
    setTimeout(function(){
        var element = angular.element(document.querySelector('#content')); 
        $ionicGesture.on('swipeleft', function(e){
            $scope.nextStatus = true;
            $scope.$apply(function() {
                $rootScope.$emit('nextQst',{
                    id: $scope.questionId
                });
            })    
        }, element);

        $ionicGesture.on('swiperight', function(e){
            $scope.$apply(function() {
                $rootScope.$emit('prevQst');
            })    
        }, element);
    },1500);
    
    
	var dt = new Date;
	var startedTime = dt.getFullYear()+''+(dt.getMonth()+1)+''+dt.getDay()+''+dt.getHours()+''+dt.getMinutes()+''+dt.getSeconds()+''+dt.getMilliseconds();
	var SurveyData = '';
    $scope.readonlyText = {};
	$scope.readonlyNumber = {};
	setSurveyNameAndId($state, localStorageService, 0, dbservice);
	var getQuestions = 'SELECT * FROM survey_questions WHERE group_id = ? AND survey_id = ?';
    $scope.showHideQuestion = false;
    var discarded_groups = localStorageService.get('discarded_groups');
    if($.inArray(parseInt($state.params.groupId),discarded_groups) != -1){
        $scope.discardStatus = true;
    }else{
        $scope.discardStatus = false;
    }
    if(localStorageService.get('iris_id') != null){
        $scope.iris_id = localStorageService.get('iris_id')
    }
	dbservice.runQuery(getQuestions, [$state.params.groupId,$state.params.surveyId], function(res){

		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	SurveyData = row;
      	localStorageService.set('startStamp', startedTime);
		var QuestionIndex = 0;
		
		window.lat = '';
		window.long = '';
		var sectionsList = localStorageService.get('sections_data');
		var sectionDetails = $.grep(sectionsList, function(elem,i){
			return (elem.group_id == $state.params.groupId);
		});

		$scope.section_name = sectionDetails[0].title;
		var surveyName = localStorageService.get('CurrentSurveyNameID');
		$scope.surveyName = surveyName.name;

		window.answerData = '';
		var totalQuest = Object.keys(SurveyData).length

		$scope.totalQst = totalQuest;  //Set Total Question Value in Survey.html

		if($state.params.QuestId.trim() != ''){

			QuestionIndex = $state.params.QuestId;
		}
		if(SurveyData[QuestionIndex] == undefined || SurveyData[QuestionIndex] == ''){
	    	finishSurvey($state, localStorageService, $ionicLoading, $cordovaGeolocation, dbservice, $scope);
	    	return false;
	    }
		var my_media = {};
		$scope.play = function(url, exact){
			angular.forEach(my_media, function(value, key){
				my_media[key].stop();
				$('.playMusic_'+key).show();
		    	$('.pauseMusic_'+key).hide();
			});
			var fname = "SmaartMedia/"+url;
			$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname).then(function(obj) {
					
				my_media[exact] = new Media(obj.nativeURL,
		        	// success callback
			        function () { console.log("playAudio():Audio Success"); },
			        // error callback
			        function (err) { console.log("playAudio():Audio Error: " + err); }
			    );
		    	my_media[exact].play();
		    	$('.playMusic_'+exact).hide();
		    	$('.pauseMusic_'+exact).show();
			});
		}

		$scope.questionId = '';
		$scope.setNextQuestion = function(nextQuestion,type){
			
			if(type == 'select'){
				nextQuestion = $('.app_select:last option:selected').attr('next');
			}
			
			if(nextQuestion != undefined && nextQuestion != ''){
				if(nextQuestion.trim() != ''){
					var surveyData = SurveyData;//getSurveyData($state, localStorageService);
					$.each(SurveyData, function(key, val){
						if(val.question_key == nextQuestion){
							$scope.questionId = key;
						}
					});
				}else{
					$scope.questionId = '';
				}
			}else{
				$scope.questionId = '';
			}
		}
		$scope.stop = function(url, exact){
			my_media[exact].stop();
			$('.playMusic_'+exact).show();
		    $('.pauseMusic_'+exact).hide();
		}

		$scope.currentQst = parseInt(QuestionIndex)+1; //Set Current Question number in Survey.html

		//if Survey According to Question Order
		if(AppConfig.QuestionOrder == 'true'){

			angular.forEach(SurveyData, function(value, key) {
		        if(value.question_order == QuestionIndex){

		            var paramQid = key;
		            var QuestionID = value.question_id;
		        }
		    });
		}
	    //end here
       var timer;
       if($scope.discardStatus){
            if(SurveyData[parseInt(QuestionIndex)+1] != undefined){
                timer = window.setTimeout(setReadonly, 600);
                function setReadonly(){
                    var type = $('input').attr('type');
                    console.log(type);
                    switch(type){
                        case'radio':      
                            console.log($('input:checked').val());                     
                            if($('input:checked').val() != undefined || $('input:checked').val() != null){
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }else{
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }
                        break;
                        case'text':
                            if($('input').val() == undefined || $('input').val() == '' || $('input').val() == null){
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }else{
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }
                        break;
                        case'checkbox':
                            if($('input:checked').val() != undefined){
                                $('input,select,textarea').prop('disabled',true);
                            }
                        break;
                        default:
                            if($('select,textarea,input:checked,input').val() == '' || $('select,textarea,input:checked,input').val() == undefined || $('select,textarea,input:checked,input').val() == null || $('select,textarea,input:checked,input').val() == '? string: ?'){
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }else{
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }
                    }
                };
            }else{
                $scope.notDisable = true;
                $('input,select,textarea').prop('disabled',false);
            }
        }
        // console.log(JSON.parse(SurveyData[QuestionIndex].field_conditions));
        //Question Conditions start here ###################################################
	    var conditionsArray = [];
        try{
            window.field_conditions = JSON.parse(SurveyData[QuestionIndex].field_conditions);
            var fieldCondIndex = 0;
            if(field_conditions.length != 0 && field_conditions[fieldCondIndex].condition_operator !== undefined && field_conditions[fieldCondIndex].condition_value !== undefined){
                checkFieldConditions(fieldCondIndex);
                function checkFieldConditions(fieldCondIndex){
                    if(field_conditions[fieldCondIndex] !== undefined){
                        
                        var condition_question_id = parseInt(field_conditions[fieldCondIndex].condition_column);
                        var conditioned_question_key = '';
                        $.each(SurveyData, function(datakey, datavalue){
                            if(datavalue.question_id == condition_question_id){
                                conditioned_question_key = datavalue.question_key;
                                return false;
                            }
                        });
                        var conditionQuery = 'SELECT '+conditioned_question_key+' FROM survey_result_'+$state.params.surveyId+' WHERE id = ?';
                        var rec_id = localStorageService.get('record_id');
                        dbservice.runQuery(conditionQuery,[rec_id],function(res){
                            var cond_operator = field_conditions[fieldCondIndex].condition_operator;
                            var cond_value = field_conditions[fieldCondIndex].condition_value;
                            
                            if($.inArray(cond_operator,['has','have']) !== -1){

                                var existingAnswerArray = JSON.parse(res.rows.item(0)[conditioned_question_key]);
                                if(existingAnswerArray != null && existingAnswerArray[cond_value] != undefined && existingAnswerArray[cond_value] == true){
                                    conditionsArray.push('true');
                                }else{
                                    
                                    $ionicHistory.nextViewOptions({
                                        disableAnimate: true
                                    });
                                    if((SurveyData[QuestionIndex]['question_key'] == 'SID2_GID8_QID84' || SurveyData[QuestionIndex]['question_key'] == 'SID1_GID1_QID281')){
                                        console.log(conditionsArray);
                                        conditionsArray.push('false');
                                       
                                    }else{
                                        window.clearTimeout(timer);
                                        $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{reload:true});
                                    }
                                }

                            }else{
                                if(eval('"'+res.rows.item(0)[conditioned_question_key]+'" '+cond_operator+' '+cond_value)){
                                    conditionsArray.push('true');
                                }else{
                                    $ionicHistory.nextViewOptions({
                                        disableAnimate: true
                                    });
                                    window.clearTimeout(timer);
                                    $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{reload:true});
                                }
                            }
                            fieldCondIndex++;
                            checkFieldConditions(fieldCondIndex);
                        }, function(error){
                            console.log(error);
                        });
                    }else{
                        if($.inArray('true',conditionsArray) == -1){
                            window.clearTimeout(timer);
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1});
                        }
                    }
                }
            }

        }catch(e){
            console.log(e);
            // console.log('No conditions found');
        }
        //Question conditions ends here ############################################################
	    var QuestType  =  SurveyData[QuestionIndex].question_type;
	    var DrawHTML = {
	    				  'QuestionText': SurveyData[QuestionIndex].question_text, 
	    				  'QuestionDesc': SurveyData[QuestionIndex].question_desc,
	    				  'QuestAnswers': JSON.parse(SurveyData[QuestionIndex].answers)[0],
	    				  'scope'		: $scope,
	    				  'raw'			: SurveyData[QuestionIndex],
	    				  'ls'			: localStorageService
		    		   };
		// console.log(QuestType);
		$scope.numberAnswer = {};
		switch(QuestType){

			case'text':
				text(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'message':
				message(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'textarea': //textarea
				textarea(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'number':
				number(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'email':
				email(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'radio':
				radio(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'checkbox':
				checkbox(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'select'://select
				select(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce, $state, dbservice);
			break;

			case'datepicker':
				date(DrawHTML, ionicDatePicker);
			break;

			case'timepicker':
				time(DrawHTML, ionicTimePicker, $mdpTimePicker, $state);
			break;

			case'location':
				GpsLocation(DrawHTML,$ionicLoading, $cordovaGeolocation);
			break;

			case'repeater':
				repeater(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $compile, $ionicLoading);
			break;

			case'text_image':
				text_only(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
            break;

            case'datetimepicker':
                datetimepicker(DrawHTML, ionicTimePicker, $mdpTimePicker);
            break;

            case'image':
                image(DrawHTML,$cordovaCamera);
            break;

		}

		/*############################## HARD CODED CONDITIONS ##############################*/
		
			if(	(QuestionIndex == 2 && $state.params.groupId == 5 && $state.params.surveyId == 2)||
				(QuestionIndex == 1 && $state.params.groupId == 19 && $state.params.surveyId == 5)){
				if(localStorageService.get('record_id') > 9){
					$scope.textAnswer = {
						value : '00'+localStorageService.get('record_id')
					};
				}else{
					$scope.textAnswer = {
						value : '000'+localStorageService.get('record_id')
					};
				}
				$scope.readonlyText.status = true;
			}
            if($state.params.surveyId == 1 && $state.params.groupId == 1 && QuestionIndex == 4){
                var getFilledData = 'SELECT `SID1_GID1_QID1`,`SID1_GID1_QID2`,`SID1_GID1_QID3`,`SID1_GID1_QID4` FROM survey_result_'+$state.params.surveyId+' WHERE id = ?';
                dbservice.runQuery(getFilledData,[localStorageService.get('record_id')], function(res){
                    console.log(res.rows.item(0));
                    var prefilled_answer_data = res.rows.item(0);
                    
                    setTimeout(function(){
                        $scope.textAnswer.value = prefilled_answer_data.SID1_GID1_QID1+''+prefilled_answer_data.SID1_GID1_QID2+''+prefilled_answer_data.SID1_GID1_QID4+''+prefilled_answer_data.SID1_GID1_QID3;
                        $scope.iris_id = 'IRISID: '+$scope.textAnswer.value;
                        localStorageService.set('iris_id',$scope.iris_id);
                    },5);
                    $scope.readonlyText.status = true;
                }, function(error){
                    console.log(error);
                });
            }
			
			if($state.params.surveyId == 3 && $state.params.groupId == 11 && QuestionIndex == 3){
                var getFilledData = 'SELECT `SID3_GID11_QID107`,`SID3_GID11_QID141`,`SID3_GID11_QID142` FROM survey_result_'+$state.params.surveyId+' WHERE id = ?';
                dbservice.runQuery(getFilledData,[localStorageService.get('record_id')], function(res){
                    var prefilled_answer_data = res.rows.item(0);
                    $scope.textAnswer.value = prefilled_answer_data.SID3_GID11_QID107+''+prefilled_answer_data.SID3_GID11_QID142+''+prefilled_answer_data.SID3_GID11_QID141;
                    $scope.iris_id = 'IRISID: '+$scope.textAnswer.value;
                    localStorageService.set('iris_id',$scope.iris_id);
                    $scope.readonlyText.status = true;
                }, function(error){
                    console.log(error);
                });
            }

            if($state.params.surveyId == 1 && $state.params.groupId == 2 && $state.params.QuestId == 3){
                var QueryForCondition = 'SELECT SID1_GID2_QID23 FROM survey_result_1 WHERE id = ?';
                dbservice.runQuery(QueryForCondition,[localStorageService.get('record_id')], function(res){
                    if(res.rows.item(0)['SID1_GID2_QID23'] != 998 && res.rows.item(0)['SID1_GID2_QID23'] != '998'){
                        var jsonParse = JSON.parse(res.rows.item(0)['SID1_GID2_QID23']);
                        if("years" in jsonParse){
                            if(jsonParse['years'] < 5){
                                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                            }
                        }else if("months" in jsonParse){
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                        }
                    }
                }); 
            }

            if($state.params.surveyId == 3 && $state.params.groupId == 11 && $state.params.QuestId == 8){
                var QueryForCondition = 'SELECT SID3_GID11_QID275 FROM survey_result_3 WHERE id = ?';
                dbservice.runQuery(QueryForCondition,[localStorageService.get('record_id')], function(res){
                    if(res.rows.item(0)['SID3_GID11_QID275'] != 998 && res.rows.item(0)['SID3_GID11_QID275'] != '998'){
                        var jsonParse = JSON.parse(res.rows.item(0)['SID3_GID11_QID275']);
                        if("years" in jsonParse){
                            if(jsonParse['years'] < 5){
                                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                            }
                        }else if("months" in jsonParse){
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                        }
                    }
                }); 
            }

            if($state.params.surveyId == 1 && $state.params.groupId == 4 && $state.params.QuestId == 2){
                var QueryForCondition = 'SELECT SID1_GID4_QID43 FROM survey_result_1 WHERE id = ?';
                var nextStatus = false;
                dbservice.runQuery(QueryForCondition,[localStorageService.get('record_id')], function(res){
                    if(res.rows.item(0)['SID1_GID4_QID43'] != ''){
                        var jsonParesed = JSON.parse(res.rows.item(0)['SID1_GID4_QID43']);
                        $.each(jsonParesed, function(key,value){
                            if(($.inArray(parseInt(key),[6,7,8,11,12]) !== -1) && value == true){
                                nextStatus = true;
                            }
                        });
                        if(nextStatus == false){
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                        }
                    }
                }); 
            }
            if($state.params.surveyId == 1 && $state.params.groupId == 6 && $state.params.QuestId == 5){
                var QueryForCondition = 'SELECT SID1_GID6_QID60, SID1_GID6_QID80 FROM survey_result_1 WHERE id = ?';
                dbservice.runQuery(QueryForCondition,[localStorageService.get('record_id')], function(res){
                    if(res.rows.item(0)['SID1_GID6_QID80'] != ''){
                        var jsonParesed = JSON.parse(res.rows.item(0)['SID1_GID6_QID80']);
                        var singleValue = res.rows.item(0)['SID1_GID6_QID60'];
                        if(((1 in jsonParesed && jsonParesed[1] == true) && singleValue == 1) || ((2 in jsonParesed && jsonParesed[2] == true) && singleValue == 2) || ((5 in jsonParesed && jsonParesed[5] == true) && singleValue == 3)){
                            //do nothing
                        }else{
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{replace: true});
                        }
                    }
                }); 
            }
            if($state.params.surveyId == 1 && $state.params.groupId == 7 && $state.params.QuestId == 10){
                var QueryForCondition = 'SELECT SID1_GID7_QID110 FROM survey_result_1 WHERE id = ?';
                dbservice.runQuery(QueryForCondition,[localStorageService.get('record_id')], function(res){
                    if($.inArray(parseInt(res.rows.item(0)['SID1_GID7_QID110']),[2,3,4]) !== -1){
                        setTimeout(function(){
                            $('select[name=selectAnswer] option').each(function(){
                                if($.inArray(parseInt( $(this).attr('value') ),[4,5,6] ) !== -1){
                                    $(this).remove();
                                }
                            });
                        },800);
                    }
                }); 
            }

			/*if(	($state.params.surveyId == 2)){
				// console.log(localStorageService.get('uniqueSerial'));
				if(localStorageService.get('uniqueSerial') != undefined && localStorageService.get('uniqueSerial') != null){
					var datavalues = localStorageService.get('uniqueSerial');
					if(datavalues[1] != undefined && datavalues[2] != undefined){
						$scope.iris_id = 'IRISID: '+datavalues[0]+''+datavalues[1]+''+datavalues[2];
					}
				}
			}*/

			/*if(	($state.params.surveyId == 5)){
				if(localStorageService.get('uniqueSerial') != undefined && localStorageService.get('uniqueSerial') != null){
					var datavalues = localStorageService.get('uniqueSerial');
					if(datavalues[0] != undefined && datavalues[1] != undefined){
						$scope.iris_id = 'IRISID: '+datavalues[0]+''+datavalues[1];
					}
				}
			}*/

		/*####################################################################################*/
        //Pre fill answer
        var getAnswer = 'SELECT '+SurveyData[QuestionIndex].question_key+' FROM survey_result_'+SurveyData[QuestionIndex].survey_id+' WHERE id = ?';
        dbservice.runQuery(getAnswer,[localStorageService.get('record_id')],function(resp){
            var answ = '';
            switch(QuestType){
                case'text':
                    try{
                        if(SurveyData[QuestionIndex].question_repeater == 'yes'){
                            var jsonAnswer = JSON.parse(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                            if(jsonAnswer.length > 0){
                                setTimeout(function(){
                                    $.each(jsonAnswer, function(key,value){
                                        if(key == 0){
                                            $('.textBoxSurvey:first').find('input').val(value);
                                        }else{
                                            var cloneTextBox = $('.textBoxSurvey:first').clone();
                                            var questionText = $('.para').text();
                                            $('.repeat_div').append(cloneTextBox);
                                            $('.surveyTextBox:last').attr('placeholder',questionText).val(value);
                                        }
                                    });
                                },500);
                            }
                        }else{
                            var answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                        }
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.textAnswer.value = answ;
                    }
                break;

                case'number':
                    if(SurveyData[QuestionIndex].question_repeater == 'yes'){
                        var answerData = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                        if(answerData != null && answerData != ''){
                            var numberAnswerData = JSON.parse(answerData);
                            var index = 1;
                            $.each(numberAnswerData,function(key,value){
                                $('.numberAnswer:nth-child('+index+')').val(value);
                                index++;
                            });
                        }
                    }else{
                        try{
                            answ = parseInt(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                        }catch(e){

                        }
                        if((answ != '' && answ != null) || answ == 0){
                            $scope.numberAnswer.value = answ;
                        }
                    }
                break;

                case'select':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                         $scope.selectAnswer.value = answ;
                        setTimeout(function(){
                            $scope.setNextQuestion('','select');                                
                        },100);
                    }
                break;

                case'checkbox':
                    try{
                        answ = JSON.parse(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.checkboxAnswer = answ;
                    }
                break;

                case'radio':
                    if(SurveyData[QuestionIndex].have_others == 'yes'){
                        if(resp.rows.item(0)[SurveyData[QuestionIndex].question_key] != '998.0'){
                            var jsonDataAnswer = JSON.parse(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                            angular.forEach(jsonDataAnswer, function(value, key){
                                if(key == 'months'){
                                    $scope.haveOther = true;
                                    $('.radioButtons[value=1]').prop('checked',true).click();
                                    $scope.radioAnswer.value = 1;
                                    $('.surveyTextBox').val(value);
                                }else if(key == 'years'){
                                    $scope.haveOther = true;
                                    $('.radioButtons[value=2]').prop('checked',true).click();
                                    $scope.radioAnswer.value = 2;
                                    $('.surveyTextBox').val(value);
                                }else{
                                    console.log(value);
                                }
                            });
                        }else{
                            answ = parseInt(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                            $('.radioButtons:checked').click();
                            $scope.radioAnswer.value = answ;
                        }
                        
                    }else{
                       try{
                            answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                            setTimeout(function(){
                                $scope.setNextQuestion($('.radioButtons:checked').data('next'),'radio');                                
                            },100);
                        }catch(e){

                        }
                        if(answ != '' && answ != null){
                            $('.radioButtons:checked').click();
                            $scope.radioAnswer.value = answ;
                        } 
                    }
                    
                break;
                case'datetimepicker':
                    try{
                        var prefillAnswer = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                        if(prefillAnswer != null && prefillAnswer != ''){
                            answ = new Date(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                        }
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.datetime = answ;
                    }
                break;
                case'timepicker':
                    try{
                        var time = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                        if(time != ''){
                            var splitedTime = time.split(':');
                        }
                        var year = new Date().getFullYear();
                        var month = new Date().getMonth()+1;
                        var day = new Date().getDay();
                        $scope.$parent.textAnswer = new Date(year,month,day,splitedTime[0],splitedTime[1]);
                        
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.textAnswer = answ;
                    }
                break;
                case'datepicker':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.textAnswer = answ;
                    }
                break;

                case'email':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.emailAnswer = answ;
                    }
                break;

                case'textarea':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.textareaAnswer = answ;
                    }
                break;

                case'image':
                    if(resp.rows.length != 0){
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                        answ = JSON.parse(answ);
                        $.each(answ, function(key,value){
                            var imageSpan = '<span style=""><img src="'+value+'" class="selected_image" data-index="'+key+'" style="width: 100%; height: 100%;" ></span>';
                            $('.image-wrap').append(imageSpan);
                        });
                    }
                break;

                case'repeater':
                    if(resp.rows.length != 0){
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }
                    if(answ != '' && answ != null){
                        var answData = JSON.parse(answ);
                        // console.log(answData);
                        for(var clone = 1; clone < answData.length; clone++){
                            var divClone = $('.repeaterRow:last').clone();
                            $('.repeater').append(divClone);
                            $('.repeaterRow:last').find('.vehicle-count').html(clone+1);
                        }

                        var ind = 1;
                        $.each(answData, function(key,val){
                            $.each(val, function(cl,v){
                                var elem = $('.repeaterRow:nth-child('+ind+')');
                                if(elem.find('div[key='+cl+'] input').attr('type') != 'radio'){
                                    elem.find('div[key='+cl+'] select, div[key='+cl+'] input').val(v);
                                }else{
                                    elem.find('div[key='+cl+'] input[value='+v+']').attr('checked','checked');
                                }
                                if(cl == 'SID2_GID9_QID89'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID89').show();
                                            elem.find('.SID2_GID9_QID295').show();
                                            elem.find('.SID2_GID9_QID92').show();
                                        },1500);
                                    }else if($.inArray(v.toString(),['1','2','3a']) == -1){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID295').show();
                                            elem.find('.SID2_GID9_QID92').show();
                                            elem.find('.SID2_GID9_QID89').hide();
                                        },1500);
                                        
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID89').hide();
                                            elem.find('.SID2_GID9_QID295').hide();
                                            elem.find('.SID2_GID9_QID92').hide();
                                        },1500);
                                    }
                                }
                                if(cl == 'SID2_GID9_QID90'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID90').show();
                                        },1500);
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID90').hide();
                                        },1500);
                                    }
                                }

                                if(cl == 'SID2_GID9_QID91'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID91').show();
                                        },1500);
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID91').hide();
                                        },1500);
                                    }
                                }
                            });
                            ind++;
                        });
                        $('input[name=number_of_vehicle]').val(ind-1);
                    }
                break;
            }
        });
	});
    $scope.showHideQuestion = true;
    $scope.$parent.checkboxAnswer = {};
    $scope.checkUnkown = function(value){
        console.log(value);
        if(value == 998 || value == '998'){
            var checkBoxObjectArray = $scope.$parent.checkboxAnswer;
            if(checkBoxObjectArray[998] !== undefined && checkBoxObjectArray[998] != false){
                $scope.$parent.checkboxAnswer = {};
                $scope.$parent.checkboxAnswer[998] = true;
            }
        }else{
            try{
                $scope.$parent.checkboxAnswer[998] = false;
            }catch(e){

            }
        }
        if(value == '996' || value == 996){
            var checkBoxObjectArray = $scope.$parent.checkboxAnswer;
            if(checkBoxObjectArray[996] !== undefined && checkBoxObjectArray[996] != false ){
                $scope.$parent.checkboxAnswer = {};
                $scope.$parent.checkboxAnswer[996] = true;
            }
        }else{
            try{
                $scope.$parent.checkboxAnswer[996] = false;
            }catch(e){

            }
        }        
    }


})

.controller('nextQuest', function($scope, $rootScope, $ionicLoading, localStorageService, $state, AppConfig, ionicDatePicker, dbservice, $cordovaDevice, $ionicHistory){

    $rootScope.$on('nextQst', function(event, dataObject) {
        if($scope.nextStatus == true){
            $scope.nextStatus = false;
            $scope.QuestNext(dataObject.id);
        }
    });

	$scope.QuestNext = function(nextQuestion){
        if($scope.discardStatus){
            if($scope.notDisable){
                
            }
        }
		var locS = localStorageService;

		var QuestionIndex = 0;
		
		if($state.params.QuestId.trim() != ''){

			QuestionIndex = $state.params.QuestId;
			
		}

		var getQuestions = 'SELECT * FROM survey_questions WHERE group_id = ? AND survey_id = ?';
		dbservice.runQuery(getQuestions, [$state.params.groupId,$state.params.surveyId], function(res){
			var row = {};
	      	for(var i=0; i<res.rows.length; i++) {
	          	row[i] = res.rows.item(i)
	      	}
	      	var SurveyData = row;
			//to get question_type for store in answer
			
            var checkUnique = false;

            var QuestType  =  SurveyData[QuestionIndex].question_type;

			var RequiredCheck = SurveyData[QuestionIndex].required;
			/*############################## HARD CODED ##################################*/
				if($state.params.surveyId == 2 && $state.params.groupId == 5){
					if($.inArray(parseInt(QuestionIndex),[0,1,2]) !== -1){
						RequiredCheck = 'yes';
					}
				}
				if($state.params.surveyId == 5 && $state.params.groupId == 19){
					if($.inArray(parseInt(QuestionIndex),[0,1]) !== -1){
						RequiredCheck = 'yes';
					}
				}
                if($.inArray(parseInt(SurveyData[QuestionIndex].question_id),[50,56,98,149,186,46,139]) != -1){
                    RequiredCheck = 'yes';
                }

                if($state.params.surveyId == 1 && $state.params.groupId == 1 && $state.params.QuestId == 2){
                    checkUnique = true;
                }
			/*###########################################################################*/
            try{
                var lengthCheck = 'no';
                var patternCheck = 'no';
                var rangeCheck = 'no';
                var patternValidationData = {};
                var lengthValidationData = {};
                var rangeValidationData = {};
                var fieldValidations = JSON.parse(SurveyData[QuestionIndex].field_validations);
                // console.log(fieldValidations);
                angular.forEach(fieldValidations, function(validation,k){
                    if(validation.field_validation == 'required'){
                        RequiredCheck = 'yes';
                    }
                    if(validation.field_validation == 'length'){
                        lengthCheck = 'yes';
                        lengthValidationData = validation;
                    }
                    if(validation.field_validation == 'pattern'){
                        patternCheck = 'yes';
                        patternValidationData = validation;
                    }
                    if(validation.field_validation == 'range'){
                        rangeCheck = 'yes';
                        rangeValidationData = validation;
                    }

                });
            }catch(e){
                console.log(e);
            }
			if(RequiredCheck == 'yes'){
				var valResult = validation($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex], $state);
				if(valResult == true){
					if(SurveyData[QuestionIndex].pattern != '' && SurveyData[QuestionIndex].pattern != null){
						var validationResult = validatePattern($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex].pattern, SurveyData[QuestionIndex]);
						if(validationResult == false){
                            $scope.nextStatus = true;
							return false;
						}
					}
                    if(lengthCheck == 'yes'){
                        if(checkLengthValidation(SurveyData[QuestionIndex], lengthValidationData) == false){
                            return false;
                        }
                    }
                    if(patternCheck == 'yes'){
                        if(checkPatternValidation(SurveyData[QuestionIndex], patternValidationData) == false){
                            return false;
                        }
                    }
                    if(rangeCheck == 'yes'){
                        if(checkRangeValidation(SurveyData[QuestionIndex], rangeValidationData) == false){
                            return false;
                        }
                    }
                    if(checkUnique == true){
                        var recordID= localStorageService.get('record_id');
                        var checkUniqueSerialNumber = 'SELECT * FROM survey_result_'+$state.params.surveyId+' WHERE SID1_GID1_QID3 = ? and id != ?';
                        dbservice.runQuery(checkUniqueSerialNumber,[$scope.textAnswer.value, recordID], function(res){
                            if(res.rows.length != 0){
                                $ionicLoading.show({
                                    template: 'Serial number already in use!',
                                    noBackdrop: false,
                                    duration: 2000
                                });
                            }else{
                                locS.set('lastQuestionIndex',QuestionIndex);
                                goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory, $ionicLoading);    
                            }
                        });
                    }else{
                        locS.set('lastQuestionIndex',QuestionIndex);
                        goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory, $ionicLoading);    
                    }
				}else{
                    $scope.nextStatus = true;
                }
			}else{
				if(SurveyData[QuestionIndex].pattern != '' && SurveyData[QuestionIndex].pattern != null){
					var validationResult = validatePattern($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex].pattern, SurveyData[QuestionIndex]);
					if(validationResult == false){
                        $scope.nextStatus = true;
						return false;
					}
				}
                if(lengthCheck == 'yes'){
                    if(checkLengthValidation(SurveyData[QuestionIndex], lengthValidationData) == false){
                        return false;
                    }
                }
                if(patternCheck == 'yes'){
                    if(checkPatternValidation(SurveyData[QuestionIndex], patternValidationData) == false){
                        return false;
                    }
                }
                if(rangeCheck == 'yes'){
                    if(checkRangeValidation(SurveyData[QuestionIndex], rangeValidationData) == false){
                        return false;
                    }
                }
                if(checkUnique == true){
                    var recordID= localStorageService.get('record_id');
                    var checkUniqueSerialNumber = 'SELECT * FROM survey_result_'+$state.params.surveyId+' WHERE SID1_GID1_QID3 = ? and id != ?';
                    dbservice.runQuery(checkUniqueSerialNumber,[$scope.textAnswer.value, recordID], function(res){
                        if(res.rows.length != 0){
                            $ionicLoading.show({
                                template: 'Serial number already in use!',
                                noBackdrop: false,
                                duration: 2000
                            });
                        }else{
                            locS.set('lastQuestionIndex',QuestionIndex);
                            goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory, $ionicLoading);
                        }
                    });
                }else{
                    locS.set('lastQuestionIndex',QuestionIndex);
                    goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory, $ionicLoading);
                }
                
			}

			if(SurveyData == undefined){
				$state.go('app.dashboard');
			}
		});
	}

    function checkRangeValidation(questionData, validation){
        var validationArguments = validation.validation_argument;
        validationArguments = validationArguments.split(',');
        var rangeData = validationArguments[0].split('-');
        var minRange = parseInt(rangeData[0]);
        var maxRange = parseInt(rangeData[1]);
        var rangeError = false;
        $('.numberAnswer').each(function(key){
            var numberValue = parseInt($(this).val());
            if(numberValue <  minRange || numberValue > maxRange){
                if(numberValue != parseInt(validationArguments[1]) && numberValue != parseInt(validationArguments[2])){
                    rangeError = true;
                }
            }
        });
        if(rangeError == true){
            $ionicLoading.show({
                template: validation.field_validation_message,
                noBackdrop: false,
                duration: 1000
            });
            return false;
        }else{
            return true;
        }
    }

    function checkPatternValidation(questionData, validation){
        if(eval(validation['validation_argument']).test($scope.$parent.textAnswer.value)){
            return true;
        }else{
            $ionicLoading.show({
              template: validation.field_validation_message,
              noBackdrop: false,
              duration: 1000
            });
            return false;
        }
    }
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function checkLengthValidation(questionData, validation){
        var numberText = '';
        if(questionData.question_type == 'text'){
            numberText = $scope.$parent.textAnswer.value;
        }
        if(questionData.question_type == 'number'){
            numberText = $scope.$parent.numberAnswer.value.toString();
        }
        if(!isNaN(numberText) && numberText != null){
            
            if(numberText.length == validation.validation_argument && parseInt(numberText) >= 1){
                if(isNumber(numberText)){
                    return true;
                }else{
                    $ionicLoading.show({
                      template: validation.field_validation_message,
                      noBackdrop: false,
                      duration: 1000
                    });
                    return false;
                }
            }else{
                $ionicLoading.show({
                  template: validation.field_validation_message,
                  noBackdrop: false,
                  duration: 1000
                });
                return false;
            }
        }else{
            if(isNumber(numberText)){
                return true;
            }else{
                $ionicLoading.show({
                  template: validation.field_validation_message,
                  noBackdrop: false,
                  duration: 1000
                });
                return false;
            }
        }
    }

})


.controller('prevQuest', function($scope, $rootScope, $ionicLoading, localStorageService, $state, $ionicHistory, $ionicViewSwitcher){
    
    $rootScope.$on('prevQst', function(event, dataObject) {
        $scope.goToPrev();
    });
	$scope.goToPrev = function(){
        $ionicViewSwitcher.nextDirection('back');
        var lastQuestInd = localStorageService.get('lastQuestionIndex');
        if(lastQuestInd != null & lastQuestInd != ''){
            localStorageService.set('lastQuestionIndex',null);
            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId':lastQuestInd});
        }else{
            var preFilledQuestions = localStorageService.get('filled_questions');
            if($.inArray(parseInt($state.params.QuestId),preFilledQuestions) != -1){
                var questInd = preFilledQuestions.indexOf(parseInt($state.params.QuestId)) - 1;
                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId':preFilledQuestions[questInd]});
            }else{
                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(preFilledQuestions[preFilledQuestions.length - 1])});
            }
        }
        
	}
});


function goToNext(QuestionIndex, $scope, QuestType, $state, rawData, locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory, $ionicLoading){
	$scope.showHideQuestion = false;

	var storeStatus = StoreAnswer(QuestionIndex,$scope, QuestType, rawData, locS, dbservice, $state, $cordovaDevice, $ionicLoading);
    if(storeStatus  != false){
        if(nextQuestion != ''){
            QuestionIndex = nextQuestion;
            var $next = parseInt(QuestionIndex);
        }else{
            var $next = parseInt(QuestionIndex) + 1;
        }
        
        //Set localstorage data 
            var preFilledQuestions = locS.get('filled_questions');
            if(preFilledQuestions == null){
                preFilledQuestions = [];
            }
            if($.inArray(parseInt(QuestionIndex),preFilledQuestions) == -1){
                preFilledQuestions.push(parseInt(QuestionIndex));
            }
            locS.set('filled_questions',preFilledQuestions);
        /******************************/
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': $next},{replace: true});
    }
}

function checkbox(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}

	$scope.checkboxOptions = params.QuestAnswers;
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/checkbox.html'\"></div>";
}


function text(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse){

	var $scope = params.scope;
	$scope.textAnswer = {};
	$scope.textAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}

	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}

	if(params.raw.pattern == 'number'){
		$scope.onlyNumbers = /^\d+$/;
		$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/number.html'\"></div>";
	}else if(params.raw.question_repeater == 'yes'){
        $scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/text_repeater.html'\"></div>";
    }else{
		$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/text.html'\"></div>";
	}
	$scope.readonlyText.status = false;
    setTimeout(function(){
        $('input[name=repeat]').on('click',function(){
            var cloneTextBox = $('.textBoxSurvey:first').clone();
            var questionText = $('.para').text();
            $('.repeat_div').append(cloneTextBox);
            $('.surveyTextBox:last').attr('placeholder',questionText).val('');
        });
    },200);
    
}

function repeater(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $compile, $ionicLoading){
	var $scope = params.scope;
	$scope.quest_type = 'repeater';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.fieldsList = JSON.parse(params.raw.fields);
	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/repeater.html'\"></div>";
    setTimeout(function(){
        $('input[type=radio],input[type=number]').removeAttr('ng-model').removeClass('ng*');
        $('.SID1_GID5_QID51, .SID1_GID5_QID53, .SID1_GID5_QID55, .SID2_GID9_QID92, .SID2_GID9_QID295').hide();
    },1000);
    $('body').on('change','.SID1_GID5_QID59 select', function(){
        var elem = $(this).parents('.repeaterRow');
        if($(this).val() == '997'){
            elem.find('.SID1_GID5_QID51').show();
            elem.find('.SID2_GID9_QID295').show();
            elem.find('.SID2_GID9_QID92').show();
        }else if($.inArray($(this).val().toString(),['1','2','3a']) == -1){
            elem.find('.SID2_GID9_QID295').show();
            elem.find('.SID2_GID9_QID92').show();
            elem.find('.SID1_GID5_QID51').hide();
        }else{
            elem.find('.SID1_GID5_QID51').hide();
            elem.find('.SID2_GID9_QID295').hide();
            elem.find('.SID2_GID9_QID92').hide();
        }
    });
    $('body').on('change','.SID1_GID5_QID52 select', function(){
        var elem = $(this).parents('.repeaterRow');
         if($(this).val() == '997'){
            elem.find('.SID1_GID5_QID53').show();
         }else{
            elem.find('.SID1_GID5_QID53').hide();
         }
    });
    $('body').on('change','.SID1_GID5_QID54 select', function(){
        var elem = $(this).parents('.repeaterRow');
        if($(this).val() == '997'){
            elem.find('.SID1_GID5_QID55').show();
         }else{
            elem.find('.SID1_GID5_QID55').hide();
         }
    });
    $scope.repeater = true;
    // console.log($scope.fieldsList);
	$scope.templateUrl = function(type,answers,field){
        
        $scope.selectOptions = answers;
        $scope.radioOptions = '';
		$scope.radioOptions = answers;
        $scope.questId = field.question_id;
        $scope.questionkey = field.question_key;
		return "surveyTemplate/"+type+".html";
	}
    

	
	$scope.createClone = function(){
        if($('input[name=number_of_vehicle]').val().trim() != '' && $('input[name=number_of_vehicle]').val().trim() != null){
            if($('.repeaterRow').length < parseInt($('input[name=number_of_vehicle]').val())){
                var cloneRow = $('.repeaterRow:last').clone();
                $('.repeater').append(cloneRow);
                $('.repeaterRow:last').find('select,input[type=text]').val('');
                $('.repeaterRow:last').find('.SID2_GID9_QID89, .SID2_GID9_QID90, .SID2_GID9_QID91').hide();
                var test = Math.random();
                test = test.toString().split('.');
                $('.repeaterRow:last').find('input[type=radio]').attr('name',test[1]);
                $('.repeaterRow:last').find('.vehicle-count').html($('.repeaterRow').length);
            }else{
                $ionicLoading.show({
                  template: 'You entered maximum vehicles!',
                  noBackdrop: false,
                  duration: 1500
                });
            }
        }else{
            $ionicLoading.show({
              template: 'Please enter number of vehicles',
              noBackdrop: false,
              duration: 1500
            });
        }
	}

    $('body').on('keyup','input[name=number_of_vehicle]',function(){
       if($(this).val() > 5){
            $(this).val(5);
            return false;
       }
       if($(this).val() == 0 && $(this).val() != ''){
            $(this).val(1);
            return false;
       }
    });
}

function message(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	
	
	//$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/message.html'\"></div>";

}

function date(params, ionicDatePicker){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/datepicker.html'\"></div>";
	var ipObj1 = {
				      callback: function (val) {  
				        var SelectedDate = new Date(val);
				        $scope.textAnswer = SelectedDate.getFullYear()+'-'+(SelectedDate.getMonth()+1)+'-'+SelectedDate.getDate();
				      },
				      from: new Date(1990, 1, 1), 
				      to: new Date(),
				      inputDate: new Date(),
				      mondayFirst: true,
				      closeOnSelect: false,
				      templateType: 'modal'
			    };

	$scope.DatePicker = function(){
		ionicDatePicker.openDatePicker(ipObj1);
		
	}
}

function datetimepicker(params, ionicTimePicker, $mdpTimePicker){
    var $scope = params.scope;
    $scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
    if(params.QuestionDesc != null){
        $scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
    }
    $scope.$parent.maxDate = new Date();
    $scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/datetimepicker.html'\"></div>";
}


function image(params,$cordovaCamera){
    var $scope = params.scope;
    $scope.numberAnswer = {};
    $scope.numberAnswer.value = '';
    $scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
    if(params.QuestionDesc != null){
        $scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
    }
    $('body').on('click','.selected_image', function(){
        var selectedImages = $(this).attr('src');
        $('.popup-image').find('img').attr('src',selectedImages).attr('data-index',$(this).data('index'));
        $('.popup-image').fadeIn(300);
    });
    $('body').on('click','.backg, .close-pop', function(){
        $('.popup-image').fadeOut(300);
    });
    $('body').on('click','.deleteImage', function(){
        var dataIndex = $(this).parent('div').find('img').data('index');
        delete seletcedImages[dataIndex];
        seletcedImages = seletcedImages.filter(function(){return true;});
        $('.image-wrap').html('');
        $.each(seletcedImages, function(key,value){
            var imageSpan = '<span style=""><img src="'+value+'" class="selected_image" data-index="'+key+'" style="width: 100%; height: 100%;" ></span>';
            $('.image-wrap').append(imageSpan);
        });
    });
    window.seletcedImages = [];
    $scope.capture_image = function(){
        if(seletcedImages.length == 5){
            alert('You have entered maximum images!');
            return false;
        }
        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            // sourceType: 0,
            limit: 5,
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            /*targetWidth: 100,
            targetHeight: 100,*/
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: true,
            correctOrientation:true
        };

        $cordovaCamera.getPicture(options).then(function(imageURI) {
            seletcedImages.push(imageURI);
            $('.image-wrap').html('');
            $.each(seletcedImages, function(key,value){
                var imageSpan = '<span style=""><img src="'+imageURI+'" class="selected_image" data-index="'+key+'" style="width: 100%; height: 100%;" ></span>';
                $('.image-wrap').append(imageSpan);
            });
        }, function(err) {
          console.log(err);
        });
    }
    $scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/image.html'\"></div>";
}

function time(params, ionicTimePicker, $mdpTimePicker, $state){
	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
    $scope.hour_minutes = false;
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/timepicker.html'\"></div>";
    if($state.params.surveyId == 1 && $state.params.groupId == 7 && $state.params.QuestId == 0){
        $scope.hour_minutes = true;
    }
	/*var ipObj1 = {
	    callback: function (val) {      //Mandatory
	      if (typeof (val) === 'undefined') {
	        console.log('Time not selected');
	      } else {
	        var selectedTime = new Date(val * 1000);
	        $scope.textAnswer = selectedTime.getUTCHours()+':'+selectedTime.getUTCMinutes();
	        // console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
	      }
	    },
	    inputTime: 50400,   //Optional
	    format: 12,         //Optional
	    step: 1,           //Optional
	    setLabel: 'Set'    //Optional
	  };
  
	$scope.timePicker = function(){
		
		ionicTimePicker.openTimePicker(ipObj1);
	}*/
}

function GpsLocation(params, $ionicLoading, $cordovaGeolocation){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/location.html'\"></div>";
	$scope.getLoaction = function(){
		$ionicLoading.show({
          template: '<ion-spinner class="spinner-energized"></ion-spinner>',
          noBackdrop: false,
          duration: 10000
        });
        var posOptions = {timeout: 10000, enableHighAccuracy: true};
        $cordovaGeolocation
		   .getCurrentPosition(posOptions)
			
		   .then(function (position) {
		      window.lat  = position.coords.latitude
		      window.long = position.coords.longitude
		      console.log(lat + '   ' + long);
		      $scope.locAnswer = lat+','+long;
		      $ionicLoading.hide();
		});
		/*navigator.geolocation.watchPosition(function(position){
			var location = position.coords.latitude.toFixed(8)+','+position.coords.longitude.toFixed(8);
			$scope.locAnswer = location;
			$ionicLoading.hide();
		});*/
	}
}

function textarea(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/textarea.html'\"></div>";
}

function text_only(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "";
}


function number(params){

	var $scope = params.scope;
	$scope.numberAnswer = {};
	$scope.numberAnswer.value = '';
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
    $scope.repeater = false;
    $scope.question_repeater = params.raw.question_repeater;
    $scope.question_repeater_length = parseInt(params.raw.repeation_length);
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/number.html'\"></div>";
}

function email(params){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/email.html'\"></div>";
}

function radio(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	$scope.radioAnswer = {};
	$scope.radioAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}

    $('.have_other').hide();
    $scope.haveOthers = params.raw.have_others;
    if($scope.haveOthers == 'yes'){
        $('body').on('click','.radioButtons',function(){
            if($scope.haveOthers == 'yes'){
                var radioButtonValue = $('input[name=radio]:checked').val();
                if($.inArray(parseInt(radioButtonValue),[1,2]) !== -1){
                    $scope.haveOther = true;
                }else{
                    $scope.haveOther = false;
                }
            }
        });
    }
	$scope.radioOptions = params.QuestAnswers;
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/radio.html'\"></div>";
}


function select(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce, $state, dbservice){

	var $scope = params.scope;
	$scope.selectAnswer = {};
	$scope.selectAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.$parent.selectAnswer = {};
    var optionsArary = [];
    var record_id = params.ls.get('record_id');

    if($state.params.QuestId == '2' && $state.params.groupId == '10' && $state.params.surveyId == '2'){
        var getRunnugSurveyResults = 'SELECT SID2_GID10_QID61, SID2_GID10_QID63 FROM survey_result_2 WHERE id = ?';
        dbservice.runQuery(getRunnugSurveyResults,[record_id], function(response){
            var QueryForIris = 'SELECT SID1_GID1_QID5,SID1_GID1_QID6,SID1_GID1_QID8,SID1_GID1_QID9,SID1_GID1_QID10 FROM survey_result_1 WHERE SID1_GID1_QID1 = ? AND SID1_GID1_QID2 = ?';
            dbservice.runQuery(QueryForIris,[response.rows.item(0)['SID2_GID10_QID61'],response.rows.item(0)['SID2_GID10_QID63']],function(res){
                var QueryAlreadySelected = 'SELECT SID2_GID10_QID64 FROM survey_result_2 WHERE id != ?';
                dbservice.runQuery(QueryAlreadySelected,[record_id],function(resp){
                    var irisIdArray = [];
                    for(var i = 0; i < resp.rows.length; i++){
                        irisIdArray.push(resp.rows.item(i)['SID2_GID10_QID64']);
                    }
                    
                    for(var i = 0; i < res.rows.length; i++){
                        
                        if($.inArray(res.rows.item(i)['SID1_GID1_QID5'],irisIdArray) === -1){
                            var optionsObject = {};
                            optionsObject['option_type'] = 'select';
                            optionsObject['option_value'] = res.rows.item(i)['SID1_GID1_QID5'];
                            optionsObject['iris_id'] = res.rows.item(i)['SID1_GID1_QID5'];
                            optionsObject['mr_num'] = res.rows.item(i)['SID1_GID1_QID6'];
                            optionsObject['adm_date'] = res.rows.item(i)['SID1_GID1_QID8'];
                            optionsObject['adm_time'] = res.rows.item(i)['SID1_GID1_QID9'];
                            optionsObject['resp_name'] = res.rows.item(i)['SID1_GID1_QID10'];
                            optionsObject['option_next'] = '';
                            optionsObject['option_prompt'] = '';
                            optionsObject['option_text'] = optionsObject['iris_id']+'(N:'+optionsObject['resp_name']+', M:'+optionsObject['mr_num']+', AD:'+optionsObject['adm_date']+', AT:'+optionsObject['adm_time']+')';
                            optionsArary.push(optionsObject);
                        }
                    }
                    console.log('*************************');
                    console.log(optionsArary);
                    $scope.selectOptions = optionsArary;
                });
            },function(error){
                console.log(error);
            });
        },function(error){

        });
    }else{
        $scope.selectOptions = params.QuestAnswers;
    }
	
	
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/select.html'\"></div>";
}



function StoreAnswer(QuestionIndex, $scope, type, rawData, locS, dbservice, $state, $cordovaDevice, $ionicLoading){
	/*console.log($scope.numberAnswer);
	return false;*/
	var answer_of_current_question = '';
	switch(type){

		case'text':
			if(rawData.pattern == 'number'){
				answer_of_current_question = ($scope.numberAnswer.value === undefined)?null:$scope.numberAnswer.value;
			}else if(rawData.question_repeater == 'yes'){
                var textAnswersData = [];
                $('input[name=textAnswer]').each(function(){
                    textAnswersData.push($(this).val());
                });
                answer_of_current_question = JSON.stringify(textAnswersData);
            }else{
				answer_of_current_question = ($scope.$parent.textAnswer === undefined)?null:$scope.textAnswer.value;
			}			
		break;

		case'textarea'://text_only
			answer_of_current_question = $scope.textareaAnswer;
		break;

		case'number':
            if(rawData.question_repeater == 'yes'){
                var numberAnswerJson = {};//field_slug
                $('.numberAnswer').each(function(key){
                    numberAnswerJson[rawData.field_slug+''+(key+1)] = $(this).val();
                });
                answer_of_current_question = JSON.stringify(numberAnswerJson);
            }else{
                answer_of_current_question = $scope.numberAnswer.value;
            }			
		break;

		case'email':
			answer_of_current_question = $scope.emailAnswer;
		break;

		case'radio':
            if(rawData.have_others == 'yes'){
                var radioAnswerCheckedValue = $('.radioButtons:checked').val();
                var answerJson = {};
                if(radioAnswerCheckedValue == 1){
                    answerJson['months'] = $('.surveyTextBox').val();
                }else if(radioAnswerCheckedValue == 2){
                    answerJson['years'] = $('.surveyTextBox').val();
                }
                answer_of_current_question = JSON.stringify(answerJson);
                if(radioAnswerCheckedValue == '998'){
                    answer_of_current_question = 998;
                }
                locS.set('submit_section',$scope.radioAnswer.value);
            }else{
                answer_of_current_question = $scope.radioAnswer.value;
                locS.set('submit_section',$scope.radioAnswer.value);
            }
		break;

		case'checkbox':
			var checkBoxObject = {};
			angular.forEach($scope.$parent.checkboxOptions, function(val, key){
				if(val.option_value != ''){
                    
                    checkBoxObject[val.option_value] = false
                   
				}
			});
			angular.forEach($scope.$parent.checkboxAnswer, function(val,key){
                if(key != 98 || key != '98'){
                    checkBoxObject[key] = (val == false)?val:true;
                }else{
                    checkBoxObject[key] = val;
                }
			});
			answer_of_current_question = JSON.stringify(checkBoxObject);
		break;

		case'select'://dropdown
            if($state.params.QuestId == '2' && $state.params.groupId == '10' && $state.params.surveyId == '2'){
                locS.set('iris_id',$scope.selectAnswer.value);
            }
			answer_of_current_question = $scope.selectAnswer.value;
		break;

		case'datepicker':
			answer_of_current_question = ($scope.textAnswer === undefined)?null:$scope.textAnswer;
		break;

        case'datetimepicker':
            var dateTimeVar = $scope.$parent.datetime;
            // var dateAndTime = dateTimeVar.getFullYear()+'-'+(parseInt(dateTimeVar.getMonth())+1)+'-'+dateTimeVar.getDay();
            // console.log(dateTimeVar);
            // return false;
            try{
                answer_of_current_question = dateTimeVar;
            }catch(e){
                answer_of_current_question = '';
            }
        break;

		case'timepicker':
            try{
                answer_of_current_question = $scope.$parent.$$childTail.textAnswer.getHours()+':'+$scope.$parent.$$childTail.textAnswer.getMinutes();
            }catch(e){
                answer_of_current_question = '';
            }
		break;

        case'image':
            console.log(window.seletcedImages);
            answer_of_current_question = JSON.stringify(window.seletcedImages);
        break;

		case'location':
			answer_of_current_question = ($scope.locAnswer === undefined)?null:$scope.locAnswer;
		break;

		case'repeater':
            locS.set('submit_section','yes');
			var answerObject = [];
            var repeaterErrorStatus = [];
			$('.repeaterRow').each(function(i){
				var questionsObjectArray = {};
				$(this).find('.repeater_field').each(function(j){
                    if($(this).find('input').attr('type') == 'radio'){
                        questionsObjectArray[$(this).find('.textBoxSurvey').attr('key')] = $(this).find('input[type=radio]:checked').val();
                    }else{
                        var answerValue = $(this).find('select').val();
                        console.log(answerValue);
                        if((answerValue == '' || answerValue == null || answerValue == '? undefined:undefined ?') && answerValue != undefined ){
                            repeaterErrorStatus.push('true');
                        }
                        questionsObjectArray[$(this).find('.textBoxSurvey').attr('key')] = $(this).find('select,input,input[type=radio]:checked').val();
                    }
				});
				answerObject.push(questionsObjectArray);
			});
            console.log(repeaterErrorStatus);
            if($.inArray('true',repeaterErrorStatus) !== -1){
                $ionicLoading.show({
                    template: 'Please select all',
                    noBackdrop: false,
                    duration: 1000
                });
                return false;
            }
            
			answer_of_current_question = JSON.stringify(answerObject);
		break;
	}
	/*######################################## HARD CODED ########################################*/
	if(	($state.params.groupId == 5 && $state.params.surveyId == 2)||
				($state.params.groupId == 19 && $state.params.surveyId == 5)){
		if(locS.get('uniqueSerial') != null && locS.get('uniqueSerial') != undefined){
			var oldData = locS.get('uniqueSerial');
			oldData[QuestionIndex] = answer_of_current_question;
			locS.set('uniqueSerial',oldData);
		}else{
			var oldData = {};
			oldData[QuestionIndex] = answer_of_current_question;
			locS.set('uniqueSerial',oldData);
		}
	}
	/*###########################################################################################*/
	saveResult(rawData, locS, dbservice, $state, answer_of_current_question, $cordovaDevice, QuestionIndex);
	return true;
}


function saveResult(questionData, localStorage, dbservice, $state, answer, $cordovaDevice, QuestionIndex){
	var record_id = localStorage.get('record_id');
	QuestionIndex = $state.params.QuestId;
	if(record_id != null){
		//update with where clause
		var Query = 'UPDATE survey_result_'+$state.params.surveyId+' set '+questionData.question_key+' = ?, last_field_id = ?, last_group_id = ? WHERE id = ?';
		dbservice.runQuery(Query,[answer,QuestionIndex,$state.params.groupId,record_id],function(res) {
	          console.log("record updated ");
        }, function (err) {
          console.log(err);
        });
	}else{

		//insert new record
		var NameAndID = localStorage.get('CurrentSurveyNameID');
		var dateForUnique = new Date(Date.now());
        var app_mode = localStorage.get('app_mode');
        if(app_mode == null || app_mode == undefined || app_mode == ''){
            app_mode = 'live';
        }
		var uniqueKey = NameAndID.id+''+dateForUnique.getFullYear()+''+(dateForUnique.getMonth()+1)+''+dateForUnique.getDay()+''+dateForUnique.getHours()+''+dateForUnique.getMinutes()+''+dateForUnique.getSeconds()+''+dateForUnique.getMilliseconds()+''+Math.floor(Math.random() * 10000000);
		var Query = 'INSERT INTO survey_result_'+$state.params.surveyId+'('+questionData.question_key+', survey_started_on, survey_submitted_by, survey_submitted_from, imei, unique_id, device_detail, created_by, created_at, last_field_id, survey_status, last_group_id, record_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';
		dbservice.runQuery(Query,
									[
										answer, localStorage.get('startStamp'), 
										localStorage.get('userId'),'app','NULL',uniqueKey, 
										JSON.stringify($cordovaDevice.getDevice()),
										// 'device_details',
										localStorage.get('userId'), 
										timeStamp(), QuestionIndex,
										'incomplete',
										$state.params.groupId,
                                        app_mode
									],
		function(res) {
          console.log("record created ");
          localStorage.set('record_id',res.insertId);
        }, function (err) {
          console.log(err);
        });
	}
}

function replaceImageShortCodes(rawData, $q, $rootScope, $cordovaFile){
	
	var img='';
	var QuestDesc = rawData.QuestionDesc;
	angular.forEach(rawData.ls.get('SurveyMedia'), function(value, key) {
		var split = key.split('_');
		if(split[0] == 'image'){
			var reg = new RegExp('\\[' + key +'\\]');
			QuestDesc = QuestDesc.replace(reg, '<img ng-src="{{'+key+'}}" style="max-width:100%;" />');
		}

	});
	return QuestDesc;
}

function getDeferdData($scope, $q){
	var splited = value.split('/');
	var splitedLength = splited.length;
	var imagePath = '';
	var deferred = $q.defer();
	document.addEventListener("deviceready", function() {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
			imagePath = fileSystem.root.toURL() + 'SmaartMedia/' + splited[splitedLength-1];
			deferred.resolve(imagePath);
			$rootScope.$apply();
		});
	}, false);
	return deferred.promise;
}

function replaceAudioShortCode(rawData){

	var QuestDesc = rawData.QuestionDesc;
	angular.forEach(rawData.ls.get('SurveyMedia'), function(value, key) {
		var split = key.split('_');
		if(split[0] == 'audio'){
			var nameSplit = value.split('/');
			nameSplit = nameSplit[nameSplit.length-1];
			var rand_class = Math.floor(Math.random() * 1000);
			var reg = new RegExp('\\[' + key +'\\]');
        	QuestDesc = QuestDesc.replace(reg, '<img src="img/375.png" width="50" ng-click="play(\''+nameSplit+'\','+rand_class+')" class="playMusic_'+rand_class+'" ><img src="img/pause-512.png" width="50" ng-click="stop(\''+nameSplit+'\','+rand_class+')" class="pauseMusic_'+rand_class+'" style="display:none;" >');
		}

	});
	//console.log(QuestText);
	return QuestDesc;
}

function checkForMedia(rawData, $q, $rootScope, $cordovaFile){

	var splitedKey;
	var QuestDesc = '';
	rawData.QuestionDesc = replaceAudioShortCode(rawData);
	rawData.QuestionDesc = replaceImageShortCodes(rawData, $q, $rootScope, $cordovaFile);
	return rawData.QuestionDesc;
}

function validatePattern($scope, type, $ionicLoading, pattern, rawData){
	switch(type){
		case'text':
			if(pattern != 'others'){
				/*var reg = eval(pattern);
				if(reg.test($scope.textAnswer)){
					return true;
				}else{
					var message = '';
					if(pattern == /\S+@\S+\.\S+/){
						message = 'Please enter correct email'
					}else if(pattern == /^\d+$/){
						message = 'Enter numbers only!';
					}else if(pattern == /^[a-zA-Z]+$/){
						message = 'Enter alphabets only!';
					}else{
						message = 'Enter correct value!';
					}
					$ionicLoading.show({
				      template: message,
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}*/
				if(pattern == 'email'){
					var reg = /\S+@\S+\.\S+/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Please enter correct email!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'number'){
					var reg = /^\d+$/;
					if(reg.test($scope.$parent.numberAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter numbers only!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'text'){
					var reg = /^[a-zA-Z0-9 ]+$/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter alphabets only!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'url'){
					var reg = /^(ftp|http|https):\/\/[^ "]+$/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter correct url!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
			}else{
				console.log(rawData.otherPattern);
				var reg = eval(rawData.otherPattern);
				if(reg.test($scope.textAnswer)){
					return true;
				}else{
					$ionicLoading.show({
				      template: 'Enter correct data!',
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}
		break;
	}
}

function validation($scope, type, $ionicLoading, rawData, $state){

	switch(type){

        case'timepicker':
            var message = 'Please fill answer';
            if(rawData.field_validations != ''){
                var validationData = JSON.parse(rawData.field_validations);
                angular.forEach(validationData, function(value,key){
                    if(value.field_validation == "required"){
                        message = value.field_validation_message;
                    }
                })
            }
            if($scope.$parent.$$childTail.textAnswer == undefined || $scope.$parent.$$childTail.textAnswer == null){
                $ionicLoading.show({
                  template: message,
                  noBackdrop: false,
                  duration: 1000
                });
                return false;
            }
        break;

		case'text':
			if(rawData.pattern == 'number'){
				if($scope.numberAnswer === undefined || $scope.numberAnswer == null){
					$ionicLoading.show({
				      template: 'Please fill answer!',
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}else{
                var message = 'Please fill answer';
                if(rawData.field_validations != ''){
                    var validationData = JSON.parse(rawData.field_validations);
                    angular.forEach(validationData, function(value,key){
                        if(value.field_validation == "required"){
                            message = value.field_validation_message;
                        }
                    })
                }
				if($scope.textAnswer.value === undefined || $scope.textAnswer.value == ''){
					$ionicLoading.show({
				      template: message,
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}
		break;

		case'text_only'://textarea
			if($scope.textareaAnswer === undefined){
				$ionicLoading.show({
			      template: 'Please fill answer!',
			      noBackdrop: false,
			      duration: 1000
			    });
			    return false;
			}
		break;

		case'number':
            // ############################################ HARD CODED #############################################
            /*if($.inArray(parseInt(rawData.question_id),[50,56,98,149,186]) != -1){
                console.log($scope.$parent.numberAnswer);
                if($scope.$parent.numberAnswer === undefined || $scope.$parent.numberAnswer.value == null || $scope.$parent.numberAnswer.value == ''){
                    return true;
                }else{
                    if($scope.$parent.numberAnswer.value.toString().length < 10 || $scope.$parent.numberAnswer.value.toString().length > 10){
                        $ionicLoading.show({
                          template: 'Please fill mobile in proper format!',
                          noBackdrop: false,
                          duration: 1000
                        });
                        return false;
                    }
                }
            }
            if($.inArray(parseInt(rawData.question_id),[276,275]) != -1){
                console.log($scope.$parent.numberAnswer.value);
                if(/[^\d|(?=+)]/g.test($scope.$parent.numberAnswer.value)){
                    $ionicLoading.show({
                      template: 'Please enter correct digits!',
                      noBackdrop: false,
                      duration: 2000
                    });
                    return false;
                }
                if($scope.$parent.numberAnswer.value == null || $scope.$parent.numberAnswer.value == ''){
                    $ionicLoading.show({
                      template: 'Please mention age with min one and max two digits!',
                      noBackdrop: false,
                      duration: 4000
                    });
                    return false;
                }
                if($scope.$parent.numberAnswer.value.toString().length > 2 || $scope.$parent.numberAnswer.value.toString().length == 0){
                    $ionicLoading.show({
                      template: 'Please mention age with min one and max two digits!',
                      noBackdrop: false,
                      duration: 4000
                    });
                    return false;
                }
            }*/
            // ############################################ HARD CODED #############################################
            
            if($state.params.surveyId == 2 && $state.params.groupId == 10 && $state.params.QuestId == 3){
                if($scope.numberAnswer.value != null){
                    if($scope.numberAnswer.value.toString().length == 0 || $scope.numberAnswer.value.toString().length > 2){
                        $ionicLoading.show({
                          template: 'Invalid Entry',
                          noBackdrop: false,
                          duration: 1000
                        });
                        return false;
                    }
                }
            }
            var message = 'Please select answer';
            if(rawData.field_validations != ''){
                var validationData = JSON.parse(rawData.field_validations);
                angular.forEach(validationData, function(value,key){
                    if(value.field_validation == "required"){
                        message = value.field_validation_message;
                    }
                })
            }
			if((isNaN($scope.$parent.numberAnswer.value) || $scope.$parent.numberAnswer.value == '' || $scope.$parent.numberAnswer.value == null) && $scope.$parent.numberAnswer.value != 0){
				$ionicLoading.show({
			      template: message,
			      noBackdrop: false,
			      duration: 1000
			    });
			    return false;
			}

		break;

		case'email':
			if($scope.emailAnswer === undefined || $scope.emailAnswer == ''){
				$ionicLoading.show({
			      template: 'Enter correct email',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

		case'radio':
            if(rawData.have_others == 'yes'){
                if($scope.radioAnswer.value === undefined || $scope.radioAnswer.value == '' || $scope.radioAnswer.value == '{}'){
                    $ionicLoading.show({
                      template: 'Please select',
                      noBackdrop: false,
                      duration: 1000
                    });

                    return false;
                }
                if($.inArray(parseInt($scope.radioAnswer.value),[1,2]) !== -1){
                    var otherValue = $('.surveyTextBox').val();
                    if(otherValue == '' || otherValue == null){
                        $ionicLoading.show({
                          template: 'Please enter',
                          noBackdrop: false,
                          duration: 1000
                        });
                        return false;
                    }else{
                        if($.inArray(parseInt($scope.radioAnswer.value),[1,2]) !== -1){
                            if(parseInt($scope.radioAnswer.value) == 1){ //means month
                                var textValue = parseInt($('.surveyTextBox').val());
                                if(textValue < 0 || textValue > 12){
                                    $ionicLoading.show({
                                      template: 'Value should not lass then 0 or greater than 12',
                                      noBackdrop: false,
                                      duration: 3000
                                    });
                                    return false;
                                }
                                return true;
                            }
                            if(parseInt($scope.radioAnswer.value) == 2){ //means year
                                var textValue = parseInt($('.surveyTextBox').val());
                                if(textValue < 1 || textValue > 150){
                                    $ionicLoading.show({
                                      template: 'Value should not lass then 1 or greater than 150',
                                      noBackdrop: false,
                                      duration: 3000
                                    });
                                    return false;
                                }
                                return true;
                            }
                        }
                    }
                }
            }
			if($scope.radioAnswer.value === undefined || $scope.radioAnswer.value == ''){
				$ionicLoading.show({
			      template: 'Please select answer',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

		case'checkbox':
            var message = 'Please select answer';
            if(rawData.field_validations != ''){
                var validationData = JSON.parse(rawData.field_validations);
                angular.forEach(validationData, function(value,key){
                    if(value.field_validation == "required"){
                        message = value.field_validation_message;
                    }
                })
            }
			//var CheckBoxVal = $scope.$parent.checkboxAnswer;
			if($scope.$parent.checkboxAnswer === undefined){// || validateCheckBoxSelection(CheckBoxVal) == false){
				$ionicLoading.show({
			      template: message,
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}else{
                return true;
				/*var validateStatus = true;
				angular.forEach($scope.$parent.checkboxAnswer, function(value, key){
					if(value == false){
						validateStatus = false;
					}
				});
                console.log(validateStatus);
				if(validateStatus == true){
					return true;
				}else{
					$ionicLoading.show({
				      template: 'Please select answer',
				      noBackdrop: false,
				      duration: 1000
				    });
					return false;
				}*/
			}
		break;

        case'datepicker':
            var message = 'Please fill answer';
            if(rawData.field_validations != ''){
                var validationData = JSON.parse(rawData.field_validations);
                angular.forEach(validationData, function(value,key){
                    if(value.field_validation == "required"){
                        message = value.field_validation_message;
                    }
                })
            }
            if($scope.$parent.textAnswer == undefined || $scope.$parent.textAnswer == '' || $scope.$parent.textAnswer == null){
                $ionicLoading.show({
                  template: message,
                  noBackdrop: false,
                  duration: 1000
                });
                return false;
            }
        break;

		case'select'://dropdown
			/*console.log(typeof $scope.$parent.selectAnswer);
			if(typeof $scope.$parent.selectAnswer != 'object'){
				console.log('Not object')
			}
			return false;*/
            var message = 'Please select answer';
			if($scope.$parent.selectAnswer.value == ''){
                if(rawData.field_validations != ''){
                    var validationData = JSON.parse(rawData.field_validations);
                    angular.forEach(validationData, function(value,key){
                        console.log(value);
                        if(value.field_validation == "required"){
                            message = value.field_validation_message;
                        }
                    })
                }
				$ionicLoading.show({
			      template: message,
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

	}
	return true;
}

function validateCheckBoxSelection(checkBoxObj){
	
	var status = false;
	angular.forEach(checkBoxObj, function(value, key){
		
		if(value == true){

			status = true;
		}
	});

	return status;
}

function setSurveyNameAndId($state, localStorageService, index, dbservice){

	
	var SurveyNameID = {};
	var surveyData = '';
	var getSurveyData = 'SELECT * FROM survey_data WHERE survey_id = ?';
	dbservice.runQuery(getSurveyData,[$state.params.surveyId], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	surveyData = row;
      	SurveyNameID['id'] = surveyData[0].id;
		SurveyNameID['name'] = surveyData[0].name;
		localStorageService.set('CurrentSurveyNameID',SurveyNameID);
	});
}

function findQuestionIndex(rawData, questionId){

	var QuestKey = '';
	angular.forEach(rawData, function(value, key){

		if(value.question_id == questionId){

			QuestKey = key;
		}
	});

	return QuestKey;
}

function checkConditions(conditions, rawData, localStorageService){

	
	var splitedCond = conditions.split('|');
	var compareWithval = '';
	var RepQuestIDs = splitedCond[0].match(/[\w]+(?=])/g);
	var NexQuestID = splitedCond[1].match(/[\w]+(?=])/g);
	
	var AllAnswers = localStorageService.get('allAnswers');
	var NextQuestInd = findQuestionIndex(rawData, NexQuestID[0]);
	var ansByIds = [];
	angular.forEach(RepQuestIDs, function(vals, keys){
		angular.forEach(AllAnswers, function(value, key){

			if(value.questid == vals){
				ansByIds.push(value.answer);
			}
		});
	})
	var index = 0;
	angular.forEach(RepQuestIDs, function(value, key){

		var reg = new RegExp('\\[\\[' + value +'\\]\\]');
		splitedCond[0] = splitedCond[0].replace(reg, '"'+ansByIds[index]+'"');
		index++;
	});
	
	
	var returnObj = {};
	returnObj['next'] = NextQuestInd;
	
	if(eval(splitedCond[0])){

		returnObj['status'] = 'false';
		return returnObj;
	}else{
		returnObj['status'] = 'true';
		return returnObj;
	}

}

function finishSurvey($state, localStorageService, $ionicLoading, $cordovaGeolocation, dbservice, $scope){
	window.surveyId = $state.params.surveyId;
	window.groupId = $state.params.groupId;
	var getGroupsData = 'SELECT * FROM survey_sections WHERE survey_id = ?';
	var currentSurveyGroups = '';
	dbservice.runQuery(getGroupsData, [$state.params.surveyId], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	currentSurveyGroups = row;
	})
	//var groupsData = localStorageService.get('GroupsData');
    var record_id = localStorageService.get('record_id');
	/*var currentSurveyGroups = $.grep(groupsData, function(value){
		return value.survey_id == $state.params.surveyId;
	});*/

	
	var Query = 'SELECT completed_groups from survey_result_'+$state.params.surveyId+' WHERE id = ?';
	var surveyStatus = [];
	dbservice.runQuery(Query,[record_id],function(res) {
		
		if(res.rows.length != 0 && res.rows.item(0).completed_groups != null){

			var completedGroup = JSON.parse(res.rows.item(0).completed_groups);
			completedGroup.push(parseInt(window.groupId));
            var submit_section = localStorageService.get('submit_section');
			var Query = 'UPDATE survey_result_'+window.surveyId+' SET completed_groups = ?, last_group_id = ? WHERE id = ?';
            
            dbservice.runQuery(Query,[JSON.stringify(completedGroup),'',record_id],function(res) {
                localStorageService.set('completedGroups',completedGroup);
                angular.forEach(currentSurveyGroups, function(group, key){
                    if($.inArray(group.group_id, completedGroup) != -1){
                        surveyStatus.push('completed');
                    }else{
                        surveyStatus.push('incomplete');
                    }
                });
                if($.inArray('incomplete', surveyStatus) != -1){
                    surveyStatus = 'incomplete';
                }else{
                    surveyStatus = 'completed';
                }
                if(surveyStatus == 'completed'){
                    var Query = 'UPDATE survey_result_'+window.surveyId+' SET survey_status = ?, last_group_id = ? WHERE id = ?';
                    dbservice.runQuery(Query,[surveyStatus,'',record_id],function(res) {
                        $state.go('app.surveyGroup',{id: window.surveyId});
                        console.log("survey completed ");
                    }, function (err) {
                      console.log(err);
                    });
                    console.log(surveyStatus);
                    $state.go('app.success',{},{location:'replace'});
                }else{
                    $ionicLoading.show({
                      template: $scope.section_submitted_text,
                      noBackdrop: false,
                      duration: 2000
                    });
                    $state.go('app.surveyGroup',{id: $state.params.surveyId});
                }
              console.log("group updated");
            }, function (err) {
              console.log(err);
            });

		}else{
            var submit_section = localStorageService.get('submit_section');
            
			var completedGroup = [];
			completedGroup.push(parseInt(window.groupId));
			localStorageService.set('completedGroups',completedGroup);
            
			angular.forEach(currentSurveyGroups, function(group, key){
				if($.inArray(group.group_id, completedGroup) != -1){
	    			surveyStatus.push('completed');
	    		}else{
	    			surveyStatus.push('incomplete');
	    		}
			});
			if($.inArray('incomplete', surveyStatus) != -1){
				surveyStatus = 'incomplete';
			}else{
				surveyStatus = 'completed';
			}
            if(submit_section == 'yes' || submit_section != 'no'){
    			var Query = 'UPDATE survey_result_'+ window.surveyId +' SET completed_groups = ?, last_group_id = ?, survey_status = ? WHERE id = ?';
    			dbservice.runQuery(Query,[JSON.stringify(completedGroup),'',surveyStatus,record_id],function(res) {
    				localStorageService.set('completedGroups',completedGroup);
                    $ionicLoading.show({
                      template: $scope.section_submitted_text,
                      noBackdrop: false,
                      duration: 2000
                    });
    				$state.go('app.surveyGroup',{id: $state.params.surveyId});
                  	console.log("group updated");
                  	console.log(surveyStatus);
                  	if(surveyStatus == 'completed'){
                  		$state.go('app.success',{},{location:'replace'});
                  	}
                }, function (err) {
                  console.log(err);
                });

            }else{
                $ionicLoading.show({
                  template: $scope.section_discarded_text,
                  noBackdrop: false,
                  duration: 2000
                });
                $state.go('app.surveyGroup',{id: $state.params.surveyId});
            }
		}
    }, function (err) {
      console.log(err);
    });
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    var returnArray = {};
    returnArray['h'] = hours;
    returnArray['m'] = minutes;
    returnArray['s'] = seconds;
    returnArray['ms'] = milliseconds;
    return returnArray;
}

function countdown($scope){
	if($scope.min == "00" && $scope.hour == "00" && $scope.sec == "00"){

		return true;
	}
	var hr 	= parseInt($scope.hour);
	var min = parseInt($scope.min);
	var sec = parseInt($scope.sec);
	
	if((sec - 1) < 10){
		$scope.sec = "0"+(sec - 1);
	}else{
		$scope.sec = sec - 1;
	}
	
	if(sec <= 0){
		$scope.sec = 59;
	}
	if(parseInt($scope.sec) == 0){
		var checkMin = min - 1;
		if(checkMin < 0){
			if(hr == 0){
				console.log('Finish');
			}else{
				if(($scope.hour - 1)<10){
					$scope.hour = "0"+($scope.hour - 1);
				}else{
					$scope.hour = $scope.hour - 1;
				}
				$scope.min = 59;
			}
		}else{
			if((min-1)<10){

				$scope.min = "0"+(min - 1);
			}else{

				$scope.min = min - 1;
			}
			$scope.sec = "00";
		}
	}
}