'use strict';

const sampleCookie = ''
const cookie = require('cookie');
const cookieObject = cookie.parse(sampleCookie)
const laravelKey = ''
const laravelSession  = require('./index')
const result = laravelSession.getSessionKey(cookieObject.laravel_session, laravelKey)
console.log(result.toString())