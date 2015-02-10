define('filterBarsDirective', ['app'], function (app) {

  app.directive('filterBars', function ($rootScope, $document) {
    return {
      templateUrl: $rootScope.url('./html/_filter-bars.html'),
      restrict: 'A',
      scope: {
        hints: '=',
        filters: '=',
        definedLanguages: '='
      },
      link: function postLink ($scope, elem, attrs) {

        function init () {
          var languages = [],
              tags      = [];

          // find languages and tags in hints
          _.each($scope.hints, function (hint) {
            var tag, lang;
            if ((tag = hint.tag) &&
                !_.find(tags, {text: tag}))
              tags.push({scope: hint.scope, text: tag});

            if ((lang = _.find($scope.definedLanguages, {id: hint.scope})) &&
                !_.find(languages, {id: hint.scope}))
              languages.push(lang);
          })

          // Choose the first group by default
          toggleScope(languages[0].id);

          $scope.languages = languages;
          $scope.tags = tags;
        }

        function toggleScope (langId) {
          $scope.filters.scope = langId;
          var tag;
          if ((tag = _.find($scope.tags, {scope: langId}))) {
            $scope.toggleTag(tag.text);
            $scope.showTags = true;
          } else {
            $scope.showTags = false;
            delete $scope.filters.tag;
          }
        }

        function toggleTag (tagText) {
          $scope.filters.tag = tagText;
        }

        function toggleSearch () {
          if ($scope.isSearch) {
            delete $scope.filters.search;
            $scope.isSearch = false;
          } else {
            $scope.isSearch = true;
          }
        }

        init();

        $scope.toggleScope  = toggleScope;
        $scope.toggleTag    = toggleTag;
        $scope.toggleSearch = toggleSearch;
      }
    }
  })
});