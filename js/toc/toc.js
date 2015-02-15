// https://github.com/ghiculescu/jekyll-table-of-contents
(function($){
  $.fn.toc = function(options) {
    var defaults = {
      title: '',
      minimumHeaders: 3,
      headers: 'h1, h2, h3, h4, h5, h6',
      listType: 'ol', // values: [ol|ul]
      showEffect: 'show', // values: [show|slideDown|fadeIn|none]
      showSpeed: 'slow', // set to 0 to deactivate effect
      
      linkHeader: true,
      linkHere: false,
      linkHereText: '',
      linkHereDuration: 0,
      backToTop: false,
      backToTopSelector: '',
      backToTopText: '',
      backToTopDisplay: 'always', // values: [always|highest] 
      backToTopDuration: 0,
    },
    settings = $.extend(defaults, options);

    backwardCompatible = function() {
      // support old option: noBackToTopLinks
      if (typeof options.backToTop === "undefined" && typeof options.noBackToTopLinks !== "undefined") {
        settings.backToTop == !options.noBackToTopLinks;
      }
    }
    backwardCompatible();

    var headers = $(settings.headers).filter(function() {
      // get all headers with an ID
      var previousSiblingName = $(this).prev().attr( "name" );
      if (!this.id && previousSiblingName) {
        this.id = $(this).attr( "id", previousSiblingName.replace(/\./g, "-") );
      }
      return this.id;
    }), output = $(this);
    
    if (!headers.length || headers.length < settings.minimumHeaders || !output.length) {
      return;
    }
    
    if (0 === settings.showSpeed || window.location.hash == '') {
      settings.showEffect = 'none';
    }
    
    var render = {
      show: function() { output.hide().html(html).show(settings.showSpeed); },
      slideDown: function() { output.hide().html(html).slideDown(settings.showSpeed); },
      fadeIn: function() { output.hide().html(html).fadeIn(settings.showSpeed); },
      none: function() { output.html(html); }
    };

    var get_level = function(ele) { return parseInt(ele.nodeName.replace("H", ""), 10); }
    var highest_level = headers.map(function(_, ele) { return get_level(ele); }).get().sort()[0];

    var level = get_level(headers[0]),
      this_level,
      header_id,
      html = settings.title + ' <'+settings.listType+' class="jekyll-toc">';

    var back_to_top = '<a class="jekyll-toc-anchor jekyll-toc-back-to-top"><span class="jekyll-toc-icon">'+settings.backToTopText+'</span></a>';
    var link_here = '<a class="jekyll-toc-anchor jekyll-toc-link-here"><span class="jekyll-toc-icon">'+settings.linkHereText+'</span></a>';

    function update_hash(hash) { 
      if(history.pushState) {
        history.pushState(null, null, '#'+hash);
      } else {
        location.hash = '#'+hash;
      }
    }

    function animate_link_here(header_id) {
      update_hash( (typeof header_id === "undefined") ? '' : header_id );
      $('html,body').animate({scrollTop:$(document.getElementById(header_id)).offset().top}, settings.linkHereDuration);
    }

    if (settings.backToTop) {
      $(document).on('click', '.jekyll-toc-back-to-top', function() {
        if ( settings.backToTopSelector == '' ) {
          if ( settings.backToTopDuration > 0 ) {
            update_hash('');
            $('html, body').animate({scrollTop: $('html, body').offset().top}, settings.backToTopDuration);
          } else {
            // force update
            window.location.hash = '';
          }
        } else {
          var top_element = ( $(settings.backToTopSelector).length ) ? $(settings.backToTopSelector).first() : $('html, body');
          var top_element_id = $(top_element).attr('id');
          update_hash ( (typeof top_element_id === "undefined") ? '' : top_element_id );
          if ( settings.backToTopDuration > 0 || window.location.hash == '' ) {
            $('html, body').animate({scrollTop: top_element.offset().top}, settings.backToTopDuration);
          } else {
            // force update
            console.log("force update");
            window.location.hash == window.location.hash
          }
        }
      });
    }

    $(headers).each(function(_, header) {
      this_level = get_level(header);
      header_id = $(header).attr('id');
      if (this_level === level) // same level as before; same indenting
        html += "<li><a href='#" + header.id + "'>" + header.innerHTML + "</a>";
      else if (this_level <= level){ // higher level than before; end parent ol
        for(i = this_level; i < level; i++) {
          html += "</li></"+settings.listType+">"
        }
        html += "<li><a href='#" + header.id + "'>" + header.innerHTML + "</a>";
      }
      else if (this_level > level) { // lower level than before; expand the previous to contain a ol
        for(i = this_level; i > level; i--) {
          html += "<"+settings.listType+"><li>"
        }
        html += "<a href='#" + header.id + "'>" + header.innerHTML + "</a>";
      }
      level = this_level; // update for the next one

      // add links at the end (so we don't pulute header.innerHTML)
      $(header).addClass('jekyll-toc-top-level-header').wrapInner('<span class="jekyll-toc-wrapper"></span>').append(link_here);
      if (settings.backToTop) {
        switch(settings.backToTopDisplay){
          case 'highest':
            if ( this_level === highest_level ) {
              $(header).append(back_to_top);      
            }
            break;
          case 'always':
          default:
            $(header).append(back_to_top);      
        }
      }

      if (settings.linkHeader) {
        $(header).addClass('jekyll-toc-header');
        $(header).children('span.jekyll-toc-wrapper').on( 'click', function( ) {
          animate_link_here($(header).attr('id'));
        });
        $(header).children('a.jekyll-toc-link-here').on( 'click', function( ) {
          animate_link_here($(header).attr('id'));
        });
      }
    });

    html += "</"+settings.listType+">";

    render[settings.showEffect]();
  };
})(jQuery);
