var request = require('request');

function _serialize (params) {
    var string = [];
    for (var p in params) {
        if (params.hasOwnProperty(p)) {
            string.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
        }
    }
    return string.join('&');
}

function TorrentAPI (name) {
    var _url     = 'https://torrentapi.org/pubapi_v2.php',
    _default = {}, _token;

    function _get (params, callback) {
        var query = _url + '?' + _serialize(params);
        request(query, (err, res, doc) => {
            if (!err && res.statusCode === 200) {
                callback(JSON.parse(doc));
            }
        });
    }

    function _setToken (callback) {
        _get({ 'get_token': 'get_token' }, res => {
            if (res.hasOwnProperty('token')) {
                _token = res.token;
                callback();
            }
        });
    }

    function _query (params, callback) {
        if (!_token) {
            _setToken(() => {
                _query(params, callback);
            });
        }
        else {
            params.app_id = name || '';
            params.token  = _token;
            _get(Object.assign({}, _default, params), res => {
                if ([1, 2, 3, 4].indexOf(res['error_code']) > -1) {
                    _setToken(() => {
                        _query(params, callback);
                    });
                }
                else if (res['error_code'] == 5) {
                    setTimeout(() => {
                        _query(params, callback);
                    }, 2100);
                }
                else {
                    callback(res['torrent_results']);
                }
            });
        }
    }

    this.list = params => {
        params || (params = {});
        return new Promise(resolve => {
            params.mode = 'list';
            _query(params, resolve);
        });
    };

    this.search = params => {
        params || (params = {});
        return new Promise(resolve => {
            params.mode = 'search';
            _query(params, resolve)
        });
    };
}

module.exports = TorrentAPI;
