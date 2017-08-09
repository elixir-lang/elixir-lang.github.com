// Dependencies
// ------------

import $ from 'jquery'
import hljs from 'highlight.js/build/highlight.pack'

window.$ = $

$(() => {
  // Setup Highlight.js
  hljs.configure({
    tabReplace: '    ', // 4 spaces
    languages: []       // disable auto-detect
  })

  hljs.initHighlighting()
})
