angular.module('RESTConnection', [])
.constant('ENDPOINT_URL', 'https://pick-favorites-rcorbeil.c9.io/api/')

.service('UserService', ['$http', 'ENDPOINT_URL', 
function ($http, ENDPOINT_URL) {
  var service = this,
  path = 'Voters/';
  
  function getUrl() {
    return ENDPOINT_URL + path;
  }
  
  service.create = function (user) {
    return $http.post(getUrl(), user);
  };
  
  service.login = function(user) {
    user["ttl"] = 1209600000;
    return $http.post(getUrl()+"login",user);
  };
  
  /*
  service.logout = function(token) {
      return $http.post(getUrl()+"logout?access_token="+token
    );
  };
  */
  
  service.logout = function(token) {
    return $http({
        url: getUrl()+"logout",
        method: "POST",
        headers: {
            'Authorization': token
        }
     });
  };
  
}])

.service('ServerCandidateService', ['$http', 'ENDPOINT_URL',
function ($http,  ENDPOINT_URL) {
  var service = this,
  path = 'Candidates/';

  function getUrl() {
    return ENDPOINT_URL + path;
  }

  service.all = function (token) {
    return $http.get(getUrl(), {
        params: { access_token: token }
    });
  };

}])
.service('ServerBallotService', ['$http', 'ENDPOINT_URL', 
function ($http, ENDPOINT_URL) {
  var service = this,
  path = 'Ballots/';

  function getUrl() {
    return ENDPOINT_URL + path;
  }

  service.create = function(ballot, token) {
    return $http({
        url: getUrl(),
        method: "POST",
        data: ballot,
        headers: {
            'Authorization': token
        }
     });
  };
  
  service.getLatestBallot = function(userID, token)
  {
    return $http.get(getUrl()+"?filter[where][voterId]="+userID+"&filter[order]=date DESC&filter[limit]=1",{
        params: { access_token: token }
    });
  };
  
  service.all = function(userID, token)
  {
    return $http.get(getUrl()+"?filter[where][voterId]="+userID,{
        params: { access_token: token }
    });
  };

}])

.service('ServerCurrentTotalsService', ['$http', 'ENDPOINT_URL', 
function ($http, ENDPOINT_URL) {
  var service = this,
  path = 'CurrentTotals/';

  function getUrl() {
    return ENDPOINT_URL + path;
  }

  service.upvoteFirst = function(candidateId, token) {
    return $http({
        url: getUrl()+"upvoteFirst",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.upvoteSecond = function(candidateId, token) {
    return $http({
        url: getUrl()+"upvoteSecond",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.upvoteThird = function(candidateId, token) {
    return $http({
        url: getUrl()+"upvoteThird",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.downvoteFirst = function(candidateId, token) {
    return $http({
        url: getUrl()+"downvoteFirst",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.downvoteSecond = function(candidateId, token) {
    return $http({
        url: getUrl()+"downvoteSecond",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.downvoteThird = function(candidateId, token) {
    return $http({
        url: getUrl()+"downvoteThird",
        method: "POST",
        headers: {
            'Authorization': token,
            'id': candidateId
        }
     });
  };
  
  service.getCurrentTotal = function(candidateId, token)
  {
    return $http.get(getUrl()+"findOne/?filter[where][candidateId]="+candidateId+"&filter[order]=date DESC",{
        params: { access_token: token }
    });
  };
              


/*
  service.getRankings = function(token)
  {
    return $http.post(getUrl()+"getRankings",{
        params: { access_token: token }
    });
  };
  */
  service.getRankings = function(token)
  {
    return $http.post(getUrl()+"getRankings/?access_token="+token,{ });
  };
  
}])
;