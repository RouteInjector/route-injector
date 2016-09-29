var tokens = {};

function deleteByUser(niceName, done) {
  for(i in tokens) {
    var t = tokens[i];
    if(t.data.user == niceName) {
	log.debug("Deleting token "+i+" of user "+niceName);
	clearTimeout(t.timer);
	delete tokens[i];
    }
  }
  done(null);
}

function getUserUid(niceName, done) {
    for(i in tokens){
        var t = tokens[i];
        if(t.data.user == niceName){
            return done(null, i);
        }
    }
    done("not found", null);
}

exports.getUserUid = getUserUid;

exports.newToken = function(data, done) {
  log.debug("Adding new token for "+data.user);
  deleteByUser(data.user, function() {
    var tokenID = uid(32);
    var timer = setTimeout(function() {
      remove(tokenID, function() {
        log.debug("Timeout of token "+tokenID+" of user "+data.user);
      }); 
    },config["token.logoutInMillis"]);
    save(tokenID, data, timer, function() {
      done(null, tokenID);
    });
  });
}

function save(token, data, timer, done) {
  tokens[token] = { data: data, timer: timer };
  return done(null);
};
exports.save = save;

function find(key, done) {
  var token = tokens[key];
  if(token) {
     return done(null, token.data);
  } else {
     return done(null, null);
  }
}
exports.find = find;

function findAndUpdate(key, done) {
  var token = tokens[key];
  if(token) {
     var timer = setTimeout(function() {
        remove(key, function() {
            log.debug("Timeout of token " + key + " of user " + token.data.user);
        });
     }, config["token.logoutInMillis"]);
     clearTimeout(token.timer);
     token.timer = timer;
     return done(null, token.data);
  } else {
     return done(null, null);
  }
}
exports.findAndUpdate = findAndUpdate;

function remove(token, done) {
   var t = tokens[token];
   if(t) {
       clearTimeout(t.timer);
       log.debug("Logging out token " + token + " of user "+ t.data.user);
       delete tokens[token];
       done(null);
   } else {
       done('not found');
   }
}
exports.remove = remove;

/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
function uid(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
}
exports.uid = uid;

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
