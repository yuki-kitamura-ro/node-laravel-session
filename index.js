'use strict';

const unserialize = require('php-unserialize').unserialize;
const unserialize2 = require('php-serialization').unserialize;
const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    getAppKey: function (filepath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filepath, 'utf8', function (err, data) {
                if (err != null) return reject(err);

                let key = data.match(/APP_KEY.*/g);

                if (key.length == 0) return reject('APP_KEY not found');
                key = key[0];
                key = key.split('=')[1].trim();

                return resolve(key.replace('base64:', ''));
            });
        });
    },
    getSessionKey: function (laravelSession, laravelKey, keyLength) {
        keyLength = keyLength || 32;
        let cypher = 'aes-' + keyLength * 8 + '-cbc';
        console.log(`cypher: ${cypher}`);

        //Get session object
        laravelSession = Buffer.from(laravelSession, 'base64');
        laravelSession = laravelSession.toString();
        // console.log(`laravelSession: ${laravelSession}`);
        laravelSession = JSON.parse(laravelSession);

        //Create key buffer
        console.log(`laravelKey: ${laravelKey}`);
        laravelKey = Buffer.from(laravelKey, 'base64');
        // console.log(`laravelKey: ${laravelKey}`);

        //crypto required iv in binary or buffer
        console.log(`laravelSession.iv: ${laravelSession.iv}`);
        laravelSession.iv = Buffer.from(laravelSession.iv, 'base64');
        // console.log(`laravelSession.iv: ${laravelSession.iv}`);

        //create decoder
        let decoder = crypto.createDecipheriv(cypher, laravelKey, laravelSession.iv);

        //add data to decoder and return decoded
        // console.log(`laravelSession.value: ${laravelSession.value}`);
        let decoded = decoder.update(laravelSession.value, 'base64') + decoder.final();;

        //unserialize
        // console.log(`decoded: ${decoded}`);
        return decoded.indexOf("s:") == 0 ? unserialize(decoded) : decoded;
    },
    getSessionFromFile: function (laravelSessionKey, filePath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filePath + '/' + laravelSessionKey, 'utf8', function (err, data) {
                if (err != null) return reject(err);

                return resolve(unserialize2(data));
            });
        });
    },
    getSessionFromRedis: async function (laravelSessionKey, redisConnection, sessionPrefix='laravel_cache') {
        const value = await redisConnection.get(sessionPrefix + ':' + laravelSessionKey);
        const first = unserialize2(value);
        return first;
    },
    getSessionFromMysql: function (laravelSessionKey, mySqlConnection, databaseTable) {
        return new Promise(function (resolve, reject) {
            databaseTable = databaseTable || 'sessions';

            mySqlConnection.query('select payload from ' + databaseTable + ' where id = "' + laravelSessionKey + '"', function (err, rows, fields) {
                if (err != null) return reject(err);
                if (rows.length == 0) return reject('Session not found');
                let session = new Buffer(rows[0].payload, 'base64').toString();

                return resolve(unserialize(session));
            });
        });
    },
    getUserIdFromSession: function (session) {
        var cookieKey = 'login_82e5d2c56bdd0811318f0cf078b78bfc';
        if (session.hasOwnProperty(cookieKey)) {
            return session[cookieKey];
        }
        for (var key in session) {
            var matches = key.match(/login_(.*_)?([a-zA-Z0-9]+)/gi);
            if (matches && matches.length > 0) {
                return session[matches[0]];
            }
        }
    }
};
