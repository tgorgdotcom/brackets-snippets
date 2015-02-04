/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

/**
 * Java​Script Snippets for Brackets
 *
 * Based on:
 *   Java​Script & Node​JS Snippets for Sublime
 */
define(function (require, exports, module) {
  "use strict";

  var AppInit        = brackets.getModule('utils/AppInit'),
      CommandManager = brackets.getModule("command/CommandManager"),
      EditorManager  = brackets.getModule("editor/EditorManager"),
      Menus          = brackets.getModule("command/Menus");

  var Hinter = require('./lib/Hinter'),
      HintWidget = require('./widget/main');

  var hinter, hintWidget;

  function activeEditorChangeHandler (bracketsEvent, focusedEditor, lostEditor) {
    if (lostEditor) {
      $(lostEditor).off("keydown", hinter.keyDownHandler.bind(hinter));
      $(lostEditor).off("keypress", hinter.keyPressHandler.bind(hinter));
      $(lostEditor).off("keyup", hinter.keyUpHandler.bind(hinter));
      $(lostEditor).off("change", hinter.changeHandler.bind(hinter));
    }

    if (focusedEditor) {
      if (!hinter) {
        hinter = new Hinter(focusedEditor);
        hintWidget = new HintWidget();
        hintWidget.init(hinter);
      } else {
        hinter.reinit(focusedEditor);
      }
      $(focusedEditor).on("keydown", hinter.keyDownHandler.bind(hinter));
      $(focusedEditor).on("keypress", hinter.keyPressHandler.bind(hinter));
      $(focusedEditor).on("keyup", hinter.keyUpHandler.bind(hinter));
      $(focusedEditor).on("change", hinter.changeHandler.bind(hinter));
    }
  }

  AppInit.appReady(function () {
    $(EditorManager).on('activeEditorChange', activeEditorChangeHandler);
  });
});