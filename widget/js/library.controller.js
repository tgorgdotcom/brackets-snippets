define('libraryCtrl', ['app', '_', 'libraryHints', 'languages'], function (app, _, libraryHints, definedLanguages) {
  app.controller('LibraryCtrl', function ($scope, $document, $timeout, Storage) {

    $scope.libraryHints = libraryHints;

    $scope.filters = {};

    $scope.definedLanguages = definedLanguages;

    $scope.hideAlert = Storage.get('hideAlert');

    var BLOCK_TAGS = ['VanillaJS'];

    $scope.save = function (snippet) {
      var snippetCopy = angular.copy(snippet);

      // block some tags and prevent it from saving
      if (snippetCopy.tag && _.contains(BLOCK_TAGS, snippetCopy.tag)) {
        delete snippetCopy.tag;
      }

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

    $scope.dismissAlert = function () {
      Storage.set('hideAlert', true);
      $scope.hideAlert = true;
    }
  })
})
