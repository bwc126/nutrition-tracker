var CalendarView;
var ItemView;
var StorageItemView;
var IndicatorView;
var SearchView;
var StorageView;
var TrendsView;
var ListView;
var indicator;
var activeListView;

(function($) {
  CalendarView = Backbone.View.extend({
    el: $('body'),
    events: {
      'mouseover button' : 'activateDate',
      'mouseover span' : 'activateDate'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'activateDate');
      this.activeDate = todayFormatted;
      this.render();

    },
    render: function() {
      $('#calendar').datepicker({
        todayBtn: true,
        todayHighlight: true
      });

    },
    activateDate: function() {
      var self = this;
      var rawDate = $('#calendar').datepicker('getDate');
      var activeDate;
      if (!rawDate) {
        activeDate = moment();
      }
      else {
        activeDate = moment(rawDate);
      }
      self.activeDate = activeDate.format("MM-DD-YYYY");
      console.log(self.activeDate);
      userStorage.date = self.activeDate;

    }

  })
  ItemView = Backbone.View.extend({
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
  StorageItemView = Backbone.View.extend({
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
  IndicatorView = Backbone.View.extend({
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

  SearchView = Backbone.View.extend({
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
  StorageView = Backbone.View.extend({
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
  TrendsView = Backbone.View.extend({
    el: $('.row','body'),
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
        $(this.el).append("<li>Google Charts Not Ready</li>")
      }
      else {
        $(this.el).append("<div class='row'><div class='col-xs-2'></div><div id='chart' class='col-xs-8' style='width:900; height:500'></div><div class='col-xs-2'></div></div>");
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
        var chart = new google.visualization.ColumnChart($("#chart")[0]);
        chart.draw(data,options);
        indicator.unrender();
      }
    },
    unrender: function() {
      $('#chart',this.el).remove();
    }
  })
  // Because the new features (swap and delete) are intrinsic to each Item, there is no need to modify ListView.
  ListView = Backbone.View.extend({
    el: $('.form'), // el attaches to existing element
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
      $(this.el).append("<button id='saved' class='col-xs-6'>View Saved Items</button>");
      $(this.el).append("<button id='trends' class='col-xs-6'>View Trends Graph</button>");
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
      userStorage.date = calendarView.activeDate;

      userStorage.retrieve();

      var storageView = new StorageView({
        collection: userStorage,
      });
    },
    renderTrendsView: function() {
      this.removeAll();
      userStorage.date = calendarView.activeDate;
      userStorage.retrieve();
      var trendsView = new TrendsView({
        collection: userStorage
      });
    }
  });
})(jQuery);
