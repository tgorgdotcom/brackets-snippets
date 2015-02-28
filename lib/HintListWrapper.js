/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";
  var CodeHintList = brackets.getModule("editor/CodeHintList");

  /**
   * Constructor to create a CodeHintList object.
   * A 1to1 CodeHintList Wrapper
   *
   * @constructor
   * @param {Object=} editor - editor object
   */
  function HintListWrapper (editor) {
    if (!editor) {throw 'CodeHintList initialize error: editor is needed.'}

    this._obj = new CodeHintList.CodeHintList(editor, true);

    // fix error from `CodeHintList.prototype._keydownHook`
    if(!this._obj.handleClose){
      this._obj.handleClose = function(){};
    }
    return this;
  }

  HintListWrapper.prototype.show = function (hints, match) {
    // wrap hints with html
    var hintsHTML = hints.map(function (hint) {
      if (hint.description) {
        if (hint.tag && !hint.tagHide) {
          return hint.trigger + '<i style="color: #9E9E9E;float: right;margin-left: 10px;">' + hint.tag  + ' ' + hint.description + '</i>';
        } else {
          return hint.trigger + '<i style="color: #9E9E9E;float: right;margin-left: 10px;">' + hint.description + '</i>';
        }
      }
      return hint.trigger;
    });

    if (!this._obj.isOpen()) {
      this._obj.open({
        hints: hintsHTML,
        match: match,
        selectInitial: true,
        handleWideResults: true
      })
    } else {
      this._obj.update({
        hints: hintsHTML,
        match: match,
        selectInitial: true,
        handleWideResults: true
      })
    }
  }

  HintListWrapper.prototype.hide = function () {
    if(this._obj.isOpen()){
      this._obj.close();
    }
  }

  HintListWrapper.prototype.onSelect = function (selectHandler) {
    this._obj.onSelect(selectHandler);
  }

  module.exports = HintListWrapper;
})
