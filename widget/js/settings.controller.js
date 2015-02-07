define('settingsCtrl', ['app', '_', 'settingsData'], function (app, _, settingsData) {
  app.controller('SettingsCtrl', function ($scope, $document, $timeout) {

    $scope.settingsData = settingsData;

    $scope.counter = 0;

    $scope.$watch('settingsData', function(newVal, oldVal) {
      if ($scope.counter++) {
        informChange(newVal);

        // prevent from users toggle too fast
        $scope.saving = true;
        $timeout(function() {
          $scope.saving = false;
        }, 300)
      }
    }, true)

    function informChange (data) {
      $document.trigger('prefs-changed', data);
    }
  })
})
