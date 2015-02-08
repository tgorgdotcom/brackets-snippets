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
    var hints = prefs.get(HINTS_PREF_KEY) ||
                  jsyaml.load(require('text!../hints.yml'));

    return removeLastBlankLine(hints);
  }

  /**
   * Load library hints
   *
   * @return {Array}          Hints
   */
  function loadLibraryHints () {
    var hints = jsyaml.load(require('text!../library-hints.yml'));

    return removeLastBlankLine(hints);
  }

  // remove the last blank line
  function removeLastBlankLine (hints) {
    for (var i = hints.length - 1; i >= 0; i--) {
      var text = hints[i].text;
      if(text.charAt(text.length - 1) === '\n'){
        hints[i].text = text.substr(0, text.length - 1);
      }
    }
    return hints;
  }


  /**
   * Filter hints by langId
   * @param  {Array}  hints
   * @param  {Language} language object
   * @return {Array}  filtered hints
   */
  function filterHintsByLang (hints, lang) {
    if (lang) {
      var langId = lang.getId();
      hints = hints.filter(function(e) {
        return e.scope === langId;
      })
    }
    return hints;
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
  exports.filterHintsByLang = filterHintsByLang;
  exports.save = save;
})
