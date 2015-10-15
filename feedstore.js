// this is handy - http://jsonviewer.stack.hu/
// https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q=http://www.jesusandmo.net/feed/
// maybe this'll help - https://www.airpair.com/angularjs/posts/angularjs-promises
// or this - http://www.peterbe.com/plog/promises-with-$http
// mulitple args to a promise - http://stackoverflow.com/questions/17686612/rejecting-promises-with-multiple-arguments-like-http-in-angularjs

angular.module("FeedStore", []);

angular.module('FeedStore').filter(
	'to_trusted', ['$sce', function($sce) {
		return function(test) {
			return $sce.trustAsHtml(test);
		};
	}]);

angular.module("FeedStore").controller(
	"AppController",
	function provideAppController($scope, $window, feedService) {
		
		var vm = this;
		vm.feeds = [];
		vm.currentFeed = {};
		vm.form = {
			url: ""
		};
		
		loadRemoteData();
		// the above is an async call, at this point vm.feeds.length will still be 0
		
		vm.processForm = processForm;
		vm.removeFeed = removeFeed;
		vm.showFeed = showFeed;
		
		function processForm() {
			if (!vm.form.url) {
				return;
			}
			feedService.addFeed(vm.form.url).then(loadRemoteData);
			vm.form.url = "";
		}
		
		function showFeed(feed) {
			vm.currentFeed = feed;
		}
		
		function removeFeed(feed) {
			feedService.deleteFeed(feed.url).then(loadRemoteData);
		}

		function loadRemoteData() {
			feedService.getFeeds().then(
				function(feeds) { 
					vm.feeds = feeds; 
					console.log('loadRemoteData got '+feeds.length + ' feeds');
					console.log('vm.feeds has '+vm.feeds.length);
				}
			);
		}
	}
);

angular.module("FeedStore").factory(
	"feedService",
	function provideFeedService($q) {
		var feeds = [];
		restoreData();
		console.log('feedService ctor '+feeds.length);
		
		return({
			addFeed: addFeed,
			deleteFeed: deleteFeed,
			getFeeds: getFeeds,
		});

		function addFeed(url) {
			console.log('addFeed '+url);
			downloadFile(url).then(createFeed).then(persistData);
			return($q.when());
		}

		function downloadFile(url) {
			console.log('downloadFile '+url);
			var deferred = $q.defer();
			var xhr = new XMLHttpRequest(); 
			xhr.open('GET', 'http://cletus.mooo.com/feedstore/getfeed.php?feed='+url, true); 
			//xhr.open('GET', 'dummy.txt', true); 
			xhr.onreadystatechange = function () { 
			
				if (xhr.readyState == 4) {
					if (xhr.response.length === 0) {
						deferred.reject();
					} else {
						deferred.resolve(JSON.parse(xhr.response));
					}
				}
			};
			xhr.send(null);
			return deferred.promise;
		}
		
		function createFeed(response){

			if (response.responseStatus == 200) {

				var feed = {
					url : response.responseData.feed.feedUrl,
					title : response.responseData.feed.title,
					entries : response.responseData.feed.entries
				};
				
				console.log('createFeed '+feed.title+' has '+feed.entries.length + ' entries');
				
				feeds.push(feed);
				console.log('createFeed feeds = '+feeds.length);	
				
			}

			return($q.when());
		}
		
		function deleteFeed(url) {
			for (var i = 0, length = feeds.length ; i < length ; i++) {
				if (feeds[i].url === url) {
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
			console.log('persistData');
			localStorage.setItem('feeds', JSON.stringify(feeds));
			return($q.when());
		}
		
		function restoreData() {
			console.log('restoreData '+JSON.stringify(feeds));
			var data = localStorage.getItem('feeds');

			if (data === null) {
				console.log('nothing in localstorage');
				setDefault();
				data = localStorage.getItem('feeds');
			} else {
				feeds = JSON.parse(data);  
			}
		}
		
		function setDefault() {
			console.log('setDefault');
			var defaults = [
				"http://feeds.feedburner.com/codinghorror/",
				"http://xkcd.com/rss.xml",
				"http://scarfolk.blogspot.com/feeds/posts/default",
				"https://news.ycombinator.com/rss",
				"http://www.pirateparty.org.uk/feeds/latest/rss.xml" ,
				"http://syndication.thedailywtf.com/TheDailyWtf" ,
				"http://www.guardian.co.uk/science/series/science/rss" ,
				"http://feeds.feedburner.com/SamHarris" ,
				"http://feeds.guardian.co.uk/theguardian/commentisfree/uk-edition/rss" ,
				"https://www.schneier.com/blog/atom.xml" ,
				"http://robinince.wordpress.com/feed/" ,
				"http://feeds.feedburner.com/dancarlin/history?format=xml" ,
				"http://feeds.feedburner.com/dancarlin/commonsense?format=xml" ,
				"https://soylentnews.org/index.rss" ,
				"http://www.jesusandmo.net/feed/",
				"http://www.smbc-comics.com/rss.php" ,
				"http://www.thedailymash.co.uk/rss.xml" ,
				"http://downloads.bbc.co.uk/podcasts/radio4/timc/rss.xml" ,
				"http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml" ,
				"http://newsthump.com/feed/",
				"http://feeds.feedburner.com/RichardHerringLSTPodcast" ,
				"http://pbfcomics.com/feed/feed.xml",
				"http://wtfevolution.tumblr.com/rss" 
				]; 
				
			defaults.forEach(function(url) {
				addFeed(url);
			});
		}
	}
);

