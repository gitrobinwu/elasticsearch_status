export default function (server) {

  // We can use this method, since we have set the require in the index.js to
  // elasticsearch. So we can access the elasticsearch plugins safely here.
  let call = server.plugins.elasticsearch.callWithRequest;
  
  /*********************************************************************/	
  //_cat/indices/
  server.route({
	path: '/api/cat',
	method: 'GET',
	handler: function(request,reply){
		call(request,'cat.indices').then(function(response){
			reply(response);
		});
	}
  });
  /*********************************************************************/	
  /*********************************************************************/	
  //_cat/health 
  server.route({
	path: '/api/health',
	method: 'GET',
	handler: function(request,reply){
		call(request,'cat.health').then(function(response){
			reply(response);
		});
	}
  });
  /*********************************************************************/	
  /*********************************************************************/	
  //_cat/indices/
  server.route({
	path: '/api/count',
	method: 'GET',
	handler: function(request,reply){
		call(request,'cat.count').then(function(response){
			reply(response);
		});
	}
  });
  /*********************************************************************/	

  server.route({
    path: '/api/elasticsearch_status/indices',
    method: 'GET',
    handler(req, reply) {
      // from Elasticsearch.
      call(req, 'cluster.state').then(function (response) {
        // Return just the names of all indices to the client.
        reply(
          Object.keys(response.metadata.indices)
        );
      });
    }
  });

  /*********************************************************************/	
  //search san sroll
  server.route({
    path: '/api/elasticsearch_status/index/{name}',
    method: 'GET',
    handler(req, reply) {
      call(req,'search', {
        index: req.params.name,
		scroll: "1m",
		search_type: "scan",
		q: "*"
      }).then(function (response) {
		console.log('**********************************');    
		reply(response);
		console.log(response);
		console.log('**********************************');    
      });
    }
  });

  //get index status 
  server.route({
    // We can use path variables in here, that can be accessed on the request
    // object in the handler.
    path: '/api/elasticsearch_status/property/{name}',
    method: 'GET',
    handler(req, reply) {
      call(req, 'cluster.state', {
        metric: 'metadata',
        index: req.params.name
      }).then(function (response) {
        reply(response.metadata.indices[req.params.name]);
      });
    }
  });
  //scroll 
  /*server.route({
	path: '/api/elasticsearch_status/scroll/{scroll_id}',
	method: 'GET',
	handler: function(request,reply){
		call(request,'scroll',{
			scrollId: request.params.scroll_id,
			scroll: "1m"
		}).then(function(response){
			reply(response);
		});
	}
  });*/
  /*********************************************************************/	
};


