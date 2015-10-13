angular.module("FeedStore", []);

angular.module("FeedStore").controller(
	"AppController",
	function provideAppController($scope, $window, feedService) {
		
		var vm = this;
		vm.feeds = [];
		vm.posts = [];
		vm.form = {
			title: "",
			url: ""
		};
		loadRemoteData();
		
		vm.processForm = processForm;
		vm.removeFeed = removeFeed;
		vm.showFeed = showFeed;
		
		function processForm() {
			if (!vm.form.title || !vm.form.url) {
				return;
			}
			feedService
				.addFeed(vm.form.title, vm.form.url)
				.then(loadRemoteData)
			;
			vm.form.title = "";
			vm.form.url = "";
		}
		
		function showFeed(feed) {
			feedService.getPosts(feed.url).then(function(posts) {
				console.log('in controller gotPosts...');
				console.log(posts)
				vm.posts = posts;
			});
		}
		
		function removeFeed(feed) {
			feedService
				.deleteFeed(feed.id)
				.then(loadRemoteData)
			;
		}

		function applyRemoteData(feeds) {			vm.feeds = feeds;
		}
		
		function loadRemoteData() {
			feedService
				.getFeeds()
				.then(applyRemoteData)
			;
		}
	}
);

angular.module("FeedStore").factory(
	"feedService",
	function provideFeedService($q) {
		
		var feeds = restoreData();
		
		return({
			addFeed: addFeed,
			deleteFeed: deleteFeed,
			getFeeds: getFeeds,
			getPosts: getPosts
		});

		function addFeed(title, url) {
			var id = (new Date()).getTime();
			var posts = getPosts(url);
			feeds.push({
				id: id,
				title: title,
				url: url,
				posts: posts
			});
			persistData();
			return($q.when(id));
		}

		function downloadFile(url, deferred) {
			var xhr = new XMLHttpRequest(); 
			xhr.open('GET', 'http://cletus.mooo.com/getfeed.php?feed='+url, true); 
			
			xhr.onreadystatechange = function () { 
			
				if (xhr.readyState == 4) {
					console.log('read of '+url);
					if (xhr.response.length == 0) {
						console.log('failed');
						deferred.reject();
					} else {
						console.log('happy');
						deferred.resolve(xhr.response);
					}
				}
			};
			xhr.send(null);
		}
		
		function getPosts(url) {
			var deferred = $q.defer();
			
			console.log("in feedService getPosts(" + url + ")");
			downloadFile(url, deferred);
			
			return deferred.promise;
		}
		
		function deleteFeed(id) {
			for (var i = 0, length = feeds.length ; i < length ; i++) {
				if (feeds[i].id === id) {
					feeds.splice(i, 1);
					break;
				}
			}
			persistData();
			return($q.when());
		}
		
		function getFeeds() {
			return($q.when(angular.copy(feeds)));
		}
		
		function persistData() {
			localStorage.setItem('feeds', JSON.stringify(feeds));
		}
		
		function restoreData() {
			var data = localStorage.getItem('feeds');

			if (data === null) {
				return []; 
			} 
			return JSON.parse(data);  
		}
	}
);

