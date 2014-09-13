var crypto = require('crypto');
var request = require('request');
var S = require('string');
var config = require('./config');

function escapeContent(content) {
  var newResult = '';
  content = content.trim();
  newResult = S(content).stripTags('p,br,strong').s;
  newResult = S(newResult).collapseWhitespace().s;
  newResult = S(newResult).replaceAll('<br />', '\n').s;
  newResult = S(newResult).replaceAll('<br /> <br />', '\n').s;
  newResult = S(newResult).replaceAll('<br /><br />', '\n').s;
  newResult = S(newResult).replaceAll('<p>', '').s;
  newResult = S(newResult).replaceAll('</p>', '\n').s;
  newResult = S(newResult).replaceAll('&nbsp;', '').s;
  newResult = S(newResult.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '$2 $1')).trim().s;
  newResult = newResult.replace(/<(?:.|\n)*?>/gm, '');
  if (S(newResult).endsWith('\n')) {

  }
  return S(newResult).trim().s;
}

module.exports.request = function() {
  request(config.source, function (error, response, body) {
    var json = JSON.parse(body);
    json.forEach(function(row) {
      var hash = crypto.createHash('md5').update(row.url).digest('hex');
      var apiUrl = config.api + 'entries/' + hash + '/exists';
      request(apiUrl, function(err, response, body) {
        var json = JSON.parse(body);
        if (json.exists) {
          console.log('This article exists');
        }
        else {
          var apiUrl = config.api + 'entries/' + config['library_id'] + '/create';
          var image = '';
          if (row.image > 0) {
            image = row.images[0].url;
          }
          var form = {
            title: row.title,
            summary: row.summary,
            content: escapeContent(row.content),
            pubDate: new Date(row.publicationdate),
            image: image,
            source: row.url
          }
          request.post(apiUrl, {form:form}, function (error, response, body) {
            var json = JSON.parse(body);
            if (json.error) {
              console.log(json.error);
            }
            else {
              console.log('Registro guardado con éxito');
            }
          });
        }
      });
    });
  });
}
