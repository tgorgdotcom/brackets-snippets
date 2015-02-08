/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

/**
 * Snippets Widget
 */
define(function (require, exports, module) {
  "use strict";

  var ExtensionUtils   = brackets.getModule('utils/ExtensionUtils'),
      WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
      MainViewManager  = brackets.getModule('view/MainViewManager'),
      Resizer          = brackets.getModule('utils/Resizer'),
      _                = brackets.getModule("thirdparty/lodash"),
      LanguageManager  = brackets.getModule("language/LanguageManager"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      HintManager      = require("../lib/HintManager");

  // Load HTML
  var ButtonHTML = require('text!./html/button.html'),
      PanelHTML = require('text!./html/panel.html');

  // Load CSS
  ExtensionUtils.loadStyleSheet(module, 'thirdparty/bootstrap-responsive.min.css');
  ExtensionUtils.loadStyleSheet(module, 'css/main.less');

  window.name = "NG_DEFER_BOOTSTRAP!";

  var CONST = {
    PANEL_ID: 'edc-brackets-snippets-panel',
    BUTTON_ID: 'edc-brackets-snippets-btn'
  }

  var $appButton, $appPanel;

  /**
   * Constructor to create a hints manager.
   *
   * @constructor
   */
  function HintWidget () {

  }

  HintWidget.prototype.init = function (hinter) {
    if (!hinter) { throw 'Hinter instance is required'; }
    this.setHinter(hinter);

    // Insert Button
    $('#main-toolbar .buttons').append(ButtonHTML);
    $appButton = $('#' + CONST.BUTTON_ID).on('click', togglePanelHandler.bind(this));

    this.initPanel();
  };

  HintWidget.prototype.initPanel = function() {
    var self = this;

    // Create Brackets Panel
    WorkspaceManager.createBottomPanel(CONST.PANEL_ID, $(PanelHTML), 100);
    $appPanel = $('#' + CONST.PANEL_ID);

    // Initialize AngularJS app
    requirejs.config({
      baseUrl: require.toUrl('.'),
      paths: {
        angular: './thirdparty/angular.min',
        app: './js/app',
        snippetsCtrl: './js/snippets.controller',
        settingsCtrl: './js/settings.controller',
        libraryCtrl:  './js/library.controller',
        _: './thirdparty/lodash'
      },
      shim: {
        'angular': {
          exports: 'angular'
        }
      }
    })

    // Panel close button
    $('#' + CONST.PANEL_ID + ' .close').on('click', togglePanelHandler.bind(this));

    // Prepare Data
    define('languages', function() {
      return  _.map(LanguageManager.getLanguages(), function (language) {
        return {
          id: language.getId(),
          name: language.getName()
        }
      })
    })
    define('userHints', function() {
      return self.hinter.allHints
    })
    define('libraryHints', function() {
      return HintManager.loadLibraryHints()
    })
    define('settingsData', function() {
      var defPref = PreferencesManager.getExtensionPrefs(".").base;
      return {
        '_insertHintOnTab': defPref.get('insertHintOnTab')
      }
    })

    // Bootstrap angular
    requirejs(['angular', 'app', 'snippetsCtrl', 'settingsCtrl', 'libraryCtrl'], function(angular) {
      $appPanel.ready(function() {
        angular.bootstrap($appPanel, ['snippets-manager']);
      });
    })
  }

  HintWidget.prototype.setHinter = function (hinter) {
    this.hinter = hinter;
  };

  function togglePanelHandler () {
    Resizer.toggle($appPanel);
    $appButton.toggleClass('active');
    if ($appButton.hasClass('active')) {
      // opened
      $(document).on('snippets-changed', hintsUpdateHandler.bind(this));
      $(document).on('prefs-changed', prefUpdateHandler.bind(this));
    } else {
      // closed
      MainViewManager.focusActivePane();
      $(document).off('snippets-changed');
      $(document).off('prefs-changed');
    }
  }

  function hintsUpdateHandler (ev, snippets) {
    this.hinter.updateHints(snippets);
  }

  /**
   * prefs key prefix:
   *   default: _               eg: `_insertHintOnTab`
   *   brackets-snippets: none  eg: `hints`
   */
  function prefUpdateHandler (ev, prefs) {

    _.forIn(prefs, function(v, k) {

      var pref;
      // default prefs
      if (k.indexOf('_') === 0) {
        pref = PreferencesManager.getExtensionPrefs(".").base;
        k = k.slice(1);
      }
      // brackets-snippets prefs
      else {
        pref = PreferencesManager.getExtensionPrefs("edc.brackets-snippets");
        k = 'edc.brackets-snippets.' + k;
      }

      pref.set(k, v);
    });
  }

  module.exports = HintWidget;
});