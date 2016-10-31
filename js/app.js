'use strict';
// The main app instantiates the needed views and collections for the app to work.
var APP_ID='0c63dc0a';
var APP_KEY='77e404c364eba040b8dcf4113d32de0e';
var storage = localStorage;
var googCharts = false;
var today = moment();
var todayFormatted = today.format("MM-DD-YYYY");
var searchView;
var indicatorView;
var listView;
var calendarView;
// Wrap our code in the Jquery object, so it executes only once Jquery is ready
(function($){
  // Instantiate search, indicator, list, calendar and user storage, loading any data saved within the browser
  searchView = new SearchView();
  indicatorView = new IndicatorView();
  listView = new ListView();
  activeListView = listView;
  indicator = indicatorView;
  calendarView = new CalendarView();
  userStorage = new Saved(calendarView.activeDate);
  if (!storage.getItem(calendarView.activeDate)) {
    userStorage.set([]);
  }
  else {
    userStorage.retrieve();
  }


})(jQuery);

/* Set the width of the side navigation to 250px */
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
