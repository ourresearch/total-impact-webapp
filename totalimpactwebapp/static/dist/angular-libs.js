/*
 * Angular Embed.ly library
 * Version 1.0
 * Author:  Sarah Green
 *          Lithium Technologies
 */
var UTILS = {

  /*
   * UTILS.urlRe
   * Regular expression for identifying URLs
   */
  urlRe: /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,

  /*
   * UTILS.isInt()
   * Check if parameter is an integer
   */
  isInt: function(n) {
    return (typeof n === 'number' && isFinite(n) && n % 1 === 0);
  },

  /*
   * UTILS.none()
   * Check if an object is null or undefined
   */
  none: function(obj) {
    return obj === null || obj === undefined;
  },

  /*
   * UTILS.zip()
   * Reference: http://stackoverflow.com/questions/4856717/
   *            http://es5.github.com/#x15.4.4.19
   * Javascript equivalent of Python's zip function
   * Must ensure that map function is defined
   */
  zip: function(arrays) {
    if (!Array.prototype.map) {
      Array.prototype.map = function (callback, thisArg) {
        var T, A, k;
        for (var i in this) {
          if (this[i] === null || this[i] === undefined) {
            throw new TypeError(' this is null or not defined');
          }
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        if (thisArg) {
          T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
          var kValue, mappedValue;
          if (k in O) {
            var Pk = k.toString();
            kValue = O[Pk];
            mappedValue = callback.call(T, kValue, k, O);
            /* In browsers that support Object.defineProperty, use the following:
             * Object.defineProperty( A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });
             * For best browser support, use the following: */
            A[Pk] = mappedValue;
          }
          k++;
        }
        return A;
      };
    }
    return arrays[0].map(function(_,i) {
      return arrays.map(function(array) {
        return array[i];
      });
    });
  },

  /*
   * UTILS.listify()
   * Make an object into a list
   */
  listify: function(obj) {
    if(UTILS.none(obj)) {
      return [];
    } else if (!angular.isArray(obj)) {
      return [obj];
    }
    return obj;
  },

  /*
   * UTILS.objectToQueryString() and UTILS.buildParams()
   * Reference: https://gist.github.com/dgs700/4677933
   * Author: David Shapiro
   * Convert Javascript object to URL encoded query string
   */
  objectToQueryString: function (a) {
    var prefix, s, add, name, r20, output;
    s = [];
    r20 = /%20/g;
    add = function (key, value) {
      // If value is a function, invoke it and return its value
      value = (typeof value == 'function') ? value() : (value === null ? '' : value);
      s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
    };
    if (a instanceof Array) {
      for (name in a) {
        add(name, a[name]);
      }
    } else {
      for (prefix in a) {
        this.buildParams(prefix, a[ prefix ], add);
      }
    }
    output = s.join('&').replace(r20, '+');
    return output;
  },

  buildParams: function(prefix, obj, add) {
    var name, i, l, rbracket;
    rbracket = /\[\]$/;
    if (obj instanceof Array) {
      for (i = 0, l = obj.length; i < l; i++) {
        if (rbracket.test(prefix)) {
          add(prefix, obj[i]);
        } else {
          this.buildParams(prefix + '[' + (typeof obj[i] === 'object' ? i : '') + ']', obj[i], add);
        }
      }
    } else if (typeof obj == 'object') {
      // Serialize object item
      for (name in obj) {
        this.buildParams(prefix + '[' + name + ']', obj[name], add);
      }
    } else {
      // Serialize scalar item
      add(prefix, obj);
    }
  }
};

angular.module('ngEmbedApp', [])

// Factory for API
.factory('API', function ($http, $q, $timeout) {

  // Cache API responses, so that Embed.ly requests are not duplicated for the same URLs
  var responseCache = {};

  return {

    log: function(level, message) {
      if (!UTILS.none(window.console) && !UTILS.none(window.console[level])) {
        window.console[level].apply(window.console, [message]);
      }
    },

    // Build URL based on method and options
    build: function(method, urls, options) {

      options = UTILS.none(options) ? {} : options;

      var secure = options.secure;

      if (UTILS.none(secure)) {
        secure = window.location.protocol === 'https:' ? true : false;
      }

      var base = (secure ? 'https' : 'http') + '://' + 'api.embed.ly' + '/' + (method === 'objectify' ? '2/' : '1/') + method;
      var query = UTILS.none(options.query) ? {} : options.query;
      query.key = options.key;
      base += '?' + UTILS.objectToQueryString(query);
      base += '&urls=' + urls.map(encodeURIComponent).join(',');
      return base;
    },

    // Split a list into batches
    batch: function(list, split) {
      var batches = [], current = [];
      angular.forEach(list, function(obj, i) {
        current.push(obj);
        if (current.length === split) {
          batches.push(current);
          current = [];
        }
      });
      if (current.length !== 0) {
        batches.push(current);
      }
      return batches;
    },

    // Batch URLs for processing
    request: function (method, urls, options) {

      options = angular.extend({}, typeof options === 'object' && options);

      if (UTILS.none(options.key)) {
        this.log('error', 'Embedly Angular requires an API Key. Please sign up for one at http://embed.ly');
        return null;
      }

      urls = UTILS.listify(urls);

      var deferred = $q.defer();

      var valid_urls = [], rejects = [], valid;

      // Iterate over url list to identify which urls to send to Embed.ly
      angular.forEach(urls, function(url, i) {
        valid = false;
        // Check against default regular expression for urls
        if (UTILS.urlRe.test(url)) {
          valid = true;
          // Check against custom regular expression, if specified
          if (!UTILS.none(options.urlRegExp) && options.urlRegExp.test && !options.urlRegExp.test(url)) {
            valid = false;
          }
        }
        // Check if valid url is already in response cache; if not, add to valid_urls
        if (valid === true) {
          if (responseCache[url]) {
            $timeout(function () {
              deferred.notify(responseCache[url]);
            });
          } else {
            valid_urls.push(url);
          }
        } else {
          rejects.push({
            url: url,
            original_url: url,
            error: true,
            invalid: true,
            type: 'error',
            error_message: 'Invalid URL "' + url + '"'
          });
        }
      });

      // Split valid_urls into batches of appropriate size (default or specified)
      var batches = this.batch(valid_urls, options.batch), self = this;

      // Make calls to Embed.ly for each batch
      angular.forEach(batches, function(batch, i) {
        // The HTTP call
        $http({
          method: 'GET',
          url: self.build(method, batch, options)
        }).
        // Successful response from Embed.ly
        success(function(data, status, headers, config) {
          var zipped = UTILS.zip([batch, data]);
          angular.forEach(zipped, function(obj, i) {
            var result = obj[1];
            result.original_url = obj[0];
            result.invalid = false;
            // Add successful result to response cache
            responseCache[result.original_url] = result;
            deferred.notify(result);
          });
        }).
        // Error occurred in Embed.ly call
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
      });

      // Notify of any rejected URLs
      if (rejects.length) {
        angular.forEach(rejects, function(reject, i) {
          deferred.notify(reject);
        });
      }

      return deferred;
    },

  };
})

// Factory for Embedly object
.factory('Embedly', function($q) {

  var Embedly = function(element, url, options) {
    this.init(element, url, options);
  };

  Embedly.prototype = {
    init: function(elem, original_url, options) {
      this.elem = elem;
      this.$elem = angular.element(elem);
      this.original_url = original_url;
      this.options = options;
      this.loaded = $q.defer();

      // Set up triggers, to listen when tag has been initialized
      var self = this;

      this.loaded.promise.then(function() {
        self.$elem.triggerHandler('loaded', [self]);
      });

      this.$elem.triggerHandler('initialized', [this]);
    },

    progress: function(obj) {

      angular.extend(this, obj);

      // Use a custom display method if provided
      if (this.options.display) {
        this.options.display.apply(this, [this, this.elem]);
      }

      else if (this.options.endpoint === 'oembed') {
        this.display();
      }

      this.loaded.resolve(this);
    },

    // If image styles are allowed, apply specified dimension styles
    imageStyle: function() {
      var style = [], units;

      if (this.options.addImageStyles) {

        if (this.options.query.maxwidth) {
          style.push('max-width: ' + (this.options.query.maxwidth) + 'px');
        }

        if (this.options.query.maxheight) {
          style.push('max-height: ' + (this.options.query.maxheight) + 'px');
        }

      }

      return style.join(';');
    },

    display: function() {

      // If response type is error return false to exit function
      if (this.type === 'error') {
        return false;
      }

      this.title = this.title || this.url;

      this.style = this.imageStyle();

      var html;

      if (UTILS.none(this.url) && !UTILS.none(this.thumbnail_url)) {
        this.url = this.thumbnail_url;
      }

      // HTML embed code for photos
      if (this.type === 'photo') {
        html = '<a href="' + this.original_url + '" target="_blank">';
        html += '<img style="' + this.style + '" src="' + this.url + '" alt="' + this.title + '" /></a>';
      }

      // HTML embed code for videos and rich media (included in Embedly API response)
      else if (this.type === 'video' || this.type === 'rich') {
        html = this.html;
      }

      // HTML embed code for thumbnail preview if response type is not a photo/video/rich media/error
      else {
        html += (!UTILS.none(this.thumbnail_url)) ? '<img src="' + this.thumbnail_url + '" class="thumb" style="' + this.style + '"/>' : '';
        html += (!UTILS.none(this.original_url)) ? '<a href="' + this.original_url + '">' + this.title + '</a>' : '';
        html += (!UTILS.none(this.provider_name)) ? '<a href="' + this.provider_url + '" class="provider">' + this.provider_name + '</a>' : '';
        html += (!UTILS.none(this.description)) ? '<div class="description">' + this.description + '</div>' : '';
      }

      // Wrap HTML embed code in div with class name (custom class name if specified)
      html = '<' + this.options.wrapElement+ ' class="' + this.options.className + '">' + html + '</' + this.options.wrapElement + '>';

      this.code = html;

      // Insert HTML embed code in the DOM as specified by method type (use replace method by default)
      if (this.options.method === 'after') {
        this.$elem.after(this.code);
      } else if (this.options.method === 'afterParent') {
        this.$elem.parent().after(this.code);
      } else if (this.options.method === 'replaceParent') {
        this.$elem.parent().replaceWith(this.code);
      }
      else {
        this.$elem.replaceWith(this.code);
      }

      this.$elem.triggerHandler('displayed', [this]);
    }

  };

  return {
    get: function (element, url, options) {
      return new Embedly(element, url, options);
    }
  };
})

// Controller to set options: either specified on scope, or else defaults
.controller('ngEmbedlyController', function ($scope) {

  // If no custom options are specified
  var defaults = {
    key:              null,
    endpoint:         'oembed',         // Default endpoint (preview and objectify available too)
    secure:           null,             // Use https endpoint vs http
    query:            {},
    method:           'replace',        // Embed handling option for standard callback
    addImageStyles:   true,             // Add style="" attribute to images for query.maxwidth and query.maxheight
    wrapElement:      'div',            // Standard wrapper around all returned embeds
    className:        'embed',          // Class on the wrapper element
    batch:            20,               // Default batch Size
    urlRegExp:        null,
    display:          null,
  };

  var options = {};

  if (!UTILS.none($scope.key)) {
    options.key = $scope.key;
  }
  if (!UTILS.none($scope.endpoint)) {
    options.endpoint = $scope.endpoint;
  }
  if (!UTILS.none($scope.secure)) {
    if (typeof $scope.secure === 'boolean') {
      options.secure = $scope.secure;
    }
  }
  if (!UTILS.none($scope.query)) {
    if ($scope.query.maxwidth && !UTILS.isInt($scope.query.maxwidth)) {
      delete $scope.query.maxwidth;
    }
    if ($scope.query.maxheight && !UTILS.isInt($scope.query.maxheight)) {
      delete $scope.query.maxheight;
    }
    if ($scope.query.width && !UTILS.isInt($scope.query.width)) {
      delete $scope.query.width;
    }
    if ($scope.query.autoplay && typeof $scope.query.autoplay !== 'boolean') {
      delete $scope.query.autoplay;
    }
    options.query = $scope.query;
  }
  if (!UTILS.none($scope.method)) {
    options.method = $scope.method;
  }
  if (!UTILS.none($scope.addImageStyles)) {
    options.addImageStyles = $scope.addImageStyles;
  }
  if (!UTILS.none($scope.wrapElement)) {
    options.wrapElement = $scope.wrapElement;
  }
  if (!UTILS.none($scope.className)) {
    options.className = $scope.className;
  }
  if (!UTILS.none($scope.batch)) {
    if (UTILS.isInt($scope.batch)) {
      options.batch = $scope.batch;
    }
  }
  if (!UTILS.none($scope.urlRegExp)) {
    options.urlRegExp = $scope.urlRegExp;
  }
  if (!UTILS.none($scope.display)) {
    if (typeof $scope.display === 'function') {
      options.display = $scope.display;
    }
  }

  // Set scope options with defaults, where no customizations are specified
  $scope.options = angular.extend({}, defaults, typeof options === 'object' && options);

})

/*
 * ngEmbedly directive
 * Parses DOM searching for 'a' tags, making calls to Embed.ly for each valid
 * link and displaying photo/video/rich media responses as embeds on the DOM
 */
.directive('ngEmbedly', function($timeout, API, Embedly) {

  return {

    scope: {
      key: '=',
      endpoint: '=',
      secure: '=',
      query: '=',
      method: '=',
      addImageStyles: '=',
      wrapElement: '=',
      className: '=',
      batch: '=',
      urlRegExp: '=',
      display: '=',
    },

    controller: 'ngEmbedlyController',

    link: function ($scope, $element) {
      var options = $scope.options;

      $timeout(function () {
        var nodes = {};

        var create = function (elem) {
          if (!angular.element(elem).data('embedly')) {
            var url = angular.element(elem).attr('href');
            var node = Embedly.get(elem, url, options);
            angular.element(elem).data('embedly', node);
            if (nodes.hasOwnProperty(url)) {
              nodes[url].push(node);
            } else {
              nodes[url] = [node];
            }
          }
        };

        var elems = angular.forEach($element, function() {
          if(!UTILS.none(angular.element($element).attr('href'))) {
            create($element);
          } else {
            angular.forEach( ($element.find('a')), function(elm) {
              if (!UTILS.none(angular.element(elm).attr('href'))) {
                create(elm);
              }
            });
          }
        });

        var nodeUrls = [];
        for (var key in nodes) {
          nodeUrls.push(key);
        }

        var deferred = API.request(
          options.endpoint,
          nodeUrls,
          options);

        if (deferred) {
          deferred.promise.then (null, null, function(obj) {
            angular.forEach(nodes[obj.original_url], function(node, i) {
              node.progress(obj);
            });
          });
        }
      });
    }
  };
})

/*
 * ngEmbedUrls directive
 * Watches for a change in $scope.urls, making calls and appending embeds
 * on the DOM when new urls are added (see demo/post_demo.html for an example
 * implementation)
 */
.directive('ngEmbedUrls', function($compile, $timeout, API, Embedly) {

  return {

    scope: {
      key: '=',
      endpoint: '=',
      secure: '=',
      query: '=',
      method: '=',
      addImageStyles: '=',
      wrapElement: '=',
      className: '=',
      batch: '=',
      urlRegExp: '=',
      display: '=',
      urls: '='
    },

    controller: 'ngEmbedlyController',

    link: function ($scope, $element) {

      var options = $scope.options;

      var nodes = {};
      var response = {};

      // Watch for a change in urls on scope
      $scope.$watch('urls', function () {
        $element.children().remove();

        var nodeUrls = [];

        // For each url, if not already in nodeUrls, create+append new node and add to nodeUrls
        for (var i in $scope.urls) {
          var url = $scope.urls[i];
          if (nodeUrls.indexOf(url) === -1) {
            var wrapper = angular.element('<div></div>');
            var elem = angular.element('<div></div>');
            var node = Embedly.get(elem, url, options);
            nodes[url] = node;
            nodeUrls.push(url);
            angular.element(elem).data('embedly', node);
            wrapper.append(elem);
            $element.append(wrapper);
          }
        }

        // Make API requests for urls in nodeUrls
        var deferred = API.request(
          options.endpoint,
          nodeUrls,
          options);

        if (deferred) {
          deferred.promise.then (null, null, function(obj) {
            response[obj.original_url] = obj;
            nodes[obj.original_url].progress(obj);
          });
        }
      });
    }
  };
});

/**
 * Created by jay on 8/16/14.
 */
/**!
 * AngularJS file upload/drop directive with http post and progress
 * @author  Danial  <danial.farid@gmail.com>
 * @version 1.6.5
 */
(function() {

var angularFileUpload = angular.module('angularFileUpload', []);

angularFileUpload.service('$upload', ['$http', '$q', '$timeout', function($http, $q, $timeout) {
	function sendHttp(config) {
		config.method = config.method || 'POST';
		config.headers = config.headers || {};
		config.transformRequest = config.transformRequest || function(data, headersGetter) {
			if (window.ArrayBuffer && data instanceof window.ArrayBuffer) {
				return data;
			}
			return $http.defaults.transformRequest[0](data, headersGetter);
		};
		var deferred = $q.defer();

		if (window.XMLHttpRequest.__isShim) {
			config.headers['__setXHR_'] = function() {
				return function(xhr) {
					if (!xhr) return;
					config.__XHR = xhr;
					config.xhrFn && config.xhrFn(xhr);
					xhr.upload.addEventListener('progress', function(e) {
						deferred.notify(e);
					}, false);
					//fix for firefox not firing upload progress end, also IE8-9
					xhr.upload.addEventListener('load', function(e) {
						if (e.lengthComputable) {
							deferred.notify(e);
						}
					}, false);
				};
			};
		}

		$http(config).then(function(r){deferred.resolve(r)}, function(e){deferred.reject(e)}, function(n){deferred.notify(n)});

		var promise = deferred.promise;
		promise.success = function(fn) {
			promise.then(function(response) {
				fn(response.data, response.status, response.headers, config);
			});
			return promise;
		};

		promise.error = function(fn) {
			promise.then(null, function(response) {
				fn(response.data, response.status, response.headers, config);
			});
			return promise;
		};

		promise.progress = function(fn) {
			promise.then(null, null, function(update) {
				fn(update);
			});
			return promise;
		};
		promise.abort = function() {
			if (config.__XHR) {
				$timeout(function() {
					config.__XHR.abort();
				});
			}
			return promise;
		};
		promise.xhr = function(fn) {
			config.xhrFn = (function(origXhrFn) {
				return function() {
					origXhrFn && origXhrFn.apply(promise, arguments);
					fn.apply(promise, arguments);
				}
			})(config.xhrFn);
			return promise;
		};

		return promise;
	}

	this.upload = function(config) {
		config.headers = config.headers || {};
		config.headers['Content-Type'] = undefined;
		config.transformRequest = config.transformRequest || $http.defaults.transformRequest;
		var formData = new FormData();
		var origTransformRequest = config.transformRequest;
		var origData = config.data;
		config.transformRequest = function(formData, headerGetter) {
			if (origData) {
				if (config.formDataAppender) {
					for (var key in origData) {
						var val = origData[key];
						config.formDataAppender(formData, key, val);
					}
				} else {
					for (var key in origData) {
						var val = origData[key];
						if (typeof origTransformRequest == 'function') {
							val = origTransformRequest(val, headerGetter);
						} else {
							for (var i = 0; i < origTransformRequest.length; i++) {
								var transformFn = origTransformRequest[i];
								if (typeof transformFn == 'function') {
									val = transformFn(val, headerGetter);
								}
							}
						}
						formData.append(key, val);
					}
				}
			}

			if (config.file != null) {
				var fileFormName = config.fileFormDataName || 'file';

				if (Object.prototype.toString.call(config.file) === '[object Array]') {
					var isFileFormNameString = Object.prototype.toString.call(fileFormName) === '[object String]';
					for (var i = 0; i < config.file.length; i++) {
						formData.append(isFileFormNameString ? fileFormName : fileFormName[i], config.file[i],
								(config.fileName && config.fileName[i]) || config.file[i].name);
					}
				} else {
					formData.append(fileFormName, config.file, config.fileName || config.file.name);
				}
			}
			return formData;
		};

		config.data = formData;

		return sendHttp(config);
	};

	this.http = function(config) {
		return sendHttp(config);
	}
}]);

angularFileUpload.directive('ngFileSelect', [ '$parse', '$timeout', function($parse, $timeout) {
	return function(scope, elem, attr) {
		var fn = $parse(attr['ngFileSelect']);
		if (elem[0].tagName.toLowerCase() !== 'input' || (elem.attr('type') && elem.attr('type').toLowerCase()) !== 'file') {
			var fileElem = angular.element('<input type="file">')
			for (var i = 0; i < elem[0].attributes.length; i++) {
				fileElem.attr(elem[0].attributes[i].name, elem[0].attributes[i].value);
			}
			if (elem.attr("data-multiple")) fileElem.attr("multiple", "true");
			fileElem.css("top", 0).css("bottom", 0).css("left", 0).css("right", 0).css("width", "100%").
					css("opacity", 0).css("position", "absolute").css('filter', 'alpha(opacity=0)');
			elem.append(fileElem);
			if (elem.css("position") === '' || elem.css("position") === 'static') {
				elem.css("position", "relative");
			}
			elem = fileElem;
		}
		elem.bind('change', function(evt) {
			var files = [], fileList, i;
			fileList = evt.__files_ || evt.target.files;
			if (fileList != null) {
				for (i = 0; i < fileList.length; i++) {
					files.push(fileList.item(i));
				}
			}
			$timeout(function() {
				fn(scope, {
					$files : files,
					$event : evt
				});
			});
		});
		// removed this since it was confusing if the user click on browse and then cancel #181
//		elem.bind('click', function(){
//			this.value = null;
//		});

		// removed because of #253 bug
		// touch screens
//		if (('ontouchstart' in window) ||
//				(navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
//			elem.bind('touchend', function(e) {
//				e.preventDefault();
//				e.target.click();
//			});
//		}
	};
} ]);

angularFileUpload.directive('ngFileDropAvailable', [ '$parse', '$timeout', function($parse, $timeout) {
	return function(scope, elem, attr) {
		if ('draggable' in document.createElement('span')) {
			var fn = $parse(attr['ngFileDropAvailable']);
			$timeout(function() {
				fn(scope);
			});
		}
	};
} ]);

angularFileUpload.directive('ngFileDrop', [ '$parse', '$timeout', '$location', function($parse, $timeout, $location) {
	return function(scope, elem, attr) {
		if ('draggable' in document.createElement('span')) {
			var leaveTimeout = null;
			elem[0].addEventListener("dragover", function(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				$timeout.cancel(leaveTimeout);
				if (!elem[0].__drag_over_class_) {
					if (attr['ngFileDragOverClass'].search(/\) *$/) > -1) {
						dragOverClassFn = $parse(attr['ngFileDragOverClass']);
						var dragOverClass = dragOverClassFn(scope, {
							$event : evt
						});
						elem[0].__drag_over_class_ = dragOverClass;
					} else {
						elem[0].__drag_over_class_ = attr['ngFileDragOverClass'] || "dragover";
					}
				}
				elem.addClass(elem[0].__drag_over_class_);
			}, false);
			elem[0].addEventListener("dragenter", function(evt) {
				evt.stopPropagation();
				evt.preventDefault();
			}, false);
			elem[0].addEventListener("dragleave", function(evt) {
				leaveTimeout = $timeout(function() {
					elem.removeClass(elem[0].__drag_over_class_);
					elem[0].__drag_over_class_ = null;
				}, attr['ngFileDragOverDelay'] || 1);
			}, false);
			var fn = $parse(attr['ngFileDrop']);
			elem[0].addEventListener("drop", function(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				elem.removeClass(elem[0].__drag_over_class_);
				elem[0].__drag_over_class_ = null;
				extractFiles(evt, function(files) {
					fn(scope, {
						$files : files,
						$event : evt
					});
				});
			}, false);

			function isASCII(str) {
				return /^[\000-\177]*$/.test(str);
			}

			function extractFiles(evt, callback) {
				var files = [], items = evt.dataTransfer.items;
				if (items && items.length > 0 && items[0].webkitGetAsEntry && $location.protocol() != 'file') {
					for (var i = 0; i < items.length; i++) {
						var entry = items[i].webkitGetAsEntry();
						if (entry != null) {
							//fix for chrome bug https://code.google.com/p/chromium/issues/detail?id=149735
							if (isASCII(entry.name)) {
								traverseFileTree(files, entry);
							} else if (!items[i].webkitGetAsEntry().isDirectory) {
								files.push(items[i].getAsFile());
							}
						}
					}
				} else {
					var fileList = evt.dataTransfer.files;
					if (fileList != null) {
						for (var i = 0; i < fileList.length; i++) {
							files.push(fileList.item(i));
						}
					}
				}
				(function waitForProcess(delay) {
					$timeout(function() {
						if (!processing) {
							callback(files);
						} else {
							waitForProcess(10);
						}
					}, delay || 0)
				})();
			}

			var processing = 0;
			function traverseFileTree(files, entry, path) {
				if (entry != null) {
					if (entry.isDirectory) {
						var dirReader = entry.createReader();
						processing++;
						dirReader.readEntries(function(entries) {
							for (var i = 0; i < entries.length; i++) {
								traverseFileTree(files, entries[i], (path ? path : "") + entry.name + "/");
							}
							processing--;
						});
					} else {
						processing++;
						entry.file(function(file) {
							processing--;
							file._relativePath = (path ? path : "") + file.name;
							files.push(file);
						});
					}
				}
			}
		}
	};
} ]);

})();

