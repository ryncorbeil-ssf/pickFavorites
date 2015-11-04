angular.module('starter.controllers', [])

.controller('LoginCtrl',['$scope', '$state', 'UserService', '$ionicHistory', '$window', 'SSFAlertsService',
function($scope, $state, UserService, $ionicHistory, $window, SSFAlertsService) {
    $scope.user = {};
    
    var rememberMeValue;
    if($window.localStorage["rememberMe"] === undefined || $window.localStorage["rememberMe"] == "true") {
        rememberMeValue = true;
    }else {
        rememberMeValue = false;
    }
    
    $scope.checkbox = {
        rememberMe : rememberMeValue
    };
    

    if($window.localStorage["username"]!== undefined && rememberMeValue === true) {
        $scope.user.email = $window.localStorage["username"];
    }

    
    $scope.loginSubmitForm = function(form)
    {
        if(form.$valid)
        {   
            UserService.login($scope.user)
            .then(function(response) {
                if (response.status === 200) {
                    //Should return a token
                    $ionicHistory.nextViewOptions({
                      historyRoot: true,
                      disableBack: true
                    });
                    $state.go('lobby');
                    
                    $window.localStorage['userID'] = response.data.userId;
                    $window.localStorage['token'] = response.data.id;
                    
                    if($scope.checkbox.rememberMe) {
                        $window.localStorage["username"] = $scope.user.email;
                    }else {
                        delete $window.localStorage["username"];
                        $scope.user.email = "";
                    }
                    $window.localStorage["rememberMe"] = $scope.checkbox.rememberMe;
                    $scope.user.password = "";
                    form.$setPristine();
                } else {
                    // invalid response
                    if(response.status === 401)
                    {
                        SSFAlertsService.showAlert("Error","Incorrect username or password");
                    }else {
                        SSFAlertsService.showAlert("Error", "Something went wrong, try again.");
                    }
                }
            }, function(response) {
                // Code 401 corresponds to Unauthorized access, in this case, the email/password combination was incorrect.
                if(response.status === 401)
                {
                    SSFAlertsService.showAlert("Error","Incorrect username or password");
                }else if(response.data === null) {
                //If the data is null, it means there is no internet connection.
                    SSFAlertsService.showAlert("Error","The connection with the server was unsuccessful, check your internet connection and try again later.");
                }else {
                    SSFAlertsService.showAlert("Error","Something went wrong, try again.");
                }
                
            });
        }
    };
}])
.controller('RegisterCtrl',['$scope', '$state', 'UserService', '$ionicHistory','$window', 'SSFAlertsService',
function($scope, $state, UserService, $ionicHistory, $window, SSFAlertsService) {
    $scope.user = {};
    $scope.repeatPassword = {};
    $scope.signupForm = function(form)
    {
        if(form.$valid)
        {   
            if($scope.user.password !== $scope.repeatPassword.password)
            {
                SSFAlertsService.showAlert("Warning","Passwords must match");
            }else {
                UserService.create($scope.user)
                .then(function(response) {
                    if (response.status === 200) {
                        loginAfterRegister();
                        form.$setPristine();
                    } else {
                        // status 422 in this case corresonds to the email already registered to the DB
                        if(response.status === 422)
                        {
                            SSFAlertsService.showAlert("Warning","The email is already taken.");
                        }else if(response.data === null){
                             //If the data is null, it means there is no internet connection.
                            SSFAlertsService.showAlert("Error","The connection with the server was unsuccessful, check your internet connection and try again later.");
                        }else {
                            SSFAlertsService.showAlert("Error","Something went wrong, try again.");
                        }
                    }
                }, function(response) {
                    // status 422 in this case corresonds to the email already registered to the DB
                    if(response.status === 422)
                    {
                        SSFAlertsService.showAlert("Warning","The email is already taken.");
                    }else if(response.data === null){
                         //If the data is null, it means there is no internet connection.
                        SSFAlertsService.showAlert("Error","The connection with the server was unsuccessful, check your internet connection and try again later.");
                    }else {
                        SSFAlertsService.showAlert("Error","Something went wrong, try again.");
                    }
                });
            }
        }
    };
    //Required to get the access token
    function loginAfterRegister()
    {
        UserService.login($scope.user)
        .then(function(response) {
            if (response.status === 200) {
                //Should return a token
                $window.localStorage["userID"] = response.data.userId;
                $window.localStorage['token'] = response.data.id;
                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                });
                $state.go('lobby');
            } else {
                // invalid response
                $state.go('landing');
            }
            resetFields();
        }, function(response) {
            // something went wrong
            $state.go('landing');
            resetFields();
        });
    }
    
    function resetFields()
    {
        $scope.user.email = "";
        $scope.user.firstName = "";
        $scope.user.lastName = "";
        $scope.user.organization = "";
        $scope.user.password = "";
        $scope.repeatPassword.password = "";
    }
}])

