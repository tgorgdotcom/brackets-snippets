/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";
  var _         = brackets.getModule("thirdparty/lodash");

  /**
   * Adjust all placeholders positions by reading its markedSpan position
   *
   * Since the textMarker did not specify which markedSpan
   * belongs to the wrapped text or bookmark,
   * I have to do a little trick on it
   *
   * @param  {Array} placeholders
   * @return {Array} placeholders
   */
  function adjustPlaceholdersPos(placeholders, placeholdersGroupId) {
    if(placeholders && placeholders.length){
      _.each(placeholders, function (placeholder) {
        var lines = placeholder.textMarker.lines;

        // reset _found status to false
        placeholder._found = false;

        if (lines && lines.length) {
          // get the line that the current placholder resides in
          var markedSpans = lines[0].markedSpans;

          // note: I think this is syncronous
          _.each(markedSpans, function (markedSpan) {
            // continue if it's not the target placeholder set
            if (markedSpan.marker._gid !== 'hinter_' + placeholdersGroupId) {
              return true;
            }

            if (markedSpan.marker._id === placeholder.id) {
              placeholder.start.ch = markedSpan.from;
              placeholder.end.ch = markedSpan.to || markedSpan.from;
              placeholder.stringBefore = lines[0].text.slice(0, placeholder.start.ch);
              placeholder.stringAfter = lines[0].text.slice(0, placeholder.end.ch);
              placeholder._found = true;
              return false;
            }
          });
          
          //TODO: fix this to handle situations when the marker disappears
          //(if the user deletes the text, then types):
          //  - Provide a fallback if the placeholder still isn't found: blank out the placeholder value
          //    (only if there are no other placeholders with that index)
          if (!placeholder._found) {
            findRegExp = new RegExp(placeholder.stringBefore + '(.+)' + placeholder.stringAfter);
            var result = lines[0].text.match(findRegExp);
            
            if (result !== null) {
              placeholder.start.ch = result.index;
              placeholder.end.ch = result.index + result[0].length;
              placeholder.stringBefore = lines[0].text.slice(0, placeholder.start.ch);
              placeholder.stringAfter = lines[0].text.slice(0, placeholder.end.ch);
              placeholder._found = true;
            }
          }
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
  function isCursorPos(position) {
    return position.start.ch === position.end.ch && position.start.line === position.end.line;
  }
  
  
  /**
   * Judge if the pos arrays are all cursors
   *
   * @param  {Array}  positionArr
   * @param  {Array}  comparedPositionArr
   * @return {Boolean}
   */
  function isCursorPosArr(positionArr) {
    for (var i = positionArr.length - 1; i >= 0; i--) {
      if (!isCursorPos(positionArr[i]))
        return false;
    }
    return true;
  }
  
  
  /**
   * Judge if a cursor is within a placeholder
   *
   * @param  {Object}  position
   * @param  {Object}  comparedPosition
   * @return {Boolean}
   */
  function isCursorInPlacholder(cursorPos, placeholderPos) {
    return cursorPos.start.line >= placeholderPos.start.line &&
          cursorPos.start.ch >= placeholderPos.start.ch &&
          cursorPos.end.line <= placeholderPos.end.line &&
          cursorPos.end.ch <= placeholderPos.end.ch;
  }
  
  /**
   * Judge if all of the cursor positions are in placeholders
   *
   * @param  {Array}  cursorPosArr
   * @param  {Array}  placeholderPosArr
   * @return {Boolean}
   */
  function isCursorInPlacholderArr(cursorPosArr, placeholderPosArr) {
    if (cursorPosArr.length === placeholderPosArr.length) {
      for (var i = cursorPosArr.length - 1; i >= 0; i--) {
        if (!isCursorInPlacholder(cursorPosArr[i], placeholderPosArr[i]))
          return false;
      }
      return true;
    }
    return false;
  }


  /**
   * Judge if two pos objects have the same range
   *
   * @param  {Object}  position
   * @param  {Object}  comparedPosition
   * @return {Boolean}
   */
  function isEqualPos(position, comparedPosition) {
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
  function isEqualPosArr(positionArr, comparedPositionArr) {
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
  exports.isCursorInPlacholder = isCursorInPlacholder;
  exports.isCursorInPlacholderArr = isCursorInPlacholderArr;
  exports.isEqualPos = isEqualPos;
  exports.isEqualPosArr = isEqualPosArr;
})
