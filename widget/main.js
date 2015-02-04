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
      LanguageManager  = brackets.getModule("language/LanguageManager");


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
    define('snippetsData', function() {
      return {
        languages: LanguageManager.getLanguages(),
        hints: self.hinter.allHints
      }
    })

    requirejs(['angular', 'app', 'snippetsCtrl'], function(angular) {
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
      $(document).on('snippets-changed', updateHandler.bind(this));
    } else {
      // closed
      MainViewManager.focusActivePane();
      $(document).off('snippets-changed');
    }
  }

  function updateHandler (ev, snippets) {
    this.hinter.updateHints(snippets);
  }


  module.exports = HintWidget;
});