.controller('LobbyCtrl',['$scope', '$state', '$ionicHistory', 'UserService','$window', 
 'SSFAlertsService', 'ServerCandidateService', 'CandidatesService',
function($scope, $state, $ionicHistory, UserService, $window,  
 SSFAlertsService, ServerCandidateService, CandidatesService) {
    $scope.$on('$ionicView.enter', function() {
     // Code you want executed every time view is opened
        //CandidatesService.resetCandidates();
    });
    
    $scope.logout = function()
    {
        UserService.logout($window.localStorage.token)
        .then(function(response) {
            //The successful code for logout is 204
            if(response.status === 204)
            {
                delete $window.localStorage['token'];
                delete $window.localStorage['userID'];
                $ionicHistory.nextViewOptions({
                  historyRoot: true,
                  disableBack: true
                });
                $state.go('landing');
            }else {
                 SSFAlertsService.showAlert("Error","Could not logout at this moment, try again.");
            }
        }, function(response) {
            SSFAlertsService.showAlert("Error","Could not logout at this moment, try again.");
        });
    };
    
    //Get Candidates initially if they are not already stored
    if(CandidatesService.candidatesLength() === 0)
        getCandidates();
        
    function getCandidates()
    {
        ServerCandidateService.all($window.localStorage['token'])
        .then(function(response) {
            if (response.status === 200) {
                var candidates = response.data;
                CandidatesService.setCandidates(candidates);
            } else if(response.status !== 401) {
                // invalid response
                confirmPrompt();
            }
        }, function(response) {
            // something went wrong
            confirmPrompt();
        });
    }
    
    function confirmPrompt()
    {
        SSFAlertsService.showConfirm("Error","The candidates could not be retrieved at this time, do you want to try again?")
        .then(function(response) {
            if (response == true) {
                getCandidates();
            }
        });
    }
    
    $scope.voteButtonTapped = function()
    {
        if(CandidatesService.candidatesLength() === 0)
            getCandidates();
        
        $state.go('vote');
        
    };
}])

.controller('VoteCtrl',['$scope', '$state', 'UserService', '$ionicHistory', '$window', 'SSFAlertsService', 'CandidatesService',
function($scope, $state, UserService, $ionicHistory, $window, SSFAlertsService, CandidatesService) {
    $scope.candidates = CandidatesService.getCandidates();
    
    var selected = [];

    $scope.clicked = function (member) {
        var index = selected.indexOf(member);
        if(index > -1) {
            selected.splice(index, 1);
            member.selected = false;
            
            var rankOfUnselected = $scope.candidates[$scope.candidates.indexOf(member)].rank;
            $scope.candidates[$scope.candidates.indexOf(member)].rank = null;
            
            for (var i=0; i<$scope.candidates.length; i++) {
                if ($scope.candidates[i].rank != undefined && $scope.candidates[i].rank != null){
                    if ($scope.candidates[i].rank > rankOfUnselected ){
                        $scope.candidates[i].rank--;
                        if ($scope.candidates[i].rank == 0 ){
                            $scope.candidates[i].rank = null;
                        }
                    }
                }
            }
        } else {
            selected.push(member);
            member.selected = true;
            
            $scope.candidates[$scope.candidates.indexOf(member)].rank = selected.length;
        
        }
        
    }

    
    $scope.loginSubmitForm = function(form)
    {
        if(form.$valid)
        {   
            UserService.login($scope.user)
            .then(function(response) {
                if (response.status === 200) {
                    //Should return a token
                    $ionicHistory.nextViewOptions({
                      historyRoot: true,
                      disableBack: true
                    });
                    $state.go('lobby');
                    
                    $window.localStorage['userID'] = response.data.userId;
                    $window.localStorage['token'] = response.data.id;
                    
                    if($scope.checkbox.rememberMe) {
                        $window.localStorage["username"] = $scope.user.email;
                    }else {
                        delete $window.localStorage["username"];
                        $scope.user.email = "";
                    }
                    $window.localStorage["rememberMe"] = $scope.checkbox.rememberMe;
                    $scope.user.password = "";
                    form.$setPristine();
                } else {
                    // invalid response
                    if(response.status === 401)
                    {
                        SSFAlertsService.showAlert("Error","Incorrect username or password");
                    }else {
                        SSFAlertsService.showAlert("Error", "Something went wrong, try again.");
                    }
                }
            }, function(response) {
                // Code 401 corresponds to Unauthorized access, in this case, the email/password combination was incorrect.
                if(response.status === 401)
                {
                    SSFAlertsService.showAlert("Error","Incorrect username or password");
                }else if(response.data === null) {
                //If the data is null, it means there is no internet connection.
                    SSFAlertsService.showAlert("Error","The connection with the server was unsuccessful, check your internet connection and try again later.");
                }else {
                    SSFAlertsService.showAlert("Error","Something went wrong, try again.");
                }
                
            });
        }
    };
}])
;