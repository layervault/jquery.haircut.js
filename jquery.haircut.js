(function($) {
  var
    options = {
      placement         : "middle",
      jitterPadding     : 15, //The more haircut items on the page, the more it jitters during animation. Adding padding reduces jitter but gives you less usable space.
      scrollTimeout     : 50
    },
    placement,
    getTrueContainerWidth,
    bindAbbrHover,
    bindScrollEvent,
    unbindAbbrHover,
    createExpansion,
    showExpansion,
    positionExpansion,
    hideExpansion,
    getStringWidth,
    getTrimmedString,
    getTrueContainerWidth,
    resize,
    setContainerWidth,
    setAbbrTitle;

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
  }

  showExpansion = function($e) {
    var expansionId = $e.data('id'),
        $expansion  = $('#' + expansionId);
    positionExpansion($e, $expansion);
    $expansion.addClass('_LVshowHaircutExpand');
  };

  positionExpansion = function($e, $expansion) {
    var w                         = $expansion.outerWidth(),
        h                         = $expansion.outerHeight(),
        containerWidth            = $e.width(),
        attrLineHeight            = $e.find('abbr').height(),
        attrTop                   = $e.find('abbr').offset().top,
        attrLeft                  = $e.find('abbr').offset().left,
        topPosition               = attrTop + ((attrLineHeight-h)/2),
        leftPosition              = attrLeft + ((containerWidth - w)/2);

    if (leftPosition < 0) {
      leftPosition = $e.offset().left;
    }
    else if ((leftPosition + containerWidth) > $(window).width()) {
      leftPosition = ($e.offset().left + containerWidth) - w;
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

  getRandomId = function() {
    return "_LV" + (Math.floor(Math.random() * 10000000) + 1);
  };

  getStringWidth = function ($e) {
    var temporaryStringContainer = document.createElement('div');
    $(temporaryStringContainer).html($e.find('abbr').attr('title'));
    $(temporaryStringContainer).css({
      position: 'fixed',
      top: '100%'
    });
    $('body').append(temporaryStringContainer);
    $e.data("stringWidth", $(temporaryStringContainer).width());
    $(temporaryStringContainer).remove();
    return $e.data("stringWidth");
  };

  getTrimmedString = function ($e) {
    var temporaryStringContainer  = document.createElement('div'),
        trimmedText               = 
        text                      = $e.find('abbr').attr('title'),
        textLength                = text.length,
        halfwayTextPosition       = Math.floor(textLength/2),
        placement                 = $e.data('placement'),
        i                         = 0,
        stringWidth               = $e.data("stringWidth"),
        stringWidthArray          = $e.data('stringWidthArray') || [];

      $(temporaryStringContainer).html(text);
      $(temporaryStringContainer).css({
        position: 'fixed', top: '100%'
      });


      $('body').append(temporaryStringContainer);
      $e.data("stringWidth", $(temporaryStringContainer).width());

      while (stringWidth > $e.data("containerWidth")) {

        if (stringWidthArray && stringWidthArray[i] < $e.data("containerWidth")) {
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
  getTrueContainerWidth = function ($e) {
    return (
      $e.width() -
      $e.data('jitterPadding') -
      parseInt($('div').css('text-indent'), 10) - 
      parseInt($('div').find('abbr').css('text-indent'), 10) -
      parseInt($('div').find('abbr').css('margin'), 10) -
      parseInt($('div').find('abbr').css('padding'), 10) -
      (parseInt($('div').find('abbr').css('border-width'), 10)*2)
    );
  };

  resize = function($e) {
    if ($e.data("stringWidth") > $e.data("containerWidth")) {
      $e.find('abbr').html(getTrimmedString($e));
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
    $e.data("containerWidth", getTrueContainerWidth($e));
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

      $e.data("placement", opts.placement);
      $e.data('jitterPadding', opts.jitterPadding);
      $e.data('scrollTimeout', opts.scrollTimeout);
      $e.data("stringWidth", getStringWidth($e));
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