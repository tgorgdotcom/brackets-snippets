/*jslint indent: 2, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports, module) {
  "use strict";

  var _                  = brackets.getModule("thirdparty/lodash"),
      KeyEvent           = brackets.getModule("utils/KeyEvent"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      TextRange          = brackets.getModule("document/TextRange").TextRange,
      prefs              = PreferencesManager.getExtensionPrefs('edc.brackets-snippets'),
      DefaultDialogs     = brackets.getModule("widgets/DefaultDialogs"),
      Dialogs            = brackets.getModule("widgets/Dialogs");

  var HintList           = require('./HintListWrapper'),
      HintManager        = require('./HintManager'),
      HintUtil           = require('./HintUtil'),
      indentConverter    = require('../thirdparty/indent-converter'),
      keystrokeConverter = require('../thirdparty/keystroke-converter');

  var keyNext        = parseNextKey(),
      phCurrentValue = [];

  function parseNextKey () {
    var str = prefs.get("keyNext")
    if (!str)
      str = 'tab'  // default key
    return keystrokeConverter.parse(str)
  }
  
  function getDeepestFuncs(expressionStr) {
    var strArray             = expressionStr.split(''),
        funcArr              = [],
        funcLevel            = 0,
        funcStart            = 0,
        funcEnd              = 0,
        argArr               = [],
        argString            = '',
        deepestFunc          = 0,
        deepestFuncStartPos  = 0,
        deepestFuncEndPos    = 0,
        quoteMode            = false,
        functionMode         = false,
        foundFuncName        = '',
        currFuncName         = '',
        validFuncName        = false,
        i;

    for (i = 0; i < strArray.length; i++) {
      if (strArray[i] == '(' && validFuncName && !quoteMode) {
        funcLevel++;
        if (funcLevel > deepestFunc) {
          funcArr = [];  // reset if we find an even deeper function
          argArr  = [];
          argString = '';
          deepestFunc = funcLevel;
          deepestFuncStartPos = funcStart;
          currFuncName = foundFuncName;
          functionMode = true;
        }
        else if (funcLevel == deepestFunc) { // add another function to the list
          deepestFuncStartPos = funcStart;
          currFuncName = foundFuncName;
          functionMode = true;
        }
      }
      else if (strArray[i] == ')' && functionMode && !quoteMode) {
        if (funcLevel == deepestFunc) {
          deepestFuncEndPos = i;
          
          // get the last argument (or the first one if there's only one)
          argArr.push(argString.trim());
          
          funcArr.push({
            funcName: currFuncName,
            funcArgs: argArr,
            funcText: expressionStr.substring(deepestFuncStartPos, deepestFuncEndPos + 1),
            funcStart: deepestFuncStartPos,
            funcEnd: deepestFuncEndPos
          });
          functionMode = false;
        }

        funcLevel--;
      }
      else if (strArray[i] == '"' || strArray[i] == "'") {
        quoteMode = !quoteMode;
      }
      else if (strArray[i] == "\\" && quoteMode) {
        if (functionMode) {
          // capture escaped char
          argString += strArray[i + 1];
        }
        //skip the escape and the next character
        i = i + 2;
      }
      else if (strArray[i] == ',' & functionMode & !quoteMode) {
        argArr.push(argString.trim());
        argString = '';
      }
      else if (functionMode) {
        // capture argument
        argString += strArray[i];
      }

      // test for valid function name
      if (strArray[i].search(/[a-z0-9$_]/i) != -1 && !quoteMode) {
        if (!validFuncName) {
          validFuncName = true;
          funcStart = i;
          foundFuncName = strArray[i];
        }
        else {
          foundFuncName += strArray[i];
        }
      }
      else if (!quoteMode) {
        validFuncName = false;
      }
    }

    // return our result when done
    return (deepestFunc === 0) ? [] : funcArr;
  }

  var DIVIDERS = ['>', '	', ' ', ',', '.', '/', '\'', '"', ';', ':', '(', ')', '{', '}', '[', ']'];

  /**
   * Constructor to create a hinter object.
   *
   * @constructor
   * @param  {Object} editor - editor object
   */
  function Hinter (editor) {
    if (!editor) {throw 'Hinter initialize error: editor is needed.'}

    // load all hints regardless of language
    this.allHints = HintManager.loadHints();

    // bind editor, init hintList and some other stuff about editor
    this.init(editor);
  }

  /**
   * Init hinter every time editor is changed
   *
   * @param  {Object} editor - editor object
   */
  Hinter.prototype.init = function (editor) {
    if (!editor) {throw 'Hinter initialize error: editor is missing.'}
    this.editor = editor;

    // filter hints with language of current editor
    // (this should be useless because cursorActivityHandler would be called the next tick)
    // this.hints = HintManager.filterHints(this.allHints, editor.document.language);

    // init hintList object
    this.hintList = new HintList(editor);
    this.hintList.onSelect(this.onSelect.bind(this));

    // set up some default variables
    this.lastWord = '';
    this.matchingHints = [];
    this.globalValues = [];

    // window.editor = editor;
    // window._ = _;
    // window.hinter = this;
  }

  Hinter.prototype.updateHints = function (allHints) {
    if(!allHints){return;}
    this.allHints = allHints;
    HintManager.save(allHints);
  }

  Hinter.prototype.restoreHints = function () {
    this.allHints = HintManager.restore();
  }

  Hinter.prototype.cursorActivityHandler = function (bracketsEvent, editor, keyboardEvent) {
    var langIds = [],
        langId = this.editor.document.language.getId(),
        mode = this.editor.getModeForSelection();

    if (mode) {
      // correct the returning mode
      switch (mode) {
        // php returns "clike" for no reason
        case 'clike':
          if (langId === 'php')
            mode = 'php';
          break;
        case 'text/plain':
            mode = 'unknown';
          break;
      }

      // fix c, bash, scss, etc..
      if (mode.indexOf('text/x-') >= 0) {
        mode = langId;
      }
      // fix json, etc..
      else if (mode.indexOf('application/') >= 0) {
        mode = langId;
      }
      // fix svg, etc..
      else if (mode.indexOf('image/') >= 0) {
        mode = langId;
      }

      // some snippets should work anywhere
      // inside of the corresponding file
      switch (langId) {
        case 'erb_html':
        case 'ejs':
        case 'gfm':
        case 'markdown_plus':
          langIds.push(langId);
          break;
      }

      langIds.push(mode);
    }
    this.hints = HintManager.filterHints(this.allHints, langIds);
  }

  prefs.on("change", function () {
    keyNext = parseNextKey()
  });

  Hinter.prototype.keyDownHandler = function(bracketsEvent, editor, keyboardEvent) {

    // Focus on the next placeholders
    if(keystrokeConverter.compare(keyboardEvent, keyNext)){
      var shouldSelectNext = true;

      if (this.placeholders) {
        // stop if other groups of text are selected (maybe indenting multiple lines)
        var selections = this.editor.getSelections();

        // this seems to always be true
        // because the cursor is also a selection
        if (selections && selections.length) {
          this.placeholders = HintUtil.adjustPlaceholdersPos(this.placeholders, this.placeholdersGroupId);
          var currentPlaceholders = _.where(this.placeholders, {index: this.currentSelectionIndex - 1});

          // don't stop if we haven't selected anything (no text is highlighted)
          if (!HintUtil.isCursorPosArr(selections)) {
            // compare if the selection positions are the same as the current placeholders
            if (currentPlaceholders.length && !HintUtil.isEqualPosArr(currentPlaceholders, selections)) {
              shouldSelectNext = false;
            }
          } else if (!HintUtil.isCursorInPlacholderArr(selections, currentPlaceholders) && (this.placeholdersProcessed < this.totalPlaceholdersCount)) {
            // if we're outside of the placeholders, then tab to the placeholder that we were currently at
            // instead of the next one
            this.currentSelectionIndex--;
            this.placeholdersProcessed--;
          }
        }
      }

      if (shouldSelectNext) {
        var isSelected = this.selectNext();
        if(isSelected)
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
    if (keyboardEvent.altKey || keyboardEvent.ctrlKey || keyboardEvent.shiftKey || keyboardEvent.metaKey)
      return;

    var keyCode = keyboardEvent.keyCode;

    // ESC is pressed
    if (keyCode === KeyEvent.DOM_VK_ESCAPE) {
      this.hideHints();
    }
    // Named keys pressed
    else if ((keyCode >= 65 && keyCode <= 90) ||  // A-Z
             (keyCode >= 48 && keyCode <= 57) ||  // 0-9
              keyCode === KeyEvent.DOM_VK_BACK_SPACE || // BackSpace
              keyCode === 16 ||  // _
              keyCode === 189    // -
            ) {
      if(this.findHints()){
        this.showHints();
      }else{
        this.hideHints();
      }
    }
  };

  Hinter.prototype.changeHandler = function(bracketsEvent, editor, changeArr) {
    // not doing this ATM since it's buggy
    /*if (changeArr.length > 0) {
      // judge if it's redo or undo
      var action = changeArr[0].origin;
      if (action === 'undo') {
        this.currentSelectionIndex-=2;
        this.placeholdersProcessed-=2;
        var isSelected = this.selectNext();
        if(!isSelected)  // add it back if NOTHING selected
          this.currentSelectionIndex+=2;
          this.placeholdersProcessed+=2;
      } else if (action === 'redo') {
        this.currentSelectionIndex++;
        this.placeholdersProcessed++;
      }
    }*/
  }

  /**
   * Find last word before cursor,
   * save it into this.lastWord
   *
   * @return {Boolean}
   * True if find any word, false if empty string
   */
  Hinter.prototype.findLastWord = function (divider) {
    var cursorPos = this.editor.getCursorPos();
    var line = this.editor.document.getLine(cursorPos.line);
    return line.substr(0, cursorPos.ch).split(divider).slice(-1)[0];
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

    if (this.hints.length) {

      // Integrate `findLastWord` function for better performance
      var cursorPos = this.editor.getCursorPos();
      var line = this.editor.document.getLine(cursorPos.line);

      // Try every dividers
      for (var i = DIVIDERS.length - 1; i >= 0; i--) {

        var lastWord = line.substr(0, cursorPos.ch)
                            .split(DIVIDERS[i]).slice(-1)[0];

        if (lastWord) {
          this.matchingHints = this.hints.filter(function (hint) {
            return hint.trigger.indexOf(lastWord) === 0;
          });

          if (this.matchingHints.length) {
            this.lastWord = lastWord;
            return true;
          }
        }
      }
    }
    return false;
  };

  /**
   * Show hints list
   */
  Hinter.prototype.showHints = function() {
    this.hintList.show(this.matchingHints, this.lastWord);
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
  Hinter.prototype.onSelect = function(hintHTML) {
    // capture the trigger from html
    var idx, trigger;
    if ((idx = hintHTML.indexOf('<i ')) > -1) {
      trigger = hintHTML.slice(0, idx);
    } else {
      trigger = hintHTML;
    }

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
    var lineCount = (replaceStr.match(/\n/g) || []).length;

    var start = {
      line: cursorPos.line,
      ch: cursorPos.ch - this.lastWord.length
    };

    var useTabChar = PreferencesManager.get('useTabChar');
    var spaceUnits = PreferencesManager.get('spaceUnits');

    // first convert the indentation saved in the hint
    replaceStr = indentConverter(replaceStr, useTabChar, spaceUnits);

    // then insert indentation of current line
    if (start.ch) {
      var line = this.editor.document.getLine(cursorPos.line);
      var indentStr = line.match(/^\s+/);
      if (indentStr)
        replaceStr = replaceStr.replace(/\n/g, '\n' + indentStr);
    }

    // start on the first line before we place the snippet
    this.hintTextRange = new TextRange(this.editor.document, start.line, start.line);
    this.editor._codeMirror.replaceRange(replaceStr, start, cursorPos);

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
    var startPos             = this.startPos,
        hint                 = this.selectedHint,
        indent               = this.indent,
        tempPlaceholderList  = "",
        fileId               = this.editor.getFile().id;

    var placeholders = [],
        lines = this.replaceStr.split('\n'),
        bookmarkIndex = 0;
    
    var self                     = this;
    
    self.totalPlaceholdersCount       = 0;
    
    for (var i = 0, len = lines.length; i < len; i++) {
      // match string like: ${0:document}, ${1}
      lines[i].replace(/\${(\d+)(:(?:\\.|[^:])*?|)(:.*?|)}/g, matchHandler);
      bookmarkIndex = 0;
    }
    
    phCurrentValue               = [];
    
    if (typeof this.globalValues[fileId] == 'undefined') {
      this.globalValues[fileId]    = {};
    }

    this.placeholders            = placeholders;
    this.placeholders.fileId     = fileId; // associate placeholders with current editor

    /**
     * Assemble placeholder obj
     *
     * @param  {String}  text       - original text of placeholder, example: ${1:document}
     * @param  {String}  index      - select order (start from 1), example: 1
     * @param  {String}  value      - default value, example: :document (the colon will be removed)
     * @param  {String}  expression - a simple equation style expression used for referencing prior placeholder values
     * @param  {Integer} ch         - horizontal position, example: 27
     * @param  {String}  searchStr  - the entire string being searched
     * @return {String}             - default value
     */
    function matchHandler(text, index, value, expression, ch, searchStr) {
      value = value.substr(1).replace(/\\(.)/g, '$1');  // remove the colon and any escaped items
      expression = expression.substr(1);  // remove the colon 

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
        expression: expression,
        text: text,
        stringBefore: searchStr.slice(0, ch),
        stringAfter: searchStr.slice(ch + text.length),
        index: ~~index,  //bitwise decriment?
        textMarker: null
      };
      
      // count the placeholders, grouped by index
      if (tempPlaceholderList.split(',').indexOf(index) == -1) {
        self.totalPlaceholdersCount++;
        tempPlaceholderList = (tempPlaceholderList == '') ? index : tempPlaceholderList + ',' + index
      }

      placeholders.push(placeholder);
      return value;
    }
  }

  /**
   * replace placeholders code with the default value specified in the placeholder
   */
  Hinter.prototype.replacePlaceholders = function() {
    var editor = this.editor;
    var document = editor.document;
    var placeholders = this.placeholders;

    var placeholdersGroupId = _.uniqueId();
    var placeholderId;
    this.placeholdersGroupId = placeholdersGroupId;

    // mark text or set bookmark
    placeholders.forEach(function (placeholder) {
      var textMarker;
      // if it's not empty, use doc.markText
      // else use cm.setBookmark
      if (placeholder.value.length) {
        textMarker = editor._codeMirror.markText(
          placeholder.start,
          placeholder.end,
          {
            // addToHistory: true, // this would interrupt batchOperation
            inclusiveLeft: true,
            inclusiveRight: true
          });
      } else {
        textMarker = editor._codeMirror.setBookmark(
          placeholder.start,
          {
            insertLeft: true
          });
      }

      placeholderId = _.uniqueId();
      textMarker._gid = 'hinter_' + placeholdersGroupId;
      textMarker._id = placeholderId;
      placeholder.textMarker = textMarker;
      placeholder.id = placeholderId;
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

    placeholders = HintUtil.adjustPlaceholdersPos(placeholders, this.placeholdersGroupId);

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
    this.placeholdersProcessed = 0;
  }

  // focus on the next placeholders
  //
  // `focus` means:
  //   if the placeholder has value, the value would be selected
  //   otherwise would put the cursor after the position of placeholder
  Hinter.prototype.selectNext = function () {

    var isSelected,
        document                = this.editor.document,
        placeholders            = this.placeholders,
        placeholdersGroupId     = this.placeholdersGroupId,
        editor                  = this.editor,
        hintTextRange           = this.hintTextRange,
        self                    = this;
    
    if(!placeholders || placeholders.fileId !== editor.getFile().id){ return; }

    // fix placeholders position
    placeholders = HintUtil.adjustPlaceholdersPos(placeholders, placeholdersGroupId);
    
    // get the value of the current placeholder(s)
    var currPlaceholders = _.where(placeholders, {index: self.currentSelectionIndex - 1});
    
    // only do this if we aren't done getting all of the placeholder values
    if (currPlaceholders.length && (self.placeholdersProcessed < self.totalPlaceholdersCount)) {
      var currSelections = [];
      for(var i = 0; i < currPlaceholders.length; i++){
        if (currPlaceholders[i]._found)
          currSelections.push(currPlaceholders[i]);
      }
      
      if (currSelections.length) {
        editor.setSelection(currSelections[0].start, currSelections[0].start); // clear selection hack
        editor.setSelections(currSelections);
        phCurrentValue[self.currentSelectionIndex - 1] = editor.getSelectedText();
      }
      else {
        phCurrentValue[self.currentSelectionIndex - 1] = "";
      }
    }
  
    // find the next placeholders with index
    var nextPlaceholders = _.where(placeholders, {index: self.currentSelectionIndex});
    
    if(!nextPlaceholders.length){ 
      // sometimes the user might miss a number in the placeholder index sequence;
      // keep getting the next item if there's still more placeholders
      if(self.placeholdersProcessed < self.totalPlaceholdersCount) {
        while (!nextPlaceholders.length) {
          self.currentSelectionIndex++;
          nextPlaceholders = _.where(placeholders, {index: self.currentSelectionIndex});
        }
      }
      else if(self.placeholdersProcessed == self.totalPlaceholdersCount) {
        // if we're in the last item, move to the end of the snippet
        self.placeholdersProcessed++;
        isSelected = true;
        
        if (hintTextRange.endLine !== null) {
          editor.setSelection({
            line: hintTextRange.endLine,
            ch: document.getLine(hintTextRange.endLine).length
          },
          {
            line: hintTextRange.endLine,
            ch: document.getLine(hintTextRange.endLine).length
          });
        }
        
        hintTextRange.dispose();
        return isSelected;
      }
      else {
        return; 
      }
    }

    // select text or put the cursor
    var selections = [];
    for(var i = 0; i < nextPlaceholders.length; i++){
      if (nextPlaceholders[i]._found)
        selections.push(nextPlaceholders[i]);
    }
    
    if(selections.length){
      // if there's an expression, process it and set it to all selections
      // we'll have to defer the selection process in case we have a function in the
      // expression that needs something asyncronously (i.e. image dimensions)
      if (selections[0].expression !== '') {
        // TODO: fix the references to the this values in this callback
        this.evalExpression(selections[0].expression, function(result) {
          // if the expression returns empty, skip it (keeping the default placeholder value)
          if (result !== '') {
            var edits = document.doMultipleEdits(
              selections.map(function (selection) {
                return {
                  edit: {
                    text: result,
                    start: selection.start,
                    end: selection.end
                  }
                }
              })
            );

            // update the placeholder positions, as things have probably changed
            placeholders = HintUtil.adjustPlaceholdersPos(placeholders, placeholdersGroupId);
          }

          editor.setSelection(selections[0].start, selections[0].start); // clear selection hack
          editor.setSelections(selections);
        },
        function(message) {
          //console.warn("Expression error: " + message);
          self.displayError(message);
          self.currentSelectionIndex--; // go back one
        })
      }

      else {
        editor.setSelection(selections[0].start, selections[0].start); // clear selection hack
        editor.setSelections(selections);
      }
      
      isSelected = true;
      self.placeholdersProcessed++;
    }

    self.currentSelectionIndex++;

    return isSelected;
  }
  
  
  /*
  funcName: currFuncName,
  funcText: expressionStr.substring(deepestFuncStartPos, deepestFuncEndPos + 1),
  funcStart: deepestFuncStartPos,
  funcEnd: deepestFuncEndPos
  */
  
  Hinter.prototype.evalExpression = function (expression, evalCallback, errorCallback) {
    var result              = '',
        expressionFuncCount = 0,
        globalValues        = this.globalValues[this.editor.getFile().id],
        self                = this;
    
    
    // functions that support the callable functions
    ////////////////////////////////////////////////

    function _loadImg(urlString, callback, loadErrCallback) {
      var imageObj = new Image();
      imageObj.onload = function() {
        callback(imageObj.width, imageObj.height);
      }
      imageObj.onerror = function() {
        loadErrCallback("Error Loading file: " + urlString);
      }
      imageObj.src = urlString;
    }
    
    function _resolveFunc(functionName, returnVal, funcStart, funcEnd) {
      // TODO: make sure returnVal is modded to work well if it's a string or a complex object
      expression = expression.slice(0, funcStart) + returnVal + expression.slice(funcEnd + 1, expression.length);
      
      // continue to handle this until there aren't any more functions
      _process(expression);
    }
    
    
    function _process() {
      var functionList = getDeepestFuncs(expression),
          evalValue    = '',
          evalSuccess  = false,
          i;
      
      if (functionList.length > 0) {
        // we'll work on one at a time, even if there's multiple per function level
        if (functionList[0].funcName == "imgX") {
          imgX(functionList[0].funcArgs[0], functionList[0].funcStart, functionList[0].funcEnd);
        }
        else if (functionList[0].funcName == "imgY") {
          imgY(functionList[0].funcArgs[0], functionList[0].funcStart, functionList[0].funcEnd);
        }
        else if (functionList[0].funcName == "imgXresize") {
          imgXresize(functionList[0].funcArgs[0], functionList[0].funcArgs[1], functionList[0].funcStart, functionList[0].funcEnd);
        }
        else if (functionList[0].funcName == "imgYresize") {
          imgYresize(functionList[0].funcArgs[0], functionList[0].funcArgs[1], functionList[0].funcStart, functionList[0].funcEnd);
        }
        else {
          try {
            evalValue   = eval(functionList[0].funcText);
            evalSuccess = true;
          }
          catch (err) {
            _expError(err.message);
          }
          
          if (evalSuccess)
            _resolveFunc(functionList[0].funcName, evalValue, functionList[0].funcStart, functionList[0].funcEnd);
        }
      }
      else {
        try {
          // if we've processed all of the functions, the all we have left is the expression
          evalValue   = eval(expression);
          evalSuccess = true;
        }
        catch (err) {
          _expError(err.message);
        }
        
        if (evalSuccess) {
          // make sure we return string here
          if (typeof evalValue != 'string')
            evalCallback(evalValue.toString());
          else
            evalCallback(evalValue);
        }
      }
    }
    
    function _expError(message) {
      errorCallback(message);
    }
  
    
    // async functions that are callable in the expression
    //////////////////////////////////////////////////////
    
    // async functions
    function imgX(urlString, funcStart, funcEnd) {
      _loadImg(urlString, function(imgWidth, imgHeight) {
        _resolveFunc("imgX", imgWidth, funcStart, funcEnd);
      },
      function(message){
        _expError(message);
      });
    }
    
    function imgY(urlString, funcStart, funcEnd) {
      _loadImg(urlString, function(imgWidth, imgHeight) {
        _resolveFunc("imgY", imgHeight, funcStart, funcEnd);
      },
      function(message){
        _expError(message);
      });
    }
    
    function imgXresize(urlString, height, funcStart, funcEnd) {
      _loadImg(urlString, function(imgWidth, imgHeight) {
        var resizePercentage = height / imgHeight;
        var resizedWidth = Math.round(imgWidth * resizePercentage);
        _resolveFunc("imgXresize", resizedWidth, funcStart, funcEnd);
      },
      function(message){
        _expError(message);
      });
    }
    
    function imgYresize(urlString, width, funcStart, funcEnd) {
      _loadImg(urlString, function(imgWidth, imgHeight) {
        var resizePercentage = width / imgWidth;
        var resizedHeight = Math.round(imgHeight * resizePercentage);
        _resolveFunc("imgYresize", resizedHeight, funcStart, funcEnd);
      },
      function(message){
        _expError(message);
      });
    }
    
    
    // non async: doesn't need fancy resolve mechanism
    function currYear() {
      return (new Date()).getFullYear();
    }
    
    
    // expression code
    ////////////////////////////////////////////////

    try {
      
      // replace all placeholders with values (placeholder must not be in quotes)
      expression = expression.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$(\d+)/g, function(text, index) {
        // only worry about the found items we want (items that are captured)
        if (typeof index !== 'undefined') {
          if (typeof phCurrentValue[index] === 'undefined') {
            var exception = {
              message: "$" + index + " does not exist, or is in a placeholder after the current expression"
            }
            throw exception;
          }
          
          return (self.isIntegerStr(phCurrentValue[index])) ? phCurrentValue[index] : "'" + phCurrentValue[index] + "'";
        }
        else {
          return text;
        }
      });
      
      
      // if there are any global values, process them (globals must not be in quotes)
      var globalRegex  = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|_[0-9a-z_-]+/gi,
          resultArray  = [],
          globalResult,
          varName,
          replaceVal,
          iTmp,
          i;
      
      // filter out the quoted matches
      while ((globalResult = globalRegex.exec(expression)) !== null) {
        if (globalResult[0].substr(0, 1) == '_') {
          resultArray.push(globalResult);
        }
      }
      
      for (i = resultArray.length; i > 0; i--) {
        // start with last item and work your way down
        // which gives us the benefit of not having to track
        // any changes to search result positions
        
        // get the variable name
        varName = resultArray[i - 1][0].substr(1);
        iTmp = i;
        
        if (typeof globalValues[varName] === 'undefined') {
          this.getGlobalVariable(varName, function(returnVal) {
            
            globalValues[varName] = returnVal;

            replaceVal = (self.isIntegerStr(returnVal)) ? returnVal : "'" + returnVal + "'";
            expression = expression.substr(0, resultArray[iTmp - 1].index) + replaceVal + expression.substr(resultArray[iTmp - 1].index + resultArray[iTmp - 1][0].length);
            
            if (iTmp == 1) {
              _process(expression);
            }
          });
        }
        
        else {
          replaceVal = (self.isIntegerStr(globalValues[varName])) ? globalValues[varName] : "'" + globalValues[varName] + "'";
          expression = expression.substr(0, resultArray[i - 1].index) + replaceVal + expression.substr(resultArray[i - 1].index + resultArray[i - 1][0].length);
          
          if (i == 1) {
            _process(expression);
          }
        }
      }
      
      // if there was no results, run the process function as normal
      if (resultArray.length == 0) {
        _process(expression);
      }
    }
    
    catch(err) {
      _expError(err.message);
    }
  }
  
  
  
  Hinter.prototype.isIntegerStr = function (value) {
    return /^[0-9]+$/.test(value);
  }
  
  
  
  
  Hinter.prototype.getGlobalVariable = function (varName, callback) {
    var dlgTemplate = `
<div id='gv-modal' class='template modal hide' style='width:350px'>
  <h4 class='modal-header' style='margin: 0'>
    Please input value for global _${varName}
  </h4>
  <div class='modal-body'>
    <input id='gv-modal-value' type='text' style='display:block;margin: 0 auto'>
  </div>
  <div class='modal-footer'>
    <a class='dialog-button btn primary' data-button-id='ok' href='#'>Ok</a>
  </div>
</div>`;
    
    var gvDialog        = Dialogs.showModalDialogUsingTemplate(dlgTemplate);
    var gvDialogElement = gvDialog.getElement(),
        gvDialogOkBtn   = $(".dialog-button[data-button-id='ok']", gvDialogElement),
        gvDialogTextBox = $("#gv-modal-value", gvDialogElement);
    
    
    gvDialogTextBox.keyup(function(evt) {
      if (evt.keyCode == 13) {
        gvDialogOkBtn.click();
      }
    })
    
    gvDialogOkBtn.on("click", function() {
      callback(gvDialogTextBox.val());
    });
    
    gvDialogTextBox.focus();
  }
  
  
  
  
  
  Hinter.prototype.displayError = function (errorMsg) {
    var dlgTemplate = `
<div id='gv-modal' class='template modal hide' style='width:300px'>
  <h4 class='modal-header' style='margin: 0'>
    Error in placeholder expression
  </h4>
  <div class='modal-body'>
    <p class='dialog-message'>${errorMsg}</p>
  </div>
  <div class='modal-footer'>
    <a class='dialog-button btn primary' data-button-id='ok' href='#'>Ok</a>
  </div>
</div>`;
    
    var gvDialog        = Dialogs.showModalDialogUsingTemplate(dlgTemplate);    
  }
  
  
  

  module.exports = Hinter;
})
