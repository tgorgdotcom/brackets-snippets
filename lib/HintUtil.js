/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";
  var _         = brackets.getModule("thirdparty/lodash");

  /**
   * Adjust placeholders position by reading its markedSpan position
   *
   * Since the textMarker did not specify which markedSpan
   * belongs to the wrapped text or bookmark,
   * I have to do a little trick on it
   *
   * @param  {Array} placeholders
   * @return {Array} placeholders
   */
  function adjustPlaceholdersPos (placeholders) {
    if(placeholders && placeholders.length){
      _.each(placeholders, function (placeholder) {
        var lines = placeholder.textMarker.lines;
        if(lines && lines.length){
          var markedSpans = lines[0].markedSpans;
          var spanIndex = 0;
          var bookmarkIndex = 0;
          _.each(markedSpans, function (markedSpan) {
            // continue if it's not the target
            if(placeholder.value.length){
              if(markedSpan.to === null || markedSpan.marker.className !== 'hinter'){
                return true;
              }
              if(spanIndex === placeholder.spanIndex){
                placeholder.start.ch = markedSpan.from;
                placeholder.end.ch = markedSpan.to;
                return false;
              }
              spanIndex++;
            }else{
              if(markedSpan.marker.type !== 'bookmark'){
                return true;
              }
              if(bookmarkIndex === placeholder.bookmarkIndex){
                placeholder.start.ch = markedSpan.from;
                placeholder.end.ch = markedSpan.to;
                return false;
              }
              bookmarkIndex++;
            }
          })
        }
      })
    }
    return placeholders;
  }

  exports.adjustPlaceholdersPos = adjustPlaceholdersPos;
})
