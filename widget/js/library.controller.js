define('libraryCtrl', ['app', '_', 'libraryHints', 'languages'], function (app, _, libraryHints, definedLanguages) {
  app.controller('LibraryCtrl', function ($scope, $document, $timeout) {

    $scope.libraryHints = libraryHints;

    $scope.filters = {};

    $scope.definedLanguages = definedLanguages;

    $scope.save = function (snippet) {
      var snippetCopy = angular.copy(snippet);

      var group = $scope.groupedSnippets[snippet.scope];

      if (!group) {
        $scope.groupedSnippets[snippet.scope] = [];
        group = $scope.groupedSnippets[snippet.scope];
      }

      var counter = 0;
      while (_.find(group, {trigger: snippetCopy.trigger})) {
        snippetCopy.trigger = snippet.trigger + (++counter);
      }

      group.push(snippetCopy);

      $scope.informChange();
    }

  })
})
