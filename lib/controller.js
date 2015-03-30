var usb = require('./usb_connection')
  , lan = require('./lan_connection')
  , Tessel = require('./tessel/tessel')
  , async = require('async')
  , tessel = require('tessel')
  , Promise = require('bluebird')
  ;

/*
  Fetches Tessels and prints them out
    param callback: called upon completion in the form (err)
*/
function listTessels(callback) {
  // Fetch usb connected Tessels
  console.info('Scanning for connections...');
  return Promise.join( usb.findConnections(), lan.findConnections(), function(usb, lan){
        var connections = {
          usb: usb,
          lan: lan
        };
        for (var i = 0; i < connections.usb.length; i++) {
          console.log('USB CONNECTION ', connections.usb[i].serialNumber);
        }
        for (var i = connections.lan.length - 1; i >= 0; i--) {
          console.log('LAN CONNECTION ip: ', connections.lan[i].ip, ', host: ', connections.lan[i].auth.host, ', Authorized: ', connections.lan[i].authorized);
        }
        return connections;
    });
}

/*
  Returns an instance of the requested Tessel.
  If TESSEL_SERIAL env variable is set, that Tessel is returned.
  If it is not set, the first USB listed Tessel is returned.
    param opts: an object that can contain the field of serial, eg. {serial: "SOME_SERIAL"}
    param callback: called upon completion in the form (err, tessel)
*/
function getTessel(opts, callback) {
  tessel.logs.info("Connecting to Tessel...");
  // Grab all attached Tessels
  return Promise.join(usb.findConnections,lan.findConnections)
    .then(function(stuff){
      if(!stuff.length){
        throw new Error('No Tessel\'s found');
      }
      return stuff;
    })
    // Iterate through each and look for a match on the provided serial
    // number of the return the first Tessel if one wasn't provided
    .reduce(function(memo, connection){
      // if serial number matches connect
      if (!opts.serial || opts.serial === connection.serialNumber) {
        return connection;
      }
      // if memo is not defined set memo to first tessel
      if (!memo) return connection;
      // If none of the above, pass memo along
      return memo;
    }, null)
    .then(function(connection){
      tessel.logs.info("Connected over", connection.connectionType + ".");
      return new Tessel(connection);
    })
}

function deployScript(opts, push) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(tessel){
      // Run the script on Tessel
      tessel.deployScript(opts, push);
    });
}

function eraseScript(opts) {
  // Grab the preferred Tessel
  getTessel({})
    .then(function(tessel) {
      // Run the script on Tessel
      tessel.eraseScript(opts, false);
    });
}

module.exports.listTessels = listTessels;
module.exports.deployScript = deployScript;
module.exports.eraseScript = eraseScript