angular.module('angularPayments', []);angular.module('angularPayments')
.factory('Common', [function(){

  var ret = {};


  // expiry is a string "mm / yy[yy]"
  ret['parseExpiry'] = function(value){
    var month, prefix, year, _ref;

    value = value || ''

    value = value.replace(/\s/g, '');
    _ref = value.split('/', 2), month = _ref[0], year = _ref[1];

    if ((year != null ? year.length : void 0) === 2 && /^\d+$/.test(year)) {
      prefix = (new Date).getFullYear();
      prefix = prefix.toString().slice(0, 2);
      year = prefix + year;
    }

    month = parseInt(month, 10);
    year = parseInt(year, 10);
    
    return {
      month: month,
      year: year
    };
  }

  return ret;

}]);angular.module('angularPayments')

.factory('Cards', [function(){

  var defaultFormat = /(\d{1,4})/g;
  var defaultInputFormat =  /(?:^|\s)(\d{4})$/;

        var cards = [
    {
      type: 'maestro',
      pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [12, 13, 14, 15, 16, 17, 18, 19],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'dinersclub',
      pattern: /^(36|38|30[0-5])/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [14],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'laser',
      pattern: /^(6706|6771|6709)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16, 17, 18, 19],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'jcb',
      pattern: /^35/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'unionpay',
      pattern: /^62/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16, 17, 18, 19],
      cvcLength: [3],
      luhn: false
    }, {
      type: 'discover',
      pattern: /^(6011|65|64[4-9]|622)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'mastercard',
      pattern: /^5[1-5]/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'amex',
      pattern: /^3[47]/,
      format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
      inputFormat: /^(\d{4}|\d{4}\s\d{6})$/,
      length: [15],
      cvcLength: [3, 4],
      luhn: true
    }, {
      type: 'visa',
      pattern: /^4/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [13, 14, 15, 16],
      cvcLength: [3],
      luhn: true
    }
  ];


  var _fromNumber = function(num){
      var card, i, len;

      num = (num + '').replace(/\D/g, '');

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];

        if (card.pattern.test(num)) {
          return card;
        }

      }
  }

  var _fromType = function(type) {
      var card, i, len;

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];
        
        if (card.type === type) {
          return card;
        }

      }
  };

  return {
      fromNumber: function(val) { return _fromNumber(val) },
      fromType: function(val) { return _fromType(val) },
      defaultFormat: function() { return defaultFormat;},
      defaultInputFormat: function() { return defaultInputFormat;}
  }

}]);angular.module('angularPayments')


