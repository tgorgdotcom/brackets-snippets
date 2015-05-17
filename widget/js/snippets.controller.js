define('snippetsCtrl', ['app', '_', 'userHints', 'languages'], function (app, _, snippets, languages) {
  app.controller('SnippetsCtrl', function ($rootScope, $scope, $document, $timeout, $window) {
    $scope.editingObj = null;

    $rootScope.snippets = snippets;
    groupSnippets();

    $scope.triggerPattern = /^[^\s,\./"';:(){}\[\]]+$/; //"

    $scope.filters = {};

    $scope.languages = languages;

    function groupSnippets () {
      $scope.groupedSnippets = _.groupBy($rootScope.snippets, function (snippet) {
        return snippet.scope;
      })
    }

    var editListener
    function confirmCancel () {
      if ($rootScope.editing) {
        if ($window.confirm('Do you want to discard the changes?')) {
          $rootScope.editing = false
          editListener()
          return true
        }
      }
    }

    $scope.getLanguageName = function (key) {
      return _.find($scope.languages, {id: key}).name || key;
    }

    $scope.toLibrary = function () {
      if ($rootScope.editing && !confirmCancel()) return

      $scope.isLibrary = !$scope.isLibrary;
      $scope.isSetting = false;
    }

    $scope.toSetting = function () {
      if ($rootScope.editing && !confirmCancel()) return

      $scope.isSetting = !$scope.isSetting;
      $scope.isLibrary = false;
    }

    $scope.toNew = function () {
      if ($rootScope.editing && !confirmCancel()) return

      $scope.originalObj = null;
      $scope.editingObj = {};
      $scope.triggerErr = false;
    }

    $scope.toEdit = function (snippet) {
      if ($rootScope.editing && !confirmCancel()) return

      if (editListener)
        editListener()

      $scope.originalObj = snippet;
      $scope.editingObj = angular.copy(snippet);
      $scope.triggerErr = false;

      var _flag = false

      // listen for object changes
      editListener = $scope.$watch("editingObj", function (newValue, oldValue) {

        if (!_flag) return (_flag = true)  // ignore the first time

        if (!newValue)
          return editListener()

        if (newValue && _.keys(newValue).length) {
          $rootScope.editing = true
          editListener()
        }
      }, true);

      $scope.scopeChanged = function () {
        // mapping the mode from brackets to ace
        var ret = mappingMode($scope.editingObj.scope)
        if (ret)
          $scope.mode = ret
      }

      $scope.scopeChanged()

      /**
       * "_any", "audio", "bash", "binary", "c", "clojure", 
       * "coffeescript", "cpp", "csharp", "css", "dart", "diff", 
       * "ejs", "erb_html", "gfm", "groovy", "haskell", "html", 
       * "hx", "image", "java", "javascript", "json", "jsx", "less", 
       * "lua", "markdown", "perl", "php", "properties", "python", 
       * "ruby", "sass", "scala", "scss", "sql", "svg", "unknown", 
       * "vb", "vbscript", "xml", "yaml"
       * 
       * @param  {String} mode    Language Id
       * @return {String}         ace mode
       */
      function mappingMode (mode) {
        if (!mode)
          return false

        switch (mode) {
          case '_any':
          case 'audio':
          case 'binary':
          case 'image':
          case 'unknown':
            return false
          case 'bash':
            return 'sh'
          case 'c':
          case 'cpp':
            return 'c_cpp'
          case 'coffeescript':
            return 'coffee'
          case 'erb_html':
            return 'html_ruby'
          case 'gfm':
            return 'markdown'
          case 'hx':
            return 'haxe'
          case 'vb':
            return 'vbscript'
        }

        return mode
      }
    }

    $scope.cancelEdit = function () {
      if ($rootScope.editing && !confirmCancel()) return
      $scope.originalObj = null;
      $scope.editingObj = null;
      $rootScope.editing = false;
    }

    $scope.remove = function (snippet) {
      var group = $scope.groupedSnippets[snippet.scope];
      var idx = group.indexOf(snippet);
      group.splice(idx, 1);

      if (!group.length) {
        delete $scope.groupedSnippets[snippet.scope];
      }

      $scope.cancelEdit();
      $scope.informChange();
    }

    /**
     * Validate:
     *   1. prevent from `trigger` collision
     */
    $scope.validate = function (editingObj) {
      // Trigger has not change?
      if ($scope.originalObj)
        if ($scope.originalObj.trigger === editingObj.trigger)
          return true;

      // New scope?
      var group = $scope.groupedSnippets[editingObj.scope];
      if (!group)
        return true;

      $scope.triggerErr = false;

      // Find if trigger exists in new scope
      var idx = _.findIndex(group, {
        trigger: editingObj.trigger.toLowerCase()
      });

      if (idx === -1)
        return true;

      $scope.triggerErr = true;
      return false;
    }

    /**
     * Save current editing snippet and apply it immediately
     *
     * @param  {Object} editingObj     Editing snippet object
     * @param  {Boolean} toCreateFlag  To bulk create view after save rather than edit
     */
    $scope.save = function (editingObj, toCreateFlag) {
      if (!$scope.validate(editingObj))
        return;

      // add timestamp
      editingObj.mTime = new Date().getTime();

      var group = $scope.groupedSnippets[editingObj.scope];

      // create scope if not existed
      if (!group) {
        $scope.groupedSnippets[editingObj.scope] = [];
        group = $scope.groupedSnippets[editingObj.scope];
      }

      // judge if existed or pristine
      if ($scope.originalObj) {
        var originalGroup = $scope.groupedSnippets[$scope.originalObj.scope];
        var idx = _.findIndex(originalGroup, {
          trigger: $scope.originalObj.trigger
        });

        // replace the original object if in same scope
        if (originalGroup === group) {
          originalGroup.splice(idx, 1, editingObj);
        } else {
          // remove from the original scope
          originalGroup.splice(idx, 1);

          // insert into the new scope
          group.push(editingObj);
        }
      } else {
        // push new snippet
        group.push(editingObj);
      }

      $rootScope.editing = false;

      if (toCreateFlag) {
        $scope.toNew();
      } else {
        $scope.toEdit(editingObj);
      }

      // remember last scope
      $scope.lastScope = editingObj.scope;
      $scope.informChange();
    }

    var timeoutObj;
    $scope.informChange = function (snippets) {
      $scope.showMsg = false;

      $rootScope.snippets = snippets || _.chain($scope.groupedSnippets).values().flatten().value();

      $document.trigger('update-snippets', [$rootScope.snippets]);

      // makes user feel the change
      $timeout(function() {
        $scope.showMsg = true;

        if (timeoutObj) {
          $timeout.cancel(timeoutObj);
        }

        timeoutObj = $timeout(function() {
          $scope.showMsg = false;
        }, 3000)
      }, 200)
    }

    $scope.$on('snippets-changed', function(ev, snippets) {
      $scope.informChange(snippets);
      groupSnippets();
    })

    $scope.useLastScope = function () {
      $scope.editingObj.scope = $scope.lastScope;
    }

    $scope.toggleSearch = function () {
      if ($scope.isSearch) {
        delete $scope.filters.scope;
        delete $scope.filters.search;
        $scope.isSearch = false;
      } else {
        $scope.isSearch = true;
      }
    }
  })
})
