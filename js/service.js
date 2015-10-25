angular.module('app')
    .service('service', ['$q', '$http', '$timeout', function ($q, $http, $timeout) {
        
        var defaultFeeds = [
            
            'http://www.jesusandmo.net/feed/', 
            'http://wtfevolution.tumblr.com/rss', 
            'http://www.thedailymash.co.uk/rss.xml',
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
            "http://www.smbc-comics.com/rss.php" ,
            "http://downloads.bbc.co.uk/podcasts/radio4/timc/rss.xml" ,
            "http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml" ,
            "http://newsthump.com/feed/",
            "http://feeds.feedburner.com/RichardHerringLSTPodcast" ,
            "http://pbfcomics.com/feed/feed.xml",
            "http://feeds.feedburner.com/stuartgoldsmith"

        ];
        
        // return saved data in localStorage, or a default set if not there
        //
        this.loadFeeds = function () {
            console.log('loadFeeds');
            
            var feeds = defaultFeeds;
            var blob = localStorage.getItem('feeds');
            if (blob !== null) {
                feeds = JSON.parse(blob);
            }
            
            return feeds;
        };
        
        this.getFeed = getFeed;
        
        // Use ajax.googleapis.com for rss2json, return response
        // for example - https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q=http://downloads.bbc.co.uk/podcasts/radio4/fricomedy/rss.xml
        //
        function getFeed(url) {
            console.log('getFeed');
            var deferred = $q.defer();
            $http({method: 'GET', url: 'getfeed.php?feed='+url})
                .success(function (data) {
                    try {    
                        if (data.responseStatus == 200) {
                            $timeout(function(){
                                deferred.resolve(data.responseData.feed);
                            });
                            
                        } else {
                            deferred.reject(data);
                        }
                    } catch (err) {
                        console.log('got error ', err);
                        deferred.reject(err);
                    }

                }).error(function (data, status) {
                    console.log('got failure ', data, status);
                    deferred.reject(status);
                });
            
            return deferred.promise;
        }
        
        this.saveReadPosts = function (readPosts) {
            saveState('readPosts', readPosts);
        };
        
        this.loadReadPosts = function () {
            console.log('loadReadPosts');
            var blob = localStorage.getItem('readPosts') || '{}';
            return JSON.parse(blob);
        };
        
        this.saveFeeds = function (feeds) {
            console.log('saveFeeds');
            data = [];
            angular.forEach(feeds, function (feed){
                data.push(feed.feedUrl);
            });
            
            saveState('feeds', data);
        };
        
        saveState = function (key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        };
    }
]);

angular.module('app')
    .filter('to_trusted', ['$sce', function ($sce) {
		return function (test) {
			return $sce.trustAsHtml(test);
		};
    }
]);