.factory('_Format',['Cards', 'Common', '$filter', function(Cards, Common, $filter){

  var _formats = {}

  var _hasTextSelected = function($target) {
      var ref;
      
      if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
          return true;
      }
      
      if (typeof document !== "undefined" && document !== null ? (ref = document.selection) != null ? typeof ref.createRange === "function" ? ref.createRange().text : void 0 : void 0 : void 0) {
          return true;
      }
      
      return false;
    };

  // card formatting

  var _formatCardNumber = function(e) {
      var $target, card, digit, length, re, upperLength, value;
      
      digit = String.fromCharCode(e.which);
      $target = angular.element(e.currentTarget);
      value = $target.val();
      card = Cards.fromNumber(value + digit);
      length = (value.replace(/\D/g, '') + digit).length;
      
      upperLength = 16;
      
      if (card) {
        upperLength = card.length[card.length.length - 1];
      }
      
      if (length >= upperLength) {
        return;
      }

      if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
        e.preventDefault();
        return;
      }

      if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
        return;
      }

      re = Cards.defaultInputFormat();
      if (card) {
          re = card.inputFormat;
      }

      if (re.test(value)) {
        e.preventDefault();
        return $target.val(value + ' ' + digit);

      } else if (re.test(value + digit)) {
        e.preventDefault();
        return $target.val(value + digit + ' ');

      }
  };

  var _restrictCardNumber = function(e) {
      var $target, card, digit, value;
      
      $target = angular.element(e.currentTarget);
      digit = String.fromCharCode(e.which);
      
      if(!/^\d+$/.test(digit)) {
        return;
      }
      
      if(_hasTextSelected($target)) {
        return;
      }
      
      value = ($target.val() + digit).replace(/\D/g, '');
      card = Cards.fromNumber(value);
      
      if(card) {
        if(!(value.length <= card.length[card.length.length - 1])){
          e.preventDefault();
        }
      } else {
        if(!(value.length <= 16)){
          e.preventDefault();
        }
      }
  };

  var _formatBackCardNumber = function(e) {
      var $target, value;
      
      $target = angular.element(e.currentTarget);
      value = $target.val();
      
      if(e.meta) {
        return;
      }
      
      if(e.which !== 8) {
        return;
      }
      
      if(($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
        return;
      }
      
      if(/\d\s$/.test(value) && !e.meta && e.keyCode >= 46) {
        e.preventDefault();
        return $target.val(value.replace(/\d\s$/, ''));
      } else if (/\s\d?$/.test(value)) {
        e.preventDefault();
        return $target.val(value.replace(/\s\d?$/, ''));
      }
    };

  var _getFormattedCardNumber = function(num) {
      var card, groups, upperLength, ref;
      
      card = Cards.fromNumber(num);
      
      if (!card) {
        return num;
      }
      
      upperLength = card.length[card.length.length - 1];
      num = num.replace(/\D/g, '');
      num = num.slice(0, +upperLength + 1 || 9e9);
      
      if(card.format.global) {
        return (ref = num.match(card.format)) != null ? ref.join(' ') : void 0;
      } else {
        groups = card.format.exec(num);
          
        if (groups != null) {
          groups.shift();
        }

        return groups != null ? groups.join(' ') : void 0;
      }
    };

  var _reFormatCardNumber = function(e) {
    return setTimeout(function() {
      var $target, value;
      $target = angular.element(e.target);
    
      value = $target.val();
      value = _getFormattedCardNumber(value);
      return $target.val(value);
    });
  };

  var _parseCardNumber = function(value) {
    return value != null ? value.replace(/\s/g, '') : value;
  };

  _formats['card'] = function(elem, ctrl){
    elem.bind('keypress', _restrictCardNumber);
    elem.bind('keypress', _formatCardNumber);
    elem.bind('keydown', _formatBackCardNumber);
    elem.bind('paste', _reFormatCardNumber);

    ctrl.$parsers.push(_parseCardNumber);
    ctrl.$formatters.push(_getFormattedCardNumber);
  }


  // cvc

  _formatCVC = function(e){
    $target = angular.element(e.currentTarget);
    digit = String.fromCharCode(e.which);
    
    if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
      e.preventDefault();
      return;
    }

    val = $target.val() + digit;
    
    if(val.length <= 4){
      return;
    } else {
      e.preventDefault();
      return;
    }
  }

  _formats['cvc'] = function(elem){
    elem.bind('keypress', _formatCVC)
  }

  // expiry

  _restrictExpiry = function(e) {
    var $target, digit, value;
    
    $target = angular.element(e.currentTarget);
    digit = String.fromCharCode(e.which);
    
    if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
      e.preventDefault();
      return;
    }
    
    if(_hasTextSelected($target)) {
      return;
    }
    
    value = $target.val() + digit;
    value = value.replace(/\D/g, '');
    
    if (value.length > 6) {
      e.preventDefault()
      return;
    }
  };

  _formatExpiry = function(e) {
    var $target, digit, val;
    
    digit = String.fromCharCode(e.which);
    
    if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
      e.preventDefault();
      return;
    }
    
    $target = angular.element(e.currentTarget);
    val = $target.val() + digit;
    
    if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
      e.preventDefault();
      return $target.val("0" + val + " / ");

    } else if (/^\d\d$/.test(val)) {
      e.preventDefault();
      return $target.val("" + val + " / ");

    }
  };

  _formatForwardExpiry = function(e) {
    var $target, digit, val;
    
    digit = String.fromCharCode(e.which);
    
    if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
      return;
    }
    
    $target = angular.element(e.currentTarget);
    val = $target.val();
    
    if (/^\d\d$/.test(val)) {
      return $target.val("" + val + " / ");
    }
  };

  _formatForwardSlash = function(e) {
    var $target, slash, val;
    
    slash = String.fromCharCode(e.which);
    
    if (slash !== '/') {
      return;
    }
    
    $target = angular.element(e.currentTarget);
    val = $target.val();
    
    if (/^\d$/.test(val) && val !== '0') {
      return $target.val("0" + val + " / ");
    }
  };

  _formatBackExpiry = function(e) {
    var $target, value;
    
    if (e.meta) {
      return;
    }
    
    $target = angular.element(e.currentTarget);
    value = $target.val();
    
    if (e.which !== 8) {
      return;
    }
    
    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
      return;
    }
    
    if (/\d(\s|\/)+$/.test(value)) {
      e.preventDefault();
      return $target.val(value.replace(/\d(\s|\/)*$/, ''));

    } else if (/\s\/\s?\d?$/.test(value)) {
      e.preventDefault();
      return $target.val(value.replace(/\s\/\s?\d?$/, ''));

    }
  };

  var _parseExpiry = function(value) {
    if(value != null) {
      var obj = Common.parseExpiry(value);
      var expiry = new Date(obj.year, obj.month-1);
      return $filter('date')(expiry, 'MM/yyyy');
    }
    return null;
  };

  var _getFormattedExpiry = function(value) {
    if(value != null) {
      var obj = Common.parseExpiry(value);
      var expiry = new Date(obj.year, obj.month-1);
      return $filter('date')(expiry, 'MM / yyyy');
    }
    return null;
  };


  _formats['expiry'] = function(elem, ctrl){
    elem.bind('keypress', _restrictExpiry);
    elem.bind('keypress', _formatExpiry);
    elem.bind('keypress', _formatForwardSlash);
    elem.bind('keypress', _formatForwardExpiry);
    elem.bind('keydown', _formatBackExpiry);

    ctrl.$parsers.push(_parseExpiry);
    ctrl.$formatters.push(_getFormattedExpiry);
  }

  return function(type, elem, ctrl){
    if(!_formats[type]){

      types = Object.keys(_formats);

      errstr  = 'Unknown type for formatting: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _formats[type](elem, ctrl);
  }

}])

.directive('paymentsFormat', ['$window', '_Format', function($window, _Format){
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl){
        _Format(attr.paymentsFormat, elem, ctrl);
      }
    }
}]);angular.module('angularPayments')



