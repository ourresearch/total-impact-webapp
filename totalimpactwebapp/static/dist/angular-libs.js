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
