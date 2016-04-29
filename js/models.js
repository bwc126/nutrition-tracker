'use strict';
// The app's models are implemented here
var foodItem;
var searchTerm;

(function($) {
  // Backbone.sync: Overrides persistence storage with dummy function. This enables use of Model.destroy() without raising an error.
  Backbone.sync = function(method, model, success, error){
    success();
  }
  // foodItem is the basic building block of the whole app; it's the simplest model that exists for the food itmes that will be shown in various views throughout the app
  foodItem = Backbone.Model.extend({
    defaults: {
      name: 'Yum',
      cals: 200
    }
  });
  // searchTerm is the model for each term the user puts into the search field, giving us a standardized way to store a history of the user's past search phrases. Not used for much other than in the Search collection, at the moment, which isn't even persisted.
  searchTerm = Backbone.Model.extend({
    defaults: {
      term: ''
    }
  });
})(jQuery);
