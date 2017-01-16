$(function() {
  $('.item.dynamic-background').on('scroll', function(event) {
    var obj = event.target;
    var backgrounds = $(obj).find('div.fixed img[data-show-with]');
    var backgroundToShow = $(obj).find('div.fixed img').get(0);
    backgrounds.each(function(i, background) {
      var element = $($(background).data("showWith"));
      if (element[0].offsetTop <= obj.scrollTop + (obj.offsetHeight / 2)) {
        backgroundToShow = background;
      } else {
        return false;
      }
    });
    backgroundToShow = $(backgroundToShow);
    if (backgroundToShow.is(":visible")) {
      return;
    }
    var previousBackground = $(obj).find('div.fixed img:visible');
    backgroundToShow.css("zIndex", 0);
    previousBackground.css("zIndex", 9999);
    backgroundToShow.show();
    previousBackground.fadeOut("200");
  })
})
