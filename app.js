var cons = require('consolidate')
   ,request = require('request')
   ,express = require('express')
   ,cheerio = require('cheerio')
   ,strftime = require('strftime')

require('coffee-script/register');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'hamlc')
app.use(express.static(__dirname+'/public'));
app.engine('hamlc', cons['haml-coffee']);


var port = process.env.PORT || 5000;

app.listen(port);

app.get('/', render_index);
app.get('/shows', get_vars, get_shows, render_shows);
app.get('/shows/json', get_vars, get_shows, render);
app.get('/langs', get_langs, render);

var root_url = 'http://shortwaveschedule.com/index.php?now=true'

String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}

function get_vars(req, res, next) {
  res.stash = res.stash || {};

  res.stash.min_freq = req.query.min || 0;
  res.stash.max_freq = req.query.max || 30000;
  res.stash.language = req.query.lang || '';

  return next();
}

function get_langs(req, res, next) {
  res.stash = res.stash || {};

  request(root_url, function(e,r,b) {
    if (!e & r.statusCode == 200) {
      $ = cheerio.load(b);

      var langs = {};

      var trans_table = $('#transmissionslist > tbody > tr');
      
      trans_table.each(function() {
        var lang = $(this).find('td').eq(2).text();
        langs[lang] = 1;
      });

      var lang_list = [];
      for(l in langs) {
        if (l.length) {
          lang_list.push(l);
        }
      }
      res.stash.json = lang_list;
      return next();
    } else {
      res.stash.json = [];
      return next();
    } 
  });
}
        

function get_shows(req, res, next) {
  res.stash = res.stash || {};

  request(root_url, function(e,r,b) {
    if (!e & r.statusCode == 200) {
      $ = cheerio.load(b);

      var programs = [];

      var trans_table = $('#transmissionslist > tbody > tr');

      trans_table.each(function() {
        tmp = {};
        tmp['freq'] = $(this).find('td').eq(0).text().ltrim();
        tmp['station'] = $(this).find('td').eq(1).find('a').text();
        tmp['lang'] = $(this).find('td').eq(2).text();
        tmp['start'] = $(this).find('td').eq(3).text();
        tmp['end'] = $(this).find('td').eq(4).text();
        tmp['xmit_name'] = $(this).find('td').eq(6).find('.transmittername').text().ltrim();
        tmp['xmit_kw'] = $(this).find('td').eq(6).find('.transmitterkw').text()
       	tmp['xmit_kw'] = tmp['xmit_kw'].substring(0,tmp['xmit_kw'].length-2); 
	if ((!res.stash.language.length || tmp['lang'] == res.stash.language) && parseInt(tmp['freq']) <= res.stash.max_freq && parseInt(tmp['freq']) >= res.stash.min_freq) {
          programs.push(tmp);
        }
      });
     
      res.stash.json = programs;
 
      return next();
    } else {
      res.stash.json = {error: 'error'};
    }
  });

}



function render(req, res) {
  res.stash = res.stash || {};

  res.send(res.stash.json);
}

function render_index(req, res) {
  res.stash = res.stash || {};

  res.render('index');
}

function render_shows(req, res) {
  res.stash = res.stash || {};

  res.render('shows', { shows : res.stash.json });
}