.factory('_Validate', ['Cards', 'Common', '$parse', function(Cards, Common, $parse){

  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }

  var _luhnCheck = function(num) {
    var digit, digits, odd, sum, i, len;

    odd = true;
    sum = 0;
    digits = (num + '').split('').reverse();

    for (i = 0, len = digits.length; i < len; i++) {

      digit = digits[i];
      digit = parseInt(digit, 10);

      if ((odd = !odd)) {
        digit *= 2;
      }

      if (digit > 9) {
        digit -= 9;
      }

      sum += digit;

    }

    return sum % 10 === 0;
  };

  var _validators = {}

  _validators['cvc'] = function(cvc, ctrl, scope, attr){
      var ref, ref1;

      // valid if empty - let ng-required handle empty
      if(cvc == null || cvc.length == 0) return true;

      if (!/^\d+$/.test(cvc)) {
        return false;
      }

      var type;
      if(attr.paymentsTypeModel) {
          var typeModel = $parse(attr.paymentsTypeModel);
          type = typeModel(scope);
      }

      if (type) {
        return ref = cvc.length, __indexOf.call((ref1 = Cards.fromType(type)) != null ? ref1.cvcLength : void 0, ref) >= 0;
      } else {
        return cvc.length >= 3 && cvc.length <= 4;
      }
  }

  _validators['card'] = function(num, ctrl, scope, attr){
      var card, ref, typeModel;

      if(attr.paymentsTypeModel) {
          typeModel = $parse(attr.paymentsTypeModel);
      }

      var clearCard = function(){
          if(typeModel) {
              typeModel.assign(scope, null);
          }
          ctrl.$card = null;
      };

      // valid if empty - let ng-required handle empty
      if(num == null || num.length == 0){
        clearCard();
        return true;
      }

      num = (num + '').replace(/\s+|-/g, '');

      if (!/^\d+$/.test(num)) {
        clearCard();
        return false;
      }

      card = Cards.fromNumber(num);

      if(!card) {
        clearCard();
        return false;
      }

      ctrl.$card = angular.copy(card);

      if(typeModel) {
          typeModel.assign(scope, card.type);
      }

      ret = (ref = num.length, __indexOf.call(card.length, ref) >= 0) && (card.luhn === false || _luhnCheck(num));

      return ret;
  }

  _validators['expiry'] = function(val){
    // valid if empty - let ng-required handle empty
    if(val == null || val.length == 0) return true;

    obj = Common.parseExpiry(val);

    month = obj.month;
    year = obj.year;

    var currentTime, expiry, prefix;

    if (!(month && year)) {
      return false;
    }

    if (!/^\d+$/.test(month)) {
      return false;
    }

    if (!/^\d+$/.test(year)) {
      return false;
    }

    if (!(parseInt(month, 10) <= 12)) {
      return false;
    }

    if (year.length === 2) {
      prefix = (new Date).getFullYear();
      prefix = prefix.toString().slice(0, 2);
      year = prefix + year;
    }

    expiry = new Date(year, month);
    currentTime = new Date;
    expiry.setMonth(expiry.getMonth() - 1);
    expiry.setMonth(expiry.getMonth() + 1, 1);

    return expiry > currentTime;
  }

  return function(type, val, ctrl, scope, attr){
    if(!_validators[type]){

      types = Object.keys(_validators);

      errstr  = 'Unknown type for validation: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _validators[type](val, ctrl, scope, attr);
  }
}])


.factory('_ValidateWatch', ['_Validate', function(_Validate){

    var _validatorWatches = {}

    _validatorWatches['cvc'] = function(type, ctrl, scope, attr){
        if(attr.paymentsTypeModel) {
            scope.$watch(attr.paymentsTypeModel, function(newVal, oldVal) {
                if(newVal != oldVal) {
                    var valid = _Validate(type, ctrl.$modelValue, ctrl, scope, attr);
                    ctrl.$setValidity(type, valid);
                }
            });
        }
    }

    return function(type, ctrl, scope, attr){
        if(_validatorWatches[type]){
            return _validatorWatches[type](type, ctrl, scope, attr);
        }
    }
}])

.directive('paymentsValidate', ['$window', '_Validate', '_ValidateWatch', function($window, _Validate, _ValidateWatch){
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl){

      var type = attr.paymentsValidate;

      _ValidateWatch(type, ctrl, scope, attr);

      var validateFn = function(val) {
          var valid = _Validate(type, val, ctrl, scope, attr);
          ctrl.$setValidity(type, valid);
          return valid ? val : undefined;
      };

      ctrl.$formatters.push(validateFn);
      ctrl.$parsers.push(validateFn);
    }
  }
}])
;angular.module('angularPayments')

.directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {
    
  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in stripeForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
  _getDataToSend = function(data){
           
    var possibleKeys = ['number', 'expMonth', 'expYear', 
                    'cvc', 'name','addressLine1', 
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']
    
    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
        if(possibleKeys.hasOwnProperty(i)){
            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
        }
    }

    ret['number'] = (ret['number'] || '').replace(/ /g,'');

    return ret;
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {

      if(!$window.Stripe){
          throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
      }

      var form = angular.element(elem);

      form.bind('submit', function() {

        console.log("form submitted.")

        expMonthUsed = scope.expMonth ? true : false;
        expYearUsed = scope.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(scope.expiry)
          scope.expMonth = exp.month
          scope.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        if(form.hasClass('ng-valid')) {
          

          $window.Stripe.createToken(_getDataToSend(scope), function() {
            var args = arguments;
            scope.$apply(function() {
              scope[attr.stripeForm].apply(scope, args);
            });
            button.prop('disabled', false);

          });

        } else {
          scope.$apply(function() {
            scope[attr.stripeForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
          });
          button.prop('disabled', false);
        }

        scope.expiryMonth = expMonthUsed ? scope.expMonth : null;
        scope.expiryYear = expYearUsed ? scope.expMonth : null;

      });
    }
  }
}])

/* angular-placeholder-shim version 0.3.0
 * License: MIT.
 * Copyright (C) 2013, Uri Shaked.
 */

'use strict';

angular.module('placeholderShim', [])
.directive('placeholder', ['$interpolate', '$timeout', function ($interpolate, $timeout) {
if (jQuery.placeholder.browser_supported()) {
return {};
}

return function (scope, element) {
var config = {
color: '#888',
cls: 'placeholder'
};

var interpolatedPlaceholder = $interpolate(element.attr('placeholder'));
var placeholderText = null;

var overlay = null;
var pendingTimer = null;

function addPlaceholder() {
pendingTimer = $timeout(function () {
element._placeholder_shim(config);
overlay = element.data('placeholder');
pendingTimer = null;
});
}

if (element.is(':visible')) {
addPlaceholder();
}

// The following code accounts for value changes from within the code
// and for dynamic changes in placeholder text
scope.$watch(function () {
if (!overlay && element.is(':visible') && !pendingTimer) {
addPlaceholder();
}
if (overlay && (element.get(0) !== document.activeElement)) {
if (element.val().length) {
overlay.hide();
} else {
overlay.show();
}
}
if (overlay) {
var newText = interpolatedPlaceholder(scope);
if (newText !== placeholderText) {
placeholderText = newText;
overlay.text(placeholderText);
}
}
});

scope.$on('$destroy', function() {
if (pendingTimer) {
$timeout.cancel(pendingTimer);
pendingTimer = null;
}
});
};
}]);
/**
 * Poller service for AngularJS
 * @version v0.2.3
 * @link http://github.com/emmaguo/angular-poller
 * @license MIT
 */

(function (window, angular, undefined) {

    'use strict';

    angular.module('emguo.poller', [])

        /*
         * Usage:
         * - Simple example:
         *      var myPoller = poller.get(myResource);
         *      myPoller.promise.then(successCallback, errorCallback, notifyCallback);
         *
         * - Advanced example:
         *      var myPoller = poller.get(myResource, {
         *          action: 'get',
         *          delay: 6000,
         *          params: {
         *              verb: 'greet',
         *              salutation: 'Hello'
         *          },
         *          smart: true
         *      });
         *      myPoller.promise.then(successCallback, errorCallback, notifyCallback);
         *
         * Most likely you only need the notifyCallback, in which case you will use:
         *      myPoller.promise.then(null, null, notifyCallback);
         */
        .factory('poller', function ($interval, $q) {

            var pollers = [], // Poller registry

                /*
                 * Default settings:
                 * - Resource action can be anything. By default it is query.
                 * - Default delay is 5000 ms.
                 * - Default values for url parameters.
                 * - Smart flag is set to false by default. If it is set to true then poller will only send new
                 *   request after the previous one is resolved.
                 *
                 * Angular $resource:
                 * (http://docs.angularjs.org/api/ngResource.$resource)
                 */
                defaults = {
                    action: 'query',
                    delay: 5000,
                    params: {},
                    smart: false
                },

                /*
                 * Poller model:
                 *  - resource
                 *  - action
                 *  - delay
                 *  - params
                 *  - smart
                 *  - promise
                 *  - interval
                 */
                Poller = function (resource, options) {

                    this.resource = resource;
                    this.set(options);
                },

                // Find poller by resource in poller registry.
                findPoller = function (resource) {

                    var poller = null;

                    angular.forEach(pollers, function (item) {
                        if (angular.equals(item.resource, resource)) {
                            poller = item;
                        }
                    });

                    return poller;
                };

            angular.extend(Poller.prototype, {

                /*
                 * Set poller action, delay, params and smart flag.
                 *
                 * If options.params is defined, then set poller params to options.params,
                 * else if poller.params is undefined, then set it to defaults.params,
                 * else do nothing.
                 *
                 * The same goes for poller.action, poller.delay and poller.smart.
                 */
                set: function (options) {

                    angular.forEach(['action', 'delay', 'params', 'smart'], function (prop) {
                        if (options && options[prop]) {
                            this[prop] = options[prop];
                        } else if (!this[prop]) {
                            this[prop] = defaults[prop];
                        }
                    }, this);
                },

                // Start poller service
                start: function () {

                    var resource = this.resource,
                        action = this.action,
                        delay = this.delay,
                        params = this.params,
                        smart = this.smart,
                        self = this,
                        current,
                        timestamp;

                    if (!this.deferred) {
                        this.deferred = $q.defer();
                    }

                    function tick() {

                        // If smart flag is true, then only send new request after the previous one is resolved.
                        if (!smart || !angular.isDefined(current) || current.$resolved) {

                            timestamp = new Date();
                            current = resource[action](params, function (data) {

                                // Ignore the response if request is sent before poller is stopped.
                                if (!angular.isDefined(self.stopTimestamp) || timestamp >= self.stopTimestamp) {
                                    self.deferred.notify(data);
                                }
                            });
                        }
                    }

                    tick();
                    this.interval = $interval(tick, delay);

                    this.promise = this.deferred.promise;
                },

                // Stop poller service if it is running
                stop: function () {

                    if (angular.isDefined(this.interval)) {
                        $interval.cancel(this.interval);
                        this.interval = undefined;
                        this.stopTimestamp = new Date();
                    }
                },

                // Restart poller service
                restart: function () {
                    this.stop();
                    this.start();
                }
            });

            return {

                /*
                 * Return a singleton instance of a poller.
                 * If poller does not exist, then register and start it.
                 * Otherwise return it and restart it if necessary.
                 */
                get: function (resource, options) {

                    var poller = findPoller(resource);

                    if (!poller) {

                        poller = new Poller(resource, options);
                        pollers.push(poller);
                        poller.start();

                    } else {

                        poller.set(options);
                        poller.restart();
                    }

                    return poller;
                },

                // Total number of pollers in poller registry
                size: function () {
                    return pollers.length;
                },

                // Stop all poller services
                stopAll: function () {
                    angular.forEach(pollers, function (p) {
                        p.stop();
                    });
                },

                // Restart all poller services
                restartAll: function () {
                    angular.forEach(pollers, function (p) {
                        p.restart();
                    });
                },

                // Stop and remove all poller services
                reset: function () {
                    this.stopAll();
                    pollers = [];
                }
            };
        }
    );
})(window, window.angular);

