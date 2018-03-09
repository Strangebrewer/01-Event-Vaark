
//  FUNCTIONS
//  Event API ajax call function

var pageCount = 0;

function displayEvents(location, page, searchTerm, zipcode, within) {
  $("#dynamic-content").css("display", "block");
  $.ajax({
    url: "https://api.eventful.com/json/events/search?...&app_key=4xmNBd2Pb7vPw3Rz&l=" + location + zipcode + within + searchTerm + "&page_size=20&page_number=" + page + "&date=Future&sort_order=popularity",
    

    // url: "http://api.eventful.com/json/events/search?&location=" + location + "&within=" + distance + "&keywords=" + searchTerm + "&page_size=20&page_number=" + page + "&date=Future&app_key=4xmNBd2Pb7vPw3Rz&sort_order=popularity",
    method: 'GET'
  }).then(function (response) {
    var results = JSON.parse(response).events.event;
    console.log(JSON.parse(response));
    var pageTotal = JSON.parse(response).page_count;

    for (let i = 0; i < results.length; i++) {
      console.log(results.length);
      const element = results[i];
      var eventDiv = $("<div class='event-container'>");
      var eventInfo = $("<div class='event-info-container'>");
      var addBtn = $("<button class='add-event-btn'>");
      var eventImg = $("<img class='event-poster'>");
      var eventDate = $("<h5 class='event-date'>").text(moment(element.start_time).format("YYYY-MM-DD") + " @ " + moment(element.start_time).format("h:mm a"));
      var eventTitle = $("<p class='event-title'>").text(element.title);

      var eventCity = $("<h6 class='event-city'>" + element.venue_name + " - " + element.city_name + ", " + element.region_abbr + "<br><a href='" + element.url + "' class='event-link' target='_blank'>More info</a></h6>");

      console.log(element.title);
      if (element.image === null) {
        eventImg.attr("src", "assets/images/narf.png");
      } else if (element.image.medium.url.includes("http")) {
        eventImg.attr("src", element.image.medium.url);
      } else {
        eventImg.attr("src", "http:" + element.image.medium.url);
      }
      addBtn.attr("event-id", element.id);
      addBtn.attr("start-time", element.start_time);
      addBtn.text("Add");
      eventDiv.append(addBtn);
      eventDiv.append(eventImg);
      eventInfo.append(eventTitle);
      eventInfo.append(eventDate);
      eventInfo.append(eventCity);
      eventDiv.append(eventInfo);
      $("#dynamic-content").append(eventDiv);
      $("#dynamic-content").append("<hr>");
    }
    page++;
    pageCount++;

    console.log(pageTotal);
    if (pageTotal <= pageCount) {
      //  Prevents creation of a "Load More Results" button if there are no more results to display
    }
    else {
      var moreResultsBtn = $("<button>");
      moreResultsBtn.attr("id", "more-event-results");
      moreResultsBtn.attr("location", location);
      moreResultsBtn.attr("zipcode", zipcode);
      moreResultsBtn.attr("within", within);
      moreResultsBtn.attr("increment", page);
      moreResultsBtn.attr("search-term", searchTerm);
      moreResultsBtn.text("Load More Results");
      $("#dynamic-content").append(moreResultsBtn);
    }
  });
}

//  Adds a movie to the database (which is where 'My List' entries are stored)
function newDbEventObject(p1, p2, p3, p4, p5, p6) {
  console.log(p1);
  var dbKey = p3;
  var newEvent = {
    title: p1,
    date: p2,
    poster: p4,
    city: p5,
    link: p6,
    objKey: dbKey
  }
  return varkDb.ref("events").child(dbKey).set(newEvent);
}

// Adds data to the "quickList" database object (which is where the "at a glance" list pulls from)
function eventQuickListItem(p1, p2, p3, p4) {
  var dbKey = p3;
  var listItem = {
    title: p1,
    date: p2,
    link: p4,
    objKey: dbKey
  }
  return varkDb.ref("eventQuickList").child(dbKey).set(listItem);
}
// END FUNCTIONS

//  EVENTS button - static button, displays default events search
$("#display-events").on("click", function () {
  $("#dynamic-content").empty();
  $("#dynamic-content").append("<h3>Coming Events</h3>");
  displayEvents("Salt+Lake+City", pageNumber);
});

//  EVENTS SEARCH button
$("#event-search-btn").on("click", function (event) {
  event.preventDefault();
  $("#dynamic-content").empty();
  $("#dynamic-content").append("<h3>Search Results</h3>");
  pageNumber = 1;
  pageCount = 0;
  var searchCity = $("#event-city-input").val().trim();
  var searchKeywords = "&keywords=" + $("#event-keyword-input").val().trim();
  var searchZipcode = $("#event-zipcode-input").val();
  var searchWithin = "&within=" + $("#event-within-input").val().trim();
  displayEvents(searchCity, pageNumber, searchKeywords, searchZipcode, searchWithin);
});

//  LOAD MORE EVENT RESULTS Button - dynamic button to add another page of search results
$("#dynamic-content").on("click", "#more-event-results", function () {
  //  Create parameters to pass into the function
  var param1 = $(this).attr("location");
  var param2 = $(this).attr("increment");
  var param3 = $(this).attr("search-term");
  //  Call the function
  displayEvents(param1, param2, param3);
  //  Remove the button - it will be recreated at the bottom by the displayMovies() function
  $(this).remove();
});

//  ADD TO MY EVENTS button - dynamic button, adds movie to db movies and db quickList
$("#dynamic-content").on("click", ".add-event-btn", function () {
  var title = $(this).siblings("div").children("p").html();
  var poster = $(this).siblings("img").attr("src");
  var eventId = $(this).attr("event-id");
  var eventDate = $(this).attr("start-time");
  var eventCity = $(this).siblings("div").children("h6").html();
  var eventInfo = $(this).siblings("div").children("h6").children("a").attr("href");
  console.log(eventInfo);
  newDbEventObject(title, eventDate, eventId, poster, eventCity, eventInfo);
  eventQuickListItem(title, eventDate, eventId, eventInfo);
});

//  REMOVE EVENT button - dynamic button, removes from My List: from html, from db movies, and from db quickList
$("#my-event-content").on("click", ".remove-event-btn", function () {
  var remove = $(this).attr("data");
  $(this).closest("div").remove();
  $("#" + remove).remove();
  varkDb.ref("events").child(remove).remove();
  varkDb.ref("eventQuickList").child(remove).remove();
});

//  Firebase listener to populate the "My Events" page on page load
varkDb.ref("events").orderByChild("date").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#my-event-content").append("<div class='event-container'><button class='remove-event-btn' data='" + data.objKey + "'>Remove</button><img src='" + data.poster + "' class='event-poster'><div class='event-info-container'><p class='event-title'>" + data.title + "</p><h5 class='event-date'>" + moment(data.date).format("YYYY-MM-DD") + " @ " + moment(data.date).format("h:mm a") + "</h5><h6 class='event-city'>" + data.city + "</h6></div></div>");
});

//  Firebase listener to populate the "at a glance" list
varkDb.ref("eventQuickList").orderByChild("date").on("child_added", function (childSnapshot) {
  var data = childSnapshot.val();
  $("#event-quick-list").append("<tr id='" + data.objKey + "'><td>" + moment(data.date).format("YYYY-MM-DD") + "</td><td><a href='" + data.link + "' class='event-link' target='_blank'>" + data.title + "</a></td></tr>");
});