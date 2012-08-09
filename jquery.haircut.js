(function($) {
  var
    options = {
      jitterPadding : 30, //The more haircut items on the page, the more it jitters during animation. Adding padding reduces jitter but gives you less usable space.
      placement     : "middle"
    },

    bindAbbrHover,
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
    setContainerWidth,
    setRandomId,
    setup,
    showExpansion,
    getEllipsiedString;

  bindAbbrHover = function() {
    if (!this.eventsBound) {
      $('body').on('mouseenter', '._LVhaircut abbr', function () {
        if ($(this).hasClass('_LVhaircutTrimmed')) {
          var $e = $('.' + $(this).data('container_id'));
          showExpansion($e);
        }
      });

      $('body').on('mouseleave', '._LVshowHaircutExpand', function () {
        hideExpansion($(this));
      });

      this.eventsBound = true;
    }
  };

  createExpansion = function($e) {
    var
      $expansionStringContainer  = $('<div></div>'),
      randomId                   = $e.data('container_id'),
      $abbr                      = $e.find('abbr'),
      $abbrParent,
      $abbrParentClone;

    if ($abbr.length === 0) {
      return;
    }

    if ($abbr.parent().get(0).tagName === 'A') { // Is the wrapping tag an anchor?
        $abbrParentClone = $abbr.parent().clone();
        $expansionStringContainer.html($abbrParentClone.html($abbr.attr('title'))); // Unwrap the <abbr> and stick it inside the anchor.
    }
    else {
      $expansionStringContainer.html($abbr.attr('title'));
    }

    $expansionStringContainer.addClass('_LVhaircutExpand');
    $expansionStringContainer.attr('id', randomId);

    $('body').append($expansionStringContainer);
  };

  // We need to create a temporary container with the same font attributes
  // as the source object.
  createTemporaryStringContainer = function($e, $temporaryStringContainer) {
    $temporaryStringContainer.css({
      position: 'fixed',
      top: '100%',
      fontSize: $e.find('abbr').css('font-size'),
      lineHeight: $e.find('abbr').css('line-height'),
      letterSpacing: $e.find('abbr').css('letter-spacing')
    });

    $('body').append($temporaryStringContainer);
  };

  showExpansion = function($e) {
    var expansionId = $e.data('container_id'),
    $expansion  = $('#' + expansionId);
    positionExpansion($e, $expansion);
    $expansion.addClass('_LVshowHaircutExpand');
  };

  positionExpansion = function($e, $expansion) {
    var
      w                     = $expansion.outerWidth(),
      h                     = $expansion.outerHeight(),
      $attr                 = $e.find('abbr');
      attrWidth             = $attr.width(),
      attrHeight            = $attr.height(),
      attrTop               = $attr.offset().top,
      attrLeft              = $attr.offset().left,
      expansionLeftPadding  = parseInt($('._LVhaircutExpand').css('padding-left'),10) * 2,
      topPosition           = (attrTop + (attrHeight/2)) - (h/2),
      leftPosition          = (attrLeft + (attrWidth/2)) - (w/2);


    if ((leftPosition - expansionLeftPadding)< 0) {
      leftPosition = (expansionLeftPadding * 2);
    }
    else if ((leftPosition + w) > $(window).width()) {
      leftPosition = $(window).width() - w + expansionLeftPadding;
    }

    $expansion.css({
      top:  topPosition,
      left: leftPosition
    });
  };

  hideExpansion = function($expansion) {
    $expansion.removeClass('_LVshowHaircutExpand');
    $expansion.css({
      left: "-100%"
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
    else { // middle
      trimmedText = text.slice(0, halfwayTextPosition - Math.ceil(i/2)) + "&hellip;" + text.slice(halfwayTextPosition + Math.floor(i/2), textLength);
    }

    return trimmedText;
  }

  getLeftmostCharPos = function($e) {
    var
      $cursorDiv = $('<div style="display: inline;">&nbsp; </div>'),
      cursorPos;

    $e.prepend($cursorDiv);
    cursorPos = $cursorDiv.position().left;
    $cursorDiv.remove();

    return(cursorPos);
  };

  getRandomId = function() {
    return "_LV" + (Math.floor(Math.random() * 10000000) + 1);
  };

  getStringWidth = function ($e) {
    var
      $temporaryStringContainer = $('<div></div>'),
      $abbr = $e.find('abbr');

    $temporaryStringContainer.html($abbr.attr('title'));
    createTemporaryStringContainer($e, $temporaryStringContainer);

    $e.data("stringWidth", $temporaryStringContainer.width());
    $e.data("stringHeight", $abbr.outerHeight());

    $temporaryStringContainer.remove();

    return $e.data("stringWidth");
  };

  getTrimmedStringByShrinking = function ($e) {
    var
      $temporaryStringContainer = $('<div></div>'),
      containerWidth            = $e.data('containerWidth'),
      jitterPadding             = $e.data('jitterPadding'),
      trimmedText               =
      text                      = $e.find('abbr').attr('title'),
      textLength                = text.length,
      halfwayTextPosition       = Math.floor(textLength / 2),
      placement                 = $e.data('placement'),
      i                         = 0,
      stringWidth               = $e.data('stringWidth'),
      stringWidthArray          = $e.data('stringWidthArray') || [];

    createTemporaryStringContainer($e, $temporaryStringContainer);

    $temporaryStringContainer.html(text);

    $e.data("stringWidth", $temporaryStringContainer.width());

    while (stringWidth > containerWidth && containerWidth > jitterPadding) {
      if (stringWidthArray && stringWidthArray[i] < containerWidth) {
      // if you already have data for this i, set it as the string width
        trimmedText = getEllipsiedString(i, placement, textLength, halfwayTextPosition);
        stringWidth = stringWidthArray[i];
      }
      else if (!stringWidthArray[i]) {
        trimmedText = getEllipsiedString(i, placement, textLength, halfwayTextPosition);
        $temporaryStringContainer.html(trimmedText);
        stringWidth = $temporaryStringContainer.width();
        stringWidthArray[i] = stringWidth;
      }
      i++;
    }

    $temporaryStringContainer.remove();
    $e.data('stringWidthArray', stringWidthArray);

    return trimmedText;
  };

  // Get the actual usable area inside the div
  getUsableWidth = function ($e) {
    var
      trueContainerWidth,
      abbrLeftPos = $e.data('abbrLeftPos'),
      prevCharPos,
      usableWidth,
      $abbr = $e.find('abbr');

    trueContainerWidth  = $e.width() -
                            $e.data('jitterPadding') -
                            parseInt($e.css('text-indent'), 10) -
                            parseInt($abbr.css('text-indent'), 10) -
                            parseInt($abbr.css('margin'), 10) -
                            (parseInt($abbr.css('border-width'), 10) * 2);

    if ($e.data("display") === "inline") {
      if (abbrLeftPos > $e.data('leftmostPos')) {
      // If the abbr is so long that it dropped to the next line
      // or if it's at the start of the line.
        usableWidth = trueContainerWidth - abbrLeftPos;
      }
      else if ($e.css("text-align") !== "center") {
        // Try figuring out where it should be positioned in the previous line
        prevCharPos = getPrevCharPos($e);
        usableWidth = trueContainerWidth - prevCharPos;
      }
      else {
        usableWidth = trueContainerWidth;
      }
    }
    else {
      usableWidth = trueContainerWidth;
    }

    return usableWidth;
  };

  getPrevCharPos = function($e) {
    var
      $abbr       = $e.find('abbr'),
      // non-breaking space plus space character forces a line-break
      $cursorDiv  = $('<div style="display: inline;">&nbsp; </div>'),
      cursorPos;

    if ($abbr.parent().get(0).tagName === 'A') {
      $e.find('a').before($cursorDiv);
    }
    else {
      $abbr.before($cursorDiv);
    }

    cursorPos = $cursorDiv.position().left;
    $cursorDiv.remove();

    return cursorPos;
  };

  resize = function($e) {
    var
      $abbr = $e.find('abbr'),
      jitterPadding = $e.data("jitterPadding"),
      containerWidth = $e.data("containerWidth"),
      newText;

    if (containerWidth < jitterPadding) {
      newText = "&hellip;";
      $abbr.addClass("_LVhaircutTrimmed");
    }
    else if ($e.data("stringWidth") > containerWidth) {
      newText = getTrimmedStringByShrinking($e);
      $abbr.addClass("_LVhaircutTrimmed");
    }
    else {
      newText = $abbr.attr('title');
      $abbr.removeClass("_LVhaircutTrimmed");
    }

    $abbr.html(newText);
  };

  setContainerWidth = function($e) {
    $e.data("containerWidth", getUsableWidth($e));
  };

  setRandomId = function($e) {
    var id = getRandomId();
    $e.data('container_id', id);
    $e.find('abbr').data('container_id', id);
    $e.addClass(id)
  };

  setup = function($e, opts) {
    $e.data("placement",      opts.placement)
      .data('jitterPadding',  opts.jitterPadding)
      .data("stringWidth",    getStringWidth($e))
      .data("leftmostPos",    getLeftmostCharPos($e))
      .data("abbrLeftPos",    $e.find('abbr').position().left)
      .data("display",        $e.find('abbr').css('display'));
  };

  // Expose our options to the world.
  $.haircut = (function () {
    return { options: options };
  })();

  //-- Methods to attach to jQuery sets

  $.fn.haircut = function(opts) {
    var
      $allMatching = $(this),
      $e;

    opts = $.extend(options, opts);

    $allMatching.each(function(){
      $e = $(this);

      if ($e.find('abbr').length === 0) {
        return;
      }

      $e.addClass('_LVhaircut');

      setRandomId($e);
      createExpansion($e);

      setup($e, opts);
      setContainerWidth($e);

      $e.stringResize();
    });

    bindAbbrHover();
  };

  $.fn.stringResize = function() {
    var
      $allMatching  = $(this),
      ePos;

    hideAllExpansions();

    $allMatching.each(function(options){
      var $e = $(this);
      setContainerWidth($e);
      resize($e);
    });
  };
})(jQuery);