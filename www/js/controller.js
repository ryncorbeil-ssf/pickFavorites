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
'ServerBallotService', 'ServerCurrentTotalsService',
function($scope, $state, UserService, $ionicHistory, $window, SSFAlertsService, CandidatesService, 
    ServerBallotService, ServerCurrentTotalsService) {
    $scope.candidates = CandidatesService.getCandidates();
    var newBallot = {};
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

    
    $scope.doneButtonTapped = function(form)
    {
        if(selected.length > 0)
        {   
            updateModels();
        }
    };
    
    function updateModels()
    {
        newBallot["first"] = selected[0].name;
        newBallot["second"] = selected[1].name;
        newBallot["third"] = selected[2].name;
        
        newBallot["voterId"] = $window.localStorage['userID'];
        var date = new Date();
        newBallot["date"] = date.toUTCString();
        
        updateTotals();
    }
    
    function nameToId(name)
    {
        var id = "";
        for (var i=0; i<$scope.candidates.length; i++)
        {
            if (name == $scope.candidates[i].name) {
                id = $scope.candidates[i].id;
                break;
            }
        }
        return id;
    }
    
    function upvoteAndAddBallot(){
                ServerCurrentTotalsService.upvoteFirst(nameToId(newBallot.first), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {
                ServerCurrentTotalsService.upvoteSecond(nameToId(newBallot.second), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {
                ServerCurrentTotalsService.upvoteThird(nameToId(newBallot.third), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {
                        ServerBallotService.create(newBallot, $window.localStorage['token'])
                        .then(function(response) {
                            if (response.status === 200) {
                                $ionicHistory.nextViewOptions({
                                  disableBack: true
                                });
                                //TKResultsButtonService.setShouldShowMenuButton(true);
                                $state.go('graph');
                            } else if(response.status !== 401) {
                                // invalid response
                                confirmPrompt();
                            }
                        }, function(response) {
                            // something went wrong
                            confirmPrompt();
                        });                        
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });                        
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });                        
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });        
        
    }
    function updateTotals()
    {
        // retrieve voter's last ballot
        ServerBallotService.getLatestBallot($window.localStorage['userID'], $window.localStorage['token'])
        .then(function(response) {
            if (response.status === 200 && response.data.length > 0) {
                // downvote first, second, third choices from latest ballot (if any)
                ServerCurrentTotalsService.downvoteFirst(nameToId(response.data[0].first), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {
                ServerCurrentTotalsService.downvoteSecond(nameToId(response.data[0].second), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {
                ServerCurrentTotalsService.downvoteThird(nameToId(response.data[0].third), $window.localStorage['token'])
                .then(function(res1) {
                    if (res1.status === 200) {                        
                        // upvote first, second, third choice from new ballot  
                        upvoteAndAddBallot();
                
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });                        
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });                        
                    }
                }, function(res2) {
                    // something went wrong
                    confirmPrompt();
                });
                        
            } else {
                // must be the first time this voter has voted.
                upvoteAndAddBallot();
            }
        }, function(response) {
            // something went wrong
            confirmPrompt();
        }); 
    }
    
    function confirmPrompt()
    {
        SSFAlertsService.showConfirm("Warning","The ballot could not be saved at the moment, do you want to try again?")
        .then(function(response){
            if (response == true) {
                performRequest();
            }else {
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                //TKResultsButtonService.setShouldShowMenuButton(true);
                $state.go('graph');
            }
        });
    }
}])

.controller('GraphCtrl',['$scope', '$state', 'UserService', '$ionicHistory', '$window', 'SSFAlertsService', 'CandidatesService',
'ServerBallotService', 'ServerCurrentTotalsService',
function($scope, $state, UserService, $ionicHistory, $window, SSFAlertsService, CandidatesService, ServerBallotService,
ServerCurrentTotalsService) {

    $scope.menuButtonTapped = function()
    {
        $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableBack: true
        });
        $state.go('lobby');
    };
    
    var candidates = CandidatesService.getCandidates();
    
    function compareName(a, b) {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;        
    }
    
    function idToName(id)
    {
        var name = "";
        for (var i=0; i<candidates.length; i++)
        {
            if (id == candidates[i].id) {
                name = candidates[i].name;
                break;
            }
        }
        return name;
    }
    
    $scope.labels = [];
    $scope.data =[[]];
    var totalPossibleScore = 0;
                    
    function showCurrentRankings() {
        // get current rankings for all candidates.
        ServerCurrentTotalsService.getRankings($window.localStorage['token'])
        .then(function(response) {
            //if (response.status === 200 && response.data.length > 0) {
            
                // display in chart
                var rankings = response.data.status;

                
                for(var i=0; i<candidates.length; i++){
                    $scope.labels.push(idToName(rankings[i].candidateId));
                    totalPossibleScore += rankings[i].score;
                }
                
                for(var i=0; i<candidates.length; i++){
                    $scope.data[0].push(returnPercentage(rankings[i].score));
                }
                
                //$scope.labels.sort(compareName);

                $scope.options = {
                    scaleIntegersOnly: true,
                    animation: false,
                    responsive:true,
                    maintainAspectRatio: false,
                    scaleOverride: true,
                    scaleSteps: 4,
                    scaleStepWidth: 25,
                    scaleStartValue: 0,
                    scaleLabel: "<%=value%>"+"%",
                    tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value.toFixed(0) %>"+"%",
                };
                
                $scope.colours = [{
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(15,187,25,1)",
                    pointColor: "rgba(15,187,25,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,0.8)"
                }];
                
                function returnPercentage (value)
                {
                    return (value/totalPossibleScore)*100;
                }
        });
    }
    
    showCurrentRankings();


}])
;
