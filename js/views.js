'use strict';
// All of the app's views are implemented here.
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
  // The CalendarView acts as a datepicker, allowing the user to select dates for saving items to, inspecting previously saved items, and generating graphs of weekly trends
  CalendarView = Backbone.View.extend({
    // The parent element is chosen to include objects which are later used to trigger updates to activeDate, using only the eventual parent div for the calendar would preclude this.
    el: $('body'),
    // Any time the user is about to press a button or save an item, we need to make sure the user-selected date is active. Ideally, updating the activeDate would be done only when the user selects a day on the calendar, but due to how the calendar is generated, we'd have to use a callback or otherwise detect when the calendar is fully generated and attach triggers only then. The present method requires far less overhead and is just as effective in likely use-cases.
    events: {
      'mouseover button' : 'activateDate',
      'mouseover span' : 'activateDate'
    },
    // Since the CalendarView is our datepicker, and no date will initially be selected, we instantiate the activeDate as today
    initialize: function() {
      _.bindAll(this, 'render', 'activateDate');
      this.activeDate = todayFormatted;
      this.render();
    },
    // Render uses the standard technique for initializing our datepicker/calendar instance, as specified in the bootstrap-datepicker documentation
    render: function() {
      $('#calendar').datepicker({
        todayBtn: true,
        todayHighlight: true
      });
    },
    // Update activeDate with the current selection on the datepicker, and change the active user storage date
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
  });
  // When our search query to nutritionix returns, ItemView is how those individual items are shown
  ItemView = Backbone.View.extend({
    tagName: 'button', // name of tag to be created
    // When the 'save' area is clicked, the corresponding item should be saved to user storage
    events: {
      'click button.btn-success':  'save',
    },
    // To initialize the item, we need only make bindings between the keyword 'this' and each function where it'll be used, as well as between the bootstrap events of change to or removal of the model and corresponding render/unrender functions, respectively
    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'save', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('remove', this.unrender);
    },
    // Render uses jquery to place a tag on the page and edit its html in place to display the food item's name and calorie content
    render: function(){
      $(this.el).html('<button class="btn btn-success">'+this.model.get('name')+' '+this.model.get('cals')+'&nbsp; &nbsp; </button>');

      return this;
    },
    // Unrender uses jquery to simply retrieve and remove the item from the page
    unrender: function(){
      $(this.el).remove();
    },
    // Save the present item to user storage
    save: function(){
      userStorage.add(this.model);
      activeListView.removeAll();
    },
    // Destroys the corresponding model for this food item view
    remove: function(){
      this.model.destroy();
    }
  });
  // Once a food item has been saved to the user's collection, StorageItemView is how they're displayed within the user storage view area
  StorageItemView = Backbone.View.extend({
    tagName: 'div', // Each stored item will get its own div
    // Remove this item from the user's storage when the user clicks on the table cell with the big red 'X'
    events: {
      'click button.btn-danger':  'remove',
    },
    // To initialize the item, we need only make bindings between the keyword 'this' and each function where it'll be used, as well as between the bootstrap event of removal of the model and the corresponding unrender function
    initialize: function(){
      _.bindAll(this, 'render', 'unrender', 'save', 'remove');
      this.model.bind('remove', this.unrender);
    },
    // Render uses jquery to place a tag on the page and edit its html in place to display the food item's name and calorie content
    render: function(){
      $(this.el).html('<div>'+this.model.get('name')+' '+this.model.get('cals')+'</div> &nbsp; &nbsp; <button class="btn btn-danger" style="font-family:sans-serif; cursor:pointer;">Delete</button>');
      return this;
    },

    unrender: function(){
      $(this.el).remove();
    },
    // save will add this item to the user's collection
    save: function(){
      userStorage.add(this.model);

    },
    // remove will delete the model; currently, this event will also cause the item to unrender and be removed from the user's collection
    remove: function(){
      this.model.destroy();
    }
  });
  // The loading/search indicator gets its own view for the sake of coding expediency and readability
  IndicatorView = Backbone.View.extend({
    // the basic element of this view is simply an image, specifically an animated gif
    el: $('img'),
    // When the indicator is first added to the page, we have no reason to show it, since nothing is "loading" with respect to functions the app carries out. Theoretically, we could also show it until the last thing finishes loading upon the initial page load, but we want this to primarily be an indicator for search results and graph generation, so we'll load it invisibly to start with.
    initialize: function() {
      $(this.el).css('display','none');
    },
    // render simply removes the 'none' property from the 'display' style attribute, casuing the indictor to show
    render: function() {
      $(this.el).css('display','');
    },
    // unrender simply reverses the procedure of 'render', changing the css style 'display' to 'none' to cause the indicator to be non-visible on the page
    unrender: function() {
      $(this.el).css('display','none');
    }
  })
  // SearchView includes the search input field, and the code which actually carries out the API request to nutritionix
  SearchView = Backbone.View.extend({
    el: $('input'),
    // Using the keyup event to trigger searching means that every time the user finishes putting in a new letter, we will carry out a new search. This has the effect of searching for partial matches while typing, rather than having to complete an entire query before searching or even pressing the return key to execute a search
    events: {
      'keyup' : 'search',
    },
    // Initializing the search area requires us to bind the appropriate functions to the keyword 'this', and changing the input field to show it's ready for searches
    initialize: function() {
      _.bindAll(this,'render','search');
      this.collection = new Search();
      this.render();
    },
    // render uses jquery to change the input field to show the user it's ready for searches.
    render: function() {
      $(this.el).attr('placeholder','Search Here');
    },
    // search, when triggered by a keyup event in the input field, takes the current value in the field and calls getResults with it (after activating the indicator which shows a search is in progress).
    search: function() {
      var key = this.$el.val();
      var search = key;
      // search.set({term: key});
      indicator.render();
      this.getResults(key);
      return search;
    },
    getResults: function(key) {
      // Here we prepare the primary component of the nutritionix API key, the url request, including our search term, application ID and key as required by nutrionix' terms of use
      console.log('getting results....');
      var Url = "https://api.nutritionix.com/v1_1/search/"+key+"?results=0:20&fields=item_name,brand_name,item_id,nf_calories&appId="+APP_ID+"&appKey="+APP_KEY;
      var req = $.ajax(Url, {
        success: function(response) {
          var food;
          activeListView.removeAll();
          // We expect to receive many results, so we need to create a food item in the list area for each one
          _(response.hits).each(function(item){
            food = new foodItem()
            food.set({
              name: item.fields.brand_name + " " + item.fields.item_name,
              cals: item.fields.nf_calories
            });
            activeListView.appendItem(food);
          });

          indicator.unrender();
        },
        error: function(error, status, thrown) {
          if (!thrown) {
            thrown = "description unavailable";
          };
          alert(status +"\nDescription: " + thrown);
        }
      });
    },
  });
  // StorageView is the window for displaying food items the user has added to their collection
  StorageView = Backbone.View.extend({
    // our prototypical element will be a div (natively in index.html) with the id 'storage'
    el: $('#storage'),
    events: {
    },
    // initialize binds the keyword 'this' to appropriate functions, renders the storage view (including any items the user has saved for the currently active day) and then binds add/remove events for the user's collection of saved items for the day to the render function for the storage view, so the view updates whenever the user's collection changes.
    initialize: function() {
      _.bindAll(this, 'render', 'appendItem', 'removeAll');
      this.render();
      var self = this;
      var coll = this.collection;
      coll.on('add',self.render,self);
      coll.on('remove',self.render,self);
      console.log("storageview init");
    },
    // render begins by clearing its html element, (through a call to removeAll) then iterates through each item the user has saved and appends it to the page, finishing the rendering process by adding a calorie total for the active day
    render: function() {
      this.removeAll();
      var self = this;
      var itemView;
      console.log('rendering storageview');
      _(this.collection.models).each(function(item) {
        console.log('rendering item');
        itemView = self.appendItem(item);
        itemView.bind('remove',self.collection.remove(this));
      });
      $(self.el).append("<div class='panel-footer'><div>Total Calories: </div><div>"+self.collection.getCals()+"</div></div>");
    },
    // appendItem is what renders each food item within the user's collection for the day, creating a new StorageItemView for each food item the user has saved, and using jQuery to append it to the page once the fragment has been built with the item's native render function, returning the individual StorageItemView for chaining.
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
    // removeAll, unsurprisingly, clears all table row items found within the parent element for the StorageView (the #storage div)
    removeAll: function() {
      $(this.el).children().remove();
    }
  });
  // TrendsView uses google charts to generate a graph of the week's calorie consumption on a daily basis. This view could easily be extended to include multiple-week, month, or yearly trend graphs.
  TrendsView = Backbone.View.extend({
    el: $('#graph'),
    events: {
      'click #calendar': 'render',
      'click #saved': 'unrender',
      'keyup input': 'unrender'
    },
    // When a TrendsView is first created, we want the indicator to show, and to begin the rendering process. The 'this' keyword also needs to be bound.
    initialize: function() {
      _.bindAll(this,'render');
      var self = this;
      indicator.render();
      this.render();
    },
    // render handles the main business of TrendsView: generating the google chart of weekly calories intake based on daily totals of all saved food items for each day
    render: function() {
      // / First we clear the parent div, ensuring only one up-to-date graph is ever found in the parent div.
      this.removeAll();
      var self = this;
      // If google charts still isn't ready, we should let the user know. They should still be able to try again once the package is ready, as this will evaluate to false in that case.
      if (!googCharts) {
        $(this.el).append("<tr>Google Charts Not Ready</tr>")
      }
      else {
        var self = this;
        // Within the parent div of the view, we create an immediate parent div for the chart proper, reserving width and height on the page to save just a few ms of having to re-position once the chart is ready.
        $(this.el).append("<div id='chart' class='col-xs-12' style='width:100%; height:50%'></div>");

        // We'll need the width of the parent div, as it's based on the client's active width, ensuring the chart we generate will fit upon generation (at least most of the time).
        var width = $(self.el)[0].clientWidth*0.9;
        var height = $('#calendar').height();
        console.log(width, height);
        // Here we use google charts to generate the basic unit of our graph: the data, handled much like a table, so we start by adding date/calorie columns.
        var data = new google.visualization.DataTable();
        data.addColumn('string','Date');
        data.addColumn('number','Calories');
        // Our chart's rows are generated by getWeeklyCals, which is a Saved collection function
        var rows = userStorage.getWeeklyCals();
        data.addRows(rows);
        // We set the title, background color, and dimensions of the chart within a JSON object
        var options = {
          'title': 'Calories Consumed',
          'width': width,
          'height': height,
          'backgroundColor': 'dimgrey'
        };
        // Now we actually create the chart, passing the id of the immediate parent div, then draw it, and finally deactivate the loading indicator
        var chart = new google.visualization.ColumnChart($("#chart")[0]);
        chart.draw(data,options);
        indicator.unrender();
      }
    },
    // unrender removes any chart inside the #chart div where the chart will normally be
    unrender: function() {
      $('#chart',this.el).remove();
    },
    // removeAll is virtually identical to the function of the same name within the StorageView class, removing any table rows within the div with the 'stored' class.
    removeAll: function() {
      $('div','.stored').remove();
    }
  })
  // ListView is the core of the app, and as such, acts as a parent view for the others, in addition to generating the list of results from a search.
  ListView = Backbone.View.extend({
    el: $('.search'), // the basic element of the ListView is the .form class div
    // Two buttons--saved and trends--will effectively give this
    events: {
      'click .openbtn': 'renderStorageView',
      'click button#trends': 'renderTrendsView'
    },
    initialize: function() {
      _.bindAll(this, 'render', 'addItem', 'appendItem', 'removeAll'); // every function that uses 'this' as the current object should be in here
      this.collection = new Results();
      this.collection.bind('add', this.appendItem); // collection event binder
      this.render();
    },
    // render adds buttons for the TrendsView and Saved view to the page,
    render: function() {
      var self = this;
      $('.buttons').prepend("<button id='trends' class='col-xs-3 btn btn-primary'>View Trends Graph</button>");
      $('.buttons').prepend("<span class='openbtn' onclick='openNav()'><i class='fa fa-archive fa-3x' aria-hidden='true'></i></span>");
      _(this.collection.models).each(function(item) {
        self.appendItem(item);
      }, this);
    },
    addItem: function() {

      var item = new foodItem();
      item.set({
        cals: item.get('cals')
      });
      this.collection.add(item);
    },
    appendItem: function(item) {
      var self = this;
      var itemView = new ItemView({
        model: item
      });

      if ($('.results').children().length < 21) {
        $('.results').append(itemView.render().el);
      };

    },
    removeAll: function() {
      $('.results').children().remove();
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
