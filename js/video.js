$(document).ready(function() {
	var w=2000, h=1257, ratio = h/w;
	function setSize() {
		var setWidth, setHeight, wrapper = $('.video-wrapper');

		setWidth = wrapper.width();
		setHeight = setWidth * ratio;
		if(setHeight < wrapper.height()) {
			setHeight = wrapper.height();
			setWidth = setHeight / ratio;
		}

		var marginLeft = (wrapper.width() - setWidth) / 2;
		var marginTop = (wrapper.height() - setHeight) / 2;

		$('video', wrapper).css({
			width:setWidth,
			height:setHeight,
			'margin-left':marginLeft,
			'margin-top':marginTop
		});
	}
	$(window).bind('resize', setSize);
	setSize();
});