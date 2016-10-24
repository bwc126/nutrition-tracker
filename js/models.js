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
})(jQuery);
