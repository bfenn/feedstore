// this is handy - http://jsonviewer.stack.hu/
// https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q=http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml
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
		vm.readPost = readPost;
        vm.updateFeed = updateFeed;
        
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
		
        function readPost(postUrl) {
            console.log('controller.readPost('+postUrl+')');
            feedService.readPost(vm.currentFeed.url, postUrl).then(loadRemoteData);
        }
        
        function updateFeed(feed) {
            feedService.updateFeed(feed.url).then(loadRemoteData);
        }
        
		function removeFeed(feed) {
			feedService.deleteFeed(feed.url).then(loadRemoteData);
		}

		function loadRemoteData() {
			feedService.getFeeds().then(
				function(feeds) { vm.feeds = feeds; }
			);
		}
	}
);

angular.module("FeedStore").factory(
	"feedService",
	function provideFeedService($q) {
		var feeds = [];
		restoreData().then(function(){
			console.log('feedService ctor '+feeds.length);
		});
		
		return({
			addFeed: addFeed,
            updateFeed: updateFeed,
			deleteFeed: deleteFeed,
			getFeeds: getFeeds,
            readPost: readPost
		});

        function readPost(feedUrl, postUrl) {
            console.log('feedService.readPost('+feedUrl+', '+postUrl+')');
            var i = findFeed(feedUrl);
            if (i > -1) {
                for (var j = 0; j < feeds[i].entries.length; j++) {
                    if (feeds[i].entries[j].link === postUrl && feeds[i].entries[j].unread) {
                        feeds[i].entries[j].unread = false;
                        feeds[i].unreadCount--;
                    }
                }
                persistData();
            }
            return($q.when());
        }
        
		function addFeed(url) {
			console.log('addFeed '+url);
			downloadFile(url).then(createFeed).then(persistData);
			return($q.when());
		}

        function updateFeed(url) {
            console.log('updateFeed '+url);
            downloadFile(url).then(refreshFeed).then(persistData);
            return($q.when());
        }
        
		function downloadFile(url) {
			//console.log('downloadFile '+url);
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
					entries : response.responseData.feed.entries,
                    unreadCount : response.responseData.feed.entries.length
				};
				
                for (var i = 0; i < feed.entries.length; i++) {
                    feed.entries[i].unread = true;
                }
				feeds.push(feed);
				console.log('createFeed ', feeds.length);
			}

			return($q.when());
		}
		
        function refreshFeed(response){
            if (response.responseStatus == 200) {
                var found = findFeed(response.responseData.feed.feedUrl);
                if (found > -1) {
                    var feed = feeds[found];
                    for (var i = 0; i < response.responseData.feed.entries.length; i++)
                    {
                        var found = false;
                        for (var j = 0; j < feed.entries.length; j++) {
                            if (response.responseData.feed.entries[i].link === feed.entries[j].link) {
                                found = true;
                                break;
                            }
                        }
                        
                        if (!found) {
							console.log('refreshFeed found new one');
                            var entry = angular.copy(response.responseData.feed.entries[i]);
                            entry.unread = true;
                            feed.entries.push(entry);
                        }
                    }
                }
			}
            return($q.when());
        }
        
        function findFeed(url) {
            console.log('findFeed '+url);
   			for (var i = 0, length = feeds.length ; i < length ; i++) {
				if (feeds[i].url === url) {
                    console.log('found it at ' + i);
                    return i;
                }
            }
            console.log('could not find feed with url ' + url);
            return -1;
        }
        
		function deleteFeed(url) {
            
            var i = findFeed(url);
            if (i > -1) {
                feeds.splice(i, 1);
                persistData();
            }
			return($q.when());
		}
		
		function getFeeds() {
			return($q.when(angular.copy(feeds)));
		}
		
		function persistData() {
			console.log('persistData ',feeds.length);
			localStorage.setItem('feeds', JSON.stringify(feeds));
			return($q.when());
		}
		
		function restoreData() {
			var data = localStorage.getItem('feeds');

			if (data === null) {
				console.log('restoreData - nothing in localstorage');
				setDefault();
				
			} else {
				feeds = JSON.parse(data);  
                console.log('restoreData - ', feeds.length, ' feeds in localstorage');
			}
			return($q.when());
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

			var defer = $q.defer();
			var promises = [];
			
			angular.forEach(defaults, function(url) {
				promises.push(downloadFile(url).then(createFeed));
			});
			
			$q.all(promises).then(persistData).then(defer.resolve());
            return defer;
		}
	}
);

