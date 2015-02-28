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

    var spaces = new Array(spaceUnits + 1).join(SPACE);

    var _reg1 = new RegExp(spaces, 'g');
    var _reg2 = /\t/g;
    // each line
    for (var i = 0; i < len; i++) {
      if (useTabChar) {
        lines[i] = lines[i].replace(_reg1, TAB);
      } else {
        lines[i] = lines[i].replace(_reg2, spaces);
      }
    }
    return lines.join(lineSeparator);
  }

  function replaceAt (str, index, character) {
    return str.substr(0, index) + character + str.substr(index + character.length);
  }

  module.exports = main;
})
