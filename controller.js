angular.module('app', [])
   .controller('controller', function($scope, service) {

        service.loadState().then(function(data){
            console.log('load state finished');
            $scope.feeds = data;    
        }) 
        
        $scope.addFeed = function() {
            console.log('addFeed', $scope.formurl);
            if (!$scope.formurl) {
                return;
            }

            service.getFeed($scope.formurl).then(newFeed);
        };
    
        $scope.readFeed = function(feed) {
            console.log('readFeed', feed);
            $scope.currentFeed = feed;
            $scope.currentPost = null;
        }
        
        $scope.readPost = function(feed, post) {
            console.log('readPost', post);
            $scope.currentFeed = feed;
            $scope.currentPost = post;
            if (!post.read) {
                if (isNaN($scope.currentFeed.unread)) {
                    $scope.currentFeed.unread = $scope.currentFeed.entries.length;
                }
                    
                $scope.currentFeed.unread--;
            }
                
            post.read = true;
            $scope.currentPost = post;
            console.log('currentPost', post);
        }
        
        $scope.formatDate = function(date) {
            return new Date(date);
        }
        
        function newFeed(data) {
            console.log('newFeed', data);
            var newfeed = {
                    url : $scope.formurl,
                    title : data.title,
                    entries : data.entries,
                    unread : data.entries.length
                };
            $scope.feeds.push(newfeed);
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
        this.loadState = function() {
            console.log('loadState');
            var promises = [];

            angular.forEach(defaultFeeds, function(url) {
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
                            console.log('got ', data.responseData.feed);
                            deferred.resolve(data.responseData.feed);
                        } else {
                            console.log('unhappy with ', data);
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