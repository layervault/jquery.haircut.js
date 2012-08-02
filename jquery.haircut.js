(function($) {
  var
    options = {
      bindToResize      : true, //Clips text when the page resizes
      bindToScroll      : true, //Only clips text that's in the viewport
      jitterPadding     : 50, //The more haircut items on the page, the more it jitters during animation. Adding padding reduces jitter but gives you less usable space.
      placement         : "middle",
      scrollTimeout     : 50
    },
    
    bindAbbrHover,
    bindScrollEvent,
    createExpansion,
    createTemporaryStringContainer,
    getLeftmostCharPos,
    getPrevCharPos,
    getStringWidth,
    getTrimmedStringByShrinking,
    getTrueContainerWidth,
    hideExpansion,
    placement,
    positionExpansion,
    resize,
    setAbbrTitle,
    setContainerWidth,
    setup,
    showExpansion,
    unbindAbbrHover;

  bindAbbrHover = function($e) {
    $e.on('mouseenter', 'abbr', function () {
      showExpansion($e);
    });

    $('body').on('mouseleave', '._LVhaircutExpand', function () {
      hideExpansion($e);
    });
  };

  bindScrollEvent = function($e) {
    var timeout       = 0,
        scrollTimeout = $e.data('scrollTimeout');
        
    $(window).scroll(function(){
      clearTimeout(timeout);
      timeout = setTimeout(function(){
        $e.stringResize()},
      scrollTimeout);
    });
  };

  unbindAbbrHover = function($e) {
    $e.off('mouseenter', 'abbr');
  };

  createExpansion = function($e) {
    var expansionStringContainer   = document.createElement('div'),
        randomId                   = getRandomId(),
        $abbr                      = $e.find('abbr'),
        $abbrParent,
        $abbrParentClone;

    if ($abbr.parent().get(0).tagName === 'A') { // Is the wrapping tag an anchor?
        $abbrParentClone = $abbr.parent().clone(); 
        $(expansionStringContainer).html($abbrParentClone.html($abbr.attr('title'))); // Unwrap the <abbr> and stick it inside the anchor.
    } else {
      $(expansionStringContainer).html($abbr.attr('title'));
    }
    $(expansionStringContainer).addClass('_LVhaircutExpand');
    $(expansionStringContainer).attr('id', randomId);
    $e.data('id', randomId);
    $('body').append(expansionStringContainer);
  };

  createTemporaryStringContainer = function($e, temporaryStringContainer) {
      $(temporaryStringContainer).css({
        position: 'fixed', 
        top: '100%',
        fontSize: $e.find('abbr').css('font-size'),
        lineHeight: $e.find('abbr').css('line-height'),
        letterSpacing: $e.find('abbr').css('letter-spacing')
      });
      $('body').append(temporaryStringContainer);
  };

  showExpansion = function($e) {
    var expansionId = $e.data('id'),
        $expansion  = $('#' + expansionId);
    positionExpansion($e, $expansion);
    $expansion.addClass('_LVshowHaircutExpand');
  };

  positionExpansion = function($e, $expansion) {
    var w                         = $expansion.outerWidth(),
        h                         = $expansion.outerHeight(),
        $attr                     = $e.find('abbr');
        attrWidth                 = $attr.width(),
        attrHeight                = $attr.height(),
        attrTop                   = $attr.offset().top,
        attrLeft                  = $attr.offset().left,
        topPosition               = (attrTop + (attrHeight/2)) - (h/2),
        leftPosition              = (attrLeft + (attrWidth/2)) - (w/2)

    if (leftPosition < 0) {
      leftPosition = 0;
    }
    else if ((leftPosition + w) > $(window).width()) {
      leftPosition = $(window).width() - w;
    }

    $expansion.css({
      top:        topPosition,
      left:       leftPosition
    });
  };

  hideExpansion = function($e) {
    var expansionId = $e.data('id'),
    $expansion  = $('#' + expansionId);
    $expansion.removeClass('_LVshowHaircutExpand');
    $expansion.css({
      left:       "-100%"
    });
  };

  hideAllExpansions = function() {
    $('._LVhaircutExpand').removeClass('_LVshowHaircutExpand');
  };

  getEllipsiedString = function(i, placement, textLength, halfwayTextPosition) {
    if (placement === "start" || placement === "beginning") {
      trimmedText = "&hellip;" + text.slice(i, textLength);
    }
    else if (placement === "end") {
      trimmedText = text.slice(0, textLength-i) + "&hellip;";
    }
    else {
      trimmedText = text.slice(0, halfwayTextPosition - Math.ceil(i/2)) + "&hellip;" + text.slice(halfwayTextPosition + Math.floor(i/2), textLength);
    }

    return trimmedText;
  }

  getLeftmostCharPos = function($e) {
    var cursorDiv  = document.createElement('div'),
        cursorPos;
    $(cursorDiv).html("&nbsp; ");
    $(cursorDiv).css({
      display: "inline"
    });
  
    $e.prepend(cursorDiv);
    cursorPos = $(cursorDiv).position().left;
    $(cursorDiv).remove();

    return(cursorPos);
  };

  getRandomId = function() {
    return "_LV" + (Math.floor(Math.random() * 10000000) + 1);
  };

  getStringWidth = function ($e) {
    var temporaryStringContainer = document.createElement('div');
    $(temporaryStringContainer).html($e.find('abbr').attr('title'));
    createTemporaryStringContainer($e, temporaryStringContainer);
    $e.data("stringWidth", $(temporaryStringContainer).width());
    $e.data("stringHeight", $e.find('abbr').outerHeight());
    $(temporaryStringContainer).remove();
    return $e.data("stringWidth");
  };

  getTrimmedStringByShrinking = function ($e) {
    var temporaryStringContainer  = document.createElement('div'),
        containerWidth            = $e.data('containerWidth'),
        jitterPadding             = $e.data('jitterPadding'),
        trimmedText               = 
        text                      = $e.find('abbr').attr('title'),
        textLength                = text.length,
        halfwayTextPosition       = Math.floor(textLength/2),
        placement                 = $e.data('placement'),
        i                         = 0,
        stringWidth               = $e.data('stringWidth'),
        stringWidthArray          = $e.data('stringWidthArray') || [];

      createTemporaryStringContainer($e, temporaryStringContainer);

      $(temporaryStringContainer).html(text);

      $e.data("stringWidth", $(temporaryStringContainer).width());

      while (stringWidth > containerWidth && containerWidth > jitterPadding) {

        if (stringWidthArray && stringWidthArray[i] < containerWidth) {
        // if you already have data for this i, set it as the string width
          trimmedText = getEllipsiedString(i, placement, textLength, halfwayTextPosition);
          stringWidth = stringWidthArray[i];
        }
        else if (!stringWidthArray[i]){
          trimmedText = getEllipsiedString(i, placement, textLength, halfwayTextPosition);
          $(temporaryStringContainer).html(trimmedText);
          stringWidth = $(temporaryStringContainer).width();
          stringWidthArray[i] = stringWidth;
        }
        i++;
      }

      $(temporaryStringContainer).remove();
      $e.data('stringWidthArray', stringWidthArray);

    return trimmedText;
  };

  // Get the actual usable area inside the div
  getUsableWidth = function ($e) {
    var trueContainerWidth  = $e.innerWidth() - 
                              $e.data('jitterPadding') -
                              parseInt($e.css('text-indent'), 10) -
                              parseInt($e.find('abbr').css('text-indent'), 10) - 
                              parseInt($e.find('abbr').css('margin'), 10) -
                              (parseInt($e.find('abbr').css('border-width'), 10)*2),
        abbrLeftPos         = $e.data('abbrLeftPos'),
        prevCharPos;



    if ($e.data("display") === "inline") {
      if (abbrLeftPos > $e.data('leftmostPos')) {
      // If the abbr is so long that it dropped to the next line
      // or if it's at the start of the line.
        return (trueContainerWidth - abbrLeftPos);
      } else {
      // Try figuring out where it should be positioned in the previous line
        prevCharPos = getPrevCharPos($e);
        //return ($e.data.innerWidth() - prevCharPos);
        return (trueContainerWidth - prevCharPos);
      }
    } else {
      return trueContainerWidth;
    }
  };

  getPrevCharPos = function($e) {
    var $abbr = $e.find('abbr'),
        cursorDiv  = document.createElement('div'),
        cursorPos;
    $(cursorDiv).html("&nbsp; ");
    $(cursorDiv).css({
      display: "inline"
    });
    if ($abbr.parent().get(0).tagName === 'A') {
      $e.find('a').before(cursorDiv);
    } else {
      $abbr.before(cursorDiv);
    }
    cursorPos = $(cursorDiv).position().left;
    $(cursorDiv).remove();
    return(cursorPos);
  };

  resize = function($e) {
    var $abbr = $e.find('abbr'),
        jitterPadding = $e.data("jitterPadding");
    
    if ($e.data("containerWidth") < jitterPadding) {
      $e.find('abbr').html("&hellip;");
      bindAbbrHover($e);
    } else if ($e.data("stringWidth") > $e.data("containerWidth")) {
      $e.find('abbr').html(getTrimmedStringByShrinking($e));
      bindAbbrHover($e);
    } else {
      $e.find('abbr').html($e.find('abbr').attr('title'));
      unbindAbbrHover($e);
    }

  };

  setAbbrTitle = function($e) {
    var text = $e.find('abbr').text();
    $e.find('abbr').attr('title', text);
  };

  setContainerWidth = function($e) {
    $e.data("containerWidth", getUsableWidth($e));
  };

  setup = function($e, opts) {
    $e.data("placement", opts.placement);
    $e.data('jitterPadding', opts.jitterPadding);
    $e.data('scrollTimeout', opts.scrollTimeout);
    $e.data("stringWidth", getStringWidth($e));
    $e.data("leftmostPos", getLeftmostCharPos($e));
    $e.data("abbrLeftPos", $e.find('abbr').position().left);
    $e.data("display", $e.find('abbr').css('display'));
  };

  // Expose our options to the world.
  $.haircut = (function () {
    return { options: options };
  })();

  //-- Methods to attach to jQuery sets

  $.fn.haircut = function(opts) {
    var $allMatching = $(this),
        $e;

    opts = $.extend(options, opts);

    $allMatching.each(function(){
      $e = $(this);

      setAbbrTitle($e);
      createExpansion($e);

      setup($e, opts);
      setContainerWidth($e);

      $e.stringResize();
    });

    bindScrollEvent($allMatching);
  };

  $.fn.stringResize = function() {
    var $allMatching  = $(this),
        topWindowY    = $(window).scrollTop(),
        bottomWindowY = (topWindowY + $(window).height()),
        $e,
        ePos;

    hideAllExpansions();

    $allMatching.each(function(options){
      $e = $(this);
      ePos = $e.offset().top;
      if (ePos > topWindowY && ePos < bottomWindowY) {
        setContainerWidth($e);
        resize($e);
      }
    });
  };
})(jQuery);