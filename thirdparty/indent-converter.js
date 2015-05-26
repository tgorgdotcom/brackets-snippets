/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";

  var SPACE = ' ';
  var TAB = '	';

  /**
   * Indent Converter
   *
   * @param  {String}  str
   * @param  {Boolean} useTabChar
   *                    true:  convert space to tab
   *                    false: convert tab to space
   * @param  {Number}  spaceUnits, default: 2
   * @return {String}
   */
  function main (str, useTabChar, spaceUnits) {
    if (!str) {return str;}
    spaceUnits = spaceUnits || 2;

    var lineSeparator = str.indexOf('\r\n') > -1 ? '\r\n' : '\n';
    var lines = str.split(lineSeparator);
    var len = lines.length;

    var whiteSpaceUnit;
    if (useTabChar)
      whiteSpaceUnit = TAB;
    else
      whiteSpaceUnit = new Array(spaceUnits + 1).join(SPACE);

    var indentUnit = -1;
    // iterate each line
    for (var i = 0; i < len; i++) {
      lines[i] = lines[i].replace(/^ */, _lineHandler)
    }

    return lines.join(lineSeparator);
    
    function _lineHandler (spaces) {
      if (!spaces.length) return spaces

      // guess the indentation size through the first indented line
      if (indentUnit === -1)
        indentUnit = spaces.length

      var replaceLength = Math.floor(spaces.length / indentUnit)
      var leftLength = spaces.length - replaceLength * indentUnit
      var leftStr = spaces.substr(replaceLength, leftLength)

      return new Array(replaceLength + 1).join(whiteSpaceUnit) + leftStr
    }
  }

  function replaceAt (str, index, character) {
    return str.substr(0, index) + character + str.substr(index + character.length);
  }

  module.exports = main;
})
