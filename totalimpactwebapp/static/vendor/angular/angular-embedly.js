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
