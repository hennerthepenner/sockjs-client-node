'use strict';

var scope = require('jsdom').jsdom().createWindow()
  , library = __dirname + '/library.js'
  , read = require('fs').readFileSync;

scope.WebSocket = require('ws');

scope.eval(read(library, 'utf-8'));

/*
We'd love to have not only websockets, but also xhr-polling as transport 
options. Unfortunately jsdom always sets "document.domain" to be an empty 
string and doesn't allow it to be changed. SockJS uses the document.domain to 
figure out the null_origin option and then skips the transport. I think that 
there is no way to enable xhr-polling without changing the source code of 
either jsdom or sockjs. Therefore we opt to come up with a monkey patch...
*/

// Equip the jsdom with xhr capabilities:
// http://stackoverflow.com/questions/7086858/loading-ajax-app-with-jsdom
scope.XMLHttpRequest = function() {
  var xmlhttprequest = require("xmlhttprequest");
  var xhr = new xmlhttprequest.XMLHttpRequest();
  // SockJS skips XHR polling if the "withCredentials" option is missing
  xhr.withCredentials = false;
  return xhr;
}

var sockJsUtils = scope.SockJS.getUtils()
  , origDetectProtocolsFunc = sockJsUtils.detectProtocols;

// Patch it
sockJsUtils.detectProtocols = function(probed, protocols_whitelist, info) {
  info.null_origin = false;
  return origDetectProtocolsFunc(probed, protocols_whitelist, info);
}


module.exports = scope.SockJS;
