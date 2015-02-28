/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";

  var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      prefs = PreferencesManager.getExtensionPrefs("edc.brackets-snippets");

  var jsyaml = require('../thirdparty/js-yaml.min');

  var HINTS_PREF_KEY = 'hints';

  /**
   * Load hints from prefs or default
   *
   * @return {Array}          Hints
   */
  function loadHints () {
    var hints = prefs.get(HINTS_PREF_KEY);

    if (!hints)  // load plain javascript hints by default
      hints = filterHints(loadLibraryHints(), 'javascript', 'VanillaJS');

    return hints;
  }

  /**
   * Load library hints
   *
   * @return {Array}          Hints
   */
  function loadLibraryHints () {
    var hints = jsyaml.load(require('text!../library-hints.yml'));
    hints = markSystemHints(hints);

    return removeLastBlankLine(hints);
  }

  // remove the last blank line
  function removeLastBlankLine (hints) {
    for (var i = hints.length - 1; i >= 0; i--) {
      var text = hints[i].text;
      if(text.charAt(text.length - 1) === '\n' || text.charAt(text.length - 1) === '\r\n'){
        hints[i].text = text.substr(0, text.length - 1);
      }
    }
    return hints;
  }

  function markSystemHints (hints) {
    for (var i = hints.length - 1; i >= 0; i--) {
      hints[i].source = 'system';
    }
    return hints;
  }


  /**
   * Filter hints by langId
   * @param  {Array}            hints
   * @param  {Language|String}  lang - language object or id
   * @param  {String=}          tag
   * @return {Array}            filtered hints
   */
  function filterHints (hints, lang, tag) {
    if (lang) {
      var langId = (typeof lang === 'string') ? lang : lang.getId();

      return hints.filter(function(e) {
        return e.scope === langId && (tag ? e.tag === tag : true);
      })
    }
  }

  function save (hints) {
    var savedHints = prefs.get(HINTS_PREF_KEY);
    if(!savedHints){
      prefs.definePreference(HINTS_PREF_KEY, "generally");
    }
    prefs.set(HINTS_PREF_KEY, hints);
  }

  exports.loadHints = loadHints;
  exports.loadLibraryHints = loadLibraryHints;
  exports.filterHints = filterHints;
  exports.save = save;
})
