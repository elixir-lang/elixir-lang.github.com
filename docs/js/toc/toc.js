// https://github.com/ghiculescu/jekyll-table-of-contents
(function($){
  $.fn.toc = function(options) {
    var defaults = {
      title: '',
      minimumHeaders: 3,
      headers: 'h1, h2, h3, h4, h5, h6',
      listType: 'ol', // values: [ol|ul]
      
      linkHeader: true,
      linkHere: false,
      linkHereText: '',
      linkHereTitle: 'Link here',
      backToTop: false,
      backToTopId: '',
      backToTopText: '',
      backToTopTitle: 'Back to top',
      backToTopDisplay: 'always', // values: [always|highest] 
    },
    settings = $.extend(defaults, options);

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
    
    var get_level = function(ele) { return parseInt(ele.nodeName.replace("H", ""), 10); }
    var highest_level = headers.map(function(_, ele) { return get_level(ele); }).get().sort()[0];

    var level = get_level(headers[0]),
      this_level,
      html = settings.title + ' <'+settings.listType+' class="jekyll-toc">';

    var back_to_top = function(id) {
      return '<a href="#' +fixedEncodeURIComponent(id)+ '" title="'+settings.backToTopTitle+'" class="jekyll-toc-anchor jekyll-toc-back-to-top"><span class="jekyll-toc-icon">'+settings.backToTopText+'</span></a>';
    }

    var link_here = function(id) {
      return '<a href="#' +fixedEncodeURIComponent(id)+ '" title="'+settings.linkHereTitle+'" class="jekyll-toc-anchor jekyll-toc-link-here"><span class="jekyll-toc-icon">'+settings.linkHereText+'</span></a>';
    }

    function fixedEncodeURIComponent (str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
      });
    }

    function force_update_hash(hash) {
      if ( window.location.hash == hash ) {
        window.location.hash = '';
      }
      window.location.hash = hash;
      
    }

    $(headers).each(function(_, header) {
      this_level = get_level(header);
      var header_id = $(header).attr('id');
      if (this_level === level) // same level as before; same indenting
        html += "<li><a href='#" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      else if (this_level <= level){ // higher level than before; end parent ol
        for(i = this_level; i < level; i++) {
          html += "</li></"+settings.listType+">"
        }
        html += "<li><a href='#" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      }
      else if (this_level > level) { // lower level than before; expand the previous to contain a ol
        for(i = this_level; i > level; i--) {
          html += "<"+settings.listType+"><li>"
        }
        html += "<a href='#" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      }
      level = this_level; // update for the next one

      // add links at the end (so we don't pulute header.innerHTML)
      $(header).addClass('jekyll-toc-top-level-header').wrapInner('<span class="jekyll-toc-wrapper"></span>').append( link_here(header_id) );
      if (settings.backToTop) {
        switch(settings.backToTopDisplay){
          case 'highest':
            if ( this_level === highest_level ) {
              $(header).append( back_to_top(settings.backToTopId) );      
            }
            break;
          case 'always':
          default:
            $(header).append( back_to_top(settings.backToTopId) );      
        }
      }

      if (settings.linkHeader) {
        $(header).addClass('jekyll-toc-header');
        $(header).children('span.jekyll-toc-wrapper').on( 'click', function( ) {
          force_update_hash(fixedEncodeURIComponent(header_id));
        });
      }
    });

    html += "</"+settings.listType+">";

    output.html(html)
  };
})(jQuery);