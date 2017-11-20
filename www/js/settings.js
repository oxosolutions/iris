'use strict'

angular.module('smaart.settingsCTRL', ['ngCordova'])
.controller('settingsCTRL', function($scope, $ionicLoading, localStorageService, $state, $ionicPopup, appData, appActivation, dbservice){

    $scope.app = {};
    var current_mode = localStorageService.get('app_mode');
    if(current_mode == 'test'){
        $scope.app.testingMode = true;
        $scope.app.application_mode = true;
        $scope.enable_disable = 'Test';
    }else{
        $scope.app.testingMode = false;
        $scope.enable_disable = 'Live';
    }

    $scope.changeApplicationMode = function(app){
        if(app.application_mode == true){
            $scope.app.testingMode = true;
            localStorageService.set('app_mode','test');
            $scope.enable_disable = 'Test';
        }else{
            $scope.app.testingMode = false;
            localStorageService.set('app_mode','live');
            $scope.enable_disable = 'Live';
        }
    }

    $scope.checkAppMode = function(){
        if(current_mode == 'test'){
           return true;
        }else{
            return false;
        }
    }

    $scope.checkSurveyUpdate = function(){
        // ActivationCode
        var activation_code = localStorageService.get('ActivationCode');
        var formData = new FormData;
        formData.append('activation_key',activation_code);
        $ionicLoading.show({
            template: '<ion-spinner class="spinner-energized"></ion-spinner>',
            noBackdrop: false
        });
        appActivation.appActivate(formData).then(function(ApiRes){

            if(ApiRes.data.status == 'error'){
                $ionicLoading.show({
                    template: 'Invalid Activation Code',
                    noBackdrop: false,
                    duration: 1000
                });
            }else{
                var query = 'SELECT * FROM settings WHERE key = ?';
                dbservice.runQuery(query,['survey_update_date'],function(res){
                    if(ApiRes.data.settings.survey_update_date > res.rows.item(0).value){
                    // if(ApiRes.data.settings.survey_update_date){
                        $ionicLoading.hide();
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Update Available version: <br/>'+ApiRes.data.settings.survey_update_date,
                            template: 'Do you want to update the survyes?',
                            cancelText: 'No',
                            okText: 'Update'
                        });
                        confirmPopup.then(function(res){
                            $state.go('app.reactivate');
                        });
                    }else{
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'No updates available!',
                            content: 'There are no any updates found.'
                        }).then(function(result) {
                            return false;       
                        });
                    }
                }, function(error){
                    console.error(error);
                });
            }
        });
        return false;
    }

});