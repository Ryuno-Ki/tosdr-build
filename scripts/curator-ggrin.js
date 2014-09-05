var http = require('http');
var fs = require('fs');
var Mustache = require('mustache')
var fileServer = require('node-static');
var db = require('./database.js');
var S = require('string');


function displayPoints(res) {
  var data = {};
  data.points = [];
  data.reasons = [
    { name: 'noid',
      description: 'no id',
      test: function(point) { return !point.id } 
    },
    {name:'notopic',
     description:'no or non existent topic',
     test: untopic
    },
    {name:'notitle', 
     description:'no title',
     test: function(point) { return !point.title }
    },
    {name:'noservice', 
     description:'no service',
     test: noservice
    },
    {name : 'unservice',
     description : 'non existent service',
     test : unservice
    },
    {name:'noscore', 
     description:"no score",
     test: noscore
    },
    {name:'nocase', 
     description:"no case", 
     test: nocase
    }, 
    {name:'uncase',
     description:'non existing case',
     test: uncase
    },
    {name:'wrongscore',
     description:'point and case not consistent',
     test: function(point){
       if(nocase(point) || noscore(point) || uncase(point) ) //doesn't have a case or score can't be inconsistent
         return false;
       console.log(point);
       return (point.tosdr.score != db.cases[point.tosdr.case].score);
     }
    }
  ];
  function uncase(point){
    if(nocase(point))
      return false;
    return point.tosdr && !db.cases[point.tosdr.case];
  }
  function noscore(point){
   return (!point.tosdr || !point.tosdr.score);
  }
  function nocase(point){ 
   return (!point.tosdr || !point.tosdr.case);
  }
  function noservice(point) { return !point.service }
  function unservice(point){
    if(noservice(point))
      return false;
    var service = point.service
    if(typeof service === 'object'){
      return (service.filter(function(service){
        return !db.services[service];
      }).length < db.services.length);
    }else{
      return !db.services[service]
    }
  }
  function untopic(point){
    var topic;
    if(point.tosdr && point.tosdr.topic)
      topic = point.tosdr.topic
    else
      topic = point.topic
    //no topic
    if(!topic)
      return true;
    //topic is array and an element is not in list
    if(typeof topic == 'object'){
      return (topic.filter(function(topic){
        return !db.topics[topic]
      }).length < topic.length );
    }
    //topic not in list
    else {
      return !db.topics[topic];
    }

  }
  function prepare(point,reason){
    var obj = {}
    for(var k in point)
      obj[k] = point[k];
    obj.json = JSON.stringify(point, null, 2);
    obj.reason = reason;
    return obj;
  }
  for(var i in db.points){
    var point = db.points[i]
    data.reasons.forEach(function(reason){
      if(reason.test(point))
        data.points.push( prepare(point, reason) );
    })
  }
  res.write(db.templates['points'](data));
}

function displayForm(res, point_id) {
  var point = db.points[point_id];
  res.write(db.templates['points_form.html'](
    {
      point:point, 
      json:JSON.stringify(point, undefined, 2) 
    }
  ));
}

function processPost(req) {
  var str='';
  req.on('data', function(chunk) {
    str += chunk;
  });
  req.on('end', function(){
    console.log(str);
    var data = {};
    str.split('&').forEach(function(pair){
      var parts = pair.split('=');
      data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]).replace(/\+/g,' ');
    })
    console.log('processed post data into : ', data);
    

    function save(data, storage){
      var assign = function(parent, key, data){
        try {
          var obj = JSON.parse(data)
          parent[key] = obj
        } catch(e) {
          // if(e instanceof SyntaxError)
          parent[key] = data; 
        }
      }
      if(!data.id)
        return;
      console.log('updating ',data.id,data)
      for(var k in data){
        if(k!='id' && data[k]){
          var ks
          if((ks = k.split('.')).length > 1){
            //console.log('eneterd nested object', k)
            var cur = storage[data.id]
            for(var i = 0 ; i < ks.length; i++){
              //console.log('current = ', cur);
              if(typeof cur[ks[i]] === 'undefined'){
                //console.log('creating new stage ', ks[i])
                cur[ks[i]] = {};
              }
              else if(typeof cur[ks[i]] !== 'object' && i != ks.length-1){
                console.log("I am not shure how to save that "+ k + '=>' + data[k], storage[data[id]])
                return;
              }
              if( i == ks.length-1){
                //console.log('there we are', ks[i]);
                assign(cur, ks[i], data[k])
              } else {
                cur = cur[ks[i]];
              }
            }
          } else
            assign(storage[data.id],k, data[k]);
        }
      }
    }
    //FIXME update seervices and topics somewhere
    if( req.url.match(/^\/case\//) && data.topic) {
      data.id = S(data.name).camelize().s
      save(data, db.cases);
      db.saveCase(data.id);
    } else if( req.url.match(/^\/point\//) && data.id) {
      save(data, db.points);
      db.savePoint(data.id);
    }
             
  });
}



function displayTopic(res, topic_id){
  var topic = db.topics[topic_id];
  console.log(topic)
  function  render_cases(){
    //console.log(arguments)
    var ret = "";
    if(!topic){
      console.error("Topic not found : ",topic_id);
      return ""
    }
    topic.cases.forEach(function(aCase){
      //var aCase = cases[case_id];
      if(typeof aCase === 'undefined'){
        console.error("case not found", case_id, "for", topic_id);
        return;
      }
      console.log("case : ",aCase);
      var data = {
        topic : topic_id,
        badge : aCase.badge,
        score : aCase.score,
        name : aCase.name,
        id: aCase.id,
        description: aCase.description,
      };
    
      ret += db.templates['topic_case.html'](data);
    });
    return ret;
  };
  
  var data = {
    topic : topic,
    points : render_cases()
  }

  res.write( db.templates['topics_view.html'](data) );
}

function displayPointOverview(res, point_id){
  displayForm(res, point_id);
  console.log(db.points[point_id])
  var point = db.points[point_id];
  if( typeof(point.tosdr) != 'undefined' 
     && typeof(point.tosdr.topic) != 'undefined') {
    if(typeof point.tosdr.topic == 'string') {
      displayTopic(res, point.tosdr.topic);
    } else if(point.tosdr.topic instanceof Array){
      point.tosdr.topic.forEach( function(topic) {
        displayTopic(res, topic);
      } )
    } else {
      console.error("Error Displaying Topic : Wrong Type", point.tosdr.topic)
    }
  }
}


var staticServer = new fileServer.Server('.')

var server = http.createServer(function(req, res) {
  processPost(req);
  var match;
  if(match = req.url.match(/^\/topic\/(.*)/) ){
    console.log("displaying topic : ",match[1])
    res.writeHead(200, {});
    res.write(fs.readFileSync('curator-prefix.html'));

    displayTopic(res, match[1]);

    res.write(fs.readFileSync('curator-postfix.html'));
  } else if(match = req.url.match(/^\/point\/(.*)/)) {
    var point = match[1];
    console.log('displaying form for ',point);
    res.writeHead(200, {});
    res.write(fs.readFileSync('curator-prefix.html'));
    displayPointOverview(res, point);
    res.write(fs.readFileSync('curator-postfix.html'));
  } else if (req.url == '/') {
    res.writeHead(200, {});

    res.write(fs.readFileSync('curator-prefix.html'));
    displayPoints(res);
    res.write(fs.readFileSync('curator-postfix.html'));
  } else {
    staticServer.serve(req, res);
  }
  res.end()
});

server.listen(21337);
console.log('see http://localhost:21337/');
