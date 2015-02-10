define('storageService', ['app'], function (app) {

  app.factory('Storage', function () {

    var KEY = 'edc.brackets-snippets';

    function get (name) {
      var jsonStr = localStorage.getItem(KEY);
      return jsonStr ? JSON.parse(jsonStr)[name] : null;
    }

    function set (name, item) {
      var jsonStr = localStorage.getItem(KEY);
      if (!jsonStr) {
        jsonStr = '{}';
      }
      var jsonObj = JSON.parse(jsonStr);
      jsonObj[name] = item;
      localStorage.setItem(KEY, JSON.stringify(jsonObj));
    }

    return {
      get: get,
      set: set
    };
  })
})