angular.module('app', [])
   .controller('controller', function ($timeout, $scope, service) {

        'use strict';
    
        var readPosts = {};
    
        // page load
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
                });    
            }
        };

        $scope.updateFeeds = function () {
            console.log('updateFeeds');
            service.loadFeeds().then(function (data){
                data.sort(function (a, b) { 
                    if (a.title > b.title) 
                        return 1;
                    
                    if (a.title < b.title) 
                        return -1;
                    
                    return 0;
                });
                
                $scope.feeds = data; 
                service.saveFeeds($scope.feeds);
                readPosts = service.loadReadPosts();
                $scope.loading = false;
            });
        }; 

        $scope.readFeed = function (feed) {
            if ($scope.currentFeed === feed)            
                $scope.currentFeed = null;
            else {
                $scope.currentFeed = feed;
                $scope.currentPost = feed.entries[0];
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