(function () {


  'use strict';

  angular.module('pdf', []).directive('ngPdf', function($window) {
    return {
      restrict: 'E',
      templateUrl: function(element, attr) {
        return attr.templateUrl ? attr.templateUrl : 'partials/viewer.html'
      },
      link: function (scope, element, attrs) {
        var url = scope.pdfUrl,
          pdfDoc = null,
          pageNum = 1,
          scale = (attrs.scale ? attrs.scale : 1),
          canvas = (attrs.canvasid ? document.getElementById(attrs.canvasid) : document.getElementById('pdf-canvas')),
          ctx = canvas.getContext('2d'),
          windowEl = angular.element($window);

        windowEl.on('scroll', function() {
          scope.$apply(function() {
            var viewportOffset = document.getElementById(attrs.canvasid).getBoundingClientRect()
            scope.scroll = viewportOffset.top
          });
        });

        PDFJS.disableWorker = true;
        scope.pageNum = pageNum;

        scope.renderPage = function(num) {

          pdfDoc.getPage(num).then(function(page) {
            var viewport = page.getViewport(canvas.width / page.getViewport(1.0).width)



            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            page.render(renderContext);

          });

        };

        scope.goPrevious = function() {
          if (scope.pageNum <= 1)
            return;
          scope.pageNum = parseInt(scope.pageNum, 10) - 1;
        };

        scope.goNext = function() {
          if (scope.pageNum >= pdfDoc.numPages)
            return;
          scope.pageNum = parseInt(scope.pageNum, 10) + 1;
        };

        scope.zoomIn = function() {
          scale = parseFloat(scale) + 0.2;
          scope.renderPage(scope.pageNum);
          return scale;
        };

        scope.zoomOut = function() {
          scale = parseFloat(scale) - 0.2;
          scope.renderPage(scope.pageNum);
          return scale;
        };

        scope.changePage = function() {
          scope.renderPage(scope.pageNum);
        };

        scope.rotate = function() {
          if (canvas.getAttribute('class') === 'rotate0') {
            canvas.setAttribute('class', 'rotate90');
          } else if (canvas.getAttribute('class') === 'rotate90') {
            canvas.setAttribute('class', 'rotate180');
          } else if (canvas.getAttribute('class') === 'rotate180') {
            canvas.setAttribute('class', 'rotate270');
          } else {
            canvas.setAttribute('class', 'rotate0');
          }
        };


        PDFJS.getPage

        console.log("getting doc with PDFJS", url)
        PDFJS.getDocument(url).then(function (_pdfDoc) {
          pdfDoc = _pdfDoc;

          console.log("pdfDoc is", pdfDoc)

          scope.renderPage(scope.pageNum);

          scope.$apply(function() {
            scope.pageCount = _pdfDoc.numPages;
          });
        });

        scope.$watch('pageNum', function (newVal) {
          if (pdfDoc !== null)
            scope.renderPage(newVal);
        });

      }
    };
  });

})();

// from https://github.com/parndt/jquery-html5-placeholder-shim

(function($) {
  // @todo Document this.

  $.extend($,{ placeholder: {
    browser_supported: function() {
      return this._supported !== undefined ?
        this._supported :
        ( this._supported = !!('placeholder' in $('<input type="text">')[0]) );
    },
    shim: function(opts) {
      var config = {
        color: '#888',
        cls: 'placeholder',
        selector: 'input[placeholder], textarea[placeholder]'
      };
      $.extend(config,opts);
      return !this.browser_supported() && $(config.selector)._placeholder_shim(config);
    }
  }});

  $.extend($.fn,{
    _placeholder_shim: function(config) {
      function calcPositionCss(target)
      {
        var op = $(target).offsetParent().offset();
        var ot = $(target).offset();

        return {
          top: ot.top - op.top,
          left: ot.left - op.left,
          width: $(target).width()
        };
      }
      function adjustToResizing(label) {
        var $target = label.data('target');
        if(typeof $target !== "undefined") {
          label.css(calcPositionCss($target));
          $(window).one("resize", function () { adjustToResizing(label); });
        }
      }
      return this.each(function() {
        var $this = $(this);

        if( $this.is(':visible') ) {

          if( $this.data('placeholder') ) {
            var $ol = $this.data('placeholder');
            $ol.css(calcPositionCss($this));
            return true;
          }

          var possible_line_height = {};
          if( !$this.is('textarea') && $this.css('height') != 'auto') {
            possible_line_height = { lineHeight: $this.css('height'), whiteSpace: 'nowrap' };
          }

          var ol = $('<label />')
            .text($this.attr('placeholder'))
            .addClass(config.cls)
            .css($.extend({
                            position:'absolute',
                            display: 'inline',
                            float:'none',
                            overflow:'hidden',
                            textAlign: 'left',
                            color: config.color,
                            cursor: 'text',
                            paddingTop: $this.css('padding-top'),
                            paddingRight: $this.css('padding-right'),
                            paddingBottom: $this.css('padding-bottom'),
                            paddingLeft: $this.css('padding-left'),
                            fontSize: $this.css('font-size'),
                            fontFamily: $this.css('font-family'),
                            fontStyle: $this.css('font-style'),
                            fontWeight: $this.css('font-weight'),
                            textTransform: $this.css('text-transform'),
                            backgroundColor: 'transparent',
                            zIndex: 99
                          }, possible_line_height))
            .css(calcPositionCss(this))
            .attr('for', this.id)
            .data('target',$this)
            .click(function(){
                     $(this).data('target').focus();
                   })
            .insertBefore(this);
          $this
            .data('placeholder',ol)
            .focus(function(){
                     ol.hide();
                   }).blur(function() {
                             ol[$this.val().length ? 'hide' : 'show']();
                           }).triggerHandler('blur');
          $(window).one("resize", function () { adjustToResizing(ol); });
        }
      });
    }
  });
})(jQuery);

jQuery(document).add(window).bind('ready load', function() {
  if (jQuery.placeholder) {
    jQuery.placeholder.shim();
  }
});

/*!
angular-xeditable - 0.1.8
Edit-in-place for angular.js
Build date: 2014-01-10 
*/
/**
 * Angular-xeditable module 
 *
 */
angular.module('xeditable', [])


/**
 * Default options. 
 *
 * @namespace editable-options
 */
//todo: maybe better have editableDefaults, not options...
.value('editableOptions', {
  /**
   * Theme. Possible values `bs3`, `bs2`, `default`.
   * 
   * @var {string} theme
   * @memberOf editable-options
   */  
  theme: 'default',
  /**
   * Whether to show buttons for single editalbe element.  
   * Possible values `right` (default), `no`.
   * 
   * @var {string} buttons
   * @memberOf editable-options
   */    
  buttons: 'right',
  /**
   * Default value for `blur` attribute of single editable element.  
   * Can be `cancel|submit|ignore`.
   * 
   * @var {string} blurElem
   * @memberOf editable-options
   */
  blurElem: 'cancel',
  /**
   * Default value for `blur` attribute of editable form.  
   * Can be `cancel|submit|ignore`.
   * 
   * @var {string} blurForm
   * @memberOf editable-options
   */
  blurForm: 'ignore',
  /**
   * How input elements get activated. Possible values: `focus|select|none`.
   *
   * @var {string} activate
   * @memberOf editable-options
   */
  activate: 'focus'

});
/*
Angular-ui bootstrap datepicker
http://angular-ui.github.io/bootstrap/#/datepicker
*/
angular.module('xeditable').directive('editableBsdate', ['editableDirectiveFactory',
  function(editableDirectiveFactory) {
    return editableDirectiveFactory({
      directiveName: 'editableBsdate',
      inputTpl: '<input type="text">'
    });
}]);
/*
Angular-ui bootstrap editable timepicker
http://angular-ui.github.io/bootstrap/#/timepicker
*/
angular.module('xeditable').directive('editableBstime', ['editableDirectiveFactory',
  function(editableDirectiveFactory) {
    return editableDirectiveFactory({
      directiveName: 'editableBstime',
      inputTpl: '<timepicker></timepicker>',
      render: function() {
        this.parent.render.call(this);

        // timepicker can't update model when ng-model set directly to it
        // see: https://github.com/angular-ui/bootstrap/issues/1141
        // so we wrap it into DIV
        var div = angular.element('<div class="well well-small" style="display:inline-block;"></div>');

        // move ng-model to wrapping div
        div.attr('ng-model', this.inputEl.attr('ng-model'));
        this.inputEl.removeAttr('ng-model');

        // move ng-change to wrapping div
        if(this.attrs.eNgChange) {
          div.attr('ng-change', this.inputEl.attr('ng-change'));
          this.inputEl.removeAttr('ng-change');
        }

        // wrap
        this.inputEl.wrap(div);
      }
    });
}]);
//checkbox
angular.module('xeditable').directive('editableCheckbox', ['editableDirectiveFactory',
  function(editableDirectiveFactory) {
    return editableDirectiveFactory({
      directiveName: 'editableCheckbox',
      inputTpl: '<input type="checkbox">',
      render: function() {
        this.parent.render.call(this);
        if(this.attrs.eTitle) {
          this.inputEl.wrap('<label></label>');
          this.inputEl.after(angular.element('<span></span>').text(this.attrs.eTitle));
        }
      },
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('change', function() {
          setTimeout(function() {
            self.scope.$apply(function() {
              self.scope.$form.$submit();
            });
          }, 500);
        });
      }
    });
}]);
// checklist
angular.module('xeditable').directive('editableChecklist', [
  'editableDirectiveFactory',
  'editableNgOptionsParser',
  function(editableDirectiveFactory, editableNgOptionsParser) {
    return editableDirectiveFactory({
      directiveName: 'editableChecklist',
      inputTpl: '<span></span>',
      useCopy: true,
      render: function() {
        this.parent.render.call(this);
        var parsed = editableNgOptionsParser(this.attrs.eNgOptions);
        var html = '<label ng-repeat="'+parsed.ngRepeat+'">'+
          '<input type="checkbox" checklist-model="$parent.$data" checklist-value="'+parsed.locals.valueFn+'">'+
          '<span ng-bind="'+parsed.locals.displayFn+'"></span></label>';

        this.inputEl.removeAttr('ng-model');
        this.inputEl.removeAttr('ng-options');
        this.inputEl.html(html);
      }
    });
}]);
/*
Input types: text|email|tel|number|url|search|color|date|datetime|time|month|week
*/

(function() {

  var types = 'text|email|tel|number|url|search|color|date|datetime|time|month|week'.split('|');

  //todo: datalist
  
  // generate directives
  angular.forEach(types, function(type) {
    var directiveName = 'editable'+type.charAt(0).toUpperCase() + type.slice(1);
    angular.module('xeditable').directive(directiveName, ['editableDirectiveFactory',
      function(editableDirectiveFactory) {
        return editableDirectiveFactory({
          directiveName: directiveName,
          inputTpl: '<input type="'+type+'">'
        });
    }]);
  });

  //`range` is bit specific
  angular.module('xeditable').directive('editableRange', ['editableDirectiveFactory',
    function(editableDirectiveFactory) {
      return editableDirectiveFactory({
        directiveName: 'editableRange',
        inputTpl: '<input type="range" id="range" name="range">',
        render: function() {
          this.parent.render.call(this);
          this.inputEl.after('<output>{{$data}}</output>');
        }        
      });
  }]);

}());


// radiolist
angular.module('xeditable').directive('editableRadiolist', [
  'editableDirectiveFactory',
  'editableNgOptionsParser',
  function(editableDirectiveFactory, editableNgOptionsParser) {
    return editableDirectiveFactory({
      directiveName: 'editableRadiolist',
      inputTpl: '<span></span>',
      render: function() {
        this.parent.render.call(this);
        var parsed = editableNgOptionsParser(this.attrs.eNgOptions);
        var html = '<label ng-repeat="'+parsed.ngRepeat+'">'+
          '<input type="radio" ng-model="$parent.$data" value="{{'+parsed.locals.valueFn+'}}">'+
          '<span ng-bind="'+parsed.locals.displayFn+'"></span></label>';

        this.inputEl.removeAttr('ng-model');
        this.inputEl.removeAttr('ng-options');
        this.inputEl.html(html);
      },
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('change', function() {
          setTimeout(function() {
            self.scope.$apply(function() {
              self.scope.$form.$submit();
            });
          }, 500);
        });
      }
    });
}]);
//select
angular.module('xeditable').directive('editableSelect', ['editableDirectiveFactory',
  function(editableDirectiveFactory) {
    return editableDirectiveFactory({
      directiveName: 'editableSelect',
      inputTpl: '<select></select>',
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('change', function() {
          self.scope.$apply(function() {
            self.scope.$form.$submit();
          });
        });
      }
    });
}]);
//textarea
angular.module('xeditable').directive('editableTextarea', ['editableDirectiveFactory',
  function(editableDirectiveFactory) {
    return editableDirectiveFactory({
      directiveName: 'editableTextarea',
      inputTpl: '<textarea></textarea>',
      addListeners: function() {
        var self = this;
        self.parent.addListeners.call(self);
        // submit textarea by ctrl+enter even with buttons
        if (self.single && self.buttons !== 'no') {
          self.autosubmit();
        }
      },
      autosubmit: function() {
        var self = this;
        self.inputEl.bind('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
            self.scope.$apply(function() {
              self.scope.$form.$submit();
            });
          }
        });
      }
    });
}]);

