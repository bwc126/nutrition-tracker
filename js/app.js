'use strict';

var APP_ID='0c63dc0a';
var APP_KEY='77e404c364eba040b8dcf4113d32de0e';
var storage = localStorage;
var googCharts = false;

$('#calendar').datepicker({
  todayBtn: true,
  todayHighlight: true
});
var day;
(function($){
// Backbone.sync: Overrides persistence storage with dummy function. This enables use of Model.destroy() without raising an error.
Backbone.sync = function(method, model, success, error){
  success();
}
var foodItem = Backbone.Model.extend({
  defaults: {
    name: 'Yum',
    cals: 200
  }
});
var searchTerm = Backbone.Model.extend({
  defaults: {
    term: ''
  }
})
var Results = Backbone.Collection.extend({
  model: foodItem
});
var Search = Backbone.Collection.extend({
  model: searchTerm
});
var userStorage;

var Saved = Backbone.Collection.extend({
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
    storage.setItem(self.date.total,self.getCals());
  },
  retrieve: function() {
    var self = this;
    this.set(JSON.parse(storage.getItem(self.date)));
  },
  getCals: function() {
    var total = 0;

    _(this.models).each(function(item) {
      console.log(item.get('cals'));
      total += item.get('cals');
    })
    return total;

  },
  getWeeklyCals: function() {
    var originalDate = this.date;
    var first = originalDate.search(/-/g);
    var second = originalDate.length-5;
    var month = originalDate.slice(0,first);
    var day = originalDate.slice(first+1,second);
    var year = originalDate.slice(second+1);
    var total = [];
    var self = this;
    for (var i = 6; i >= 0; i--) {
      var focusDay = day - i;
      if (focusDay<0) {
        month = month-1;
        focusDay = 30 - focusDay;
      }
      if (month<0) {
        year = year -1;
        month = 11;
      }
      self.date = month + "-" + focusDay + "-" + year;
      console.log(self.date);
      self.retrieve();
      total.push([self.date,self.getCals()]);

    }
    self.date = originalDate;
    self.retrieve();
    return total;

  }
});

var ItemView = Backbone.View.extend({
  tagName: 'li', // name of tag to be created
// ItemViews now respond to two clickable actions for each Item: swap and delete.
  events: {
    'click span.save':  'save',
  },
// initialize() now binds model change/removal to the corresponding handlers below.
  initialize: function(){
    _.bindAll(this, 'render', 'unrender', 'save', 'remove'); // every function that uses 'this' as the current object should be in here
    this.model.bind('change', this.render);
    this.model.bind('remove', this.unrender);
  },
// render() now includes two extra spans corresponding to the actions swap and delete.
  render: function(){
    $(this.el).html('<span style="color:black;">'+this.model.get('name')+' '+this.model.get('cals')+'</span> &nbsp; &nbsp; <span class="save" style="font-family:sans-serif; color:blue; cursor:pointer;">[SAVE]</span>');
    return this; // for chainable calls, like .render().el
  },
// unrender(): Makes Model remove itself from the DOM.
  unrender: function(){
    $(this.el).remove();
  },
// swap() will interchange an Item's attributes. When the .set() model function is called, the event change will be triggered.
  save: function(){
    userStorage.add(this.model);
  },
// remove(): We use the method destroy() to remove a model from its collection. Normally this would also delete the record from its persistent storage, but we have overridden that (see above).
  remove: function(){
    this.model.destroy();
  }
});
var StorageItemView = Backbone.View.extend({
  tagName: 'li', // name of tag to be created
// ItemViews now respond to two clickable actions for each Item: swap and delete.
  events: {
    'click span.remove':  'remove',
  },
// initialize() now binds model change/removal to the corresponding handlers below.
  initialize: function(){
    _.bindAll(this, 'render', 'unrender', 'save', 'remove'); // every function that uses 'this' as the current object should be in here
    this.model.bind('remove', this.unrender);
  },
// render() now includes two extra spans corresponding to the actions swap and delete.
  render: function(){
    $(this.el).html('<span style="color:black;">'+this.model.get('name')+' '+this.model.get('cals')+'</span> &nbsp; &nbsp; <span class="remove" style="font-family:sans-serif; color:blue; cursor:pointer;">[X]</span>');
    return this; // for chainable calls, like .render().el
  },
// unrender(): Makes Model remove itself from the DOM.
  unrender: function(){
    $(this.el).remove();
  },
// swap() will interchange an Item's attributes. When the .set() model function is called, the event change will be triggered.
  save: function(){
    userStorage.add(this.model);

  },
// remove(): We use the method destroy() to remove a model from its collection. Normally this would also delete the record from its persistent storage, but we have overridden that (see above).
  remove: function(){
    this.model.destroy();
  }
});
var IndicatorView = Backbone.View.extend({
  el: $('img'),
  initialize: function() {
    $(this.el).css('display','none');
  },
  render: function() {
    $(this.el).css('display','');
  },
  unrender: function() {
    $(this.el).css('display','none');
  }
})
var indicator;
var activeListView;
var SearchView = Backbone.View.extend({
  el: $('input'),
  events: {
    'keyup' : 'search',
  },
  initialize: function() {
    _.bindAll(this,'render','search');
    this.collection = new Search();
    this.render();
  },
  render: function() {
    $(this.el).attr('placeholder','Search Here');
  },
  search: function(event) {
    var key = this.$el.val();
    var search = new searchTerm();
    search.set({term: key})
    indicator.render();
    this.getResults(key);
    return search;
  },
  getResults: function(key) {

    var Url = "https://api.nutritionix.com/v1_1/search/"+key+"?results=0:20&fields=item_name,brand_name,item_id,nf_calories&appId="+APP_ID+"&appKey="+APP_KEY;
    var req = $.ajax(Url, {
      success: function(response) {

        _(response.hits).each(function(item){
          var food = new foodItem()
          food.set({
            name: item.fields.brand_name + " " + item.fields.item_name,
            cals: item.fields.nf_calories
          });
          activeListView.appendItem(food);
        })
        indicator.unrender();
      }
    });
  },
});
var StorageView = Backbone.View.extend({
  el: $('body'),
  events: {
    // 'click span.remove' : 'remove'
  },
  initialize: function() {
    _.bindAll(this, 'render', 'appendItem');

    this.render();
  },
  render: function() {

    var self = this;
    _(this.collection.models).each(function(item) {
      var itemView = self.appendItem(item);
      itemView.bind('remove',self.collection.remove(this));
    });
    $('ul',self.el).append("<li style='color: green'>Total Calories: "+self.collection.getCals()+"</li>");
  },
  appendItem: function(item) {
    var self = this;
    var itemView;

    itemView = new StorageItemView({
      model: item
    });
    var frag = itemView.render().el;
    $('ul', this.el).append(frag);


    return itemView;
  },
});
var TrendsView = Backbone.View.extend({
  el: $('body'),
  events: {
    'click #calendar': 'render',
    'click #saved': 'unrender',
    'keyup input': 'unrender'
  },
  initialize: function() {
    _.bindAll(this,'render');
    indicator.render();
    this.render();
  },
  render: function() {
    var self = this;
    var activeDate = $('#calendar').datepicker('getDate');
    if (!activeDate) {
      formattedActiveDate = todayFormatted;
    }
    else {
      var formattedActiveDate = activeDate.getMonth() + "-" + activeDate.getDate() + "-" + activeDate.getFullYear();
    }
    if (!googCharts) {
      $('ul',this.el).append("<li>Google Charts Not Ready</li>")
    }
    else {
      $('ul',this.el).append("<div id='chart' style='width:900; height:500'></div>");
      var data = new google.visualization.DataTable();
      data.addColumn('string','Date');
      data.addColumn('number','Calories');
      var rows = userStorage.getWeeklyCals();

      data.addRows(rows);
      var options = {
        'title': 'Calories Consumed',
        'width': 900,
        'height': 500
      };
      var chart = new google.visualization.LineChart($("#chart")[0]);
      chart.draw(data,options);
      indicator.unrender();
    }
  },
  unrender: function() {
    $('#chart',this.el).remove();
  }
})
// Because the new features (swap and delete) are intrinsic to each Item, there is no need to modify ListView.
var ListView = Backbone.View.extend({
  el: $('body'), // el attaches to existing element
  events: {
    'click button#saved': 'renderStorageView',
    'click button#trends': 'renderTrendsView'
  },
  initialize: function() {
    _.bindAll(this, 'render', 'addItem', 'appendItem'); // every function that uses 'this' as the current object should be in here
    this.collection = new Results();
    this.collection.bind('add', this.appendItem); // collection event binder
    this.counter = 0;
    this.render();
  },
  render: function() {
    var self = this;
    $(this.el).append("<button id='saved'>View Saved Items</button>");
    $(this.el).append("<button id='trends'>View Trends Graph</button>");
    $(this.el).append("<ul></ul>");
    _(this.collection.models).each(function(item) { // in case collection is not empty
      self.appendItem(item);
    }, this);
  },
  addItem: function() {
    this.counter++;
    var item = new foodItem();
    item.set({
      cals: item.get('cals') + this.counter // modify item defaults
    });
    this.collection.add(item);
  },
  appendItem: function(item) {
    var itemView = new ItemView({
      model: item
    });
    if ($('ul').children().length > 19) {

      this.removeFirst();
    }
    $('ul', this.el).append(itemView.render().el);
  },
  removeFirst: function() {

    $('ul li:first-child').remove()
  },
  removeAll: function() {

    $('ul li').remove();
  },
  renderStorageView: function() {
    this.removeAll();
    var activeDate = $('#calendar').datepicker('getDate');
    if (activeDate) {
      var formattedActiveDate = activeDate.getMonth() + "-" + activeDate.getDate() + "-" + activeDate.getFullYear();
      userStorage = new Saved(formattedActiveDate);
      if (!storage.getItem(formattedActiveDate)) {
        userStorage.set([]);
      }
      else {
        userStorage.retrieve();
      }
    }
    var storageView = new StorageView({
      collection: userStorage,
    });
  },
  renderTrendsView: function() {
    this.removeAll();
    var trendsView = new TrendsView({
      collection: userStorage
    });
  }
});
var searchView = new SearchView();
var indicatorView = new IndicatorView();
var listView = new ListView();
activeListView = listView;
indicator = indicatorView;
var today = new Date();
var todayFormatted = today.getMonth() + "-" + today.getDate() + "-" + today.getFullYear();
userStorage = new Saved(todayFormatted);
if (!storage.getItem(todayFormatted)) {
  userStorage.set([]);
}
else {
  userStorage.retrieve(todayFormatted);
}
})(jQuery);
