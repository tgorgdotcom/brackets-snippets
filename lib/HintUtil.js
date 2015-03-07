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
  function adjustPlaceholdersPos (placeholders, placeholdersId) {
    if(placeholders && placeholders.length){
      _.each(placeholders, function (placeholder) {
        var lines = placeholder.textMarker.lines;

        // reset _found status to false
        placeholder._found = false;

        if (lines && lines.length) {
          var markedSpans = lines[0].markedSpans;
          var lineIndex = 0;

          _.each(markedSpans, function (markedSpan) {
            // continue if it's not the target
            if (markedSpan.marker._id !== 'hinter_' + placeholdersId) {
              return true;
            }

            if (lineIndex === placeholder.lineIndex) {
              placeholder.start.ch = markedSpan.from;
              placeholder.end.ch = markedSpan.to || markedSpan.from;
              placeholder._found = true;
              return false;
            }

            lineIndex++;
          })
        }
      })
    }
    return placeholders;
  }

  /**
   * Judge if a pos object is a cursor
   *
   * @param  {Object}  position  eg: {start: {ch:0, line:12}, end: {ch:0, line:12}}
   * @return {Boolean}
   */
  function isCursorPos (position) {
    return position.start.ch === position.end.ch && position.start.line === position.end.line;
  }

  /**
   * Jude if the pos arrays are all cursors
   *
   * @param  {Array}  positionArr
   * @param  {Array}  comparedPositionArr
   * @return {Boolean}
   */
  function isCursorPosArr (positionArr) {
    for (var i = positionArr.length - 1; i >= 0; i--) {
      if (!isCursorPos(positionArr[i]))
        return false;
    }
    return true;
  }

  /**
   * Judge if two pos objects have the same range
   *
   * @param  {Object}  position
   * @param  {Object}  comparedPosition
   * @return {Boolean}
   */
  function isEqualPos (position, comparedPosition) {
    return position.start.line === comparedPosition.start.line &&
          position.start.ch === comparedPosition.start.ch &&
          position.end.line === comparedPosition.end.line &&
          position.end.ch === comparedPosition.end.ch;
  }

  /**
   * Judge if the two pos arrays have the same ranges
   *
   * @param  {Array}  positionArr
   * @param  {Array}  comparedPositionArr
   * @return {Boolean}
   */
  function isEqualPosArr (positionArr, comparedPositionArr) {
    if (positionArr.length === comparedPositionArr.length) {
      for (var i = positionArr.length - 1; i >= 0; i--) {
        if (!isEqualPos(positionArr[i], comparedPositionArr[i]))
          return false;
      }
      return true;
    }
    return false;
  }

  exports.adjustPlaceholdersPos = adjustPlaceholdersPos;
  exports.isCursorPos = isCursorPos;
  exports.isCursorPosArr = isCursorPosArr;
  exports.isEqualPos = isEqualPos;
  exports.isEqualPosArr = isEqualPosArr;
})
