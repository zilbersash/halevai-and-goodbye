$(function() {
  $('.item.dynamic-background .scrolling-layer').on('scroll', function(event) {
    var obj = event.target;
    var fixedLayer = $(obj).parent().find('.fixed-layer');
    var backgrounds = fixedLayer.find('img[data-show-with]');
    var backgroundToShow = fixedLayer.find('img').get(0);
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
    var previousBackground = fixedLayer.find('img:visible');
    backgroundToShow.css("zIndex", 0);
    previousBackground.css("zIndex", 1);
    backgroundToShow.show();
    previousBackground.fadeOut("100");
  })
})