/**
 * EditableController class. 
 * Attached to element with `editable-xxx` directive.
 *
 * @namespace editable-element
 */
/*
TODO: this file should be refactored to work more clear without closures!
*/
angular.module('xeditable').factory('editableController', 
  ['$q', 'editableUtils',
  function($q, editableUtils) {

  //EditableController function
  EditableController.$inject = ['$scope', '$attrs', '$element', '$parse', 'editableThemes', 'editableOptions', '$rootScope', '$compile', '$q'];
  function EditableController($scope, $attrs, $element, $parse, editableThemes, editableOptions, $rootScope, $compile, $q) {
    var valueGetter;

    //if control is disabled - it does not participate in waiting process
    var inWaiting;

    var self = this;

    self.scope = $scope;
    self.elem = $element;
    self.attrs = $attrs;
    self.inputEl = null;
    self.editorEl = null;
    self.single = true;
    self.error = '';
    self.theme =  editableThemes[editableOptions.theme] || editableThemes['default'];
    self.parent = {};

    //to be overwritten by directive
    self.inputTpl = '';
    self.directiveName = '';

    // with majority of controls copy is not needed, but..
    // copy MUST NOT be used for `select-multiple` with objects as items
    // copy MUST be used for `checklist`
    self.useCopy = false;

    //runtime (defaults)
    self.single = null;

    /**
     * Attributes defined with `e-*` prefix automatically transfered from original element to
     * control.  
     * For example, if you set `<span editable-text="user.name" e-style="width: 100px"`>
     * then input will appear as `<input style="width: 100px">`.  
     * See [demo](#text-customize).
     * 
     * @var {any|attribute} e-*
     * @memberOf editable-element
     */ 

    /**
     * Whether to show ok/cancel buttons. Values: `right|no`.
     * If set to `no` control automatically submitted when value changed.  
     * If control is part of form buttons will never be shown. 
     * 
     * @var {string|attribute} buttons
     * @memberOf editable-element
     */    
    self.buttons = 'right'; 
    /**
     * Action when control losses focus. Values: `cancel|submit|ignore`.
     * Has sense only for single editable element.
     * Otherwise, if control is part of form - you should set `blur` of form, not of individual element.
     * 
     * @var {string|attribute} blur
     * @memberOf editable-element
     */     
    // no real `blur` property as it is transfered to editable form

    //init
    self.init = function(single) {
      self.single = single;

      self.name = $attrs.eName || $attrs[self.directiveName];
      /*
      if(!$attrs[directiveName] && !$attrs.eNgModel && ($attrs.eValue === undefined)) {
        throw 'You should provide value for `'+directiveName+'` or `e-value` in editable element!';
      }
      */
      if($attrs[self.directiveName]) {
        valueGetter = $parse($attrs[self.directiveName]);
      } else {
        throw 'You should provide value for `'+self.directiveName+'` in editable element!';
      }

      // settings for single and non-single
      if (!self.single) {
        // hide buttons for non-single
        self.buttons = 'no';
      } else {
        self.buttons = self.attrs.buttons || editableOptions.buttons;
      }

      //if name defined --> watch changes and update $data in form
      if($attrs.eName) {
        self.scope.$watch('$data', function(newVal){
          self.scope.$form.$data[$attrs.eName] = newVal;
        });
      }

      /**
       * Called when control is shown.  
       * See [demo](#select-remote).
       * 
       * @var {method|attribute} onshow
       * @memberOf editable-element
       */
      if($attrs.onshow) {
        self.onshow = function() {
          return self.catchError($parse($attrs.onshow)($scope));
        };
      }

      /**
       * Called when control is hidden after both save or cancel.  
       * 
       * @var {method|attribute} onhide
       * @memberOf editable-element
       */
      if($attrs.onhide) {
        self.onhide = function() {
          return $parse($attrs.onhide)($scope);
        };
      }

      /**
       * Called when control is cancelled.  
       * 
       * @var {method|attribute} oncancel
       * @memberOf editable-element
       */
      if($attrs.oncancel) {
        self.oncancel = function() {
          return $parse($attrs.oncancel)($scope);
        };
      }          

      /**
       * Called during submit before value is saved to model.  
       * See [demo](#onbeforesave).
       * 
       * @var {method|attribute} onbeforesave
       * @memberOf editable-element
       */
      if ($attrs.onbeforesave) {
        self.onbeforesave = function() {
          return self.catchError($parse($attrs.onbeforesave)($scope));
        };
      }

      /**
       * Called during submit after value is saved to model.  
       * See [demo](#onaftersave).
       * 
       * @var {method|attribute} onaftersave
       * @memberOf editable-element
       */
      if ($attrs.onaftersave) {
        self.onaftersave = function() {
          return self.catchError($parse($attrs.onaftersave)($scope));
        };
      }

      // watch change of model to update editable element
      // now only add/remove `editable-empty` class.
      // Initially this method called with newVal = undefined, oldVal = undefined
      // so no need initially call handleEmpty() explicitly
      $scope.$parent.$watch($attrs[self.directiveName], function(newVal, oldVal) {
        self.handleEmpty();
      });
    };

    self.render = function() {
      var theme = self.theme;

      //build input
      self.inputEl = angular.element(self.inputTpl);

      //build controls
      self.controlsEl = angular.element(theme.controlsTpl);
      self.controlsEl.append(self.inputEl);

      //build buttons
      if(self.buttons !== 'no') {
        self.buttonsEl = angular.element(theme.buttonsTpl);
        self.submitEl = angular.element(theme.submitTpl);
        self.cancelEl = angular.element(theme.cancelTpl);
        self.buttonsEl.append(self.submitEl).append(self.cancelEl);
        self.controlsEl.append(self.buttonsEl);
        
        self.inputEl.addClass('editable-has-buttons');
      }

      //build error
      self.errorEl = angular.element(theme.errorTpl);
      self.controlsEl.append(self.errorEl);

      //build editor
      self.editorEl = angular.element(self.single ? theme.formTpl : theme.noformTpl);
      self.editorEl.append(self.controlsEl);

      // transfer `e-*|data-e-*|x-e-*` attributes
      for(var k in $attrs.$attr) {
        if(k.length <= 1) {
          continue;
        }
        var transferAttr = false;
        var nextLetter = k.substring(1, 2);

        // if starts with `e` + uppercase letter
        if(k.substring(0, 1) === 'e' && nextLetter === nextLetter.toUpperCase()) {
          transferAttr = k.substring(1); // cut `e`
        } else {
          continue;
        }
        
        // exclude `form` and `ng-submit`, 
        if(transferAttr === 'Form' || transferAttr === 'NgSubmit') {
          continue;
        }

        // convert back to lowercase style
        transferAttr = transferAttr.substring(0, 1).toLowerCase() + editableUtils.camelToDash(transferAttr.substring(1));  

        // workaround for attributes without value (e.g. `multiple = "multiple"`)
        var attrValue = ($attrs[k] === '') ? transferAttr : $attrs[k];

        // set attributes to input
        self.inputEl.attr(transferAttr, attrValue);
      }

      self.inputEl.addClass('editable-input');
      self.inputEl.attr('ng-model', '$data');

      // add directiveName class to editor, e.g. `editable-text`
      self.editorEl.addClass(editableUtils.camelToDash(self.directiveName));

      if(self.single) {
        self.editorEl.attr('editable-form', '$form');
        // transfer `blur` to form
        self.editorEl.attr('blur', self.attrs.blur || (self.buttons === 'no' ? 'cancel' : editableOptions.blurElem));
      }

      //apply `postrender` method of theme
      if(angular.isFunction(theme.postrender)) {
        theme.postrender.call(self);
      }

    };

    // with majority of controls copy is not needed, but..
    // copy MUST NOT be used for `select-multiple` with objects as items
    // copy MUST be used for `checklist`
    self.setLocalValue = function() {
      self.scope.$data = self.useCopy ? 
        angular.copy(valueGetter($scope.$parent)) : 
        valueGetter($scope.$parent);
    };

    //show
    self.show = function() {
      // set value of scope.$data
      self.setLocalValue();

      /*
      Originally render() was inside init() method, but some directives polluting editorEl,
      so it is broken on second openning.
      Cloning is not a solution as jqLite can not clone with event handler's.
      */
      self.render();

      // insert into DOM
      $element.after(self.editorEl);

      // compile (needed to attach ng-* events from markup)
      $compile(self.editorEl)($scope);

      // attach listeners (`escape`, autosubmit, etc)
      self.addListeners();

      // hide element
      $element.addClass('editable-hide');

      // onshow
      return self.onshow();
    };

    //hide
    self.hide = function() {
      self.editorEl.remove();
      $element.removeClass('editable-hide');

      // onhide
      return self.onhide();
    };

    // cancel
    self.cancel = function() {
      // oncancel
      self.oncancel();
      // don't call hide() here as it called in form's code
    };

    /*
    Called after show to attach listeners
    */
    self.addListeners = function() {
      // bind keyup for `escape`
      self.inputEl.bind('keyup', function(e) {
          if(!self.single) {
            return;
          }

          // todo: move this to editable-form!
          switch(e.keyCode) {
            // hide on `escape` press
            case 27:
              self.scope.$apply(function() {
                self.scope.$form.$cancel();
              });
            break;
          }
      });

      // autosubmit when `no buttons`
      if (self.single && self.buttons === 'no') {
        self.autosubmit();
      }

      // click - mark element as clicked to exclude in document click handler
      self.editorEl.bind('click', function(e) {
        // ignore right/middle button click
        if (e.which !== 1) {
          return;
        }

        if (self.scope.$form.$visible) {
          self.scope.$form._clicked = true;
        }
      });
    };

    // setWaiting
    self.setWaiting = function(value) {
      if (value) {
        // participate in waiting only if not disabled
        inWaiting = !self.inputEl.attr('disabled') &&
                    !self.inputEl.attr('ng-disabled') &&
                    !self.inputEl.attr('ng-enabled');
        if (inWaiting) {
          self.inputEl.attr('disabled', 'disabled');
          if(self.buttonsEl) {
            self.buttonsEl.find('button').attr('disabled', 'disabled');
          }
        }
      } else {
        if (inWaiting) {
          self.inputEl.removeAttr('disabled');
          if (self.buttonsEl) {
            self.buttonsEl.find('button').removeAttr('disabled');
          }
        }
      }
    };

    self.activate = function() {
      setTimeout(function() {
        var el = self.inputEl[0];
        if (editableOptions.activate === 'focus' && el.focus) {
          el.focus();
        }
        if (editableOptions.activate === 'select' && el.select) {
          el.select();
        }
      }, 0);
    };

    self.setError = function(msg) {
      if(!angular.isObject(msg)) {
        $scope.$error = msg;
        self.error = msg;
      }
    };

    /*
    Checks that result is string or promise returned string and shows it as error message
    Applied to onshow, onbeforesave, onaftersave
    */
    self.catchError = function(result, noPromise) {
      if (angular.isObject(result) && noPromise !== true) {
        $q.when(result).then(
          //success and fail handlers are equal
          angular.bind(this, function(r) {
            this.catchError(r, true);
          }),
          angular.bind(this, function(r) {
            this.catchError(r, true);
          })
        );
      //check $http error
      } else if (noPromise && angular.isObject(result) && result.status &&
        (result.status !== 200) && result.data && angular.isString(result.data)) {
        this.setError(result.data);
        //set result to string: to let form know that there was error
        result = result.data;
      } else if (angular.isString(result)) {
        this.setError(result);
      }
      return result;
    };

    self.save = function() {
      valueGetter.assign($scope.$parent, angular.copy(self.scope.$data));

      // no need to call handleEmpty here as we are watching change of model value
      // self.handleEmpty();
    };

    /*
    attach/detach `editable-empty` class to element
    */
    self.handleEmpty = function() {
      var val = valueGetter($scope.$parent);
      var isEmpty = val === null || val === undefined || val === "" || (angular.isArray(val) && val.length === 0); 
      $element.toggleClass('editable-empty', isEmpty);
    };

    /*
    Called when `buttons = "no"` to submit automatically
    */
    self.autosubmit = angular.noop;

    self.onshow = angular.noop;
    self.onhide = angular.noop;
    self.oncancel = angular.noop;
    self.onbeforesave = angular.noop;
    self.onaftersave = angular.noop;
  }

  return EditableController;
}]);

