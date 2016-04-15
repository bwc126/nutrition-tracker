# nutrition-tracker
Front End Nanodegree Optional Project 5-2 'health tracker'

## Overview
A Udacity Front End Nanodegree project to make a nutrition tracker. Users search for food items they've consumed, save them to a date, see at a glance total calories for the day, and generate graphs of calorie consumption for the prior week.

## Running
Load index.html in a modern browser (IE8 or later).

## Components

### Calendar
Use as a date picker to select an active date for saving or viewing saved food items or to use as the starting day for viewing a weekly calorie graph for the prior week.

### Search and Results
Input field accepts partial input and searches as the user types, returning results below the input field.

### Saved Items
Displays items the user has saved for the current active date (chosen with the calendar), showing a calorie total for the day's saved items.

### Trends Graph
Uses Google Charts to generate a graph of daily calorie consumption for the preceding week, using the active day as the start date, showing calorie totals for each of 6 days prior and the active day.


#### Made possible by:
Bootstrap-datepicker enables a calendar with datepicker functionality:
https://github.com/eternicode/bootstrap-datepicker

Uses Nutritionix API for nutrition data search results:
http://www.nutritionix.com/api

AJAX loading indicator made with:
http://www.ajaxload.info/
