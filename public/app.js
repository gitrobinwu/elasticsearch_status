import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';

import './less/main.less';
import overviewTemplate from './templates/index.html';
import detailTemplate from './templates/detail.html';
import propretyTemplate from './templates/property.html';

uiRoutes.enable();
uiRoutes
.when('/', {
  template: overviewTemplate,
  controller: 'elasticsearchStatusController',
  controllerAs: 'ctrl'
})
.when('/index/:name', {
  template: detailTemplate,
  controller: 'elasticsearchDetailController',
  controllerAs: 'ctrl'
})
.when('/property/:name', {
  template: propretyTemplate,
  controller: 'elasticsearchPropertyController',
  controllerAs: 'ctrl'
});

uiModules
.get('app/elasticsearch_status')
.controller('elasticsearchStatusController', function ($http,$scope,es) {
  console.log(es);
  //从cat字符串数据中获取行数据
  var get_linedata = function(data){
	  let list_data = data.split(' ');
	  let tmp_data = new Array();
	  for(let n=0; n<list_data.length; n++){
		  if(!list_data[n]) continue;
		  tmp_data.push(list_data[n]);
	  }
	  return tmp_data;
  };
 

  /***************** cat api ****************************/
  //_cat/health -->nodes shards 	 
  $http.get('../api/health').then((response) =>{
	console.log('------------cat/health---------------');
	console.log(response.data);
	let data = get_linedata(response.data);
	console.log('data.lenght = '+data.lenght);
	console.log(data);
	$scope.nodesCount = data[4];
	$scope.shardsCount = data[6];
	console.log('------------cat/health---------------');
  }); 
 
  //_cat/count --> docs 
  $http.get('../api/count').then((response) =>{
	console.log('------------cat/count---------------');
	let data = get_linedata(response.data);
	$scope.docsCount = data[2];
	console.log('------------cat/count---------------');
  });

  //_cat/indices  --> indices size 
  $http.get('../api/cat').then((response) => {
	console.log('------------cat/indices---------------');
	//获取cat返回数据中获取行数据
	let data = get_linedata(response.data);
	//索引数量
	$scope.indicesCount = parseInt(data.length/9);

	//计算索引存储容量
	var indexSize = 0;
	for(let i=0; i<data.length-1;i+=9){
		let size = 0;
		if(!(data[i+7].indexOf('k')<0)){
			size = parseFloat(data[i+7])*1024;
		}else if(!(data[i+7].indexOf('m')<0)){
			size = parseFloat(data[i+7])*1024*1024;
		}else if(!(data[i+7].indexOf('g')<0)){
			size = parseFloat(data[i+7])*1024*1024*1024;
		}
		
		indexSize+=size;
	}

	console.log('indexSize = '+indexSize);
	if(indexSize<1024){
		//<1kb  
		$scope.storeSize = indexSize+'B';
	}else if(indexSize<(1024*1024)){
		//<1mb 
		$scope.storeSize = parseFloat(indexSize/1024).toFixed(2)+'KB'; 
	}else if(indexSize<(1024*1024*1024)){
		//<1gb
		$scope.storeSize = parseFloat(indexSize/(1024*1024)).toFixed(2)+'MB';
	}else if(indexSize<(1024*1024*1024*1024)){
		//>1tb
		$scope.storeSize = parseFloat(indexSize/(1024*1024*1024)).toFixed(2)+'GB'
	}else {
		alert("存储容量已经达到了TB级别");
	}	
	console.log('$scope.storeSize = '+$scope.storeSize);

	//设置行数据组
	$scope.datalines = new Array();
	for(let n=0; n<data.length-1; n+=9){
		$scope.datalines.push({"name": data[n+2], "count": data[n+5], "size": data[n+7]});
	}
	
	//根据获取数据设置分页初始参数
	$scope.pageinit = function(datasource,pagesize,currentpage){
		console.log('--------------------- pageinit --------------------------------------');
		//数据源
		$scope.datasource = typeof(datasource) == 'undefined'?$scope.datalines:datasource;
		//分页大小
		$scope.pagesize = typeof(pagesize) == 'undefined'?5:pagesize;
		//当前指向的分页
		$scope.currentpage = typeof(currentpage) == 'undefined'?1:currentpage;
		console.log('datasource = '+$scope.datasource);
		console.log('pagesize = '+$scope.pagesize);
		console.log('currentpage = '+$scope.currentpage);
	
		//分页数(向上舍入)
		console.log('datasource type: '+typeof($scope.datasource));
		$scope.pagecount = Math.ceil($scope.datasource.length/$scope.pagesize);
		console.log('pagecount = '+$scope.pagecount);
		//显示page页数 
		$scope.displaypage = $scope.pagecount>5?5:$scope.pagecount;
		//分页要repeat的数组
		$scope.pageList = [];
		for(let i=0; i<$scope.displaypage; i++){
			$scope.pageList.push(i+1);
		}
		console.log('pageList = '+$scope.pageList);
		//初始载入数据
		$scope.items = $scope.datasource.slice(0,$scope.pagesize);
		//载入分页数据function
		$scope.setData = function(){
			let start = $scope.pagesize*($scope.currentpage-1);
			let end = $scope.pagesize*$scope.currentpage;
			$scope.items = $scope.datasource.slice(start,end);	
		}
	};

	//初始化分页设置
	$scope.pageinit();
	//选择分页时，更新分页栏显示，当前页，载入数据
	$scope.selectPage = function(page){
		//不能小于1大于最大页数
		if(page<1||page>$scope.pagecount) return;

		//最多显示5个分页数，大于2页开始分页转换
		if(page>2){
			var newpageList = [];
			for (var i=(page-3); i < ((page + 2)>$scope.pagecount ? $scope.pagecount : (page + 2)); i++) {
				newpageList.push(i+1);
			}
			//更新分页栏显示
			$scope.pageList = newpageList;
		}
		//更新当前页
		$scope.currentpage = page;
		//更新载入数据
		$scope.setData();
		//设置为选中 
		$scope.isActivePage(page);
		console.log("选择的页: "+ page);
	};

	//是否选中 
	$scope.isActivePage = function(page){
		return $scope.currentpage == page;
	}

	//上一页
	$scope.Previous = function(){
		$scope.selectPage($scope.currentpage -1);
	}

	//下一页
	$scope.Next = function(){
		$scope.selectPage($scope.currentpage +1);
	}

	//filter indices by name
	$scope.search = function(query){
		console.log("query ======= "+query);
		//query改变为空值时,重置分页
		if(!query) {
			$scope.pageinit();
			return;
		}
		
		//query改变为非空值时，从$scope.datalines过滤数据源
		var newDatalines = [];
		for(var i=0; i<$scope.datalines.length; i++){
			if(!(($scope.datalines[i].name.indexOf(query))<0)){
				newDatalines.push($scope.datalines[i]);
			}
		}
		//重置分页
		$scope.pageinit(newDatalines);
	}
  });
  /*****************************************************/

  /*$http.get('../api/elasticsearch_status/indices').then((response) => {
    this.indices = response.data;
  });*/
})
.controller('elasticsearchDetailController', function($routeParams, $scope,$http,es) {
  $scope.index = $routeParams.name;//要查询的索引
 
  //获取表格数据
  var get_tabledata = function(response){
	let items = []
	let data = response.hits.hits;
	for(let n=0; n<data.length; n++){
		items.push({"timestamp": data[n]._source["@timestamp"],"type":data[n]._type,"message": data[n]._source["message"]});
	}
	return items
  }

  //search scan scroll 
  $http.get(`../api/elasticsearch_status/index/${$scope.index}`).then((response) => { 
	console.log('------------ search ---------------');
	//获取token 
	$scope.scroll_id = response.data._scroll_id;
    console.log("scroll_id ===== "+$scope.scroll_id);

	//scroll 请求
	es.scroll({
		body:{"scroll_id": $scope.scroll_id,"scroll":"1m"}
	}).then(function(resp){
		console.log('***************************');
		console.log(resp);
		console.log(resp._scroll_id);
		$scope.scroll_id = resp._scroll_id;//更新token 
		console.log(resp.hits.total);
		$scope.Total = resp.hits.total;
		$scope.items = get_tabledata(resp);
		$scope.itemsLength = $scope.items.length;
		console.log($scope.items);
		console.log('***************************');
	});

	//首页
	$scope.HomePage = function(){
		console.log('---------------- HomePage -------------');
		$http.get(`../api/elasticsearch_status/index/${$scope.index}`).then((response) => {
			$scope.scroll_id = response.data._scroll_id;
			es.scroll({
				body:{"scroll_id": $scope.scroll_id,"scroll":"1m"}
			}).then(function(resp){
				$scope.scroll_id = resp._scroll_id;//更新token
				$scope.items = get_tabledata(resp);
			});	
		});
		console.log('---------------- HomePage -------------');
	}

	//查找对应分页数据
	$scope.search = function(){
		var page = $scope.page;
		console.log('page ============== '+page);
		if(!page) return;
		var pagenum = parseInt($scope.Total/$scope.itemsLength);
		console.log('total = '+$scope.Total);
		console.log('itemsLength ='+$scope.itemsLength);
		console.log('pagenum ='+pagenum);
		if(page<0 || page >(pagenum+2)) return;

		console.log('@@11111111111111111111111111111');
		$http.get(`../api/elasticsearch_status/index/${$scope.index}`).then((response) => {
			$scope.scroll_id = response.data._scroll_id;
			for(var n=0; n<page; n++){
				if(n!=(page-1)){ 
					es.scroll({
						body:{"scroll_id": $scope.scroll_id,"scroll":"1m"}
					}).then(function(resp){
						$scope.scroll_id = resp._scroll_id;//只更新token
					});
				}else{
					//使用最新token访问数据
					es.scroll({
						body:{"scroll_id": $scope.scroll_id,"scroll":"1m"}
					}).then(function(resp){
						$scope.scroll_id = resp._scroll_id;
						console.log('&&&&&&&&&&&&&&&&&&&&');
						$scope.items = get_tabledata(resp);
						console.log($scope.items);
					});
				}
			}
		});		
	}
	//下一页
	$scope.NextPage = function(){
		console.log('------------ NextPage --------------');
		es.scroll({
			body: {"scroll_id": $scope.scroll_id, "scroll": "1m"}
		}).then(function(resp){
			$scope.scroll_id = resp._scroll_id;
			$scope.items = get_tabledata(resp);
		});
		console.log('------------ NextPage --------------');
	}
	console.log('------------ search ---------------');
  });
})
.controller('elasticsearchPropertyController', function($routeParams,$scope,$http,es) {
	console.log('------------------- Index status -----------------------');
	console.log($routeParams.name);
	$scope.index = $routeParams.name;
	$http.get(`../api/elasticsearch_status/property/${$scope.index}`).then((response) => {
		$scope.status = response.data;
	});
	console.log('------------------- Index status -----------------------');
});













