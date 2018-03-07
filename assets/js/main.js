//  Initialize firebase
var config = {
  apiKey: "AIzaSyCNL6Q2BIadv465lKGHJG9_wOZlUvFUztY",
  authDomain: "event-vaark.firebaseapp.com",
  databaseURL: "https://event-vaark.firebaseio.com",
  projectId: "event-vaark",
  storageBucket: "event-vaark.appspot.com",
  messagingSenderId: "857971417467"
};

firebase.initializeApp(config);

var movieGlanceArray = [];
var eventGlanceArray = [];

var varkDb = firebase.database();

//  Flag variables to control the functions and buttons below
var moviePageNumber = 1;
var totalResults = 0;

//  FUNCTIONS
//  Movie API ajax call function
function displayMovies(p1, p2, p3, p4) {
  //  The Search term is passed in as p4 when the function is called. This allows emptying the search field while still retaining the search term for the "Load More Results" button.
  $.ajax({
    "async": true,
    "crossDomain": true,
    //  p1 and p2 change depending on if it is a preset search (such as "upcoming" or "now-playing") or if it accepts search terms. In the former, p1 would be "movie", and in the latter, p1 would be "search".
    //  p4 can be left out of the function call for preset searches (i.e. "upcoming" and "now_playing") without interfering with  those searches. This allows for a single function to handle all movie ajax calls.
    url: "https://api.themoviedb.org/3/" + p1 + "/" + p2 + "?api_key=ab8e08e3d76136182fa701fcadfde64a&language=en-US&region=US&query=" + p4 + "&page=" + p3 + "&include_adult=false",
    method: "GET",
  }).then(function (response) {
    console.log(response);
    var results = response.results;
    for (let i = 0; i < results.length; i++) {
      const element = results[i];
      var movieDiv = $("<div class='movie-container'>");
      var movieTitle = $("<p class='movie-title'>").text(element.original_title);
      var movieImg = $("<img class='movie-poster'>");
      var addBtn = $("<button class='add-movie-btn'>");
      movieImg.attr("src", "https://image.tmdb.org/t/p/original/" + element.poster_path);
      addBtn.attr("movie-id", element.id);
      addBtn.attr("release-date", element.release_date);
      addBtn.text("Add to My Movies");
      movieDiv.append(addBtn);
      movieDiv.append(movieImg);
      movieDiv.append(movieTitle);
      $("#dynamic-content").append(movieDiv);
    }
    p3++;
    totalResults += results.length;
    console.log(response.total_results);
    console.log(totalResults);
    if (response.total_results <= totalResults) {
      //  Prevents creation of a "Load More Results" button if there are no more results to display
    }
    else {
      //  Creates a "Load More Results" button if there are more results to be displayed
      var moreResultsBtn = $("<button>");
      moreResultsBtn.attr("id", "more-results");
      moreResultsBtn.attr("result-type", p1);
      moreResultsBtn.attr("result-characteristic", p2);
      moreResultsBtn.attr("increment", p3);
      moreResultsBtn.attr("search-term", p4);
      moreResultsBtn.text("Load More Results");
      $("#dynamic-content").append(moreResultsBtn);
    }
  });
}

//  Adds a movie to the database (which is where 'My List' entries are stored)
function newDbMovieObject(p1, p2, p3) {
  var dbKey = p3;
  var newMovie = {
    title: p1,
    poster: p2,
    objKey: dbKey
  }
  return varkDb.ref("movies").child(dbKey).set(newMovie);
}

// Adds data to the "quickList" database object (which is where the "at a glance" list pulls from)
function movieQuickListItem(p1, p2, p3) {
  var dbKey = p3;
  var listItem = {
    title: p1,
    date: p2,
    objKey: dbKey
  }
  return varkDb.ref("movieQuickList").child(dbKey).set(listItem);
}
// END FUNCTIONS

//  Movie API onload ajax call
displayMovies("movie", "now_playing", moviePageNumber);

//  BUTTON CLICKS (event listeners)
//  CURRENT MOVIES button - displays Current field, which defaults to movies currently in theaters
$("#display-current").on("click", function () {
  $("#dynamic-content").empty();
  $("#dynamic-content").append("<h3>Movies Currently in Theaters</h3>");
  totalResults = 0;
  moviePageNumber = 1;
  displayMovies("movie", "now_playing", moviePageNumber);
});

//  UPCOMING button - displays Upcoming field, which defaults to movies being released in the next two weeks or so
$("#display-upcoming").on("click", function () {
  $("#dynamic-content").empty();
  $("#dynamic-content").append("<h3>Movies Coming Soon</h3>");
  totalResults = 0;
  moviePageNumber = 1;
  displayMovies("movie", "upcoming", moviePageNumber);
});

//  MOVIE SEARCH button - static button, pushes search term value into movie ajax call
$("#movie-search-btn").on("click", function (event) {
  event.preventDefault();
  $("#dynamic-content").empty();
  totalResults = 0;
  moviePageNumber = 1;
  displayMovies("search", "movie", moviePageNumber, $("#movie-input").val().trim());
  $("#movie-input").val("");
});

//  LOAD MORE RESULTS Button - dynamic button to add another page of search results
$("#dynamic-content").on("click", "#more-results", function () {
  //  Create parameters to pass into the function
  var param1 = $(this).attr("result-type");
  var param2 = $(this).attr("result-characteristic");
  var param3 = $(this).attr("increment");
  var param4 = $(this).attr("search-term");
  //  Call the function
  displayMovies(param1, param2, param3, param4);
  //  Remove the button - it will be recreated at the bottom by the displayMovies() function
  $(this).remove();
});

//  ADD TO MY MOVIES button - dynamic button, adds movie to db movies and db quickLisst
$("#dynamic-content").on("click", ".add-movie-btn", function () {
  var title = $(this).siblings("p").html();
  var poster = $(this).siblings("img").attr("src");
  var movieId = $(this).attr("movie-id");
  var rlsDate = $(this).attr("release-date");
  newDbMovieObject(title, poster, movieId);
  movieQuickListItem(title, rlsDate, movieId);
});

//  REMOVE button - dynamic button, removes from My List: from html, from db movies, and from db quickList
$("#my-movie-content").on("click", ".remove-movie-btn", function () {
  var remove = $(this).attr("data");
  $(this).closest("div").remove();
  $("#" + remove).remove();
  varkDb.ref("movies").child(remove).remove();
  varkDb.ref("movieQuickList").child(remove).remove();
});

//  Firebase listener to populate the "My Movies" page on page load
varkDb.ref("movies").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#my-movie-content").append("<div class='movie-container'><button class='remove-movie-btn' data='" + data.objKey + "'>Remove</button><img src='" + data.poster + "' class='movie-poster'><p class='movie-title'>" + data.title + "</p></div>");
});

//  Firebase listener to populate the "at a glance" list
varkDb.ref("movieQuickList").orderByChild("date").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#movie-quick-list").append("<tr id='" + data.objKey + "'><td>" + data.date + "</td><td>" + data.title + "</td></tr>");
});