/* global Parse */

//Utilities
function isNullOrWhiteSpace(str) {
  return (!str || str.length === 0 || /^\s*$/.test(str));
}




//Spot
Parse.Cloud.beforeSave("Spot", function(request, response) {
  if (isNullOrWhiteSpace(request.object.get("name"))) {
    response.error("Lo spot deve avere un nome");
  } else if (isNullOrWhiteSpace(request.object.get("description"))) {
    response.error("Lo spot deve avere una descrizione");
  } else if (!request.object.get("position")) {
    response.error("Lo spot deve avere una posizione");
  } else if (isNullOrWhiteSpace(request.object.get("createdBy"))) {
    response.error("Lo spot deve avere un utente creatore");
  } else {
    response.success();
  }
});


//Vote
Parse.Cloud.beforeSave("Vote", function(request, response) {
  var Vote = Parse.Object.extend("Vote");
  var query = new Parse.Query(Vote);
  var valid = true;
  query.equalTo("createdBy", request.object.get("createdBy"));
  query.equalTo("referredTo", request.object.get("referredTo"));
  query.first({
    success: function(object) {
      if (object) {
        response.error("Un utente può esprimere un solo voto per spot"); 
        valid = false;
      }
    },
    error: function(error) {
      response.error("Si è verificato un errore nel controllare l'univocità del voto");
      valid = false;
    }
  });
  
  if (valid) {
    if (request.object.get("value") < 0 || request.object.get("value") > 5) {
      response.error("Il voto deve essere compreso tra 0 e 5");
    } else if (isNullOrWhiteSpace(request.object.get("createdBy"))) {
      response.error("Il voto deve avere un creatore");
	} else if (isNullOrWhiteSpace(request.object.get("referredTo"))) {
	  response.error("Il voto deve essere riferito ad uno spot");
	} else {
	  response.success();
	}
  }
});

Parse.Cloud.afterSave("Vote", function(request, response) {
  //chiedo di usare la MasterKey per ottenere i permessi
  //di lettura e scrittura
  Parse.Cloud.useMasterKey();
  //prendo lo spot a cui si riferisce il voto appena salvato
  var spot = request.object.get("referredTo");
  //ho bisogno di fare il fetch per caricarlo
  spot.fetch({
   success: function(spot) {
     //cerco tutti i voti che si riferiscono a questo spot
     var Vote = Parse.Object.extend("Vote");
     var query = new Parse.Query(Vote);
     query.equalTo("referredTo", spot);
     query.find({
      success: function(votes) {
        //e calcolo la media
        var totale = 0.0;
        votes.forEach(function(vote) {
          totale += vote.get("value");
        });
        //a questo punto, salvo la valutazione media in voteAverage
        spot.set("voteAverage", totale / votes.length);
        spot.save();
      }
    });
   } 
  });
});


//SpotImage
Parse.Cloud.beforeSave("SpotImage", function(request, response) {
  if (!request.object.get("image")) {
    response.error("Lo spotImage deve avere una immagine");
  } else if (isNullOrWhiteSpace(request.object.get("referredTo"))) {
    response.error("Lo spotImage deve riferirsi ad uno spot");
  } else {
    response.success();
  }
});

//Comment
Parse.Cloud.beforeSave("Comment", function(request, response) {
  var Comment = Parse.Object.extend("Vote");
  var query = new Parse.Query(Comment);
  var valid = true;
  query.equalTo("createdBy", request.object.get("createdBy"));
  query.equalTo("referredTo", request.object.get("referredTo"));
  query.first({
    success: function(object) {
      if (object) {
        response.error("Un utente può esprimere un solo commento per spot"); 
        valid = false;
      }
    },
    error: function(error) {
      response.error("Si è verificato un errore nel controllare l'univocità del commento");
      valid = false;
    }
  });
  
  if (valid) {
     if (isNullOrWhiteSpace(request.object.get("content"))) {
    response.error("Il commento deve avere un contenuto");
    } else if (isNullOrWhiteSpace(request.object.get("createdBy"))) {
      response.error("Il commento deve avere un creatore");
    } else if (isNullOrWhiteSpace(request.object.get("referredTo"))) {
      response.error("Il commento deve riferisci a qualcuno");
    } else {
      response.success();
    }
  } 
});