/*
editableFactory is used to generate editable directives (see `/directives` folder)
Inside it does several things:
- detect form for editable element. Form may be one of three types:
  1. autogenerated form (for single editable elements)
  2. wrapper form (element wrapped by <form> tag)
  3. linked form (element has `e-form` attribute pointing to existing form)

- attach editableController to element

Depends on: editableController, editableFormFactory
*/
angular.module('xeditable').factory('editableDirectiveFactory',
['$parse', '$compile', 'editableThemes', '$rootScope', '$document', 'editableController', 'editableFormController',
function($parse, $compile, editableThemes, $rootScope, $document, editableController, editableFormController) {

  //directive object
  return function(overwrites) {
    return {
      restrict: 'A',
      scope: true,
      require: [overwrites.directiveName, '?^form'],
      controller: editableController,
      link: function(scope, elem, attrs, ctrl) {
        // editable controller
        var eCtrl = ctrl[0];

        // form controller
        var eFormCtrl;

        // this variable indicates is element is bound to some existing form, 
        // or it's single element who's form will be generated automatically
        // By default consider single element without any linked form.ß
        var hasForm = false;
     
        // element wrapped by form
        if(ctrl[1]) {
          eFormCtrl = ctrl[1];
          hasForm = true;
        } else if(attrs.eForm) { // element not wrapped by <form>, but we hane `e-form` attr
          var getter = $parse(attrs.eForm)(scope);
          if(getter) { // form exists in scope (above), e.g. editable column
            eFormCtrl = getter;
            hasForm = true;
          } else { // form exists below or not exist at all: check document.forms
            for(var i=0; i<$document[0].forms.length;i++){
              if($document[0].forms[i].name === attrs.eForm) {
                // form is below and not processed yet
                eFormCtrl = null;
                hasForm = true;
                break;
              }
            }
          }
        }

        /*
        if(hasForm && !attrs.eName) {
          throw 'You should provide `e-name` for editable element inside form!';
        }
        */

        //check for `editable-form` attr in form
        /*
        if(eFormCtrl && ) {
          throw 'You should provide `e-name` for editable element inside form!';
        }
        */

        // store original props to `parent` before merge
        angular.forEach(overwrites, function(v, k) {
          if(eCtrl[k] !== undefined) {
            eCtrl.parent[k] = eCtrl[k];
          }
        });

        // merge overwrites to base editable controller
        angular.extend(eCtrl, overwrites);

        // init editable ctrl
        eCtrl.init(!hasForm);

        // publich editable controller as `$editable` to be referenced in html
        scope.$editable = eCtrl;

        // add `editable` class to element
        elem.addClass('editable');

        // hasForm
        if(hasForm) {
          if(eFormCtrl) {
            scope.$form = eFormCtrl;
            if(!scope.$form.$addEditable) {
              throw 'Form with editable elements should have `editable-form` attribute.';
            }
            scope.$form.$addEditable(eCtrl);
          } else {
            // future form (below): add editable controller to buffer and add to form later
            $rootScope.$$editableBuffer = $rootScope.$$editableBuffer || {};
            $rootScope.$$editableBuffer[attrs.eForm] = $rootScope.$$editableBuffer[attrs.eForm] || [];
            $rootScope.$$editableBuffer[attrs.eForm].push(eCtrl);
            scope.$form = null; //will be re-assigned later
          }
        // !hasForm
        } else {
          // create editableform controller
          scope.$form = editableFormController();
          // add self to editable controller
          scope.$form.$addEditable(eCtrl);

          // if `e-form` provided, publish local $form in scope
          if(attrs.eForm) {
            scope.$parent[attrs.eForm] = scope.$form;
          }

          // bind click - if no external form defined
          if(!attrs.eForm) {
            elem.addClass('editable-click');
            elem.bind('click', function(e) {
              e.preventDefault();
              e.editable = eCtrl;
              scope.$apply(function(){
                scope.$form.$show();
              });
            });
          }
        }

      }
    };
  };
}]);

/*
Returns editableForm controller
*/
angular.module('xeditable').factory('editableFormController', 
  ['$parse', '$document', '$rootScope', 'editablePromiseCollection', 'editableUtils',
  function($parse, $document, $rootScope, editablePromiseCollection, editableUtils) {

  // array of opened editable forms
  var shown = [];

  // bind click to body: cancel|submit|ignore forms
  $document.bind('click', function(e) {
    // ignore right/middle button click
    if (e.which !== 1) {
      return;
    }

    var toCancel = [];
    var toSubmit = [];
    for (var i=0; i<shown.length; i++) {

      // exclude clicked
      if (shown[i]._clicked) {
        shown[i]._clicked = false;
        continue;
      }

      // exclude waiting
      if (shown[i].$waiting) {
        continue;
      }

      if (shown[i]._blur === 'cancel') {
        toCancel.push(shown[i]);
      }

      if (shown[i]._blur === 'submit') {
        toSubmit.push(shown[i]);
      }
    }

    if (toCancel.length || toSubmit.length) {
      $rootScope.$apply(function() {
        angular.forEach(toCancel, function(v){ v.$cancel(); });
        angular.forEach(toSubmit, function(v){ v.$submit(); });
      });
    }
  });
 

  var base = {
    $addEditable: function(editable) {
      //console.log('add editable', editable.elem, editable.elem.bind);
      this.$editables.push(editable);

      //'on' is not supported in angular 1.0.8
      editable.elem.bind('$destroy', angular.bind(this, this.$removeEditable, editable));

      //bind editable's local $form to self (if not bound yet, below form) 
      if (!editable.scope.$form) {
        editable.scope.$form = this;
      }

      //if form already shown - call show() of new editable
      if (this.$visible) {
        editable.catchError(editable.show());
      }
    },

    $removeEditable: function(editable) {
      //arrayRemove
      for(var i=0; i < this.$editables.length; i++) {
        if(this.$editables[i] === editable) {
          this.$editables.splice(i, 1);
          return;
        }
      }
    },

    /**
     * Shows form with editable controls.
     * 
     * @method $show()
     * @memberOf editable-form
     */
    $show: function() {
      if (this.$visible) {
        return;
      }

      this.$visible = true;

      var pc = editablePromiseCollection();

      //own show
      pc.when(this.$onshow());

      //clear errors
      this.$setError(null, '');

      //children show
      angular.forEach(this.$editables, function(editable) {
        pc.when(editable.show());
      });

      //wait promises and activate
      pc.then({
        onWait: angular.bind(this, this.$setWaiting), 
        onTrue: angular.bind(this, this.$activate), 
        onFalse: angular.bind(this, this.$activate), 
        onString: angular.bind(this, this.$activate)
      });

      // add to internal list of shown forms
      // setTimeout needed to prevent closing right after opening (e.g. when trigger by button)
      setTimeout(angular.bind(this, function() {
        // clear `clicked` to get ready for clicks on visible form
        this._clicked = false;
        if(editableUtils.indexOf(shown, this) === -1) {
          shown.push(this);
        }
      }), 0);      
    },

    /**
     * Sets focus on form field specified by `name`.
     * 
     * @method $activate(name)
     * @param {string} name name of field
     * @memberOf editable-form
     */
    $activate: function(name) {
      var i;
      if (this.$editables.length) {
        //activate by name
        if (angular.isString(name)) {
          for(i=0; i<this.$editables.length; i++) {
            if (this.$editables[i].name === name) {
              this.$editables[i].activate();
              return;
            }
          }
        }

        //try activate error field
        for(i=0; i<this.$editables.length; i++) {
          if (this.$editables[i].error) {
            this.$editables[i].activate();
            return;
          }
        }

        //by default activate first field
        this.$editables[0].activate();
      }
    },

    /**
     * Hides form with editable controls without saving.
     * 
     * @method $hide()
     * @memberOf editable-form
     */
    $hide: function() {
      if (!this.$visible) {
        return;
      }      
      this.$visible = false;
      // self hide
      this.$onhide();
      // children's hide
      angular.forEach(this.$editables, function(editable) {
        editable.hide();
      });

      // remove from internal list of shown forms
      editableUtils.arrayRemove(shown, this);
    },

    /**
     * Triggers `oncancel` event and calls `$hide()`.
     * 
     * @method $cancel()
     * @memberOf editable-form
     */
    $cancel: function() {
      if (!this.$visible) {
        return;
      }      
      // self cancel
      this.$oncancel();
      // children's cancel      
      angular.forEach(this.$editables, function(editable) {
        editable.cancel();
      });
      // self hide
      this.$hide();
    },    

    $setWaiting: function(value) {
      this.$waiting = !!value;
      // we can't just set $waiting variable and use it via ng-disabled in children
      // because in editable-row form is not accessible
      angular.forEach(this.$editables, function(editable) {
        editable.setWaiting(!!value);
      });
    },

    /**
     * Shows error message for particular field.
     * 
     * @method $setError(name, msg)
     * @param {string} name name of field
     * @param {string} msg error message
     * @memberOf editable-form
     */
    $setError: function(name, msg) {
      angular.forEach(this.$editables, function(editable) {
        if(!name || editable.name === name) {
          editable.setError(msg);
        }
      });
    },

    $submit: function() {
      if (this.$waiting) {
        return;
      } 

      //clear errors
      this.$setError(null, '');

      //children onbeforesave
      var pc = editablePromiseCollection();
      angular.forEach(this.$editables, function(editable) {
        pc.when(editable.onbeforesave());
      });

      /*
      onbeforesave result:
      - true/undefined: save data and close form
      - false: close form without saving
      - string: keep form open and show error
      */
      pc.then({
        onWait: angular.bind(this, this.$setWaiting), 
        onTrue: angular.bind(this, checkSelf, true), 
        onFalse: angular.bind(this, checkSelf, false), 
        onString: angular.bind(this, this.$activate)
      });

      //save
      function checkSelf(childrenTrue){
        var pc = editablePromiseCollection();
        pc.when(this.$onbeforesave());
        pc.then({
          onWait: angular.bind(this, this.$setWaiting), 
          onTrue: childrenTrue ? angular.bind(this, this.$save) : angular.bind(this, this.$hide), 
          onFalse: angular.bind(this, this.$hide), 
          onString: angular.bind(this, this.$activate)
        });
      }
    },

    $save: function() {
      // write model for each editable
      angular.forEach(this.$editables, function(editable) {
        editable.save();
      });

      //call onaftersave of self and children
      var pc = editablePromiseCollection();
      pc.when(this.$onaftersave());
      angular.forEach(this.$editables, function(editable) {
        pc.when(editable.onaftersave());
      });

      /*
      onaftersave result:
      - true/undefined/false: just close form
      - string: keep form open and show error
      */
      pc.then({
        onWait: angular.bind(this, this.$setWaiting), 
        onTrue: angular.bind(this, this.$hide), 
        onFalse: angular.bind(this, this.$hide), 
        onString: angular.bind(this, this.$activate)
      });
    },

    $onshow: angular.noop,
    $oncancel: angular.noop,
    $onhide: angular.noop,
    $onbeforesave: angular.noop,
    $onaftersave: angular.noop
  };

  return function() {
    return angular.extend({
      $editables: [],
      /**
       * Form visibility flag.
       * 
       * @var {bool} $visible
       * @memberOf editable-form
       */
      $visible: false,
      /**
       * Form waiting flag. It becomes `true` when form is loading or saving data.
       * 
       * @var {bool} $waiting
       * @memberOf editable-form
       */
      $waiting: false,
      $data: {},
      _clicked: false,
      _blur: null
    }, base);
  };
}]);

/**
 * EditableForm directive. Should be defined in <form> containing editable controls.  
 * It add some usefull methods to form variable exposed to scope by `name="myform"` attribute.
 *
 * @namespace editable-form
 */
