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
    backgroundToShow.removeClass("hidden");
    $(obj).find('div.fixed img').not(backgroundToShow).addClass("hidden");
  })
})
