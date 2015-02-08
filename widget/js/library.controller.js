define('libraryCtrl', ['app', '_', 'libraryHints', 'languages'], function (app, _, libraryHints, languages) {
  app.controller('LibraryCtrl', function ($scope, $document, $timeout) {

    $scope.libraryHints = libraryHints;

    $scope.languages =  _.chain(libraryHints)
                          .pluck('scope')
                          .uniq()
                          .map(function(scope) {
                            return _.find(languages, {id: scope})
                          }).value();

    // Choose the first group by default
    $scope.searchGroup = $scope.languages[0].id;

    $scope.toggleGroup = function (langId) {
      // Not allowed to see all hints at one time, for better performance
      // $scope.searchGroup = $scope.searchGroup === langId ? '' : langId;
      $scope.searchGroup = langId;
    }

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
