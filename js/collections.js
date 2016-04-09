var Results;
var Search;
var Saved;
var userStorage;

(function($) {
  Results = Backbone.Collection.extend({
    model: foodItem
  });
  Search = Backbone.Collection.extend({
    model: searchTerm
  });

  Saved = Backbone.Collection.extend({
    initialize: function(date) {
      _.bindAll(this, 'add', 'store', 'retrieve');
      var self = this;
      this.date = date;
      this.bind('add', self.store);
      this.bind('remove', self.store);
    },
    store: function() {
      var self = this;
      storage.setItem(self.date,JSON.stringify(self.clone()));

    },
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
    getCals: function() {
      var total = 0;

      _(this.models).each(function(item) {
        total += item.get('cals');
      })
      return total;

    },
    getWeeklyCals: function() {
      var originalDate = this.date;
      var originalMoment = moment(originalDate, "MM-DD-YYYY");
      // var first = originalDate.search(/-/g);
      // var second = originalDate.length-5;
      // var month = originalDate.slice(0,first);
      // var day = originalDate.slice(first+1,second);
      // var year = originalDate.slice(second+1);
      var total = [];
      var self = this;
      for (var i = 6; i >= 0; i--) {

        var focus = originalMoment.clone();
        focus.subtract(i, 'day');
        // var focusDay = Number(day) - i;
        // var focusMonth = month;
        // var focusYear = year;
        // if (Number(focusDay)<0) {
        //   focusMonth = Number(month)-1;
        //   focusDay = 31 - i;
        // }
        // if (Number(month)<0) {
        //   focusYear = Number(year) -1;
        //   focusMonth = 11 - Number(month);
        // }
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
