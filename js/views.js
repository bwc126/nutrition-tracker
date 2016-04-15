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
      userStorage.date = self.activeDate;

    }

  })
  ItemView = Backbone.View.extend({
    tagName: 'tr', // name of tag to be created
  // ItemViews now respond to two clickable actions for each Item: swap and delete.
    events: {
      'click td.save':  'save',
    },
  // initialize() now binds model change/removal to the corresponding handlers below.
    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'save', 'remove'); // every function that uses 'this' as the current object should be in here
      this.model.bind('change', this.render);
      this.model.bind('remove', this.unrender);
    },
  // render() now includes two extra spans corresponding to the actions swap and delete.
    render: function(){
      $(this.el).html('<td>'+this.model.get('name')+' '+this.model.get('cals')+'</td> &nbsp; &nbsp; <td class="save green" style="font-family:sans-serif; cursor:pointer;">[SAVE]</td>');
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
    tagName: 'tr', // name of tag to be created
  // ItemViews now respond to two clickable actions for each Item: swap and delete.
    events: {
      'click td.remove':  'remove',
    },
  // initialize() now binds model change/removal to the corresponding handlers below.
    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'save', 'remove'); // every function that uses 'this' as the current object should be in here
      this.model.bind('remove', this.unrender);
    },
  // render() now includes two extra spans corresponding to the actions swap and delete.
    render: function(){
      $(this.el).html('<td>'+this.model.get('name')+' '+this.model.get('cals')+'</td> &nbsp; &nbsp; <td class="remove red" style="font-family:sans-serif; cursor:pointer;">[X]</td>');
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
          var food;
          activeListView.removeAll();
          _(response.hits).each(function(item){
            food = new foodItem()
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
    el: $('.stored'),
    events: {

    },
    initialize: function() {
      _.bindAll(this, 'render', 'appendItem');
      var self = this;
      this.render();
      var coll = this.collection;
      coll.on('add',self.render,self);
      coll.on('remove',self.render,self);
    },
    render: function() {
      this.removeAll();
      var self = this;
      _(this.collection.models).each(function(item) {
        var itemView = self.appendItem(item);
        itemView.bind('remove',self.collection.remove(this));
      });
      $(self.el).append("<tr class='green'><td>Total Calories: </td><td>"+self.collection.getCals()+"</td></tr>");
    },
    appendItem: function(item) {
      var self = this;
      var itemView;

      itemView = new StorageItemView({
        model: item
      });
      var frag = itemView.render().el;
      $(this.el).append(frag);


      return itemView;
    },
    removeAll: function() {
      $('tr',this.el).remove();
    }
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
      var self = this;
      indicator.render();
      this.render();
    },
    render: function() {
      this.removeAll();
      var self = this;
      if (!googCharts) {
        $(this.el).append("<tr>Google Charts Not Ready</tr>")
      }
      else {
        var self = this;
        $('.left',this.el).append("<div id='chart' class='col-xs-12' style='width:100%; height:50%'></div>");
        var width = $('.col-xs-12','.left',self.el)[0].clientWidth;
        var data = new google.visualization.DataTable();
        data.addColumn('string','Date');
        data.addColumn('number','Calories');
        var rows = userStorage.getWeeklyCals();

        data.addRows(rows);
        var options = {
          'title': 'Calories Consumed',
          'width': width,
          'height': 500,
          'backgroundColor': 'dimgrey'
        };
        var chart = new google.visualization.ColumnChart($("#chart")[0]);
        chart.draw(data,options);
        indicator.unrender();
      }
    },
    unrender: function() {
      $('#chart',this.el).remove();
    },
    removeAll: function() {
      $('tr','.stored').remove();
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
      $(this.el).prepend("<button id='trends' class='col-xs-6'>View Trends Graph</button>");
      $(this.el).prepend("<button id='saved' class='col-xs-6'>View Saved Items</button>");
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
      if ($('tbody',this.el).children().length < 21) {
        $('table', this.el).append(itemView.render().el);
      }
    },
    removeAll: function() {
      $('tr',this.el).remove();
    },
    renderStorageView: function() {
      userStorage.date = calendarView.activeDate;
      userStorage.retrieve();
      var storageView = new StorageView({
        collection: userStorage,
      });

    },
    renderTrendsView: function() {
      userStorage.date = calendarView.activeDate;
      userStorage.retrieve();
      var trendsView = new TrendsView({
        collection: userStorage
      });
    }
  });
})(jQuery);
