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

});