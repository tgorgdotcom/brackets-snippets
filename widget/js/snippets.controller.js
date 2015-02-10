define('snippetsCtrl', ['app', '_', 'userHints', 'languages'], function (app, _, snippets, languages) {
  app.controller('SnippetsCtrl', function ($scope, $document, $timeout) {
    $scope.editingObj = null;

    $scope.snippets = snippets;

    $scope.groupedSnippets = _.groupBy(snippets, function (snippet) {
      return snippet.scope;
    })

    $scope.triggerPattern = /^[^\s,\./"';:(){}\[\]]+$/; //"

    $scope.filters = {};

    $scope.languages = languages;

    $scope.getLanguageName = function (key) {
      return _.find($scope.languages, {id: key}).name || key;
    }

    $scope.toLibrary = function () {
      $scope.isLibrary = !$scope.isLibrary;
      $scope.isSetting = false;
    }

    $scope.toSetting = function () {
      $scope.isSetting = !$scope.isSetting;
      $scope.isLibrary = false;
    }

    $scope.toNew = function () {
      $scope.originalObj = null;
      $scope.editingObj = {};
      $scope.triggerErr = false;
    }

    $scope.toEdit = function (snippet) {
      $scope.originalObj = snippet;
      $scope.editingObj = angular.copy(snippet);
      $scope.triggerErr = false;
    }

    $scope.cancelEdit = function () {
      $scope.originalObj = null;
      $scope.editingObj = null;
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
    $scope.informChange = function () {
      $scope.showMsg = false;

      snippets = _.chain($scope.groupedSnippets).values().flatten().value();
      $scope.snippets = snippets;

      $document.trigger('snippets-changed', [snippets]);

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
