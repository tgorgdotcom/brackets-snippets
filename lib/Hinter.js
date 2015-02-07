/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";
  var _         = brackets.getModule("thirdparty/lodash"),
      KeyEvent  = brackets.getModule("utils/KeyEvent");

  var HintList    = require('./HintListWrapper'),
      HintManager = require('./HintManager'),
      HintUtil = require('./HintUtil');

  /**
   * Constructor to create a hinter object.
   *
   * @constructor
   * @param {Object=} editor - editor object
   */
  function Hinter (editor) {
    if (!editor) {throw 'Hinter initialize error: editor is needed.'}

    // load all hints regardless of language
    this.allHints = HintManager.loadHints();

    // bind editor, init hintList and some other stuff about editor
    this.reinit(editor);
  }

  /**
   * Reinit hinter everything editor is changed
   *
   * @param  {Object=} editor - editor object
   */
  Hinter.prototype.reinit = function (editor) {
    if (!editor) {throw 'Hinter reinitialize error: editor is needed.'}
    this.editor = editor;

    // filter hints with language of current editor
    this.hints = HintManager.filterHintsByLang(this.allHints, editor.document.language);

    // init hintList object
    this.hintList = new HintList(editor);
    this.hintList.onSelect(this.onSelect.bind(this));

    // set up some default variables
    this.lastWord = '';
    this.matchingHints = [];

    // window.editor = editor;
    // window._ = _;
  }

  Hinter.prototype.updateHints = function (allHints) {
    if(!allHints){return;}
    this.allHints = allHints;
    this.hints = HintManager.filterHintsByLang(this.allHints, this.editor.document.language);
    HintManager.save(allHints);
  }

  Hinter.prototype.keyDownHandler = function(bracketsEvent, editor, keyboardEvent) {
    var keyCode = keyboardEvent.keyCode;

    // Focus on the next placeholders
    if(keyCode === KeyEvent.DOM_VK_TAB){
      var isSelected = this.selectNext();
      if(isSelected){
        keyboardEvent.preventDefault();
      }
    }
  };

  Hinter.prototype.keyPressHandler = function(bracketsEvent, editor, keyboardEvent) {
    // console.log('keypress ...' + keyboardEvent.keyCode);
  };

  /**
   * Handle user input
   * Notice:
   *   When hint is selected, this handler would not be fired
   *
   * @param  {Object} bracketsEvent
   * @param  {Object} editor
   * @param  {Object} keyboardEvent
   */
  Hinter.prototype.keyUpHandler = function(bracketsEvent, editor, keyboardEvent) {
    var keyCode = keyboardEvent.keyCode;

    // TAB is pressed
    if (keyCode === KeyEvent.DOM_VK_TAB) {
    }
    // ESC is pressed
    else if (keyCode === KeyEvent.DOM_VK_ESCAPE) {
      this.hideHints();
    }
    // A - Z is pressed
    else if ((keyCode >= 65 && keyCode <= keyCode <= 90) ||
              keyCode === KeyEvent.DOM_VK_BACK_SPACE) {
      if(this.findHints()){
        this.showHints();
      }else{
        this.hideHints();
      }
    }
  };

  Hinter.prototype.changeHandler = function(bracketsEvent, editor, changeArr) {
    if (changeArr.length > 0) {
      // judge if it's redo or undo
      var action = changeArr[0].origin;
      if (action === 'undo') {
        this.currentSelectionIndex-=2;
        this.selectNext();
      } else if (action === 'redo') {
        this.currentSelectionIndex++;
      }
    }
  }

  /**
   * Find last word before cursor,
   * save it into this.lastWord
   *
   * @return {Boolean}
   * True if find any word, false if empty string
   */
  Hinter.prototype.findLastWord = function () {
    var cursorPos = this.editor.getCursorPos();
    var line = this.editor.document.getLine(cursorPos.line);
    this.lastWord = line.substr(0, cursorPos.ch).split(' ').slice(-1)[0];
    return this.lastWord;
  };

  /**
   * Find any hints start with lastWord,
   * save it into this.matchingHints
   *
   * @return {Boolean}
   * True if find any hints, false if no hints
   */
  Hinter.prototype.findHints = function() {
    this.matchingHints = [];
    if (this.findLastWord() && this.hints.length) {
      var lastWord = this.lastWord;

      this.matchingHints = this.hints.filter(function (hint) {
        return hint.trigger.indexOf(lastWord) === 0;
      });
    }
    return this.matchingHints.length;
  };

  /**
   * Show hints list
   */
  Hinter.prototype.showHints = function() {
    var triggers = this.matchingHints.map(function(hint){
      return hint.trigger;
    });
    this.hintList.show(triggers, this.lastWord);
  };

  /**
   * Hide hints list
   */
  Hinter.prototype.hideHints = function() {
    this.hintList.hide();
  };

  /**
   * When hint is selected, do such couple things:
   *   - apply hint (paste hint into document)
   *   - find all placeholders
   *   - markup all placeholders for trace
   *   - replace all placeholders with default value
   *   - select next placeholders
   *   - hide hints list
   */
  Hinter.prototype.onSelect = function(trigger) {
    var selectedHint = _.find(this.hints, {trigger: trigger});
    if(selectedHint){
      this.selectedHint = selectedHint;
      var hintObj = this;
      this.editor.document.batchOperation(function() {
        hintObj.applyHint();
        hintObj.findPlaceholders();
        hintObj.replacePlaceholders();
      });
      hintObj.selectNext();
    }
    this.hideHints();
  };

  /**
   * paste hint into document
   */
  Hinter.prototype.applyHint = function() {
    var hint      = this.selectedHint,
        cursorPos = this.editor.getCursorPos(),
        indent    = 0;

    var replaceStr = hint.text;

    var start = {
      line: cursorPos.line,
      ch: cursorPos.ch - this.lastWord.length
    };

    // count the indent spaces amount
    if (start.ch) {
      var line = this.editor.document.getLine(cursorPos.line);
      indent = line.length - line.trimLeft().length;

      if (indent) { // insert spaces before each line if indent > 0
        var indentSpaces = new Array(indent + 1).join(' ');
        replaceStr = replaceStr.replace(/\n/g, '\n' + indentSpaces);
      }
    }

    this.editor.document.replaceRange(replaceStr, start, cursorPos);


    this.indent = indent;
    this.replaceStr = replaceStr;
    this.startPos = start; // starting position
  };

  /**
   * find placeholders inside the hint string
   * placeholder format: ${index:value}, ${index}
   *
   * @return {Array} found placeholders
   */
  Hinter.prototype.findPlaceholders = function () {
    var startPos = this.startPos,
        hint     = this.selectedHint,
        indent   = this.indent;

    var placeholders = [],
        lines = this.replaceStr.split('\n'),
        spanIndex = 0,
        bookmarkIndex = 0;
    for (var i = 0, len = lines.length; i < len; i++) {
      // match string like: ${0:document}, ${1}
      lines[i].replace(/\${(\d+)(:.*?|)}/g, matchHandler);
      spanIndex = 0;
      bookmarkIndex = 0;
    }
    this.placeholders = placeholders;

    /**
     * Assemble placeholder obj
     *
     * @param  {String}  text  - original text of placeholder, example: ${1:document}
     * @param  {String}  index - select order (start from 1), example: 1
     * @param  {String}  value - default value, example: :document (the colon will be removed)
     * @param  {Integer} ch    - horizontal position, example: 27
     * @return {String}        - default value
     */
    function matchHandler (text, index, value, ch) {
      value = value.substr(1);  // remove the colon

      var offsetCh = i === 0 ? startPos.ch : 0; // first line may not start from ch:0
      // offsetCh += indent;

      var placeholder = {
        start: {
          line: i + startPos.line,
          ch: ch + offsetCh
        },
        end: {
          line: i + startPos.line,
          ch: ch + offsetCh + text.length
        },
        value: value,
        text: text,
        index: ~~index,
        textMarker: null
      };
      if(value.length){
        placeholder.spanIndex = spanIndex++;
      }else{
        placeholder.bookmarkIndex = bookmarkIndex++;
      }
      placeholders.push(placeholder);
      return value;
    }
  }

  /**
   * replace placeholders with
   * @return {[type]} [description]
   */
  Hinter.prototype.replacePlaceholders = function() {
    var editor = this.editor;
    var document = editor.document;
    var placeholders = this.placeholders;

    // mark text or set bookmark
    placeholders.forEach(function (placeholder) {
      var textMarker;
      // if it's not empty, use doc.markText
      // else use cm.setBookmark
      if (placeholder.value.length) {
        textMarker = editor._codeMirror.markText(
          placeholder.start,
          placeholder.end,
          { className:'hinter',
            // addToHistory: true, // this would interrupt batchOperation
            // clearWhenEmpty: false,
            inclusiveLeft: true, inclusiveRight: true
          });
      } else {
        textMarker = editor._codeMirror.setBookmark(
          placeholder.start,
          {insertLeft: true});
      }

      placeholder.textMarker = textMarker;
    })

    // edit document in order to replace the placeholder with its value
    var edits = document.doMultipleEdits(
      placeholders.map(function (placeholder) {
        return {
          edit: {
            text: placeholder.value,
            start: placeholder.start,
            end: placeholder.end
          }
        }
      })
    );

    placeholders = HintUtil.adjustPlaceholdersPos(placeholders);

    // fix position (deprecated)
    // placeholders.forEach(function (placeholder, i) {
    //   _.each(placeholders, function(prevPlaceholder, ii) {
    //     if(i <= ii || prevPlaceholder.start.line !== placeholder.start.line){return false;}
    //     placeholder.start.ch -= (prevPlaceholder.text.length - prevPlaceholder.value.length);
    //   })
    //   placeholder.end.ch = (placeholder.start.ch + placeholder.value.length);
    // })

    // reset selection index (start from 1)
    this.currentSelectionIndex = 1;
  }

  // focus on the next placeholders
  //
  // `focus` means:
  //   if the placeholder has value, the value would be selected
  //   otherwise would put the cursor after the position of placeholder
  Hinter.prototype.selectNext = function () {
    var isSelected;
    if(!this.placeholders){ return; }

    // fix placeholders position
    this.placeholders = HintUtil.adjustPlaceholdersPos(this.placeholders);

    // find the next placeholders with index
    var nextPlaceholders = _.where(this.placeholders, {index: this.currentSelectionIndex});
    if(!nextPlaceholders.length){ return; }

    // select text or put the cursor
    var selections = [];
    for(var i = 0; i < nextPlaceholders.length; i++){
      var placeholder = nextPlaceholders[i];
      if(placeholder.value.length){
       selections.push(placeholder);
      }else{
        this.editor.setCursorPos(placeholder.start, placeholder.end);
        isSelected = true;
      }
    }
    if(selections.length){
      this.editor.setSelections(selections);
      isSelected = true;
    }

    this.currentSelectionIndex++;

    return isSelected;
  }

  module.exports = Hinter;
})
