'use strict';

var Results;
var Search;
var Saved;
var userStorage;

(function($) {
  // Results stores all of our food items returned from nutritionix due to a user query
  Results = Backbone.Collection.extend({
    model: foodItem
  });
  // Search is a colleciton of all previously used search terms, including the partials. Not used for much at the moment. This has no way of persisting currently. 
  Search = Backbone.Collection.extend({
    model: searchTerm
  });
  // Saved is our collection for storing food items the user has saved for a particular day
  Saved = Backbone.Collection.extend({
    // Uses the currently selected date, or today's if none is selected, and then binds the store function to the add/remove events for when items are added/removed from this collection
    initialize: function(date) {
      _.bindAll(this, 'add', 'store', 'retrieve');
      var self = this;
      this.date = date;
      this.bind('add', self.store);
      this.bind('remove', self.store);
    },
    // store will keep the corresponding collection in persistent storage up to date with this collection, allowing this collection to be stored in the browser. This collection's date and contents are simply set (i.e., stored) within the browser's storage when this function is called.
    store: function() {
      var self = this;
      storage.setItem(self.date,JSON.stringify(self.clone()));
    },
    // retrieve looks in the browser's storage for any saved collection data for this collection's current date (which could be today's or something chosen on the datepicker). If found, the stored data is loaded as this collection's contents, otherwise, if no stored data is found, this colleciton is set to an empty object.
    retrieve: function() {
      var self = this;
      var memory = storage.getItem(self.date);
      if (!memory) {
        this.set([]);
      }
      else {
        this.set(JSON.parse(storage.getItem(self.date)));
      }
    },
    // getCals retrieves the calories for each item in the collection, adds them together, and puts out the total
    getCals: function() {
      var total = 0;

      _(this.models).each(function(item) {
        total += item.get('cals');
      })
      return total;

    },
    // getWeeklyCals acts similarly to getCals, but takes the collection's current date as a start, finds the total calories for each of six days prior, along with the calories for the starting day, and then puts each of these daily calorie totals into a properly formatted array which google charts can work with right away
    getWeeklyCals: function() {
      var originalDate = this.date;
      var originalMoment = moment(originalDate, "MM-DD-YYYY");

      var total = [];
      var self = this;
      for (var i = 6; i >= 0; i--) {

        var focus = originalMoment.clone();
        focus.subtract(i, 'day');

        self.date = focus.format('MM-DD-YYYY');
        var dispDate = focus.format('MMMM-DD-YYYY');
        self.retrieve();
        total.push([dispDate,self.getCals()]);

      }
      this.date = originalDate;
      self.retrieve();
      return total;

    }
  });
})(jQuery);
