angular.module('app', ['mc.resizer'])
   .controller('controller', function ($timeout, $scope, $q, service) {

        'use strict';
        var readPosts = {};
    
        $scope.init = function () {
            console.log('init');
            $scope.loading = true;
            $scope.updateFeeds();    
        };
        
        $timeout($scope.init);

        $scope.addFeed = function () {
            if ($scope.formurl) {
                service.getFeed($scope.formurl).then(function (data) {
                    $scope.feeds.push(data);
                    $scope.formurl = "";
                    service.saveFeeds($scope.feeds);
                })//.catch(function (fail) {
                //    $scope.error = 'Failed!';
                //})
                ;    
            }
        };

        $scope.updateFeeds = function () {
            console.log('updateFeeds');
            $scope.feeds = [];
            
            var getAndLoadEachFeed = function(){
                var promises = [];
                angular.forEach(service.loadFeeds(), function(feed){
                    
                    var promise = service.getFeed(feed).then(function(feedData){
                        $scope.feeds.push(feedData);
                    });
                    
                    promises.push(promise);
                });
                return $q.all(promises);
            }
            
            getAndLoadEachFeed().then(function(){
                $scope.feeds.sort(function (a, b) { 
                    if (a.title > b.title) 
                        return 1;

                    if (a.title < b.title) 
                        return -1;

                    return 0;
                });

                service.saveFeeds($scope.feeds);
                readPosts = service.loadReadPosts();    
            });
        }; 

        $scope.readFeed = function (feed) {
            if ($scope.currentFeed === feed)            
                $scope.currentFeed = null;
            else {
                $scope.currentFeed = feed;
                $scope.currentPost = feed.entries[0];
                readPosts[$scope.currentPost.link] = true;
                service.saveReadPosts(readPosts);
            }
        };
    
        $scope.removeFeed = function (feed) {
            var index = $scope.feeds.indexOf(feed);
            $scope.feeds.splice(index, 1);
            service.saveFeeds($scope.feeds);
        };
    
        $scope.readPost = function (feed, post) {
            $scope.currentFeed = feed;
            $scope.currentPost = post;
            readPosts[post.link] = true;
            service.saveReadPosts(readPosts);
        };
        
        $scope.formatDate = function (date) {
            return new Date(date);
        };
        
        $scope.unreadPostsInFeed = function (feed) {
            var unread = 0;
            angular.forEach(feed.entries, function (entry) {   
                if (!postHasBeenRead(entry)) {
                    unread++;
                }
            });
            return unread;
        };
        
        $scope.markAllAsRead = function () {
            angular.forEach($scope.feeds, function (feed) {   
                angular.forEach(feed.entries, function (post) {   
                    readPosts[post.link] = true;
                });
            });
            service.saveReadPosts(readPosts);
        };
        
        $scope.postHasBeenRead = postHasBeenRead;
        
        function postHasBeenRead(post) {
            return readPosts[post.link] === true;
        }
    }
);
