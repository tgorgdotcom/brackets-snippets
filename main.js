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

  var handlers;
  function activeEditorChangeHandler (bracketsEvent, focusedEditor, lostEditor) {
    if (lostEditor) {
      if(hinter){
        $(lostEditor).off("keydown", handlers.keydown);
        $(lostEditor).off("keypress", handlers.keypress);
        $(lostEditor).off("keyup", handlers.keyup);
        $(lostEditor).off("change", handlers.change);
      }
    }

    if (focusedEditor) {
      if (!hinter) {
        hinter = new Hinter(focusedEditor);
        hintWidget = new HintWidget();
        hintWidget.init(hinter);
      } else {
        hinter.reinit(focusedEditor);
      }

      handlers = {
        keydown: hinter.keyDownHandler.bind(hinter),
        keypress: hinter.keyPressHandler.bind(hinter),
        keyup: hinter.keyUpHandler.bind(hinter),
        change: hinter.changeHandler.bind(hinter)
      }

      $(focusedEditor).on("keydown", handlers.keydown);
      $(focusedEditor).on("keypress", handlers.keypress);
      $(focusedEditor).on("keyup", handlers.keyup);
      $(focusedEditor).on("change", handlers.change);
    }
  }


  AppInit.appReady(function () {
    // Instantly initialize extension after being installed.
    //  Note:
    //    The editor instance would be null at the moment when Brackets starts
    var editor = EditorManager.getCurrentFullEditor();
    if(editor){
      activeEditorChangeHandler(null, editor, null);
    }

    $(EditorManager).on('activeEditorChange', activeEditorChangeHandler);
  });

});