define('settingsCtrl', ['app', '_', 'settingsData', 'jsyaml'], function (app, _, settingsData, jsyaml) {
  app.controller('SettingsCtrl', function ($rootScope, $scope, $document, $timeout, $window) {

    $scope.settingsData = settingsData;

    var flag = false;

    $scope.$watch('settingsData', function(newVal, oldVal) {
      if (!flag)
        return (flag = true)

      prefsChanged(newVal);

      // prevent from users toggle too fast
      $scope.saving = true;
      $timeout(function() {
        $scope.saving = false;
      }, 300)
    }, true)

    $scope.togglePanel = function (idx) {
      if ($scope.curPanel === idx)
        $scope.curPanel = -1;
      else
        $scope.curPanel = idx;
    }

    $scope.import = {};
    $scope.export = {};
    $scope.importSnippets = function () {
      if (!$scope.import.file || !$scope.import.type)
        return;

      var importedSnippets, existedSnippets = $rootScope.snippets;
      try{
        importedSnippets = jsyaml.load($scope.import.file.content);
      } catch (e) {
        console.log(e);
        $window.alert('Import fail: The file contains some syntax errors.');
        return;
      }

      if (!importedSnippets || !importedSnippets.length) {
        $window.alert('Import fail: The file has no valid snippets.');
        return;
      }

      importedSnippets = removeLastBlankLine(importedSnippets);

      var idx, // index of snippets in existedSnippets
        importCount = 0,
        skipCount = 0,
        overrideCount = 0;
      switch($scope.import.type) {
        case '1':  // remove all snippets
          existedSnippets = importedSnippets;
          importCount = importedSnippets.length;
          break;
        case '2':  // override all snippets with same trigger
        case '3':  // skip all snippets with same trigger
          for (var i = importedSnippets.length - 1; i >= 0; i--) {
            var snippet = importedSnippets[i];
            if ((idx = _.findIndex(existedSnippets, {trigger: snippet.trigger, scope:snippet.scope})) > -1) {
              if ($scope.import.type === '2') {
                // override
                existedSnippets[idx] = snippet;
                overrideCount++;
              } else if ($scope.import.type === '3') {
                // skip
                skipCount++;
              }
            } else {
              existedSnippets.push(snippet);
              importCount++;
            }
          }
          break;
        default:
          throw 'unknown import scheme';
      }

      $scope.$emit('snippets-changed', existedSnippets);
      $window.alert(
        'Successfully Imported!' + '\n\n' +
        'Imported: ' + importCount + '\n' +
        'Overrided: ' + overrideCount + '\n' +
        'Skipped: ' + skipCount + '\n'
      );

      // reset
      $scope.import.file = null;
      $scope.import.type = null;
      $scope.curPanel = null;
    }

    $scope.exportSnippets = function () {
      if (!$scope.export.type)
        return;

      var snippets = angular.copy($rootScope.snippets);

      switch ($scope.export.type) {
        case '1': // Export user-defined snippets only
          for (var i = snippets.length - 1; i >= 0; i--) {
            if (snippets[i].source === 'system') {
              snippets.splice(i, 1);
            }
          }
          break;
        case '2': // Export all snippets
          // Do nothing
          break;
        default:
          throw 'unknown export scheme';
      }

      if (!snippets.length) {
        $window.alert('No snippet waits for export.');
        return;
      }

      // do some hack to make sure the `text` field is the last one
      for (var i = snippets.length - 1; i >= 0; i--) {
        var text = snippets[i].text;

        if (text) {
          delete snippets[i].text;
          snippets[i].text = text;
        }
      }

      // json to yaml
      var exportText = jsyaml.dump(snippets);

      // save file
      $document.trigger('export-snippets', [
        exportText,
        function(openFile, file) {
          if ($window.confirm('Successfully exported! Open the file now?')) {
            openFile(file)
          }
          $scope.$apply(function() {
            $scope.curPanel = null;
          });
        },
        function() {
          $window.alert('Something goes wrong...');
        }
      ]);
    }

    $scope.fileLoadSuccess = function () {
      $scope.import.errCode = -1;
    }

    $scope.fileLoadError = function (errCode) {
      $scope.import.errCode = errCode;
    }

    $scope.restoreDefault = function () {
      if ($window.confirm('Notice: All snippets will be restored to defaults, continue?')) {
        $document.trigger('restore-snippets', [function (snippets) {
          $scope.$emit('snippets-changed', snippets);
        }])
      }
    }

    function prefsChanged (data) {
      $document.trigger('prefs-changed', data);
    }

    // remove the last blank line
    function removeLastBlankLine (hints) {
      for (var i = hints.length - 1; i >= 0; i--) {
        var text = hints[i].text;
        if(text.charAt(text.length - 1) === '\n' || text.charAt(text.length - 1) === '\r\n'){
          hints[i].text = text.substr(0, text.length - 1);
        }
      }
      return hints;
    }

  })
})