angular.module('xeditable').directive('editableForm',
  ['$rootScope', '$parse', 'editableFormController', 'editableOptions',
  function($rootScope, $parse, editableFormController, editableOptions) {
    return {
      restrict: 'A',
      require: ['form'],
      //require: ['form', 'editableForm'],
      //controller: EditableFormController,
      compile: function() {
        return {
          pre: function(scope, elem, attrs, ctrl) {
            var form = ctrl[0];
            var eForm;

            //if `editableForm` has value - publish smartly under this value
            //this is required only for single editor form that is created and removed
            if(attrs.editableForm) {
              if(scope[attrs.editableForm] && scope[attrs.editableForm].$show) {
                eForm = scope[attrs.editableForm];
                angular.extend(form, eForm);
              } else {
                eForm = editableFormController();
                scope[attrs.editableForm] = eForm;
                angular.extend(eForm, form);
              }
            } else { //just merge to form and publish if form has name
              eForm = editableFormController();
              angular.extend(form, eForm);
            }

            //read editables from buffer (that appeared before FORM tag)
            var buf = $rootScope.$$editableBuffer;
            var name = form.$name;
            if(name && buf && buf[name]) {
              angular.forEach(buf[name], function(editable) {
                eForm.$addEditable(editable);
              });
              delete buf[name];
            }
          },
          post: function(scope, elem, attrs, ctrl) {
            var eForm;

            if(attrs.editableForm && scope[attrs.editableForm] && scope[attrs.editableForm].$show) {
              eForm = scope[attrs.editableForm];
            } else {
              eForm = ctrl[0];
            }

            /**
             * Called when form is shown.
             * 
             * @var {method|attribute} onshow 
             * @memberOf editable-form
             */
            if(attrs.onshow) {
              eForm.$onshow = angular.bind(eForm, $parse(attrs.onshow), scope);
            }

            /**
             * Called when form hides after both save or cancel.
             * 
             * @var {method|attribute} onhide 
             * @memberOf editable-form
             */
            if(attrs.onhide) {
              eForm.$onhide = angular.bind(eForm, $parse(attrs.onhide), scope);
            }

            /**
             * Called when form is cancelled.
             * 
             * @var {method|attribute} oncancel
             * @memberOf editable-form
             */
            if(attrs.oncancel) {
              eForm.$oncancel = angular.bind(eForm, $parse(attrs.oncancel), scope);
            }

            /**
             * Whether form initially rendered in shown state.
             *
             * @var {bool|attribute} shown
             * @memberOf editable-form
             */
            if(attrs.shown && $parse(attrs.shown)(scope)) {
              eForm.$show();
            }

            /**
             * Action when form losses focus. Values: `cancel|submit|ignore`.
             * Default is `ignore`.
             * 
             * @var {string|attribute} blur
             * @memberOf editable-form
             */
            eForm._blur = attrs.blur || editableOptions.blurForm;

            // onbeforesave, onaftersave
            if(!attrs.ngSubmit && !attrs.submit) {
              /**
               * Called after all children `onbeforesave` callbacks but before saving form values
               * to model.  
               * If at least one children callback returns `non-string` - it will not not be called.  
               * See [editable-form demo](#editable-form) for details.
               * 
               * @var {method|attribute} onbeforesave
               * @memberOf editable-form
               * 
               */
              if(attrs.onbeforesave) {
                eForm.$onbeforesave = function() {
                  return $parse(attrs.onbeforesave)(scope, {$data: eForm.$data});
                };
              }

              /**
               * Called when form values are saved to model.  
               * See [editable-form demo](#editable-form) for details.
               * 
               * @var {method|attribute} onaftersave 
               * @memberOf editable-form
               * 
               */
              if(attrs.onaftersave) {
                eForm.$onaftersave = function() {
                  return $parse(attrs.onaftersave)(scope, {$data: eForm.$data});
                };
              }

              elem.bind('submit', function(event) {
                event.preventDefault();
                scope.$apply(function() {
                  eForm.$submit();
                });
              });
            }


            // click - mark form as clicked to exclude in document click handler
            elem.bind('click', function(e) {
              // ignore right/middle button click
              if (e.which !== 1) {
                return;
              }

              if (eForm.$visible) {
                eForm._clicked = true;
              }
            });   

          }
        };
      }
    };
}]);
/**
 * editablePromiseCollection
 *  
 * Collect results of function calls. Shows waiting if there are promises. 
 * Finally, applies callbacks if:
 * - onTrue(): all results are true and all promises resolved to true
 * - onFalse(): at least one result is false or promise resolved to false
 * - onString(): at least one result is string or promise rejected or promise resolved to string
 */
angular.module('xeditable').factory('editablePromiseCollection', ['$q', function($q) { 

  function promiseCollection() {
    return {
      promises: [],
      hasFalse: false,
      hasString: false,
      when: function(result, noPromise) {
        if (result === false) {
          this.hasFalse = true;
        } else if (!noPromise && angular.isObject(result)) {
          this.promises.push($q.when(result));
        } else if (angular.isString(result)){
          this.hasString = true;
        } else { //result === true || result === undefined || result === null
          return;
        }
      },
      //callbacks: onTrue, onFalse, onString
      then: function(callbacks) {
        callbacks = callbacks || {};
        var onTrue = callbacks.onTrue || angular.noop;
        var onFalse = callbacks.onFalse || angular.noop;
        var onString = callbacks.onString || angular.noop;
        var onWait = callbacks.onWait || angular.noop;

        var self = this;

        if (this.promises.length) {
          onWait(true);
          $q.all(this.promises).then(
            //all resolved       
            function(results) {
              onWait(false);
              //check all results via same `when` method (without checking promises)
              angular.forEach(results, function(result) {
                self.when(result, true);  
              });
              applyCallback();
            },
            //some rejected
            function(error) { 
              onWait(false);
              onString();
            }
          );
        } else {
          applyCallback();
        }

        function applyCallback() {
          if (!self.hasString && !self.hasFalse) {
            onTrue();
          } else if (!self.hasString && self.hasFalse) {
            onFalse();
          } else {
            onString();
          }
        }

      }
    };
  }

  return promiseCollection;

}]);

/**
 * editableUtils
 */
angular.module('xeditable').factory('editableUtils', [function() {
  return {
    indexOf: function (array, obj) {
      if (array.indexOf) return array.indexOf(obj);

      for ( var i = 0; i < array.length; i++) {
        if (obj === array[i]) return i;
      }
      return -1;
    },

    arrayRemove: function (array, value) {
      var index = this.indexOf(array, value);
      if (index >= 0) {
        array.splice(index, 1);
      }
      return value;
    },

    // copy from https://github.com/angular/angular.js/blob/master/src/Angular.js
    camelToDash: function(str) {
      var SNAKE_CASE_REGEXP = /[A-Z]/g;
      return str.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
        return (pos ? '-' : '') + letter.toLowerCase();
      });
    },

    dashToCamel: function(str) {
      var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
      var MOZ_HACK_REGEXP = /^moz([A-Z])/;
      return str.
        replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
          return offset ? letter.toUpperCase() : letter;
        }).
        replace(MOZ_HACK_REGEXP, 'Moz$1');
    }
  };
}]);

/**
 * editableNgOptionsParser
 *
 * see: https://github.com/angular/angular.js/blob/master/src/ng/directive/select.js#L131
 */
angular.module('xeditable').factory('editableNgOptionsParser', [
  function() {
                        //0000111110000000000022220000000000000000000000333300000000000000444444444444444000000000555555555555555000000066666666666666600000000000000007777000000000000000000088888
  var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;
 
  function parser(optionsExp) {
    var match;

    if (! (match = optionsExp.match(NG_OPTIONS_REGEXP))) {
      throw 'ng-options parse error';
    }

    var 
        displayFn = match[2] || match[1],
        valueName = match[4] || match[6],
        keyName = match[5],
        groupByFn = match[3] || '',
        valueFn = match[2] ? match[1] : valueName,
        valuesFn = match[7],
        track = match[8],
        trackFn = track ? match[8] : null;

    var ngRepeat;
    if (keyName === undefined) { // array
      ngRepeat = valueName + ' in ' + valuesFn;
      if (track !== undefined) {
        ngRepeat += ' track by '+trackFn;
      }
    } else { // object
      ngRepeat = '('+keyName+', '+valueName+') in '+valuesFn;
    }
    
    // group not supported yet
    return {
      ngRepeat: ngRepeat,
      locals: {
        valueName: valueName,
        keyName: keyName,
        valueFn: valueFn,
        displayFn: displayFn
      }
    };
  }

  return parser;
}]);

/*
Editable themes:
- default
- bootstrap 2
- bootstrap 3

Note: in postrender() `this` is instance of editableController
*/
angular.module('xeditable').factory('editableThemes', function() {
  var themes = {
    //default
    'default': {
      formTpl:      '<form class="editable-wrap"></form>',
      noformTpl:    '<span class="editable-wrap"></span>',
      controlsTpl:  '<span class="editable-controls"></span>',
      inputTpl:     '',
      errorTpl:     '<div class="editable-error" ng-show="$error" ng-bind="$error"></div>',
      buttonsTpl:   '<span class="editable-buttons"></span>',
      submitTpl:    '<button type="submit">save</button>',
      cancelTpl:    '<button type="button" ng-click="$form.$cancel()">cancel</button>'
    },

    //bs2
    'bs2': {
      formTpl:     '<form class="form-inline editable-wrap" role="form"></form>',
      noformTpl:   '<span class="editable-wrap"></span>',
      controlsTpl: '<div class="editable-controls controls control-group" ng-class="{\'error\': $error}"></div>',
      inputTpl:    '',
      errorTpl:    '<div class="editable-error help-block" ng-show="$error" ng-bind="$error"></div>',
      buttonsTpl:  '<span class="editable-buttons"></span>',
      submitTpl:   '<button type="submit" class="btn btn-primary"><span class="icon-ok icon-white"></span></button>',
      cancelTpl:   '<button type="button" class="btn" ng-click="$form.$cancel()">'+
                      '<span class="icon-remove"></span>'+
                   '</button>'

    },

    //bs3
    'bs3': {
      formTpl:     '<form class="form-inline editable-wrap" role="form"></form>',
      noformTpl:   '<span class="editable-wrap"></span>',
      controlsTpl: '<div class="editable-controls form-group" ng-class="{\'has-error\': $error}"></div>',
      inputTpl:    '',
      errorTpl:    '<div class="editable-error help-block" ng-show="$error" ng-bind="$error"></div>',
      buttonsTpl:  '<span class="editable-buttons"></span>',
      submitTpl:   '<button type="submit" class="btn btn-primary btn-xs"><span class="icon-ok"></span></button>',
      cancelTpl:   '<button type="button" class="btn btn-default btn-xs" ng-click="$form.$cancel()">'+
                     '<span class="icon-remove"></span>'+
                   '</button>',

      //bs3 specific prop to change buttons class: btn-sm, btn-lg
      buttonsClass: '',
      //bs3 specific prop to change standard inputs class: input-sm, input-lg
      inputClass: '',
      postrender: function() {
        //apply `form-control` class to std inputs
        switch(this.directiveName) {
          case 'editableText':
          case 'editableSelect':
          case 'editableTextarea':
          case 'editableEmail':
          case 'editableTel':
          case 'editableNumber':
          case 'editableUrl':
          case 'editableSearch':
          case 'editableDate':
          case 'editableDatetime':
          case 'editableTime':
          case 'editableMonth':
          case 'editableWeek':
            this.inputEl.addClass('form-control');
            if(this.theme.inputClass) {
              // don`t apply `input-sm` and `input-lg` to select multiple
              // should be fixed in bs itself!
              if(this.inputEl.attr('multiple') &&
                (this.theme.inputClass === 'input-sm' || this.theme.inputClass === 'input-lg')) {
                  break;
              }
              this.inputEl.addClass(this.theme.inputClass);
            }
          break;
        }

        //apply buttonsClass (bs3 specific!)
        if(this.buttonsEl && this.theme.buttonsClass) {
          this.buttonsEl.find('button').addClass(this.theme.buttonsClass);
        }
      }
    }
  };

  return themes;
});
