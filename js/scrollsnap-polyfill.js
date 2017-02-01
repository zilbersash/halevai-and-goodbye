(function(w, doc, undefined) {
  // Enable strict mode
  'use strict';
  
  $(function() {
    $(".scrolling-layer").each(function(i, element) {
      setUpElement(element);
    });
  });
  
  

  /*
   * alias
   * w: window global object
   * doc: document
   * undefined: undefined
   */

    /**
     * constraint to jumping to the next snap-point.
     * when scrolling further than SNAP_CONSTRAINT snap-points,
     * but the current distance is less than 1-0.18 (read: 18 percent),
     * the snap-will go back to the closer snap-point.
     */
  var CONSTRAINT = 1-0.18,
      /*
       * if scrolling for one snap-point only,
       * the scroll distance must be at least 5% of the scroll-width.
       */
      FIRST_CONSTRAINT = 1-0.05,

      /*
       * minimum scroll distance in pixel
       */
      MIN_PX_CONSTRAINT = 5,

      /**
       * when scrolling for more than SNAP_CONSTRAINT snap points,
       * a constraint is applied for scrolling to snap points in the distance.
       * @type {Number}
       */
      SNAP_CONSTRAINT = 2,

      /**
       * time in ms after which scrolling is considered finished.
       * the scroll timeouts are timed with this.
       * whenever a new scroll event is triggered, the previous timeout is deleted.
       * @type {Number}
       */
      SCROLL_TIMEOUT = 45,

      /**
       * time for the smooth scrolling
       * @type {Number}
       */
      SCROLL_TIME = 450; //768;

  /**
   * set up an element for scroll-snap behaviour
   * @param {Object} obj         HTML element
   * @param {Object} declaration CSS declarations
   */
  function setUpElement(obj) { //, declaration) {
    // add the event listener
    obj.addEventListener('scroll', handler, false);

    // init possible elements
    obj.snapElements = $(obj).find('.snap');
  }

  /**
   * the last created timeOutId for scroll event timeouts.
   * @type int
   */
  var timeOutId = null;

  /**
   * starting point for current scroll
   * @type length
   */
  var scrollStart = null;

  /**
   * the last object receiving a scroll event
   */
  var lastScrollObj;

  /**
   * scroll handler
   * this is the callback for scroll events.
   */
  var handler = function(evt) {

    // use evt.target as target-element
    lastScrollObj = evt.target;
    // lastScrollObj = lastObj;

    // if currently animating, stop it. this prevents flickering.
    if (animationFrame) {
      // cross browser
      if (!cancelAnimationFrame(animationFrame)) {
        clearTimeout(animationFrame);
      }
    }

    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId);
    } else {
      // save new scroll start
      scrollStart = lastScrollObj.scrollTop;
    }

    /* set a timeout for every scroll event.
     * if we have new scroll events in that time, the previous timeouts are cleared.
     * thus we can be sure that the timeout will be called 50ms after the last scroll event.
     * this means a huge improvement in speed, as we just assign a timeout in the scroll event, which will be called only once (after scrolling is finished)
     */
    timeOutId = setTimeout(handlerDelayed, SCROLL_TIMEOUT);
  };

  /**
   * a delayed handler for scrolling.
   * this will be called by setTimeout once, after scrolling is finished.
   */
  var handlerDelayed = function() {
    // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for scrollStart+1.
    if(scrollStart == lastScrollObj.scrollTop) {
      // ignore timeout
      return;
    }

    // detect direction of scroll. negative is up, positive is down.
    var direction = (scrollStart - lastScrollObj.scrollTop > 0) ? -1 : 1;
    var snapPoint;

    // if (typeof lastScrollObj.snapElements !== 'undefined' && lastScrollObj.snapElements.length > 0) {
    snapPoint = getNextElementSnapPoint(lastScrollObj, direction);
    if (snapPoint === null) {
      scrollStart = lastScrollObj.scrollTop;
      return;
    }

    // before doing the move, unbind the event handler (otherwise it calls itself kinda)
    lastScrollObj.removeEventListener('scroll', handler, false);

    // smoothly move to the snap point
    smoothScroll(lastScrollObj, {y: snapPoint, x: 0}, function() {
      // after moving to the snap point, rebind the scroll event handler
      lastScrollObj.addEventListener('scroll', handler, false);
    });

    // we just jumped to the snapPoint, so this will be our next scrollStart
    if (!isNaN(snapPoint)) {
      scrollStart = snapPoint;
    }
  };

  var currentIteratedObj = null,
      currentIteration = -1;

  function getNextElementSnapPoint(scrollObj, direction) {
    var l = scrollObj.snapElements.length;
    if (l == 0) {
      return null;
    }
    var top = scrollObj.scrollTop;
    var snapCoords = 0;
    
    var firstSnap = 0;
    var lastSnap = l - 1;
    
    if (direction == 1) {
      // Find first element that is below scrollStart.
      $.each(scrollObj.snapElements, function(i, el) {
        if (el.offsetTop > scrollStart) {
          firstSnap = i;
          return false;
        }
      });
    } else {
      // Find last element that is above scrollStart.
      $.each(scrollObj.snapElements, function(i, el) {
        if (el.offsetTop >= scrollStart) {
          lastSnap = i - 1;
          return false;
        }
      });
    }

    for(var i = firstSnap; i <= lastSnap; i++) {
      currentIteratedObj = scrollObj.snapElements[i];
      // get objects snap coords by adding obj.top + obj.snaplength.y
      snapCoords = currentIteratedObj.offsetTop - scrollObj.offsetTop;
      // check if object snappoint is "close" enough to scrollable snappoint
      var height = scrollObj.offsetHeight;
      var minScrollToSnap = snapCoords - height / 2;
      var maxScrollToSnap = snapCoords + height / 2;
      if (top >= minScrollToSnap && top <= maxScrollToSnap) {
        // ok, we found a snap point.
        currentIteration = i;
        // stay in bounds (minimum: 0, maxmimum: absolute height)
        return stayInBounds(0, scrollObj.scrollHeight, snapCoords);
      }
    }
    // no snap found, use first or last?
    if (direction == 1 && i === l-1) {
      currentIteration = l-1;
      // the for loop stopped at the last element
      return stayInBounds(0, scrollObj.scrollHeight, snapCoords);
    } else if (direction == -1 && i === 0) {
      currentIteration = 0;
      // the for loop stopped at the first element
      return stayInBounds(0, scrollObj.scrollHeight, snapCoords);
    }
    // stay in the same place
    return null;
  }

  function stayInBounds(min, max, destined) {
    return Math.max(Math.min(destined, max), min);
  }

  /**
   * calc the duration of the animation proportional to the distance travelled
   * @param  {Number} start
   * @param  {Number} end
   * @return {Number}       scroll time in ms
   */
  function getDuration(start, end) {
    var distance = Math.abs(start - end),
        procDist = 100 / Math.max(doc.documentElement.clientHeight, w.innerHeight || 1) * distance,
        duration = 100 / SCROLL_TIME * procDist;

    if (isNaN(duration)) {
      return 0;
    }

    return Math.max(SCROLL_TIME / 1.5, Math.min(duration, SCROLL_TIME));
  }

  /**
   * ease in out function thanks to:
   * http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
   * @param  {Number} t timing
   * @return {Number}   easing factor
   */
  var easeInCubic = function(t) {
    return t*t*t;
  };


  /**
   * calculate the scroll position we should be in
   * @param  {Number} start    the start point of the scroll
   * @param  {Number} end      the end point of the scroll
   * @param  {Number} elapsed  the time elapsed from the beginning of the scroll
   * @param  {Number} duration the total duration of the scroll (default 500ms)
   * @return {Number}          the next position
   */
  var position = function(start, end, elapsed, duration) {
      if (elapsed > duration) {
        return end;
      }
      return start + (end - start) * easeInCubic(elapsed / duration);
  };

  // a current animation frame
  var animationFrame = null;

  /**
   * smoothScroll function by Alice Lietieur.
   * @see https://github.com/alicelieutier/smoothScroll
   * we use requestAnimationFrame to be called by the browser before every repaint
   * @param  {Object}   obj      the scroll context
   * @param  {Number}  end      where to scroll to
   * @param  {Number}   duration scroll duration
   * @param  {Function} callback called when the scrolling is finished
   */
  var smoothScroll = function(obj, end, callback) {
    var start = {y: obj.scrollTop, x: obj.scrollLeft},

        clock = Date.now(),

        // get animation frame or a fallback
        requestAnimationFrame = w.requestAnimationFrame ||
                                w.mozRequestAnimationFrame ||
                                w.webkitRequestAnimationFrame ||
                                function(fn){w.setTimeout(fn, 15);},
        duration = Math.max(getDuration(start.y, end.y), getDuration(start.x, end.x));

      // setup the stepping function
      var step = function() {

        // calculate timings
        var elapsed = Date.now() - clock;

        // change position on y-axis if result is a number.
        if (!isNaN(end.y)) {
          obj.scrollTop = position(start.y, end.y, elapsed, duration);
        }

        // change position on x-axis if result is a number.
        if (!isNaN(end.x)) {
          obj.scrollLeft = position(start.x, end.x, elapsed, duration);
        }

        // check if we are over due
        if (elapsed > duration) {
          // is there a callback?
          if (typeof callback === 'function') {
            // stop execution and run the callback
            return callback(end);
          }

          // stop execution
          return;
        }

        // use a new animation frame
        animationFrame = requestAnimationFrame(step);
      };

      // start the first step
      step();
  };
}(window, document));
