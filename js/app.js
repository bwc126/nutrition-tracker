'use strict';

var APP_ID='0c63dc0a';
var APP_KEY='77e404c364eba040b8dcf4113d32de0e';
var storage = localStorage;
var present = new Date();
console.log(present);
var today = present.getMonth() + "-" + present.getDate() + "-" + present.getFullYear();
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
  // defaults: {
  //   name: 'Yum',
  //   cals: 200
  // }
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
  initialize: function() {
    _.bindAll(this, 'add', 'store', 'retrieve');
    var self = this;
    this.bind('add', this.store);
    this.bind('remove', this.store);
  },
  store: function() {
    var self = this;
    storage.setItem(today,JSON.stringify(self));
    console.dir(JSON.stringify(self));
  },
  retrieve: function(date) {
    this.set(JSON.parse(storage.getItem(date.valueOf())));
  },
});

if (!storage.today) {
  userStorage = new Saved();
}
else {
  userStorage = new Saved();
  userStorage.retrieve(today.valueOf());
}
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
var tempListView;
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
          tempListView.appendItem(food);
        })
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
  },
  appendItem: function(item) {
    var self = this;
    var itemView = new StorageItemView({
      model: item
    });
    var frag = itemView.render().el;
    $('ul', this.el).append(frag);
    return itemView;
  },
})
// Because the new features (swap and delete) are intrinsic to each Item, there is no need to modify ListView.
var ListView = Backbone.View.extend({
  el: $('body'), // el attaches to existing element
  events: {
    'click button#saved': 'renderStorageView'

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
  renderStorageView: function() {

    $('ul li').remove();
    var activeDate = $('#calendar').datepicker('getDate');
    console.log(activeDate);
    var storageView = new StorageView({
      collection: userStorage,
    });
  }
});
var searchView = new SearchView();
var listView = new ListView();
tempListView = listView;
})(jQuery);
