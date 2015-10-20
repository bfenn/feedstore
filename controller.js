angular.module('app', [])
   .controller('controller', function($timeout, $scope, service) {

        // page load
        $scope.init = function() {
            $scope.updateFeeds();    
            readPosts = service.loadReadPosts();
        }
        
        $timeout($scope.init);

        $scope.addFeed = function() {
            console.log('addFeed', $scope.formurl);
            if ($scope.formurl) {
                service.getFeed($scope.formurl).then(function(data) {
                    $scope.feeds.push(data);
                    $scope.formurl = "";
                    service.saveFeeds($scope.feeds);
                });    
            }
        };

        $scope.updateFeeds = function() {
            
            service.loadFeeds().then(function(data){
                console.log('updateFeeds finished ', data);
                $scope.feeds = data; 
                service.saveFeeds($scope.feeds);
                readPosts = service.loadReadPosts();
                console.log('read posts: ', readPosts);
            });
        } 

        $scope.readFeed = function(feed) {
            console.log('readFeed', feed.title);
            $scope.currentFeed = feed;
            $scope.currentPost = null;
        }
        
        $scope.readPost = function(feed, post) {
            $scope.currentFeed = feed;
            $scope.currentPost = post;
            readPosts[post.link] = true;
            service.saveReadPosts(readPosts);
            //console.log('readPost ', readPosts);
        }
        
        $scope.formatDate = function(date) {
            return new Date(date);
        }
        
        $scope.unreadPostsInFeed = function(feed) {
            var unread = 0;
            angular.forEach(feed.entries, function(entry) {   
                if (!postHasBeenRead(entry)) {
                    unread++;
                }
            });
            return unread;
        }
    
        
        $scope.markAllAsRead = function() {
            
            angular.forEach($scope.feeds, function(feed) {   
                angular.forEach(feed.entries, function(post) {   
                    readPosts[post.link] = true;
                });
            });
            service.saveReadPosts(readPosts);
                                
        }
        $scope.postHasBeenRead = postHasBeenRead;
        
        function postHasBeenRead(post) {
            return readPosts[post.link] === true;
        }
    }
);

angular.module('app')
    .service('service', ['$q', '$http', function($q, $http) {
        
        var defaultFeeds = [
            'http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml', 
            'http://www.jesusandmo.net/feed/', 
            'http://wtfevolution.tumblr.com/rss', 
            'http://www.thedailymash.co.uk/rss.xml'
        ];
        
        // return saved data in localStorage, or a default set if not there
        //
        this.loadFeeds = function() {
         
            var promises = [];
            var feeds = defaultFeeds;
            var blob = localStorage.getItem('feeds');
            if (blob != null) {
                feeds = JSON.parse(blob);
            }
            console.log('feeds', feeds);
            
            angular.forEach(feeds, function(url) {
                console.log(url);
                var promise = getFeed(url);
                promises.push(promise);
            });

            return $q.all(promises)
        }
        
        this.getFeed = getFeed;
        
        // Use ajax.googleapis.com for rss2json, return response
        // for example - https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q=http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml
        //
        function getFeed(url) {
            var deferred = $q.defer();
            $http({method: 'GET', url: 'getfeed.php?feed='+url})
                .success(function(data) {
                    try {    
                        if (data.responseStatus == 200) {
                            
                            deferred.resolve(data.responseData.feed);
                        } else {
                            deferred.reject(data);
                        }
                    } catch (err) {
                        console.log('got error ', err);
                        deferred.reject(err);
                    }

                }).error(function(data, status) {
                    console.log('got failure ', data, status);
                    deferred.reject(status);
                });
            
            return deferred.promise;
        }
        
        this.saveReadPosts = function(readPosts) {
            saveState('readPosts', readPosts);
        }
        
        this.loadReadPosts = function() {
            var blob = localStorage.getItem('readPosts') || '{}';
            return JSON.parse(blob);
        }
        
        this.saveFeeds = function(feeds) {
            data = [];
            angular.forEach(feeds, function(feed){
                data.push(feed.feedUrl);
            });
            
            saveState('feeds', data);
        }
        
        saveState = function(key, data) {
            console.log('saveState', key, data);
            localStorage.setItem(key, JSON.stringify(data));
        }
    }
]);

angular.module('app')
    .filter('to_trusted', ['$sce', function($sce) {
		return function(test) {
			return $sce.trustAsHtml(test);
		};
    }
]);

/*

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
"http://wtfevolution.tumblr.com/rss",
"http://feeds.feedburner.com/stuartgoldsmith"
*/