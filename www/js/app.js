
angular.module('smaart', ['ionic', 'smaart.controllers', 'smaart.services', 'smaart.surveyCtrl','smaart.surveyListCTRL', 'smaart.dashboard', 'LocalStorageModule', 'ionic-datepicker','ngMaterial','ionic-timepicker','smaart.settingsCTRL'])

.run(function($ionicPlatform, $cordovaSQLite) {

  $ionicPlatform.ready(function() {
    if (window.cordova) {
        window.db = $cordovaSQLite.openDB({ name: "smaart.db", iosDatabaseLocation: 'default' }); //device
      console.log("Android");
    }else{
        window.db = window.openDatabase("smaart.db", '1', 'my', 1024 * 1024 * 100); // browser
        //console.log("browser");
    }
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(['$compileProvider', function($compileProvider) {
       $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|content|file|blob|data):/);
}])

.config(function (ionicTimePickerProvider) {
    var timePickerObj = {
      inputTime: (((new Date()).getHours() * 60 * 60) + ((new Date()).getMinutes() * 60)),
      format: 12,
      step: 15,
      setLabel: 'Set',
      closeLabel: 'Close'
    };
    ionicTimePickerProvider.configTimePicker(timePickerObj);
  })
.config(function( $mdGestureProvider ) {
    $mdGestureProvider.skipClickHijack();
})

.constant('AppConfig', {'QuestionOrder': 'false'})
.constant('ApiURL', 'http://iris.fhts.ac.in/api/')

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.dashboard', {
    url: '/dashboard',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/dashboard.html',
        controller: 'dashboardCtrl'
      }
    }
  })

  .state('app.ListSurvey', {
    url: '/listsurvey',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/list-survey.html',
        controller: 'dashboardCtrl'
      }
    }
  })

  .state('app.success', {
    url: '/success',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/success.html',
        controller: 'dashboardCtrl'
      }
    }
  })


  .state('app.surveylist', {
    url: '/surveylist',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/survey-list.html',
        controller: 'surveyListCTRL'
      }
    }
  })

.state('app.reactivate', {
    url: '/reactivate',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/reactivate.html',
        controller: 'surveyListCTRL'
      }
    }
  })

//about
.state('app.about', {
    url: '/about',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/about.html',
        controller: 'dashboardCtrl'
      }
    }
  })
  .state('app.help', {
    url: '/help',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/help.html',
        controller: 'dashboardCtrl'
      }
    }
  })
  .state('app.settings', {
    url: '/settings',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/settings.html',
        controller: 'settingsCTRL'
      }
    }
  })
  .state('app.incomplete', {
    url: '/incomplete/:surveyid',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/incomplete.html',
        controller: 'incompleteSurveyCTLR'
      }
    }
  })

.state('app.completed', {
    url: '/completed',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/completed.html',
        controller: 'CompleteSurveyCTLR'
      }
    }
  })

  .state('app.survey', {
      url: '/survey/:surveyId/:groupId/:QuestId',
      views: {
        'menuContent': {
          templateUrl: 'templates/survey.html'
        }
      }
    })
  .state('app.surveyGroup', {
      url: '/surveyGroup/:id',
      cache: false,
      views: {
        'menuContent': {
          templateUrl: 'templates/surveyGroup.html',
          controller: 'surveyGroup'
        }
      }
    })
  .state('app.page1', {
      url: '/page1',
      cache: false,
      views: {
        'menuContent': {
          templateUrl: 'templates/page1.html',
          // controller: 'surveyGroup'
        }
      }
    })
  .state('login', {
    cache: false,
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })
  .state('index', {
    cache: false,
    url: '/index',
    templateUrl: 'templates/index.html',
    controller: 'IndexCtrl'
  })
  .state('register', {
    cache: false,
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
