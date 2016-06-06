var _ = require('underscore');
var request = require('request');

module.exports = function (name = "", options = {}) {
    var token = null;

    var settings = _.extend({
        name: name,
        url: "https://torrentapi.org/pubapi_v2.php"
    }, options);

    var serialize = function (parameters) {
        var string = [];
        for (var p in parameters) {
            if (parameters.hasOwnProperty(p)) {
                string.push(encodeURIComponent(p) + "=" + encodeURIComponent(parameters[p]));
            }
        }
        return string.join("&");
    };

    var get = function (parameters, callback) {
        request(settings.url + '?' + serialize(parameters), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(JSON.parse(body));
            }
        });
    };

    var setToken = function (callback) {
        get({"get_token": "get_token"}, function (data) {
            if (data.hasOwnProperty('token')) {
                token = data.token;
                callback();
            }
        });
    };

    var query = function (parameters, callback) {
        if (token == null) {
            setToken(function () {
                query(parameters, callback);
            });
        } else {
            parameters.token = token;
            get(parameters, function (data) {
                if (data.hasOwnProperty('error')) {
                    console.error(data);
                    if ([1, 2, 3, 4].indexOf(data.error_code) > -1) {
                        setToken(function () {
                            query(parameters, callback);
                        });
                    }

                    if (data.error_code == 5) {
                        setTimeout(function () {
                            query(parameters, callback);
                        }, 2000);
                    }
                } else {
                    if(data.hasOwnProperty('torrent_results')) {
                        callback(data.torrent_results);
                    }
                }
            });
        }
    };

    this.list = function (parameters = {}) {
        return new Promise(function (resolve, reject) {
            parameters.mode = "list";
            query(parameters, function (data) {
                resolve(data);
            });
        });
    };

    this.search = function (parameters = {}) {
        return new Promise(function (resolve, reject) {
            parameters.mode = "search";
            query(parameters, function (data) {
                resolve(data);
            });
        });
    };
};