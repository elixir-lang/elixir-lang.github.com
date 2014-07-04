//Simple js code to preprocess the combined markdown file. Things could break
//when there is sth not considered.
//
//author: Li, Yu (liyu1981@gmail.com)

var lines = require('fs').readFileSync('all.markdown').toString().split('\n');
var reHeader = /^---$/;
var reCodeStart = /^```(.*)/;
var reCodeEnd = /^```$/;
var reSection = /^(#+)\s(\d+\.\d+)/;
var inHeaderMode = false;
var inCodeMode = false;
var curPageTitle = null;
lines.forEach(function(line) {
  //console.log('** will do:', line);
  if (line.indexOf('<div class="toc"></div>') >= 0) {
    // skip
    return;
  }

  if (line.indexOf('{{ page.title }}') >= 0) {
    var l = line.replace('{{ page.title }}', curPageTitle.toString());
    console.log(l);
    return;
  }

  var l = line.trim();

  if (inHeaderMode === true) {
    if (reHeader.test(l)) {
      inHeaderMode = false;
    }
    var kv = l.split(':');
    if (kv[0] === 'title') {
      curPageTitle = kv[1].trim();
      // remove the leading number
      var r = /^\d+\s/.exec(curPageTitle);
      if (r) {
        curPageTitle = curPageTitle.substring(r.index + r[0].length);
      }
      //console.log('change title:', curPageTitle);
    }
    return;
  } else {
    if (reHeader.test(l)) {
      inHeaderMode = true;
      return;
    }
    var r = reCodeStart.exec(l);
    if (r && inCodeMode === false) {
      console.log('\\begin{minted}[mathescape, linenos, numbersep=5pt, frame=lines, framesep=2mm]{' + (r[1] ? r[1] : 'ex' ) + '}');
      inCodeMode = true;
      return;
    }
    if (reCodeEnd.test(l)) {
      console.log('\\end{minted}');
      inCodeMode = false;
      return;
    }

    // remove the numbers in title, such as ## 1.1 Installing Erlang => ## Installing Erlang
    r = reSection.exec(l);
    if (r) {
      console.log(l.replace(r[2], ''));
      return;
    }

    console.log(line);
  }
});
