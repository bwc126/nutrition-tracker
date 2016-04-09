var foodItem;
var searchTerm;

(function($) {
  // Backbone.sync: Overrides persistence storage with dummy function. This enables use of Model.destroy() without raising an error.
  Backbone.sync = function(method, model, success, error){
    success();
  }
  foodItem = Backbone.Model.extend({
    defaults: {
      name: 'Yum',
      cals: 200
    }
  });
  searchTerm = Backbone.Model.extend({
    defaults: {
      term: ''
    }
  });
})(jQuery);
