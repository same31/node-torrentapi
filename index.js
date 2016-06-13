var request = require('request');

var serialize = function (params) {
    var string = [];
    for (var p in params) {
        if (params.hasOwnProperty(p)) {
            string.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
        }
    }
    return string.join('&');
};

var TorrentAPI = function (name = '') {
    this.name = name;
    this.url = 'https://torrentapi.org/pubapi_v2.php';
    this.default = {};

    var token = null;

    this._get = function (params, callback) {
        var query = this.url + '?' + serialize(params);
        console.log(query);
        request(query, function (err, res, doc) {
            if (!err && res.statusCode == 200) {
                callback(JSON.parse(doc));
            }
        });
    };

    this._setToken = function (callback) {
        this._get({"get_token": "get_token"}, function (res) {
            if (res.hasOwnProperty('token')) {
                token = res.token;
                callback();
            }
        });
    };

    this._query = function (params, callback) {
        var that = this;
        if (token == null) {
            that._setToken(function () {
                that._query(params, callback);
            })
        } else {
            params.app_name = this.name;
            params.token = token;
            that._get(Object.assign({}, that.default, params), function (res) {
                if ([1, 2, 3, 4].indexOf(res['error_code']) > -1) {
                    that._setToken(function () {
                        that._query(params, callback);
                    })
                } else if (res['error_code'] == 5) {
                    setTimeout(function () {
                        that._query(params, callback);
                    }, 2000);
                } else {
                    callback(res['torrent_results'])
                }
            });
        }
    };

    this.list = function () {
        var that = this;
        return new Promise(function (resolve) {
            params.mode = "list";
            that._query(params, function (res) {
                resolve(res)
            })
        })
    };

    this.search = function (params) {
        var that = this;
        return new Promise(function (resolve) {
            params.mode = "search";
            that._query(params, function (res) {
                resolve(res)
            })
        })
    };
};

module.exports = TorrentAPI;