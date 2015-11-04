angular.module('PCServicesModule', [])
.service('CandidatesService', function () {
    
    var service = this;
    var candidates = [];
    
    service.setCandidates = function(serverCandidates)
    {
        candidates = serverCandidates;
    };
    
    service.getCandidates = function()
    {
        return candidates;
    }
    /*
    service.getQuestion = function(questionID)
    {
        var results = [];
        questions.forEach(function(question){
            //Search for questions with the specified question ID
            if(question.Question_Number == questionID)
                results.push(question);
        }); 
        return results;
    };
    */
    
    service.candidatesLength = function()
    {
        return candidates.length;
    };
    
})
