// Generated by CoffeeScript 1.10.0
(function() {
  var DAILYMOTION_API, YOUTUBE_API, app, videoPlayer;

  app = angular.module('socialVideoPlayer', []);

  YOUTUBE_API = 'https://www.youtube.com/iframe_api';

  DAILYMOTION_API = 'https://api.dmcdn.net/all.js';

  videoPlayer = function($document, $window, $timeout, $compile, $q) {
    var createElement, document, isVimeoListener, loadExternalAPI, loadExternalAPIs, player;
    document = $document[0];
    player = {};
    isVimeoListener = false;
    loadExternalAPIs = function() {
      var deferred, promise;
      promise = null;
      if (typeof YT === 'undefined') {
        promise = loadExternalAPI(YOUTUBE_API);
      }
      if (typeof DM === 'undefined') {
        if (!promise) {
          promise = loadExternalAPI(DAILYMOTION_API);
        } else {
          promise = promise.then(function() {
            return loadExternalAPI(DAILYMOTION_API);
          });
        }
      }
      if (!promise) {
        deferred = $q.defer();
        deferred.resolve();
        promise = deferred.promise;
      }
      return promise;
    };
    loadExternalAPI = function(src) {
      var deferred, element;
      deferred = $q.defer();
      element = null;
      element = createElement(src);
      element.onload = element.onreadystatechange = function(e) {
        if (element.readyState && element.readyState !== 'complete' && element.readyState !== 'loaded') {
          return false;
        }
        $timeout(function() {
          deferred.resolve(e);
        });
      };
      element.onerror = function(e) {
        deferred.reject(e);
      };
      return deferred.promise;
    };
    createElement = function(src) {
      var script;
      script = document.createElement('script');
      script.src = src;
      document.body.appendChild(script);
      console.log("script added: ", script);
      return script;
    };
    return {
      restrict: 'AE',
      scope: {
        videoId: '@videoId',
        videoProvider: '@videoProvider',
        autoPlay: '@autoPlay',
        width: '=',
        height: '=',
        pause: '@pause'
      },
      link: function(scope, element) {
        var createDailymotionPlayer, createVimeoPlayer, createYoutubePlayer, onYouTubePlayerAPIReady;
        createDailymotionPlayer = function() {
          var el;
          el = angular.element('<div id="videoPlayer"/>');
          $compile(el)(scope);
          element.children().remove();
          element.append(el);
          delete player.google;
          if (!DM) {
            return console.log('DM playerNotLoaded');
          } else {
            player.dailymotion = DM.player(document.getElementById("videoPlayer"), {
              video: scope.videoId,
              width: scope.width,
              height: scope.height,
              params: {
                autoplay: scope.autoPlay === 'true',
                mute: false,
                api: '1'
              }
            });
            player.dailymotion.addEventListener("ended", function() {
              return scope.$emit('videoFinished');
            });
            player.dailymotion.addEventListener("apiready", function() {
              return console.log("dailymotion player ready for API");
            });
            player.dailymotion.addEventListener("playing", function() {
              return scope.$emit('videoStarted');
            });
            player.dailymotion.addEventListener("pause", function() {
              return scope.$emit('videoPaused');
            });
            if (scope.autoPlay !== 'true') {
              return scope.$emit('videoPaused');
            }
          }
        };
        createYoutubePlayer = function() {
          var el;
          el = angular.element('<div id="videoPlayer"/>');
          $compile(el)(scope);
          element.children().remove();
          element.append(el);
          delete player.dailymotion;
          console.log("YT.loaded? ", YT.loaded);
          if (!YT) {
            console.log('YT playerNotLoaded');
            return $window.onYouTubePlayerAPIReady = onYouTubePlayerAPIReady;
          } else if (YT.loaded) {
            return onYouTubePlayerAPIReady();
          } else {
            return YT.ready(onYouTubePlayerAPIReady);
          }
        };
        onYouTubePlayerAPIReady = function() {
          return player.google = new YT.Player(document.getElementById("videoPlayer"), {
            height: scope.height,
            width: scope.width,
            videoId: scope.videoId,
            events: {
              'onReady': function(event) {
                if (scope.autoPlay === 'true') {
                  event.target.playVideo();
                  return scope.$emit('videoStarted');
                } else {
                  return scope.$emit('videoPaused');
                }
              },
              'onStateChange': function(event) {
                switch (event.data) {
                  case 0:
                    return scope.$emit('videoFinished');
                  case 1:
                    return scope.$emit('videoStarted');
                  case 2:
                    return scope.$emit('videoPaused');
                }
              }
            }
          });
        };
        createVimeoPlayer = function() {
          var el, onMessageReceived, onReady, playerOrigin, post;
          playerOrigin = '*';
          el = angular.element('<iframe id="videoPlayer" src="https://player.vimeo.com/video/' + scope.videoId + '?api=1&player_id=videoPlayer" width="' + scope.width + '" height="' + scope.height + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen/>');
          $compile(el)(scope);
          element.children().remove();
          element.append(el);
          player.vimeo = document.getElementById('videoPlayer');
          onMessageReceived = function(event) {
            var data;
            if (!/^https?:\/\/player.vimeo.com/.test(event.origin)) {
              return false;
            }
            if (playerOrigin === '*') {
              playerOrigin = event.origin;
            }
            data = JSON.parse(event.data);
            switch (data.event) {
              case 'ready':
                return onReady();
              case 'play':
                return scope.$emit('videoStarted');
              case 'pause':
                return scope.$emit('videoPaused');
              case 'finish':
                return scope.$emit('videoFinished');
            }
          };
          if (!isVimeoListener) {
            if (window.addEventListener) {
              window.addEventListener('message', onMessageReceived, false);
              isVimeoListener = true;
            } else {
              window.attachEvent('onmessage', onMessageReceived, false);
            }
          }
          post = function(action, value) {
            var data, message;
            data = {
              method: action
            };
            if (value) {
              data.value = value;
            }
            message = JSON.stringify(data);
            return player.vimeo.contentWindow.postMessage(message, playerOrigin);
          };
          player.vimeo.post = post;
          onReady = function() {
            post('addEventListener', 'pause');
            post('addEventListener', 'finish');
            post('addEventListener', 'play');
            if (scope.autoPlay === 'true') {
              console.log('autoplay is true');
              return post('play');
            } else {
              return scope.$emit('videoPaused');
            }
          };
        };
        loadExternalAPIs().then(function() {
          var el;
          console.log("external script added and loaded");
          el = angular.element('<div id="videoPlayer"/>');
          $compile(el)(scope);
          element.append(el);
          switch (scope.videoProvider) {
            case 'google' || 'youtube':
              return createYoutubePlayer();
            case 'dailymotion':
              return createDailymotionPlayer();
            case 'vimeo':
              return createVimeoPlayer();
          }
        });
        scope.$watch('videoProvider', function(newValue, oldValue) {
          if (newValue === oldValue) {
            return;
          }
          switch (newValue) {
            case 'google':
            case 'youtube':
              return createYoutubePlayer();
            case 'dailymotion':
              return createDailymotionPlayer();
            case 'vimeo':
              return createVimeoPlayer();
          }
        });
        scope.$watch('videoId', function(newValue, oldValue) {
          if (newValue === oldValue) {
            return;
          }
          if (scope.videoProvider === 'google' || scope.videoProvider === 'youtube') {
            if (!player.google || !player.google.loadVideoById) {
              createYoutubePlayer();
            } else {
              if (scope.autoPlay === 'true') {
                console.log("google autoplay TRUE");
                player.google.loadVideoById(scope.videoId);
              } else {
                console.log("google autoplay FALSE");
                player.google.cueVideoById(scope.videoId);
              }
            }
          } else if (scope.videoProvider === 'dailymotion') {
            if (!player.dailymotion) {
              createDailymotionPlayer();
            } else {
              player.dailymotion.load(scope.videoId, {
                autoplay: scope.autoPlay === 'true'
              });
            }
          } else if (scope.videoProvider === 'vimeo') {
            createVimeoPlayer();
          } else {
            console.error(scope.videoProvider + " player not set ");
          }
          if (scope.autoPlay !== 'true') {
            return $timeout(function() {
              return scope.$emit('videoPaused');
            });
          }
        });
        scope.$watch('pause', function(newValue, oldValue) {
          if (newValue === oldValue) {
            return;
          }
          switch (scope.videoProvider) {
            case 'google':
            case 'youtube':
              if (newValue === 'true') {
                return player.google.pauseVideo();
              } else {
                return player.google.playVideo();
              }
              break;
            case 'dailymotion':
              if (newValue === 'true') {
                return player.dailymotion.pause();
              } else {
                return player.dailymotion.play();
              }
              break;
            case 'vimeo':
              if (newValue === 'true') {
                return player.vimeo.post('pause');
              } else {
                return player.vimeo.post('play');
              }
          }
        });
        scope.$on('$destroy', function() {
          return player = {};
        });
      }
    };
  };

  app.directive('svPlayer', ['$document', '$window', '$timeout', '$compile', '$q', videoPlayer]);

}).call(this);

//# sourceMappingURL=player.js.map
