define('snippetsCtrl', ['app', '_', 'userHints', 'languages'], function (app, _, snippets, languages) {
  app.controller('SnippetsCtrl', function ($scope, $document, $window, $timeout) {
    $scope.editingObj = null;

    $scope.groupedSnippets = _.groupBy(snippets, function (snippet) {
      return snippet.scope;
    })

    $scope.languages = languages;

    $scope.getLanguageName = function (key) {
      return _.find($scope.languages, {id: key}).name;
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
      $scope.showMsg = false;
      $scope.triggerErr = false;
    }

    $scope.toEdit = function (snippet) {
      $scope.originalObj = snippet;
      $scope.editingObj = angular.copy(snippet);
      $scope.showMsg = false;
      $scope.triggerErr = false;
    }

    $scope.cancelEdit = function () {
      $scope.originalObj = null;
      $scope.editingObj = null;
      $scope.showMsg = false;
    }

    $scope.remove = function (snippet) {
      if ($window.confirm('Are you sure to delete "'+ snippet.trigger +'"?')) {
        var group = $scope.groupedSnippets[snippet.scope];
        var idx = group.indexOf(snippet);
        group.splice(idx, 1);

        if (!group.length) {
          delete $scope.groupedSnippets[snippet.scope];
        }

        $scope.cancelEdit();
        $scope.informChange();
      }
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

    $scope.save = function (editingObj) {
      $scope.showMsg = false;
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

      $scope.toEdit(editingObj);
      // remember last scope
      $scope.lastScope = editingObj.scope;
      $scope.informChange();
    }

    $scope.informChange = function () {
      snippets = _.chain($scope.groupedSnippets).values().flatten().value();
      $document.trigger('snippets-changed', [snippets]);

      // makes user feel the change
      $timeout(function() {
        $scope.showMsg = true;
      }, 200)
    }

    $scope.useLastScope = function () {
      $scope.editingObj.scope = $scope.lastScope;
    }
  })
})
