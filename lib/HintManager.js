/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";

  var _                  = brackets.getModule("thirdparty/lodash"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      prefs              = PreferencesManager.getExtensionPrefs("edc.brackets-snippets");

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
      hints = filterHints(loadLibraryHints(), ['javascript'], 'VanillaJS');

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
   * Filter hints by langIds
   * @param  {Array}            hints
   * @param  {Array}            lang ids
   * @param  {String=}          tag
   * @return {Array}            filtered hints
   */
  function filterHints (hints, langIds, tag) {
    if (!langIds.length)
      return langIds // it's a trick (I know langIds must be an array)

    return hints.filter(function(e) {

      if (tag && e.tag !== tag)
        return false

      var scope = e.scope
      if (_.isString(scope))
        return scope === '_any' || _.contains(langIds, scope)
      else if (_.isArray(scope))
        for (var i = scope.length - 1; i >= 0; i--)
          return _.contains(langIds, scope[i])
    })
  }

  function save (hints) {
    var savedHints = prefs.get(HINTS_PREF_KEY);
    if(!savedHints && !prefs.getPreference(HINTS_PREF_KEY)){
      prefs.definePreference(HINTS_PREF_KEY, "generally");
    }
    prefs.set(HINTS_PREF_KEY, hints);
  }

  function restore () {
    save(undefined);
    return loadHints();
  }

  exports.loadHints = loadHints;
  exports.loadLibraryHints = loadLibraryHints;
  exports.filterHints = filterHints;
  exports.save = save;
  exports.restore = restore;
})
