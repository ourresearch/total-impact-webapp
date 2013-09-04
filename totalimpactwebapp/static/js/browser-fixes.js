// lets you use the indexOf() method on arrays.
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}

// returns a version of the array with duplicate values removed.
Array.prototype.unique = function() {
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i]] = this[i];
    for(i in o) r.push(o[i]);
    return r;
};



// patch Array.filter() for IE8
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter#Compatibility
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";

    if (this == null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}


// Patch Array.map() for IE8
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map#Browser_compatibility
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {
    var T, A, k;
    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }
    if (thisArg) {
      T = thisArg;
    }
    A = new Array(len);
    k = 0;
    while(k < len) {
      var kValue, mappedValue;
      if (k in O) {
        kValue = O[ k ];
        mappedValue = callback.call(T, kValue, k, O);
        A[ k ] = mappedValue;
      }
      k++;
    }
    return A;
  };
}

