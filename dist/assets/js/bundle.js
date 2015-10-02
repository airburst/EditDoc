(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

// Full polyfill for browsers with no classList support
if (!("classList" in document.createElement("_"))) {
  (function (view) {

  "use strict";

  if (!('Element' in view)) return;

  var
      classListProp = "classList"
    , protoProp = "prototype"
    , elemCtrProto = view.Element[protoProp]
    , objCtr = Object
    , strTrim = String[protoProp].trim || function () {
      return this.replace(/^\s+|\s+$/g, "");
    }
    , arrIndexOf = Array[protoProp].indexOf || function (item) {
      var
          i = 0
        , len = this.length
      ;
      for (; i < len; i++) {
        if (i in this && this[i] === item) {
          return i;
        }
      }
      return -1;
    }
    // Vendors: please allow content code to instantiate DOMExceptions
    , DOMEx = function (type, message) {
      this.name = type;
      this.code = DOMException[type];
      this.message = message;
    }
    , checkTokenAndGetIndex = function (classList, token) {
      if (token === "") {
        throw new DOMEx(
            "SYNTAX_ERR"
          , "An invalid or illegal string was specified"
        );
      }
      if (/\s/.test(token)) {
        throw new DOMEx(
            "INVALID_CHARACTER_ERR"
          , "String contains an invalid character"
        );
      }
      return arrIndexOf.call(classList, token);
    }
    , ClassList = function (elem) {
      var
          trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
        , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
        , i = 0
        , len = classes.length
      ;
      for (; i < len; i++) {
        this.push(classes[i]);
      }
      this._updateClassName = function () {
        elem.setAttribute("class", this.toString());
      };
    }
    , classListProto = ClassList[protoProp] = []
    , classListGetter = function () {
      return new ClassList(this);
    }
  ;
  // Most DOMException implementations don't allow calling DOMException's toString()
  // on non-DOMExceptions. Error's toString() is sufficient here.
  DOMEx[protoProp] = Error[protoProp];
  classListProto.item = function (i) {
    return this[i] || null;
  };
  classListProto.contains = function (token) {
    token += "";
    return checkTokenAndGetIndex(this, token) !== -1;
  };
  classListProto.add = function () {
    var
        tokens = arguments
      , i = 0
      , l = tokens.length
      , token
      , updated = false
    ;
    do {
      token = tokens[i] + "";
      if (checkTokenAndGetIndex(this, token) === -1) {
        this.push(token);
        updated = true;
      }
    }
    while (++i < l);

    if (updated) {
      this._updateClassName();
    }
  };
  classListProto.remove = function () {
    var
        tokens = arguments
      , i = 0
      , l = tokens.length
      , token
      , updated = false
      , index
    ;
    do {
      token = tokens[i] + "";
      index = checkTokenAndGetIndex(this, token);
      while (index !== -1) {
        this.splice(index, 1);
        updated = true;
        index = checkTokenAndGetIndex(this, token);
      }
    }
    while (++i < l);

    if (updated) {
      this._updateClassName();
    }
  };
  classListProto.toggle = function (token, force) {
    token += "";

    var
        result = this.contains(token)
      , method = result ?
        force !== true && "remove"
      :
        force !== false && "add"
    ;

    if (method) {
      this[method](token);
    }

    if (force === true || force === false) {
      return force;
    } else {
      return !result;
    }
  };
  classListProto.toString = function () {
    return this.join(" ");
  };

  if (objCtr.defineProperty) {
    var classListPropDesc = {
        get: classListGetter
      , enumerable: true
      , configurable: true
    };
    try {
      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    } catch (ex) { // IE 8 doesn't support enumerable:true
      if (ex.number === -0x7FF5EC54) {
        classListPropDesc.enumerable = false;
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      }
    }
  } else if (objCtr[protoProp].__defineGetter__) {
    elemCtrProto.__defineGetter__(classListProp, classListGetter);
  }

  }(self));
}

/* Blob.js
 * A Blob implementation.
 * 2014-07-24
 *
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/dsamarin
 * License: X11/MIT
 *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

(function (view) {
  "use strict";

  view.URL = view.URL || view.webkitURL;

  if (view.Blob && view.URL) {
    try {
      new Blob;
      return;
    } catch (e) {}
  }

  // Internally we use a BlobBuilder implementation to base Blob off of
  // in order to support older browsers that only have BlobBuilder
  var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || (function(view) {
    var
        get_class = function(object) {
        return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
      }
      , FakeBlobBuilder = function BlobBuilder() {
        this.data = [];
      }
      , FakeBlob = function Blob(data, type, encoding) {
        this.data = data;
        this.size = data.length;
        this.type = type;
        this.encoding = encoding;
      }
      , FBB_proto = FakeBlobBuilder.prototype
      , FB_proto = FakeBlob.prototype
      , FileReaderSync = view.FileReaderSync
      , FileException = function(type) {
        this.code = this[this.name = type];
      }
      , file_ex_codes = (
          "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
        + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
      ).split(" ")
      , file_ex_code = file_ex_codes.length
      , real_URL = view.URL || view.webkitURL || view
      , real_create_object_URL = real_URL.createObjectURL
      , real_revoke_object_URL = real_URL.revokeObjectURL
      , URL = real_URL
      , btoa = view.btoa
      , atob = view.atob

      , ArrayBuffer = view.ArrayBuffer
      , Uint8Array = view.Uint8Array

      , origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/
    ;
    FakeBlob.fake = FB_proto.fake = true;
    while (file_ex_code--) {
      FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
    }
    // Polyfill URL
    if (!real_URL.createObjectURL) {
      URL = view.URL = function(uri) {
        var
            uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
          , uri_origin
        ;
        uri_info.href = uri;
        if (!("origin" in uri_info)) {
          if (uri_info.protocol.toLowerCase() === "data:") {
            uri_info.origin = null;
          } else {
            uri_origin = uri.match(origin);
            uri_info.origin = uri_origin && uri_origin[1];
          }
        }
        return uri_info;
      };
    }
    URL.createObjectURL = function(blob) {
      var
          type = blob.type
        , data_URI_header
      ;
      if (type === null) {
        type = "application/octet-stream";
      }
      if (blob instanceof FakeBlob) {
        data_URI_header = "data:" + type;
        if (blob.encoding === "base64") {
          return data_URI_header + ";base64," + blob.data;
        } else if (blob.encoding === "URI") {
          return data_URI_header + "," + decodeURIComponent(blob.data);
        } if (btoa) {
          return data_URI_header + ";base64," + btoa(blob.data);
        } else {
          return data_URI_header + "," + encodeURIComponent(blob.data);
        }
      } else if (real_create_object_URL) {
        return real_create_object_URL.call(real_URL, blob);
      }
    };
    URL.revokeObjectURL = function(object_URL) {
      if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
        real_revoke_object_URL.call(real_URL, object_URL);
      }
    };
    FBB_proto.append = function(data/*, endings*/) {
      var bb = this.data;
      // decode data to a binary string
      if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
        var
            str = ""
          , buf = new Uint8Array(data)
          , i = 0
          , buf_len = buf.length
        ;
        for (; i < buf_len; i++) {
          str += String.fromCharCode(buf[i]);
        }
        bb.push(str);
      } else if (get_class(data) === "Blob" || get_class(data) === "File") {
        if (FileReaderSync) {
          var fr = new FileReaderSync;
          bb.push(fr.readAsBinaryString(data));
        } else {
          // async FileReader won't work as BlobBuilder is sync
          throw new FileException("NOT_READABLE_ERR");
        }
      } else if (data instanceof FakeBlob) {
        if (data.encoding === "base64" && atob) {
          bb.push(atob(data.data));
        } else if (data.encoding === "URI") {
          bb.push(decodeURIComponent(data.data));
        } else if (data.encoding === "raw") {
          bb.push(data.data);
        }
      } else {
        if (typeof data !== "string") {
          data += ""; // convert unsupported types to strings
        }
        // decode UTF-16 to binary string
        bb.push(unescape(encodeURIComponent(data)));
      }
    };
    FBB_proto.getBlob = function(type) {
      if (!arguments.length) {
        type = null;
      }
      return new FakeBlob(this.data.join(""), type, "raw");
    };
    FBB_proto.toString = function() {
      return "[object BlobBuilder]";
    };
    FB_proto.slice = function(start, end, type) {
      var args = arguments.length;
      if (args < 3) {
        type = null;
      }
      return new FakeBlob(
          this.data.slice(start, args > 1 ? end : this.data.length)
        , type
        , this.encoding
      );
    };
    FB_proto.toString = function() {
      return "[object Blob]";
    };
    FB_proto.close = function() {
      this.size = 0;
      delete this.data;
    };
    return FakeBlobBuilder;
  }(view));

  view.Blob = function(blobParts, options) {
    var type = options ? (options.type || "") : "";
    var builder = new BlobBuilder();
    if (blobParts) {
      for (var i = 0, len = blobParts.length; i < len; i++) {
        if (Uint8Array && blobParts[i] instanceof Uint8Array) {
          builder.append(blobParts[i].buffer);
        }
        else {
          builder.append(blobParts[i]);
        }
      }
    }
    var blob = builder.getBlob(type);
    if (!blob.slice && blob.webkitSlice) {
      blob.slice = blob.webkitSlice;
    }
    return blob;
  };

  var getPrototypeOf = Object.getPrototypeOf || function(object) {
    return object.__proto__;
  };
  view.Blob.prototype = getPrototypeOf(new view.Blob());
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));

(function (root, factory) {
    'use strict';
    if (typeof module === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory;
        });
    } else {
        root.MediumEditor = factory;
    }
}(this, function () {

    'use strict';

function MediumEditor(elements, options) {
    'use strict';
    return this.init(elements, options);
}

MediumEditor.extensions = {};
/*jshint unused: true */
(function (window) {
    'use strict';

    function copyInto(overwrite, dest) {
        var prop,
            sources = Array.prototype.slice.call(arguments, 2);
        dest = dest || {};
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            if (source) {
                for (prop in source) {
                    if (source.hasOwnProperty(prop) &&
                        typeof source[prop] !== 'undefined' &&
                        (overwrite || dest.hasOwnProperty(prop) === false)) {
                        dest[prop] = source[prop];
                    }
                }
            }
        }
        return dest;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
    // Some browsers (including phantom) don't return true for Node.contains(child)
    // if child is a text node.  Detect these cases here and use a fallback
    // for calls to Util.isDescendant()
    var nodeContainsWorksWithTextNodes = false;
    try {
        var testParent = document.createElement('div'),
            testText = document.createTextNode(' ');
        testParent.appendChild(testText);
        nodeContainsWorksWithTextNodes = testParent.contains(testText);
    } catch (exc) {}

    var Util = {

        // http://stackoverflow.com/questions/17907445/how-to-detect-ie11#comment30165888_17907562
        // by rg89
        isIE: ((navigator.appName === 'Microsoft Internet Explorer') || ((navigator.appName === 'Netscape') && (new RegExp('Trident/.*rv:([0-9]{1,}[.0-9]{0,})').exec(navigator.userAgent) !== null))),

        // http://stackoverflow.com/a/11752084/569101
        isMac: (window.navigator.platform.toUpperCase().indexOf('MAC') >= 0),

        // https://github.com/jashkenas/underscore
        keyCode: {
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            DELETE: 46,
            K: 75, // K keycode, and not k
            M: 77
        },

        /**
         * Returns true if it's metaKey on Mac, or ctrlKey on non-Mac.
         * See #591
         */
        isMetaCtrlKey: function (event) {
            if ((Util.isMac && event.metaKey) || (!Util.isMac && event.ctrlKey)) {
                return true;
            }

            return false;
        },

        /**
         * Returns true if the key associated to the event is inside keys array
         *
         * @see : https://github.com/jquery/jquery/blob/0705be475092aede1eddae01319ec931fb9c65fc/src/event.js#L473-L484
         * @see : http://stackoverflow.com/q/4471582/569101
         */
        isKey: function (event, keys) {
            var keyCode = Util.getKeyCode(event);

            // it's not an array let's just compare strings!
            if (false === Array.isArray(keys)) {
                return keyCode === keys;
            }

            if (-1 === keys.indexOf(keyCode)) {
                return false;
            }

            return true;
        },

        getKeyCode: function (event) {
            var keyCode = event.which;

            // getting the key code from event
            if (null === keyCode) {
                keyCode = event.charCode !== null ? event.charCode : event.keyCode;
            }

            return keyCode;
        },

        blockContainerElementNames: [
            // elements our editor generates
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'li', 'ol',
            // all other known block elements
            'address', 'article', 'aside', 'audio', 'canvas', 'dd', 'dl', 'dt', 'fieldset',
            'figcaption', 'figure', 'footer', 'form', 'header', 'hgroup', 'main', 'nav',
            'noscript', 'output', 'section', 'video',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'
        ],

        emptyElementNames: ['br', 'col', 'colgroup', 'hr', 'img', 'input', 'source', 'wbr'],

        extend: function extend(/* dest, source1, source2, ...*/) {
            var args = [true].concat(Array.prototype.slice.call(arguments));
            return copyInto.apply(this, args);
        },

        defaults: function defaults(/*dest, source1, source2, ...*/) {
            var args = [false].concat(Array.prototype.slice.call(arguments));
            return copyInto.apply(this, args);
        },

        /*
         * Create a link around the provided text nodes which must be adjacent to each other and all be
         * descendants of the same closest block container. If the preconditions are not met, unexpected
         * behavior will result.
         */
        createLink: function (document, textNodes, href, target) {
            var anchor = document.createElement('a');
            Util.moveTextRangeIntoElement(textNodes[0], textNodes[textNodes.length - 1], anchor);
            anchor.setAttribute('href', href);
            if (target) {
                anchor.setAttribute('target', target);
            }
            return anchor;
        },

        /*
         * Given the provided match in the format {start: 1, end: 2} where start and end are indices into the
         * textContent of the provided element argument, modify the DOM inside element to ensure that the text
         * identified by the provided match can be returned as text nodes that contain exactly that text, without
         * any additional text at the beginning or end of the returned array of adjacent text nodes.
         *
         * The only DOM manipulation performed by this function is splitting the text nodes, non-text nodes are
         * not affected in any way.
         */
        findOrCreateMatchingTextNodes: function (document, element, match) {
            var treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false),
                matchedNodes = [],
                currentTextIndex = 0,
                startReached = false,
                currentNode = null,
                newNode = null;

            while ((currentNode = treeWalker.nextNode()) !== null) {
                if (!startReached && match.start < (currentTextIndex + currentNode.nodeValue.length)) {
                    startReached = true;
                    newNode = Util.splitStartNodeIfNeeded(currentNode, match.start, currentTextIndex);
                }
                if (startReached) {
                    Util.splitEndNodeIfNeeded(currentNode, newNode, match.end, currentTextIndex);
                }
                if (startReached && currentTextIndex === match.end) {
                    break; // Found the node(s) corresponding to the link. Break out and move on to the next.
                } else if (startReached && currentTextIndex > (match.end + 1)) {
                    throw new Error('PerformLinking overshot the target!'); // should never happen...
                }

                if (startReached) {
                    matchedNodes.push(newNode || currentNode);
                }

                currentTextIndex += currentNode.nodeValue.length;
                if (newNode !== null) {
                    currentTextIndex += newNode.nodeValue.length;
                    // Skip the newNode as we'll already have pushed it to the matches
                    treeWalker.nextNode();
                }
                newNode = null;
            }
            return matchedNodes;
        },

        /*
         * Given the provided text node and text coordinates, split the text node if needed to make it align
         * precisely with the coordinates.
         *
         * This function is intended to be called from Util.findOrCreateMatchingTextNodes.
         */
        splitStartNodeIfNeeded: function (currentNode, matchStartIndex, currentTextIndex) {
            if (matchStartIndex !== currentTextIndex) {
                return currentNode.splitText(matchStartIndex - currentTextIndex);
            }
            return null;
        },

        /*
         * Given the provided text node and text coordinates, split the text node if needed to make it align
         * precisely with the coordinates. The newNode argument should from the result of Util.splitStartNodeIfNeeded,
         * if that function has been called on the same currentNode.
         *
         * This function is intended to be called from Util.findOrCreateMatchingTextNodes.
         */
        splitEndNodeIfNeeded: function (currentNode, newNode, matchEndIndex, currentTextIndex) {
            var textIndexOfEndOfFarthestNode,
                endSplitPoint;
            textIndexOfEndOfFarthestNode = currentTextIndex + (newNode || currentNode).nodeValue.length +
                    (newNode ? currentNode.nodeValue.length : 0) -
                    1;
            endSplitPoint = (newNode || currentNode).nodeValue.length -
                    (textIndexOfEndOfFarthestNode + 1 - matchEndIndex);
            if (textIndexOfEndOfFarthestNode >= matchEndIndex &&
                    currentTextIndex !== textIndexOfEndOfFarthestNode &&
                    endSplitPoint !== 0) {
                (newNode || currentNode).splitText(endSplitPoint);
            }
        },

        /*
        * Take an element, and break up all of its text content into unique pieces such that:
         * 1) All text content of the elements are in separate blocks. No piece of text content should span
         *    span multiple blocks. This means no element return by this function should have
         *    any blocks as children.
         * 2) The union of the textcontent of all of the elements returned here covers all
         *    of the text within the element.
         *
         *
         * EXAMPLE:
         * In the event that we have something like:
         *
         * <blockquote>
         *   <p>Some Text</p>
         *   <ol>
         *     <li>List Item 1</li>
         *     <li>List Item 2</li>
         *   </ol>
         * </blockquote>
         *
         * This function would return these elements as an array:
         *   [ <p>Some Text</p>, <li>List Item 1</li>, <li>List Item 2</li> ]
         *
         * Since the <blockquote> and <ol> elements contain blocks within them they are not returned.
         * Since the <p> and <li>'s don't contain block elements and cover all the text content of the
         * <blockquote> container, they are the elements returned.
         */
        splitByBlockElements: function (element) {
            var toRet = [],
                blockElementQuery = MediumEditor.util.blockContainerElementNames.join(',');

            if (element.nodeType === 3 || element.querySelectorAll(blockElementQuery).length === 0) {
                return [element];
            }

            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes[i];
                if (child.nodeType === 3) {
                    toRet.push(child);
                } else {
                    var blockElements = child.querySelectorAll(blockElementQuery);
                    if (blockElements.length === 0) {
                        toRet.push(child);
                    } else {
                        toRet = toRet.concat(MediumEditor.util.splitByBlockElements(child));
                    }
                }
            }

            return toRet;
        },

        // Find the next node in the DOM tree that represents any text that is being
        // displayed directly next to the targetNode (passed as an argument)
        // Text that appears directly next to the current node can be:
        //  - A sibling text node
        //  - A descendant of a sibling element
        //  - A sibling text node of an ancestor
        //  - A descendant of a sibling element of an ancestor
        findAdjacentTextNodeWithContent: function findAdjacentTextNodeWithContent(rootNode, targetNode, ownerDocument) {
            var pastTarget = false,
                nextNode,
                nodeIterator = ownerDocument.createNodeIterator(rootNode, NodeFilter.SHOW_TEXT, null, false);

            // Use a native NodeIterator to iterate over all the text nodes that are descendants
            // of the rootNode.  Once past the targetNode, choose the first non-empty text node
            nextNode = nodeIterator.nextNode();
            while (nextNode) {
                if (nextNode === targetNode) {
                    pastTarget = true;
                } else if (pastTarget) {
                    if (nextNode.nodeType === 3 && nextNode.nodeValue && nextNode.nodeValue.trim().length > 0) {
                        break;
                    }
                }
                nextNode = nodeIterator.nextNode();
            }

            return nextNode;
        },

        isDescendant: function isDescendant(parent, child, checkEquality) {
            if (!parent || !child) {
                return false;
            }
            if (parent === child) {
                return !!checkEquality;
            }
            // If parent is not an element, it can't have any descendants
            if (parent.nodeType !== 1) {
                return false;
            }
            if (nodeContainsWorksWithTextNodes || child.nodeType !== 3) {
                return parent.contains(child);
            }
            var node = child.parentNode;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        // https://github.com/jashkenas/underscore
        isElement: function isElement(obj) {
            return !!(obj && obj.nodeType === 1);
        },

        // https://github.com/jashkenas/underscore
        throttle: function (func, wait) {
            var THROTTLE_INTERVAL = 50,
                context,
                args,
                result,
                timeout = null,
                previous = 0,
                later = function () {
                    previous = Date.now();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                };

            if (!wait && wait !== 0) {
                wait = THROTTLE_INTERVAL;
            }

            return function () {
                var now = Date.now(),
                    remaining = wait - (now - previous);

                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },

        traverseUp: function (current, testElementFunction) {
            if (!current) {
                return false;
            }

            do {
                if (current.nodeType === 1) {
                    if (testElementFunction(current)) {
                        return current;
                    }
                    // do not traverse upwards past the nearest containing editor
                    if (Util.isMediumEditorElement(current)) {
                        return false;
                    }
                }

                current = current.parentNode;
            } while (current);

            return false;
        },

        htmlEntities: function (str) {
            // converts special characters (like <) into their escaped/encoded values (like &lt;).
            // This allows you to show to display the string without the browser reading it as HTML.
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        },

        // http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
        insertHTMLCommand: function (doc, html) {
            var selection, range, el, fragment, node, lastNode, toReplace;

            if (doc.queryCommandSupported('insertHTML')) {
                try {
                    return doc.execCommand('insertHTML', false, html);
                } catch (ignore) {}
            }

            selection = doc.getSelection();
            if (selection.rangeCount) {
                range = selection.getRangeAt(0);
                toReplace = range.commonAncestorContainer;

                // https://github.com/yabwe/medium-editor/issues/748
                // If the selection is an empty editor element, create a temporary text node inside of the editor
                // and select it so that we don't delete the editor element
                if (Util.isMediumEditorElement(toReplace) && !toReplace.firstChild) {
                    range.selectNode(toReplace.appendChild(doc.createTextNode('')));
                } else if ((toReplace.nodeType === 3 && range.startOffset === 0 && range.endOffset === toReplace.nodeValue.length) ||
                        (toReplace.nodeType !== 3 && toReplace.innerHTML === range.toString())) {
                    // Ensure range covers maximum amount of nodes as possible
                    // By moving up the DOM and selecting ancestors whose only child is the range
                    while (!Util.isMediumEditorElement(toReplace) &&
                            toReplace.parentNode &&
                            toReplace.parentNode.childNodes.length === 1 &&
                            !Util.isMediumEditorElement(toReplace.parentNode)) {
                        toReplace = toReplace.parentNode;
                    }
                    range.selectNode(toReplace);
                }
                range.deleteContents();

                el = doc.createElement('div');
                el.innerHTML = html;
                fragment = doc.createDocumentFragment();
                while (el.firstChild) {
                    node = el.firstChild;
                    lastNode = fragment.appendChild(node);
                }
                range.insertNode(fragment);

                // Preserve the selection:
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        },

        execFormatBlock: function (doc, tagName) {
            // Get the top level block element that contains the selection
            var blockContainer = Util.getTopBlockContainer(MediumEditor.selection.getSelectionStart(doc));

            // Special handling for blockquote
            if (tagName === 'blockquote') {
                if (blockContainer) {
                    var childNodes = Array.prototype.slice.call(blockContainer.childNodes);
                    // Check if the blockquote has a block element as a child (nested blocks)
                    if (childNodes.some(function (childNode) {
                        return Util.isBlockContainer(childNode);
                    })) {
                        // FF handles blockquote differently on formatBlock
                        // allowing nesting, we need to use outdent
                        // https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla
                        return doc.execCommand('outdent', false, null);
                    }
                }

                // When IE blockquote needs to be called as indent
                // http://stackoverflow.com/questions/1816223/rich-text-editor-with-blockquote-function/1821777#1821777
                if (Util.isIE) {
                    return doc.execCommand('indent', false, tagName);
                }
            }

            // If the blockContainer is already the element type being passed in
            // treat it as 'undo' formatting and just convert it to a <p>
            if (blockContainer && tagName === blockContainer.nodeName.toLowerCase()) {
                tagName = 'p';
            }

            // When IE we need to add <> to heading elements
            // http://stackoverflow.com/questions/10741831/execcommand-formatblock-headings-in-ie
            if (Util.isIE) {
                tagName = '<' + tagName + '>';
            }
            return doc.execCommand('formatBlock', false, tagName);
        },

        /**
         * Set target to blank on the given el element
         *
         * TODO: not sure if this should be here
         *
         * When creating a link (using core -> createLink) the selection returned by Firefox will be the parent of the created link
         * instead of the created link itself (as it is for Chrome for example), so we retrieve all "a" children to grab the good one by
         * using `anchorUrl` to ensure that we are adding target="_blank" on the good one.
         * This isn't a bulletproof solution anyway ..
         */
        setTargetBlank: function (el, anchorUrl) {
            var i, url = anchorUrl || false;
            if (el.nodeName.toLowerCase() === 'a') {
                el.target = '_blank';
            } else {
                el = el.getElementsByTagName('a');

                for (i = 0; i < el.length; i += 1) {
                    if (false === url || url === el[i].attributes.href.value) {
                        el[i].target = '_blank';
                    }
                }
            }
        },

        addClassToAnchors: function (el, buttonClass) {
            var classes = buttonClass.split(' '),
                i,
                j;
            if (el.nodeName.toLowerCase() === 'a') {
                for (j = 0; j < classes.length; j += 1) {
                    el.classList.add(classes[j]);
                }
            } else {
                el = el.getElementsByTagName('a');
                for (i = 0; i < el.length; i += 1) {
                    for (j = 0; j < classes.length; j += 1) {
                        el[i].classList.add(classes[j]);
                    }
                }
            }
        },

        isListItem: function (node) {
            if (!node) {
                return false;
            }
            if (node.nodeName.toLowerCase() === 'li') {
                return true;
            }

            var parentNode = node.parentNode,
                tagName = parentNode.nodeName.toLowerCase();
            while (tagName === 'li' || (!Util.isBlockContainer(parentNode) && tagName !== 'div')) {
                if (tagName === 'li') {
                    return true;
                }
                parentNode = parentNode.parentNode;
                if (parentNode) {
                    tagName = parentNode.nodeName.toLowerCase();
                } else {
                    return false;
                }
            }
            return false;
        },

        cleanListDOM: function (ownerDocument, element) {
            if (element.nodeName.toLowerCase() !== 'li') {
                return;
            }

            var list = element.parentElement;

            if (list.parentElement.nodeName.toLowerCase() === 'p') { // yes we need to clean up
                Util.unwrap(list.parentElement, ownerDocument);

                // move cursor at the end of the text inside the list
                // for some unknown reason, the cursor is moved to end of the "visual" line
                MediumEditor.selection.moveCursor(ownerDocument, element.firstChild, element.firstChild.textContent.length);
            }
        },

        /* splitDOMTree
         *
         * Given a root element some descendant element, split the root element
         * into its own element containing the descendant element and all elements
         * on the left or right side of the descendant ('right' is default)
         *
         * example:
         *
         *         <div>
         *      /    |   \
         *  <span> <span> <span>
         *   / \    / \    / \
         *  1   2  3   4  5   6
         *
         *  If I wanted to split this tree given the <div> as the root and "4" as the leaf
         *  the result would be (the prime ' marks indicates nodes that are created as clones):
         *
         *   SPLITTING OFF 'RIGHT' TREE       SPLITTING OFF 'LEFT' TREE
         *
         *     <div>            <div>'              <div>'      <div>
         *      / \              / \                 / \          |
         * <span> <span>   <span>' <span>       <span> <span>   <span>
         *   / \    |        |      / \           /\     /\       /\
         *  1   2   3        4     5   6         1  2   3  4     5  6
         *
         *  The above example represents splitting off the 'right' or 'left' part of a tree, where
         *  the <div>' would be returned as an element not appended to the DOM, and the <div>
         *  would remain in place where it was
         *
        */
        splitOffDOMTree: function (rootNode, leafNode, splitLeft) {
            var splitOnNode = leafNode,
                createdNode = null,
                splitRight = !splitLeft;

            // loop until we hit the root
            while (splitOnNode !== rootNode) {
                var currParent = splitOnNode.parentNode,
                    newParent = currParent.cloneNode(false),
                    targetNode = (splitRight ? splitOnNode : currParent.firstChild),
                    appendLast;

                // Create a new parent element which is a clone of the current parent
                if (createdNode) {
                    if (splitRight) {
                        // If we're splitting right, add previous created element before siblings
                        newParent.appendChild(createdNode);
                    } else {
                        // If we're splitting left, add previous created element last
                        appendLast = createdNode;
                    }
                }
                createdNode = newParent;

                while (targetNode) {
                    var sibling = targetNode.nextSibling;
                    // Special handling for the 'splitNode'
                    if (targetNode === splitOnNode) {
                        if (!targetNode.hasChildNodes()) {
                            targetNode.parentNode.removeChild(targetNode);
                        } else {
                            // For the node we're splitting on, if it has children, we need to clone it
                            // and not just move it
                            targetNode = targetNode.cloneNode(false);
                        }
                        // If the resulting split node has content, add it
                        if (targetNode.textContent) {
                            createdNode.appendChild(targetNode);
                        }

                        targetNode = (splitRight ? sibling : null);
                    } else {
                        // For general case, just remove the element and only
                        // add it to the split tree if it contains something
                        targetNode.parentNode.removeChild(targetNode);
                        if (targetNode.hasChildNodes() || targetNode.textContent) {
                            createdNode.appendChild(targetNode);
                        }

                        targetNode = sibling;
                    }
                }

                // If we had an element we wanted to append at the end, do that now
                if (appendLast) {
                    createdNode.appendChild(appendLast);
                }

                splitOnNode = currParent;
            }

            return createdNode;
        },

        moveTextRangeIntoElement: function (startNode, endNode, newElement) {
            if (!startNode || !endNode) {
                return false;
            }

            var rootNode = Util.findCommonRoot(startNode, endNode);
            if (!rootNode) {
                return false;
            }

            if (endNode === startNode) {
                var temp = startNode.parentNode,
                    sibling = startNode.nextSibling;
                temp.removeChild(startNode);
                newElement.appendChild(startNode);
                if (sibling) {
                    temp.insertBefore(newElement, sibling);
                } else {
                    temp.appendChild(newElement);
                }
                return newElement.hasChildNodes();
            }

            // create rootChildren array which includes all the children
            // we care about
            var rootChildren = [],
                firstChild,
                lastChild,
                nextNode;
            for (var i = 0; i < rootNode.childNodes.length; i++) {
                nextNode = rootNode.childNodes[i];
                if (!firstChild) {
                    if (Util.isDescendant(nextNode, startNode, true)) {
                        firstChild = nextNode;
                    }
                } else {
                    if (Util.isDescendant(nextNode, endNode, true)) {
                        lastChild = nextNode;
                        break;
                    } else {
                        rootChildren.push(nextNode);
                    }
                }
            }

            var afterLast = lastChild.nextSibling,
                fragment = rootNode.ownerDocument.createDocumentFragment();

            // build up fragment on startNode side of tree
            if (firstChild === startNode) {
                firstChild.parentNode.removeChild(firstChild);
                fragment.appendChild(firstChild);
            } else {
                fragment.appendChild(Util.splitOffDOMTree(firstChild, startNode));
            }

            // add any elements between firstChild & lastChild
            rootChildren.forEach(function (element) {
                element.parentNode.removeChild(element);
                fragment.appendChild(element);
            });

            // build up fragment on endNode side of the tree
            if (lastChild === endNode) {
                lastChild.parentNode.removeChild(lastChild);
                fragment.appendChild(lastChild);
            } else {
                fragment.appendChild(Util.splitOffDOMTree(lastChild, endNode, true));
            }

            // Add fragment into passed in element
            newElement.appendChild(fragment);

            if (lastChild.parentNode === rootNode) {
                // If last child is in the root, insert newElement in front of it
                rootNode.insertBefore(newElement, lastChild);
            } else if (afterLast) {
                // If last child was removed, but it had a sibling, insert in front of it
                rootNode.insertBefore(newElement, afterLast);
            } else {
                // lastChild was removed and was the last actual element just append
                rootNode.appendChild(newElement);
            }

            return newElement.hasChildNodes();
        },

        /* based on http://stackoverflow.com/a/6183069 */
        depthOfNode: function (inNode) {
            var theDepth = 0,
                node = inNode;
            while (node.parentNode !== null) {
                node = node.parentNode;
                theDepth++;
            }
            return theDepth;
        },

        findCommonRoot: function (inNode1, inNode2) {
            var depth1 = Util.depthOfNode(inNode1),
                depth2 = Util.depthOfNode(inNode2),
                node1 = inNode1,
                node2 = inNode2;

            while (depth1 !== depth2) {
                if (depth1 > depth2) {
                    node1 = node1.parentNode;
                    depth1 -= 1;
                } else {
                    node2 = node2.parentNode;
                    depth2 -= 1;
                }
            }

            while (node1 !== node2) {
                node1 = node1.parentNode;
                node2 = node2.parentNode;
            }

            return node1;
        },
        /* END - based on http://stackoverflow.com/a/6183069 */

        isElementAtBeginningOfBlock: function (node) {
            var textVal,
                sibling;
            while (!Util.isBlockContainer(node) && !Util.isMediumEditorElement(node)) {
                sibling = node;
                while (sibling = sibling.previousSibling) {
                    textVal = sibling.nodeType === 3 ? sibling.nodeValue : sibling.textContent;
                    if (textVal.length > 0) {
                        return false;
                    }
                }
                node = node.parentNode;
            }
            return true;
        },

        isMediumEditorElement: function (element) {
            return element && element.getAttribute && !!element.getAttribute('data-medium-editor-element');
        },

        getContainerEditorElement: function (element) {
            return Util.traverseUp(element, function (node) {
                return Util.isMediumEditorElement(node);
            });
        },

        isBlockContainer: function (element) {
            return element && element.nodeType !== 3 && Util.blockContainerElementNames.indexOf(element.nodeName.toLowerCase()) !== -1;
        },

        getClosestBlockContainer: function (node) {
            return Util.traverseUp(node, function (node) {
                return Util.isBlockContainer(node);
            });
        },

        getTopBlockContainer: function (element) {
            var topBlock = element;
            Util.traverseUp(element, function (el) {
                if (Util.isBlockContainer(el)) {
                    topBlock = el;
                }
                return false;
            });
            return topBlock;
        },

        getFirstSelectableLeafNode: function (element) {
            while (element && element.firstChild) {
                element = element.firstChild;
            }

            // We don't want to set the selection to an element that can't have children, this messes up Gecko.
            element = Util.traverseUp(element, function (el) {
                return Util.emptyElementNames.indexOf(el.nodeName.toLowerCase()) === -1;
            });
            // Selecting at the beginning of a table doesn't work in PhantomJS.
            if (element.nodeName.toLowerCase() === 'table') {
                var firstCell = element.querySelector('th, td');
                if (firstCell) {
                    element = firstCell;
                }
            }
            return element;
        },

        getFirstTextNode: function (element) {
            if (element.nodeType === 3) {
                return element;
            }

            for (var i = 0; i < element.childNodes.length; i++) {
                var textNode = Util.getFirstTextNode(element.childNodes[i]);
                if (textNode !== null) {
                    return textNode;
                }
            }
            return null;
        },

        ensureUrlHasProtocol: function (url) {
            if (url.indexOf('://') === -1) {
                return 'http://' + url;
            }
            return url;
        },

        warn: function () {
            if (window.console !== undefined && typeof window.console.warn === 'function') {
                window.console.warn.apply(window.console, arguments);
            }
        },

        deprecated: function (oldName, newName, version) {
            // simple deprecation warning mechanism.
            var m = oldName + ' is deprecated, please use ' + newName + ' instead.';
            if (version) {
                m += ' Will be removed in ' + version;
            }
            Util.warn(m);
        },

        deprecatedMethod: function (oldName, newName, args, version) {
            // run the replacement and warn when someone calls a deprecated method
            Util.deprecated(oldName, newName, version);
            if (typeof this[newName] === 'function') {
                this[newName].apply(this, args);
            }
        },

        cleanupAttrs: function (el, attrs) {
            attrs.forEach(function (attr) {
                el.removeAttribute(attr);
            });
        },

        cleanupTags: function (el, tags) {
            tags.forEach(function (tag) {
                if (el.nodeName.toLowerCase() === tag) {
                    el.parentNode.removeChild(el);
                }
            });
        },

        // get the closest parent
        getClosestTag: function (el, tag) {
            return Util.traverseUp(el, function (element) {
                return element.nodeName.toLowerCase() === tag.toLowerCase();
            });
        },

        unwrap: function (el, doc) {
            var fragment = doc.createDocumentFragment(),
                nodes = Array.prototype.slice.call(el.childNodes);

            // cast nodeList to array since appending child
            // to a different node will alter length of el.childNodes
            for (var i = 0; i < nodes.length; i++) {
                fragment.appendChild(nodes[i]);
            }

            if (fragment.childNodes.length) {
                el.parentNode.replaceChild(fragment, el);
            } else {
                el.parentNode.removeChild(el);
            }
        }
    };

    MediumEditor.util = Util;
}(window));

(function () {
    'use strict';

    var Extension = function (options) {
        MediumEditor.util.extend(this, options);
    };

    Extension.extend = function (protoProps) {
        // magic extender thinger. mostly borrowed from backbone/goog.inherits
        // place this function on some thing you want extend-able.
        //
        // example:
        //
        //      function Thing(args){
        //          this.options = args;
        //      }
        //
        //      Thing.prototype = { foo: "bar" };
        //      Thing.extend = extenderify;
        //
        //      var ThingTwo = Thing.extend({ foo: "baz" });
        //
        //      var thingOne = new Thing(); // foo === "bar"
        //      var thingTwo = new ThingTwo(); // foo === "baz"
        //
        //      which seems like some simply shallow copy nonsense
        //      at first, but a lot more is going on there.
        //
        //      passing a `constructor` to the extend props
        //      will cause the instance to instantiate through that
        //      instead of the parent's constructor.

        var parent = this,
            child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.

        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () {
                return parent.apply(this, arguments);
            };
        }

        // das statics (.extend comes over, so your subclass can have subclasses too)
        MediumEditor.util.extend(child, parent);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function () {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (protoProps) {
            MediumEditor.util.extend(child.prototype, protoProps);
        }

        // todo: $super?

        return child;
    };

    Extension.prototype = {
        /* init: [function]
         *
         * Called by MediumEditor during initialization.
         * The .base property will already have been set to
         * current instance of MediumEditor when this is called.
         * All helper methods will exist as well
         */
        init: function () {},

        /* base: [MediumEditor instance]
         *
         * If not overriden, this will be set to the current instance
         * of MediumEditor, before the init method is called
         */
        base: undefined,

        /* name: [string]
         *
         * 'name' of the extension, used for retrieving the extension.
         * If not set, MediumEditor will set this to be the key
         * used when passing the extension into MediumEditor via the
         * 'extensions' option
         */
        name: undefined,

        /* checkState: [function (node)]
         *
         * If implemented, this function will be called one or more times
         * the state of the editor & toolbar are updated.
         * When the state is updated, the editor does the following:
         *
         * 1) Find the parent node containing the current selection
         * 2) Call checkState on the extension, passing the node as an argument
         * 3) Get the parent node of the previous node
         * 4) Repeat steps #2 and #3 until we move outside the parent contenteditable
         */
        checkState: undefined,

        /* destroy: [function ()]
         *
         * This method should remove any created html, custom event handlers
         * or any other cleanup tasks that should be performed.
         * If implemented, this function will be called when MediumEditor's
         * destroy method has been called.
         */
        destroy: undefined,

        /* As alternatives to checkState, these functions provide a more structured
         * path to updating the state of an extension (usually a button) whenever
         * the state of the editor & toolbar are updated.
         */

        /* queryCommandState: [function ()]
         *
         * If implemented, this function will be called once on each extension
         * when the state of the editor/toolbar is being updated.
         *
         * If this function returns a non-null value, the extension will
         * be ignored as the code climbs the dom tree.
         *
         * If this function returns true, and the setActive() function is defined
         * setActive() will be called
         */
        queryCommandState: undefined,

        /* isActive: [function ()]
         *
         * If implemented, this function will be called when MediumEditor
         * has determined that this extension is 'active' for the current selection.
         * This may be called when the editor & toolbar are being updated,
         * but only if queryCommandState() or isAlreadyApplied() functions
         * are implemented, and when called, return true.
         */
        isActive: undefined,

        /* isAlreadyApplied: [function (node)]
         *
         * If implemented, this function is similar to checkState() in
         * that it will be called repeatedly as MediumEditor moves up
         * the DOM to update the editor & toolbar after a state change.
         *
         * NOTE: This function will NOT be called if checkState() has
         * been implemented. This function will NOT be called if
         * queryCommandState() is implemented and returns a non-null
         * value when called
         */
        isAlreadyApplied: undefined,

        /* setActive: [function ()]
         *
         * If implemented, this function is called when MediumEditor knows
         * that this extension is currently enabled.  Currently, this
         * function is called when updating the editor & toolbar, and
         * only if queryCommandState() or isAlreadyApplied(node) return
         * true when called
         */
        setActive: undefined,

        /* setInactive: [function ()]
         *
         * If implemented, this function is called when MediumEditor knows
         * that this extension is currently disabled.  Curently, this
         * is called at the beginning of each state change for
         * the editor & toolbar. After calling this, MediumEditor
         * will attempt to update the extension, either via checkState()
         * or the combination of queryCommandState(), isAlreadyApplied(node),
         * isActive(), and setActive()
         */
        setInactive: undefined,

        /************************ Helpers ************************
         * The following are helpers that are either set by MediumEditor
         * during initialization, or are helper methods which either
         * route calls to the MediumEditor instance or provide common
         * functionality for all extensions
         *********************************************************/

        /* window: [Window]
         *
         * If not overriden, this will be set to the window object
         * to be used by MediumEditor and its extensions.  This is
         * passed via the 'contentWindow' option to MediumEditor
         * and is the global 'window' object by default
         */
        'window': undefined,

        /* document: [Document]
         *
         * If not overriden, this will be set to the document object
         * to be used by MediumEditor and its extensions. This is
         * passed via the 'ownerDocument' optin to MediumEditor
         * and is the global 'document' object by default
         */
        'document': undefined,

        /* getEditorElements: [function ()]
         *
         * Helper function which returns an array containing
         * all the contenteditable elements for this instance
         * of MediumEditor
         */
        getEditorElements: function () {
            return this.base.elements;
        },

        /* getEditorId: [function ()]
         *
         * Helper function which returns a unique identifier
         * for this instance of MediumEditor
         */
        getEditorId: function () {
            return this.base.id;
        },

        /* getEditorOptions: [function (option)]
         *
         * Helper function which returns the value of an option
         * used to initialize this instance of MediumEditor
         */
        getEditorOption: function (option) {
            return this.base.options[option];
        }
    };

    /* List of method names to add to the prototype of Extension
     * Each of these methods will be defined as helpers that
     * just call directly into the MediumEditor instance.
     *
     * example for 'on' method:
     * Extension.prototype.on = function () {
     *     return this.base.on.apply(this.base, arguments);
     * }
     */
    [
        // general helpers
        'execAction',

        // event handling
        'on',
        'off',
        'subscribe',
        'trigger'

    ].forEach(function (helper) {
        Extension.prototype[helper] = function () {
            return this.base[helper].apply(this.base, arguments);
        };
    });

    MediumEditor.Extension = Extension;
})();

(function () {
    'use strict';

    function filterOnlyParentElements(node) {
        if (MediumEditor.util.isBlockContainer(node)) {
            return NodeFilter.FILTER_ACCEPT;
        } else {
            return NodeFilter.FILTER_SKIP;
        }
    }

    var Selection = {
        findMatchingSelectionParent: function (testElementFunction, contentWindow) {
            var selection = contentWindow.getSelection(),
                range,
                current;

            if (selection.rangeCount === 0) {
                return false;
            }

            range = selection.getRangeAt(0);
            current = range.commonAncestorContainer;

            return MediumEditor.util.traverseUp(current, testElementFunction);
        },

        getSelectionElement: function (contentWindow) {
            return this.findMatchingSelectionParent(function (el) {
                return MediumEditor.util.isMediumEditorElement(el);
            }, contentWindow);
        },

        // http://stackoverflow.com/questions/17678843/cant-restore-selection-after-html-modify-even-if-its-the-same-html
        // Tim Down
        exportSelection: function (root, doc) {
            if (!root) {
                return null;
            }

            var selectionState = null,
                selection = doc.getSelection();

            if (selection.rangeCount > 0) {
                var range = selection.getRangeAt(0),
                    preSelectionRange = range.cloneRange(),
                    start;

                preSelectionRange.selectNodeContents(root);
                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                start = preSelectionRange.toString().length;

                selectionState = {
                    start: start,
                    end: start + range.toString().length
                };
                // If start = 0 there may still be an empty paragraph before it, but we don't care.
                if (start !== 0) {
                    var emptyBlocksIndex = this.getIndexRelativeToAdjacentEmptyBlocks(doc, root, range.startContainer, range.startOffset);
                    if (emptyBlocksIndex !== -1) {
                        selectionState.emptyBlocksIndex = emptyBlocksIndex;
                    }
                }
            }

            return selectionState;
        },

        // http://stackoverflow.com/questions/17678843/cant-restore-selection-after-html-modify-even-if-its-the-same-html
        // Tim Down
        //
        // {object} selectionState - the selection to import
        // {DOMElement} root - the root element the selection is being restored inside of
        // {Document} doc - the document to use for managing selection
        // {boolean} [favorLaterSelectionAnchor] - defaults to false. If true, import the cursor immediately
        //      subsequent to an anchor tag if it would otherwise be placed right at the trailing edge inside the
        //      anchor. This cursor positioning, even though visually equivalent to the user, can affect behavior
        //      in MS IE.
        importSelection: function (selectionState, root, doc, favorLaterSelectionAnchor) {
            if (!selectionState || !root) {
                return;
            }

            var range = doc.createRange();
            range.setStart(root, 0);
            range.collapse(true);

            var node = root,
                nodeStack = [],
                charIndex = 0,
                foundStart = false,
                stop = false,
                nextCharIndex;

            while (!stop && node) {
                if (node.nodeType === 3) {
                    nextCharIndex = charIndex + node.length;
                    if (!foundStart && selectionState.start >= charIndex && selectionState.start <= nextCharIndex) {
                        range.setStart(node, selectionState.start - charIndex);
                        foundStart = true;
                    }
                    if (foundStart && selectionState.end >= charIndex && selectionState.end <= nextCharIndex) {
                        range.setEnd(node, selectionState.end - charIndex);
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    var i = node.childNodes.length - 1;
                    while (i >= 0) {
                        nodeStack.push(node.childNodes[i]);
                        i -= 1;
                    }
                }
                if (!stop) {
                    node = nodeStack.pop();
                }
            }

            if (typeof selectionState.emptyBlocksIndex !== 'undefined') {
                range = this.importSelectionMoveCursorPastBlocks(doc, root, selectionState.emptyBlocksIndex, range);
            }

            // If the selection is right at the ending edge of a link, put it outside the anchor tag instead of inside.
            if (favorLaterSelectionAnchor) {
                range = this.importSelectionMoveCursorPastAnchor(selectionState, range);
            }

            var sel = doc.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },

        // Utility method called from importSelection only
        importSelectionMoveCursorPastAnchor: function (selectionState, range) {
            var nodeInsideAnchorTagFunction = function (node) {
                return node.nodeName.toLowerCase() === 'a';
            };
            if (selectionState.start === selectionState.end &&
                    range.startContainer.nodeType === 3 &&
                    range.startOffset === range.startContainer.nodeValue.length &&
                    MediumEditor.util.traverseUp(range.startContainer, nodeInsideAnchorTagFunction)) {
                var prevNode = range.startContainer,
                    currentNode = range.startContainer.parentNode;
                while (currentNode !== null && currentNode.nodeName.toLowerCase() !== 'a') {
                    if (currentNode.childNodes[currentNode.childNodes.length - 1] !== prevNode) {
                        currentNode = null;
                    } else {
                        prevNode = currentNode;
                        currentNode = currentNode.parentNode;
                    }
                }
                if (currentNode !== null && currentNode.nodeName.toLowerCase() === 'a') {
                    var currentNodeIndex = null;
                    for (var i = 0; currentNodeIndex === null && i < currentNode.parentNode.childNodes.length; i++) {
                        if (currentNode.parentNode.childNodes[i] === currentNode) {
                            currentNodeIndex = i;
                        }
                    }
                    range.setStart(currentNode.parentNode, currentNodeIndex + 1);
                    range.collapse(true);
                }
            }
            return range;
        },

        // Uses the emptyBlocksIndex calculated by getIndexRelativeToAdjacentEmptyBlocks
        // to move the cursor back to the start of the correct paragraph
        importSelectionMoveCursorPastBlocks: function (doc, root, index, range) {
            var treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, filterOnlyParentElements, false),
                startContainer = range.startContainer,
                startBlock,
                targetNode,
                currIndex = 0;
            index = index || 1; // If index is 0, we still want to move to the next block

            // Chrome counts newlines and spaces that separate block elements as actual elements.
            // If the selection is inside one of these text nodes, and it has a previous sibling
            // which is a block element, we want the treewalker to start at the previous sibling
            // and NOT at the parent of the textnode
            if (startContainer.nodeType === 3 && MediumEditor.util.isBlockContainer(startContainer.previousSibling)) {
                startBlock = startContainer.previousSibling;
            } else {
                startBlock = MediumEditor.util.getClosestBlockContainer(startContainer);
            }

            // Skip over empty blocks until we hit the block we want the selection to be in
            while (treeWalker.nextNode()) {
                if (!targetNode) {
                    // Loop through all blocks until we hit the starting block element
                    if (startBlock === treeWalker.currentNode) {
                        targetNode = treeWalker.currentNode;
                    }
                } else {
                    targetNode = treeWalker.currentNode;
                    currIndex++;
                    // We hit the target index, bail
                    if (currIndex === index) {
                        break;
                    }
                    // If we find a non-empty block, ignore the emptyBlocksIndex and just put selection here
                    if (targetNode.textContent.length > 0) {
                        break;
                    }
                }
            }

            // We're selecting a high-level block node, so make sure the cursor gets moved into the deepest
            // element at the beginning of the block
            range.setStart(MediumEditor.util.getFirstSelectableLeafNode(targetNode), 0);

            return range;
        },

        // Returns -1 unless the cursor is at the beginning of a paragraph/block
        // If the paragraph/block is preceeded by empty paragraphs/block (with no text)
        // it will return the number of empty paragraphs before the cursor.
        // Otherwise, it will return 0, which indicates the cursor is at the beginning
        // of a paragraph/block, and not at the end of the paragraph/block before it
        getIndexRelativeToAdjacentEmptyBlocks: function (doc, root, cursorContainer, cursorOffset) {
            // If there is text in front of the cursor, that means there isn't only empty blocks before it
            if (cursorContainer.textContent.length > 0 && cursorOffset > 0) {
                return -1;
            }

            // Check if the block that contains the cursor has any other text in front of the cursor
            var node = cursorContainer;
            if (node.nodeType !== 3) {
                node = cursorContainer.childNodes[cursorOffset];
            }
            if (node && !MediumEditor.util.isElementAtBeginningOfBlock(node)) {
                return -1;
            }

            // Walk over block elements, counting number of empty blocks between last piece of text
            // and the block the cursor is in
            var closestBlock = MediumEditor.util.getClosestBlockContainer(cursorContainer),
                treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, filterOnlyParentElements, false),
                emptyBlocksCount = 0;
            while (treeWalker.nextNode()) {
                var blockIsEmpty = treeWalker.currentNode.textContent === '';
                if (blockIsEmpty || emptyBlocksCount > 0) {
                    emptyBlocksCount += 1;
                }
                if (treeWalker.currentNode === closestBlock) {
                    return emptyBlocksCount;
                }
                if (!blockIsEmpty) {
                    emptyBlocksCount = 0;
                }
            }

            return emptyBlocksCount;
        },

        selectionInContentEditableFalse: function (contentWindow) {
            // determine if the current selection is exclusively inside
            // a contenteditable="false", though treat the case of an
            // explicit contenteditable="true" inside a "false" as false.
            var sawtrue,
                sawfalse = this.findMatchingSelectionParent(function (el) {
                    var ce = el && el.getAttribute('contenteditable');
                    if (ce === 'true') {
                        sawtrue = true;
                    }
                    return el.nodeName !== '#text' && ce === 'false';
                }, contentWindow);

            return !sawtrue && sawfalse;
        },

        // http://stackoverflow.com/questions/4176923/html-of-selected-text
        // by Tim Down
        getSelectionHtml: function getSelectionHtml(doc) {
            var i,
                html = '',
                sel = doc.getSelection(),
                len,
                container;
            if (sel.rangeCount) {
                container = doc.createElement('div');
                for (i = 0, len = sel.rangeCount; i < len; i += 1) {
                    container.appendChild(sel.getRangeAt(i).cloneContents());
                }
                html = container.innerHTML;
            }
            return html;
        },

        /**
         *  Find the caret position within an element irrespective of any inline tags it may contain.
         *
         *  @param {DOMElement} An element containing the cursor to find offsets relative to.
         *  @param {Range} A Range representing cursor position. Will window.getSelection if none is passed.
         *  @return {Object} 'left' and 'right' attributes contain offsets from begining and end of Element
         */
        getCaretOffsets: function getCaretOffsets(element, range) {
            var preCaretRange, postCaretRange;

            if (!range) {
                range = window.getSelection().getRangeAt(0);
            }

            preCaretRange = range.cloneRange();
            postCaretRange = range.cloneRange();

            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);

            postCaretRange.selectNodeContents(element);
            postCaretRange.setStart(range.endContainer, range.endOffset);

            return {
                left: preCaretRange.toString().length,
                right: postCaretRange.toString().length
            };
        },

        // http://stackoverflow.com/questions/15867542/range-object-get-selection-parent-node-chrome-vs-firefox
        rangeSelectsSingleNode: function (range) {
            var startNode = range.startContainer;
            return startNode === range.endContainer &&
                startNode.hasChildNodes() &&
                range.endOffset === range.startOffset + 1;
        },

        getSelectedParentElement: function (range) {
            if (!range) {
                return null;
            }

            // Selection encompasses a single element
            if (this.rangeSelectsSingleNode(range) && range.startContainer.childNodes[range.startOffset].nodeType !== 3) {
                return range.startContainer.childNodes[range.startOffset];
            }

            // Selection range starts inside a text node, so get its parent
            if (range.startContainer.nodeType === 3) {
                return range.startContainer.parentNode;
            }

            // Selection starts inside an element
            return range.startContainer;
        },

        getSelectedElements: function (doc) {
            var selection = doc.getSelection(),
                range,
                toRet,
                currNode;

            if (!selection.rangeCount || selection.isCollapsed || !selection.getRangeAt(0).commonAncestorContainer) {
                return [];
            }

            range = selection.getRangeAt(0);

            if (range.commonAncestorContainer.nodeType === 3) {
                toRet = [];
                currNode = range.commonAncestorContainer;
                while (currNode.parentNode && currNode.parentNode.childNodes.length === 1) {
                    toRet.push(currNode.parentNode);
                    currNode = currNode.parentNode;
                }

                return toRet;
            }

            return [].filter.call(range.commonAncestorContainer.getElementsByTagName('*'), function (el) {
                return (typeof selection.containsNode === 'function') ? selection.containsNode(el, true) : true;
            });
        },

        selectNode: function (node, doc) {
            var range = doc.createRange(),
                sel = doc.getSelection();

            range.selectNodeContents(node);
            sel.removeAllRanges();
            sel.addRange(range);
        },

        select: function (doc, startNode, startOffset, endNode, endOffset) {
            doc.getSelection().removeAllRanges();
            var range = doc.createRange();
            range.setStart(startNode, startOffset);
            if (endNode) {
                range.setEnd(endNode, endOffset);
            } else {
                range.collapse(true);
            }
            doc.getSelection().addRange(range);
            return range;
        },

        /**
         * Move cursor to the given node with the given offset.
         *
         * @param  {DomDocument} doc     Current document
         * @param  {DomElement}  node    Element where to jump
         * @param  {integer}     offset  Where in the element should we jump, 0 by default
         */
        moveCursor: function (doc, node, offset) {
            this.select(doc, node, offset);
        },

        getSelectionRange: function (ownerDocument) {
            var selection = ownerDocument.getSelection();
            if (selection.rangeCount === 0) {
                return null;
            }
            return selection.getRangeAt(0);
        },

        // http://stackoverflow.com/questions/1197401/how-can-i-get-the-element-the-caret-is-in-with-javascript-when-using-contentedi
        // by You
        getSelectionStart: function (ownerDocument) {
            var node = ownerDocument.getSelection().anchorNode,
                startNode = (node && node.nodeType === 3 ? node.parentNode : node);

            return startNode;
        }
    };

    MediumEditor.selection = Selection;
}());

(function () {
    'use strict';

    var Events = function (instance) {
        this.base = instance;
        this.options = this.base.options;
        this.events = [];
        this.disabledEvents = {};
        this.customEvents = {};
        this.listeners = {};
    };

    Events.prototype = {
        InputEventOnContenteditableSupported: !MediumEditor.util.isIE,

        // Helpers for event handling

        attachDOMEvent: function (target, event, listener, useCapture) {
            target.addEventListener(event, listener, useCapture);
            this.events.push([target, event, listener, useCapture]);
        },

        detachDOMEvent: function (target, event, listener, useCapture) {
            var index = this.indexOfListener(target, event, listener, useCapture),
                e;
            if (index !== -1) {
                e = this.events.splice(index, 1)[0];
                e[0].removeEventListener(e[1], e[2], e[3]);
            }
        },

        indexOfListener: function (target, event, listener, useCapture) {
            var i, n, item;
            for (i = 0, n = this.events.length; i < n; i = i + 1) {
                item = this.events[i];
                if (item[0] === target && item[1] === event && item[2] === listener && item[3] === useCapture) {
                    return i;
                }
            }
            return -1;
        },

        detachAllDOMEvents: function () {
            var e = this.events.pop();
            while (e) {
                e[0].removeEventListener(e[1], e[2], e[3]);
                e = this.events.pop();
            }
        },

        enableCustomEvent: function (event) {
            if (this.disabledEvents[event] !== undefined) {
                delete this.disabledEvents[event];
            }
        },

        disableCustomEvent: function (event) {
            this.disabledEvents[event] = true;
        },

        // custom events
        attachCustomEvent: function (event, listener) {
            this.setupListener(event);
            if (!this.customEvents[event]) {
                this.customEvents[event] = [];
            }
            this.customEvents[event].push(listener);
        },

        detachCustomEvent: function (event, listener) {
            var index = this.indexOfCustomListener(event, listener);
            if (index !== -1) {
                this.customEvents[event].splice(index, 1);
                // TODO: If array is empty, should detach internal listeners via destroyListener()
            }
        },

        indexOfCustomListener: function (event, listener) {
            if (!this.customEvents[event] || !this.customEvents[event].length) {
                return -1;
            }

            return this.customEvents[event].indexOf(listener);
        },

        detachAllCustomEvents: function () {
            this.customEvents = {};
            // TODO: Should detach internal listeners here via destroyListener()
        },

        triggerCustomEvent: function (name, data, editable) {
            if (this.customEvents[name] && !this.disabledEvents[name]) {
                this.customEvents[name].forEach(function (listener) {
                    listener(data, editable);
                });
            }
        },

        // Cleaning up

        destroy: function () {
            this.detachAllDOMEvents();
            this.detachAllCustomEvents();
            this.detachExecCommand();

            if (this.base.elements) {
                this.base.elements.forEach(function (element) {
                    element.removeAttribute('data-medium-focused');
                });
            }
        },

        // Listening to calls to document.execCommand

        // Attach a listener to be notified when document.execCommand is called
        attachToExecCommand: function () {
            if (this.execCommandListener) {
                return;
            }

            // Store an instance of the listener so:
            // 1) We only attach to execCommand once
            // 2) We can remove the listener later
            this.execCommandListener = function (execInfo) {
                this.handleDocumentExecCommand(execInfo);
            }.bind(this);

            // Ensure that execCommand has been wrapped correctly
            this.wrapExecCommand();

            // Add listener to list of execCommand listeners
            this.options.ownerDocument.execCommand.listeners.push(this.execCommandListener);
        },

        // Remove our listener for calls to document.execCommand
        detachExecCommand: function () {
            var doc = this.options.ownerDocument;
            if (!this.execCommandListener || !doc.execCommand.listeners) {
                return;
            }

            // Find the index of this listener in the array of listeners so it can be removed
            var index = doc.execCommand.listeners.indexOf(this.execCommandListener);
            if (index !== -1) {
                doc.execCommand.listeners.splice(index, 1);
            }

            // If the list of listeners is now empty, put execCommand back to its original state
            if (!doc.execCommand.listeners.length) {
                this.unwrapExecCommand();
            }
        },

        // Wrap document.execCommand in a custom method so we can listen to calls to it
        wrapExecCommand: function () {
            var doc = this.options.ownerDocument;

            // Ensure all instance of MediumEditor only wrap execCommand once
            if (doc.execCommand.listeners) {
                return;
            }

            // Create a wrapper method for execCommand which will:
            // 1) Call document.execCommand with the correct arguments
            // 2) Loop through any listeners and notify them that execCommand was called
            //    passing extra info on the call
            // 3) Return the result
            var wrapper = function (aCommandName, aShowDefaultUI, aValueArgument) {
                var result = doc.execCommand.orig.apply(this, arguments);

                if (!doc.execCommand.listeners) {
                    return result;
                }

                var args = Array.prototype.slice.call(arguments);
                doc.execCommand.listeners.forEach(function (listener) {
                    listener({
                        command: aCommandName,
                        value: aValueArgument,
                        args: args,
                        result: result
                    });
                });

                return result;
            };

            // Store a reference to the original execCommand
            wrapper.orig = doc.execCommand;

            // Attach an array for storing listeners
            wrapper.listeners = [];

            // Overwrite execCommand
            doc.execCommand = wrapper;
        },

        // Revert document.execCommand back to its original self
        unwrapExecCommand: function () {
            var doc = this.options.ownerDocument;
            if (!doc.execCommand.orig) {
                return;
            }

            // Use the reference to the original execCommand to revert back
            doc.execCommand = doc.execCommand.orig;
        },

        // Listening to browser events to emit events medium-editor cares about
        setupListener: function (name) {
            if (this.listeners[name]) {
                return;
            }

            switch (name) {
                case 'externalInteraction':
                    // Detecting when user has interacted with elements outside of MediumEditor
                    this.attachDOMEvent(this.options.ownerDocument.body, 'mousedown', this.handleBodyMousedown.bind(this), true);
                    this.attachDOMEvent(this.options.ownerDocument.body, 'click', this.handleBodyClick.bind(this), true);
                    this.attachDOMEvent(this.options.ownerDocument.body, 'focus', this.handleBodyFocus.bind(this), true);
                    break;
                case 'blur':
                    // Detecting when focus is lost
                    this.setupListener('externalInteraction');
                    break;
                case 'focus':
                    // Detecting when focus moves into some part of MediumEditor
                    this.setupListener('externalInteraction');
                    break;
                case 'editableInput':
                    // setup cache for knowing when the content has changed
                    this.contentCache = [];
                    this.base.elements.forEach(function (element) {
                        this.contentCache[element.getAttribute('medium-editor-index')] = element.innerHTML;

                        // Attach to the 'oninput' event, handled correctly by most browsers
                        if (this.InputEventOnContenteditableSupported) {
                            this.attachDOMEvent(element, 'input', this.handleInput.bind(this));
                        }
                    }.bind(this));

                    // For browsers which don't support the input event on contenteditable (IE)
                    // we'll attach to 'selectionchange' on the document and 'keypress' on the editables
                    if (!this.InputEventOnContenteditableSupported) {
                        this.setupListener('editableKeypress');
                        this.keypressUpdateInput = true;
                        this.attachDOMEvent(document, 'selectionchange', this.handleDocumentSelectionChange.bind(this));
                        // Listen to calls to execCommand
                        this.attachToExecCommand();
                    }
                    break;
                case 'editableClick':
                    // Detecting click in the contenteditables
                    this.attachToEachElement('click', this.handleClick);
                    break;
                case 'editableBlur':
                    // Detecting blur in the contenteditables
                    this.attachToEachElement('blur', this.handleBlur);
                    break;
                case 'editableKeypress':
                    // Detecting keypress in the contenteditables
                    this.attachToEachElement('keypress', this.handleKeypress);
                    break;
                case 'editableKeyup':
                    // Detecting keyup in the contenteditables
                    this.attachToEachElement('keyup', this.handleKeyup);
                    break;
                case 'editableKeydown':
                    // Detecting keydown on the contenteditables
                    this.attachToEachElement('keydown', this.handleKeydown);
                    break;
                case 'editableKeydownEnter':
                    // Detecting keydown for ENTER on the contenteditables
                    this.setupListener('editableKeydown');
                    break;
                case 'editableKeydownTab':
                    // Detecting keydown for TAB on the contenteditable
                    this.setupListener('editableKeydown');
                    break;
                case 'editableKeydownDelete':
                    // Detecting keydown for DELETE/BACKSPACE on the contenteditables
                    this.setupListener('editableKeydown');
                    break;
                case 'editableMouseover':
                    // Detecting mouseover on the contenteditables
                    this.attachToEachElement('mouseover', this.handleMouseover);
                    break;
                case 'editableDrag':
                    // Detecting dragover and dragleave on the contenteditables
                    this.attachToEachElement('dragover', this.handleDragging);
                    this.attachToEachElement('dragleave', this.handleDragging);
                    break;
                case 'editableDrop':
                    // Detecting drop on the contenteditables
                    this.attachToEachElement('drop', this.handleDrop);
                    break;
                case 'editablePaste':
                    // Detecting paste on the contenteditables
                    this.attachToEachElement('paste', this.handlePaste);
                    break;
            }
            this.listeners[name] = true;
        },

        attachToEachElement: function (name, handler) {
            this.base.elements.forEach(function (element) {
                this.attachDOMEvent(element, name, handler.bind(this));
            }, this);
        },

        focusElement: function (element) {
            element.focus();
            this.updateFocus(element, { target: element, type: 'focus' });
        },

        updateFocus: function (target, eventObj) {
            var toolbar = this.base.getExtensionByName('toolbar'),
                toolbarEl = toolbar ? toolbar.getToolbarElement() : null,
                anchorPreview = this.base.getExtensionByName('anchor-preview'),
                previewEl = (anchorPreview && anchorPreview.getPreviewElement) ? anchorPreview.getPreviewElement() : null,
                hadFocus = this.base.getFocusedElement(),
                toFocus;

            // For clicks, we need to know if the mousedown that caused the click happened inside the existing focused element.
            // If so, we don't want to focus another element
            if (hadFocus &&
                    eventObj.type === 'click' &&
                    this.lastMousedownTarget &&
                    (MediumEditor.util.isDescendant(hadFocus, this.lastMousedownTarget, true) ||
                     MediumEditor.util.isDescendant(toolbarEl, this.lastMousedownTarget, true) ||
                     MediumEditor.util.isDescendant(previewEl, this.lastMousedownTarget, true))) {
                toFocus = hadFocus;
            }

            if (!toFocus) {
                this.base.elements.some(function (element) {
                    // If the target is part of an editor element, this is the element getting focus
                    if (!toFocus && (MediumEditor.util.isDescendant(element, target, true))) {
                        toFocus = element;
                    }

                    // bail if we found an element that's getting focus
                    return !!toFocus;
                }, this);
            }

            // Check if the target is external (not part of the editor, toolbar, or anchorpreview)
            var externalEvent = !MediumEditor.util.isDescendant(hadFocus, target, true) &&
                                !MediumEditor.util.isDescendant(toolbarEl, target, true) &&
                                !MediumEditor.util.isDescendant(previewEl, target, true);

            if (toFocus !== hadFocus) {
                // If element has focus, and focus is going outside of editor
                // Don't blur focused element if clicking on editor, toolbar, or anchorpreview
                if (hadFocus && externalEvent) {
                    // Trigger blur on the editable that has lost focus
                    hadFocus.removeAttribute('data-medium-focused');
                    this.triggerCustomEvent('blur', eventObj, hadFocus);
                }

                // If focus is going into an editor element
                if (toFocus) {
                    // Trigger focus on the editable that now has focus
                    toFocus.setAttribute('data-medium-focused', true);
                    this.triggerCustomEvent('focus', eventObj, toFocus);
                }
            }

            if (externalEvent) {
                this.triggerCustomEvent('externalInteraction', eventObj);
            }
        },

        updateInput: function (target, eventObj) {
            if (!this.contentCache) {
                return;
            }
            // An event triggered which signifies that the user may have changed someting
            // Look in our cache of input for the contenteditables to see if something changed
            var index = target.getAttribute('medium-editor-index');
            if (target.innerHTML !== this.contentCache[index]) {
                // The content has changed since the last time we checked, fire the event
                this.triggerCustomEvent('editableInput', eventObj, target);
            }
            this.contentCache[index] = target.innerHTML;
        },

        handleDocumentSelectionChange: function (event) {
            // When selectionchange fires, target and current target are set
            // to document, since this is where the event is handled
            // However, currentTarget will have an 'activeElement' property
            // which will point to whatever element has focus.
            if (event.currentTarget && event.currentTarget.activeElement) {
                var activeElement = event.currentTarget.activeElement,
                    currentTarget;
                // We can look at the 'activeElement' to determine if the selectionchange has
                // happened within a contenteditable owned by this instance of MediumEditor
                this.base.elements.some(function (element) {
                    if (MediumEditor.util.isDescendant(element, activeElement, true)) {
                        currentTarget = element;
                        return true;
                    }
                    return false;
                }, this);

                // We know selectionchange fired within one of our contenteditables
                if (currentTarget) {
                    this.updateInput(currentTarget, { target: activeElement, currentTarget: currentTarget });
                }
            }
        },

        handleDocumentExecCommand: function () {
            // document.execCommand has been called
            // If one of our contenteditables currently has focus, we should
            // attempt to trigger the 'editableInput' event
            var target = this.base.getFocusedElement();
            if (target) {
                this.updateInput(target, { target: target, currentTarget: target });
            }
        },

        handleBodyClick: function (event) {
            this.updateFocus(event.target, event);
        },

        handleBodyFocus: function (event) {
            this.updateFocus(event.target, event);
        },

        handleBodyMousedown: function (event) {
            this.lastMousedownTarget = event.target;
        },

        handleInput: function (event) {
            this.updateInput(event.currentTarget, event);
        },

        handleClick: function (event) {
            this.triggerCustomEvent('editableClick', event, event.currentTarget);
        },

        handleBlur: function (event) {
            this.triggerCustomEvent('editableBlur', event, event.currentTarget);
        },

        handleKeypress: function (event) {
            this.triggerCustomEvent('editableKeypress', event, event.currentTarget);

            // If we're doing manual detection of the editableInput event we need
            // to check for input changes during 'keypress'
            if (this.keypressUpdateInput) {
                var eventObj = { target: event.target, currentTarget: event.currentTarget };

                // In IE, we need to let the rest of the event stack complete before we detect
                // changes to input, so using setTimeout here
                setTimeout(function () {
                    this.updateInput(eventObj.currentTarget, eventObj);
                }.bind(this), 0);
            }
        },

        handleKeyup: function (event) {
            this.triggerCustomEvent('editableKeyup', event, event.currentTarget);
        },

        handleMouseover: function (event) {
            this.triggerCustomEvent('editableMouseover', event, event.currentTarget);
        },

        handleDragging: function (event) {
            this.triggerCustomEvent('editableDrag', event, event.currentTarget);
        },

        handleDrop: function (event) {
            this.triggerCustomEvent('editableDrop', event, event.currentTarget);
        },

        handlePaste: function (event) {
            this.triggerCustomEvent('editablePaste', event, event.currentTarget);
        },

        handleKeydown: function (event) {
            this.triggerCustomEvent('editableKeydown', event, event.currentTarget);

            if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.ENTER) || (event.ctrlKey && MediumEditor.util.isKey(event, MediumEditor.util.keyCode.M))) {
                return this.triggerCustomEvent('editableKeydownEnter', event, event.currentTarget);
            }

            if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.TAB)) {
                return this.triggerCustomEvent('editableKeydownTab', event, event.currentTarget);
            }

            if (MediumEditor.util.isKey(event, [MediumEditor.util.keyCode.DELETE, MediumEditor.util.keyCode.BACKSPACE])) {
                return this.triggerCustomEvent('editableKeydownDelete', event, event.currentTarget);
            }
        }
    };

    MediumEditor.Events = Events;
}());

(function () {
    'use strict';

    var Button = MediumEditor.Extension.extend({

        /* Button Options */

        /* action: [string]
         * The action argument to pass to MediumEditor.execAction()
         * when the button is clicked
         */
        action: undefined,

        /* aria: [string]
         * The value to add as the aria-label attribute of the button
         * element displayed in the toolbar.
         * This is also used as the tooltip for the button
         */
        aria: undefined,

        /* tagNames: [Array]
         * NOTE: This is not used if useQueryState is set to true.
         *
         * Array of element tag names that would indicate that this
         * button has already been applied. If this action has already
         * been applied, the button will be displayed as 'active' in the toolbar
         *
         * Example:
         * For 'bold', if the text is ever within a <b> or <strong>
         * tag that indicates the text is already bold. So the array
         * of tagNames for bold would be: ['b', 'strong']
         */
        tagNames: undefined,

        /* style: [Object]
         * NOTE: This is not used if useQueryState is set to true.
         *
         * A pair of css property & value(s) that indicate that this
         * button has already been applied. If this action has already
         * been applied, the button will be displayed as 'active' in the toolbar
         * Properties of the object:
         *   prop [String]: name of the css property
         *   value [String]: value(s) of the css property
         *                   multiple values can be separated by a '|'
         *
         * Example:
         * For 'bold', if the text is ever within an element with a 'font-weight'
         * style property set to '700' or 'bold', that indicates the text
         * is already bold.  So the style object for bold would be:
         * { prop: 'font-weight', value: '700|bold' }
         */
        style: undefined,

        /* useQueryState: [boolean]
         * Enables/disables whether this button should use the built-in
         * document.queryCommandState() method to determine whether
         * the action has already been applied.  If the action has already
         * been applied, the button will be displayed as 'active' in the toolbar
         *
         * Example:
         * For 'bold', if this is set to true, the code will call:
         * document.queryCommandState('bold') which will return true if the
         * browser thinks the text is already bold, and false otherwise
         */
        useQueryState: undefined,

        /* contentDefault: [string]
         * Default innerHTML to put inside the button
         */
        contentDefault: undefined,

        /* contentFA: [string]
         * The innerHTML to use for the content of the button
         * if the `buttonLabels` option for MediumEditor is set to 'fontawesome'
         */
        contentFA: undefined,

        /* classList: [Array]
         * An array of classNames (strings) to be added to the button
         */
        classList: undefined,

        /* attrs: [object]
         * A set of key-value pairs to add to the button as custom attributes
         */
        attrs: undefined,

        // The button constructor can optionally accept the name of a built-in button
        // (ie 'bold', 'italic', etc.)
        // When the name of a button is passed, it will initialize itself with the
        // configuration for that button
        constructor: function (options) {
            if (Button.isBuiltInButton(options)) {
                MediumEditor.Extension.call(this, this.defaults[options]);
            } else {
                MediumEditor.Extension.call(this, options);
            }
        },

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.button = this.createButton();
            this.on(this.button, 'click', this.handleClick.bind(this));
        },

        /* getButton: [function ()]
         *
         * If implemented, this function will be called when
         * the toolbar is being created.  The DOM Element returned
         * by this function will be appended to the toolbar along
         * with any other buttons.
         */
        getButton: function () {
            return this.button;
        },

        getAction: function () {
            return (typeof this.action === 'function') ? this.action(this.base.options) : this.action;
        },

        getAria: function () {
            return (typeof this.aria === 'function') ? this.aria(this.base.options) : this.aria;
        },

        getTagNames: function () {
            return (typeof this.tagNames === 'function') ? this.tagNames(this.base.options) : this.tagNames;
        },

        createButton: function () {
            var button = this.document.createElement('button'),
                content = this.contentDefault,
                ariaLabel = this.getAria(),
                buttonLabels = this.getEditorOption('buttonLabels');
            // Add class names
            button.classList.add('medium-editor-action');
            button.classList.add('medium-editor-action-' + this.name);
            if (this.classList) {
                this.classList.forEach(function (className) {
                    button.classList.add(className);
                });
            }

            // Add attributes
            button.setAttribute('data-action', this.getAction());
            if (ariaLabel) {
                button.setAttribute('title', ariaLabel);
                button.setAttribute('aria-label', ariaLabel);
            }
            if (this.attrs) {
                Object.keys(this.attrs).forEach(function (attr) {
                    button.setAttribute(attr, this.attrs[attr]);
                }, this);
            }

            if (buttonLabels === 'fontawesome' && this.contentFA) {
                content = this.contentFA;
            }
            button.innerHTML = content;
            return button;
        },

        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            var action = this.getAction();

            if (action) {
                this.execAction(action);
            }
        },

        isActive: function () {
            return this.button.classList.contains(this.getEditorOption('activeButtonClass'));
        },

        setInactive: function () {
            this.button.classList.remove(this.getEditorOption('activeButtonClass'));
            delete this.knownState;
        },

        setActive: function () {
            this.button.classList.add(this.getEditorOption('activeButtonClass'));
            delete this.knownState;
        },

        queryCommandState: function () {
            var queryState = null;
            if (this.useQueryState) {
                queryState = this.base.queryCommandState(this.getAction());
            }
            return queryState;
        },

        isAlreadyApplied: function (node) {
            var isMatch = false,
                tagNames = this.getTagNames(),
                styleVals,
                computedStyle;

            if (this.knownState === false || this.knownState === true) {
                return this.knownState;
            }

            if (tagNames && tagNames.length > 0) {
                isMatch = tagNames.indexOf(node.nodeName.toLowerCase()) !== -1;
            }

            if (!isMatch && this.style) {
                styleVals = this.style.value.split('|');
                computedStyle = this.window.getComputedStyle(node, null).getPropertyValue(this.style.prop);
                styleVals.forEach(function (val) {
                    if (!this.knownState) {
                        isMatch = (computedStyle.indexOf(val) !== -1);
                        // text-decoration is not inherited by default
                        // so if the computed style for text-decoration doesn't match
                        // don't write to knownState so we can fallback to other checks
                        if (isMatch || this.style.prop !== 'text-decoration') {
                            this.knownState = isMatch;
                        }
                    }
                }, this);
            }

            return isMatch;
        }
    });

    Button.isBuiltInButton = function (name) {
        return (typeof name === 'string') && MediumEditor.extensions.button.prototype.defaults.hasOwnProperty(name);
    };

    MediumEditor.extensions.button = Button;
}());

(function () {
    'use strict';

    /* MediumEditor.extensions.button.defaults: [Object]
     * Set of default config options for all of the built-in MediumEditor buttons
     */
    MediumEditor.extensions.button.prototype.defaults = {
        'bold': {
            name: 'bold',
            action: 'bold',
            aria: 'bold',
            tagNames: ['b', 'strong'],
            style: {
                prop: 'font-weight',
                value: '700|bold'
            },
            useQueryState: true,
            contentDefault: '<b>B</b>',
            contentFA: '<i class="fa fa-bold"></i>'
        },
        'italic': {
            name: 'italic',
            action: 'italic',
            aria: 'italic',
            tagNames: ['i', 'em'],
            style: {
                prop: 'font-style',
                value: 'italic'
            },
            useQueryState: true,
            contentDefault: '<b><i>I</i></b>',
            contentFA: '<i class="fa fa-italic"></i>'
        },
        'underline': {
            name: 'underline',
            action: 'underline',
            aria: 'underline',
            tagNames: ['u'],
            style: {
                prop: 'text-decoration',
                value: 'underline'
            },
            useQueryState: true,
            contentDefault: '<b><u>U</u></b>',
            contentFA: '<i class="fa fa-underline"></i>'
        },
        'strikethrough': {
            name: 'strikethrough',
            action: 'strikethrough',
            aria: 'strike through',
            tagNames: ['strike'],
            style: {
                prop: 'text-decoration',
                value: 'line-through'
            },
            useQueryState: true,
            contentDefault: '<s>A</s>',
            contentFA: '<i class="fa fa-strikethrough"></i>'
        },
        'superscript': {
            name: 'superscript',
            action: 'superscript',
            aria: 'superscript',
            tagNames: ['sup'],
            /* firefox doesn't behave the way we want it to, so we CAN'T use queryCommandState for superscript
               https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md#documentquerycommandstate */
            // useQueryState: true
            contentDefault: '<b>x<sup>1</sup></b>',
            contentFA: '<i class="fa fa-superscript"></i>'
        },
        'subscript': {
            name: 'subscript',
            action: 'subscript',
            aria: 'subscript',
            tagNames: ['sub'],
            /* firefox doesn't behave the way we want it to, so we CAN'T use queryCommandState for subscript
               https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md#documentquerycommandstate */
            // useQueryState: true
            contentDefault: '<b>x<sub>1</sub></b>',
            contentFA: '<i class="fa fa-subscript"></i>'
        },
        'image': {
            name: 'image',
            action: 'image',
            aria: 'image',
            tagNames: ['img'],
            contentDefault: '<b>image</b>',
            contentFA: '<i class="fa fa-picture-o"></i>'
        },
        'orderedlist': {
            name: 'orderedlist',
            action: 'insertorderedlist',
            aria: 'ordered list',
            tagNames: ['ol'],
            useQueryState: true,
            contentDefault: '<b>1.</b>',
            contentFA: '<i class="fa fa-list-ol"></i>'
        },
        'unorderedlist': {
            name: 'unorderedlist',
            action: 'insertunorderedlist',
            aria: 'unordered list',
            tagNames: ['ul'],
            useQueryState: true,
            contentDefault: '<b>&bull;</b>',
            contentFA: '<i class="fa fa-list-ul"></i>'
        },
        'indent': {
            name: 'indent',
            action: 'indent',
            aria: 'indent',
            tagNames: [],
            contentDefault: '<b>&rarr;</b>',
            contentFA: '<i class="fa fa-indent"></i>'
        },
        'outdent': {
            name: 'outdent',
            action: 'outdent',
            aria: 'outdent',
            tagNames: [],
            contentDefault: '<b>&larr;</b>',
            contentFA: '<i class="fa fa-outdent"></i>'
        },
        'justifyCenter': {
            name: 'justifyCenter',
            action: 'justifyCenter',
            aria: 'center justify',
            tagNames: [],
            style: {
                prop: 'text-align',
                value: 'center'
            },
            contentDefault: '<b>C</b>',
            contentFA: '<i class="fa fa-align-center"></i>'
        },
        'justifyFull': {
            name: 'justifyFull',
            action: 'justifyFull',
            aria: 'full justify',
            tagNames: [],
            style: {
                prop: 'text-align',
                value: 'justify'
            },
            contentDefault: '<b>J</b>',
            contentFA: '<i class="fa fa-align-justify"></i>'
        },
        'justifyLeft': {
            name: 'justifyLeft',
            action: 'justifyLeft',
            aria: 'left justify',
            tagNames: [],
            style: {
                prop: 'text-align',
                value: 'left'
            },
            contentDefault: '<b>L</b>',
            contentFA: '<i class="fa fa-align-left"></i>'
        },
        'justifyRight': {
            name: 'justifyRight',
            action: 'justifyRight',
            aria: 'right justify',
            tagNames: [],
            style: {
                prop: 'text-align',
                value: 'right'
            },
            contentDefault: '<b>R</b>',
            contentFA: '<i class="fa fa-align-right"></i>'
        },
        // Known inline elements that are not removed, or not removed consistantly across browsers:
        // <span>, <label>, <br>
        'removeFormat': {
            name: 'removeFormat',
            aria: 'remove formatting',
            action: 'removeFormat',
            contentDefault: '<b>X</b>',
            contentFA: '<i class="fa fa-eraser"></i>'
        },

        /***** Buttons for appending block elements (append-<element> action) *****/

        'quote': {
            name: 'quote',
            action: 'append-blockquote',
            aria: 'blockquote',
            tagNames: ['blockquote'],
            contentDefault: '<b>&ldquo;</b>',
            contentFA: '<i class="fa fa-quote-right"></i>'
        },
        'pre': {
            name: 'pre',
            action: 'append-pre',
            aria: 'preformatted text',
            tagNames: ['pre'],
            contentDefault: '<b>0101</b>',
            contentFA: '<i class="fa fa-code fa-lg"></i>'
        },
        'h1': {
            name: 'h1',
            action: 'append-h1',
            aria: 'header type one',
            tagNames: ['h1'],
            contentDefault: '<b>H1</b>',
            contentFA: '<i class="fa fa-header"><sup>1</sup>'
        },
        'h2': {
            name: 'h2',
            action: 'append-h2',
            aria: 'header type two',
            tagNames: ['h2'],
            contentDefault: '<b>H2</b>',
            contentFA: '<i class="fa fa-header"><sup>2</sup>'
        },
        'h3': {
            name: 'h3',
            action: 'append-h3',
            aria: 'header type three',
            tagNames: ['h3'],
            contentDefault: '<b>H3</b>',
            contentFA: '<i class="fa fa-header"><sup>3</sup>'
        },
        'h4': {
            name: 'h4',
            action: 'append-h4',
            aria: 'header type four',
            tagNames: ['h4'],
            contentDefault: '<b>H4</b>',
            contentFA: '<i class="fa fa-header"><sup>4</sup>'
        },
        'h5': {
            name: 'h5',
            action: 'append-h5',
            aria: 'header type five',
            tagNames: ['h5'],
            contentDefault: '<b>H5</b>',
            contentFA: '<i class="fa fa-header"><sup>5</sup>'
        },
        'h6': {
            name: 'h6',
            action: 'append-h6',
            aria: 'header type six',
            tagNames: ['h6'],
            contentDefault: '<b>H6</b>',
            contentFA: '<i class="fa fa-header"><sup>6</sup>'
        }
    };

})();
(function () {
    'use strict';

    /* Base functionality for an extension which will display
     * a 'form' inside the toolbar
     */
    var FormExtension = MediumEditor.extensions.button.extend({

        init: function () {
            MediumEditor.extensions.button.prototype.init.apply(this, arguments);
        },

        // default labels for the form buttons
        formSaveLabel: '&#10003;',
        formCloseLabel: '&times;',

        /* hasForm: [boolean]
         *
         * Setting this to true will cause getForm() to be called
         * when the toolbar is created, so the form can be appended
         * inside the toolbar container
         */
        hasForm: true,

        /* getForm: [function ()]
         *
         * When hasForm is true, this function must be implemented
         * and return a DOM Element which will be appended to
         * the toolbar container. The form should start hidden, and
         * the extension can choose when to hide/show it
         */
        getForm: function () {},

        /* isDisplayed: [function ()]
         *
         * This function should return true/false reflecting
         * whether the form is currently displayed
         */
        isDisplayed: function () {},

        /* hideForm: [function ()]
         *
         * This function should hide the form element inside
         * the toolbar container
         */
        hideForm: function () {},

        /************************ Helpers ************************
         * The following are helpers that are either set by MediumEditor
         * during initialization, or are helper methods which either
         * route calls to the MediumEditor instance or provide common
         * functionality for all form extensions
         *********************************************************/

        /* showToolbarDefaultActions: [function ()]
         *
         * Helper method which will turn back the toolbar after canceling
         * the customized form
         */
        showToolbarDefaultActions: function () {
            var toolbar = this.base.getExtensionByName('toolbar');
            if (toolbar) {
                toolbar.showToolbarDefaultActions();
            }
        },

        /* hideToolbarDefaultActions: [function ()]
         *
         * Helper function which will hide the default contents of the
         * toolbar, but leave the toolbar container in the same state
         * to allow a form to display its custom contents inside the toolbar
         */
        hideToolbarDefaultActions: function () {
            var toolbar = this.base.getExtensionByName('toolbar');
            if (toolbar) {
                toolbar.hideToolbarDefaultActions();
            }
        },

        /* setToolbarPosition: [function ()]
         *
         * Helper function which will update the size and position
         * of the toolbar based on the toolbar content and the current
         * position of the user's selection
         */
        setToolbarPosition: function () {
            var toolbar = this.base.getExtensionByName('toolbar');
            if (toolbar) {
                toolbar.setToolbarPosition();
            }
        }
    });

    MediumEditor.extensions.form = FormExtension;
})();
(function () {
    'use strict';

    var AnchorForm = MediumEditor.extensions.form.extend({
        /* Anchor Form Options */

        /* customClassOption: [string]  (previously options.anchorButton + options.anchorButtonClass)
         * Custom class name the user can optionally have added to their created links (ie 'button').
         * If passed as a non-empty string, a checkbox will be displayed allowing the user to choose
         * whether to have the class added to the created link or not.
         */
        customClassOption: null,

        /* customClassOptionText: [string]
         * text to be shown in the checkbox when the __customClassOption__ is being used.
         */
        customClassOptionText: 'Button',

        /* linkValidation: [boolean]  (previously options.checkLinkFormat)
         * enables/disables check for common URL protocols on anchor links.
         */
        linkValidation: false,

        /* placeholderText: [string]  (previously options.anchorInputPlaceholder)
         * text to be shown as placeholder of the anchor input.
         */
        placeholderText: 'Paste or type a link',

        /* targetCheckbox: [boolean]  (previously options.anchorTarget)
         * enables/disables displaying a "Open in new window" checkbox, which when checked
         * changes the `target` attribute of the created link.
         */
        targetCheckbox: false,

        /* targetCheckboxText: [string]  (previously options.anchorInputCheckboxLabel)
         * text to be shown in the checkbox enabled via the __targetCheckbox__ option.
         */
        targetCheckboxText: 'Open in new window',

        // Options for the Button base class
        name: 'anchor',
        action: 'createLink',
        aria: 'link',
        tagNames: ['a'],
        contentDefault: '<b>#</b>',
        contentFA: '<i class="fa fa-link"></i>',

        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);

            this.subscribe('editableKeydown', this.handleKeydown.bind(this));
        },

        // Called when the button the toolbar is clicked
        // Overrides ButtonExtension.handleClick
        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            var range = MediumEditor.selection.getSelectionRange(this.document);

            if (range.startContainer.nodeName.toLowerCase() === 'a' ||
                range.endContainer.nodeName.toLowerCase() === 'a' ||
                MediumEditor.util.getClosestTag(MediumEditor.selection.getSelectedParentElement(range), 'a')) {
                return this.execAction('unlink');
            }

            if (!this.isDisplayed()) {
                this.showForm();
            }

            return false;
        },

        // Called when user hits the defined shortcut (CTRL / COMMAND + K)
        handleKeydown: function (event) {
            if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.K) && MediumEditor.util.isMetaCtrlKey(event) && !event.shiftKey) {
                this.handleClick(event);
            }
        },

        // Called by medium-editor to append form to the toolbar
        getForm: function () {
            if (!this.form) {
                this.form = this.createForm();
            }
            return this.form;
        },

        getTemplate: function () {
            var template = [
                '<input type="text" class="medium-editor-toolbar-input" placeholder="', this.placeholderText, '">'
            ];

            template.push(
                '<a href="#" class="medium-editor-toolbar-save">',
                this.getEditorOption('buttonLabels') === 'fontawesome' ? '<i class="fa fa-check"></i>' : this.formSaveLabel,
                '</a>'
            );

            template.push('<a href="#" class="medium-editor-toolbar-close">',
                this.getEditorOption('buttonLabels') === 'fontawesome' ? '<i class="fa fa-times"></i>' : this.formCloseLabel,
                '</a>');

            // both of these options are slightly moot with the ability to
            // override the various form buildup/serialize functions.

            if (this.targetCheckbox) {
                // fixme: ideally, this targetCheckboxText would be a formLabel too,
                // figure out how to deprecate? also consider `fa-` icon default implcations.
                template.push(
                    '<div class="medium-editor-toolbar-form-row">',
                    '<input type="checkbox" class="medium-editor-toolbar-anchor-target">',
                    '<label>',
                    this.targetCheckboxText,
                    '</label>',
                    '</div>'
                );
            }

            if (this.customClassOption) {
                // fixme: expose this `Button` text as a formLabel property, too
                // and provide similar access to a `fa-` icon default.
                template.push(
                    '<div class="medium-editor-toolbar-form-row">',
                    '<input type="checkbox" class="medium-editor-toolbar-anchor-button">',
                    '<label>',
                    this.customClassOptionText,
                    '</label>',
                    '</div>'
                );
            }

            return template.join('');

        },

        // Used by medium-editor when the default toolbar is to be displayed
        isDisplayed: function () {
            return this.getForm().style.display === 'block';
        },

        hideForm: function () {
            this.getForm().style.display = 'none';
            this.getInput().value = '';
        },

        showForm: function (opts) {
            var input = this.getInput(),
                targetCheckbox = this.getAnchorTargetCheckbox(),
                buttonCheckbox = this.getAnchorButtonCheckbox();

            opts = opts || { url: '' };
            // TODO: This is for backwards compatability
            // We don't need to support the 'string' argument in 6.0.0
            if (typeof opts === 'string') {
                opts = {
                    url: opts
                };
            }

            this.base.saveSelection();
            this.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.setToolbarPosition();

            input.value = opts.url;
            input.focus();

            // If we have a target checkbox, we want it to be checked/unchecked
            // based on whether the existing link has target=_blank
            if (targetCheckbox) {
                targetCheckbox.checked = opts.target === '_blank';
            }

            // If we have a custom class checkbox, we want it to be checked/unchecked
            // based on whether an existing link already has the class
            if (buttonCheckbox) {
                var classList = opts.buttonClass ? opts.buttonClass.split(' ') : [];
                buttonCheckbox.checked = (classList.indexOf(this.customClassOption) !== -1);
            }
        },

        // Called by core when tearing down medium-editor (destroy)
        destroy: function () {
            if (!this.form) {
                return false;
            }

            if (this.form.parentNode) {
                this.form.parentNode.removeChild(this.form);
            }

            delete this.form;
        },

        // core methods

        getFormOpts: function () {
            // no notion of private functions? wanted `_getFormOpts`
            var targetCheckbox = this.getAnchorTargetCheckbox(),
                buttonCheckbox = this.getAnchorButtonCheckbox(),
                opts = {
                    url: this.getInput().value
                };

            if (this.linkValidation) {
                opts.url = this.checkLinkFormat(opts.url);
            }

            opts.target = '_self';
            if (targetCheckbox && targetCheckbox.checked) {
                opts.target = '_blank';
            }

            if (buttonCheckbox && buttonCheckbox.checked) {
                opts.buttonClass = this.customClassOption;
            }

            return opts;
        },

        doFormSave: function () {
            var opts = this.getFormOpts();
            this.completeFormSave(opts);
        },

        completeFormSave: function (opts) {
            this.base.restoreSelection();
            this.execAction(this.action, opts);
            this.base.checkSelection();
        },

        checkLinkFormat: function (value) {
            var re = /^(https?|ftps?|rtmpt?):\/\/|mailto:/;
            return (re.test(value) ? '' : 'http://') + value;
        },

        doFormCancel: function () {
            this.base.restoreSelection();
            this.base.checkSelection();
        },

        // form creation and event handling
        attachFormEvents: function (form) {
            var close = form.querySelector('.medium-editor-toolbar-close'),
                save = form.querySelector('.medium-editor-toolbar-save'),
                input = form.querySelector('.medium-editor-toolbar-input');

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));

            // Handle typing in the textbox
            this.on(input, 'keyup', this.handleTextboxKeyup.bind(this));

            // Handle close button clicks
            this.on(close, 'click', this.handleCloseClick.bind(this));

            // Handle save button clicks (capture)
            this.on(save, 'click', this.handleSaveClick.bind(this), true);

        },

        createForm: function () {
            var doc = this.document,
                form = doc.createElement('div');

            // Anchor Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-anchor-' + this.getEditorId();
            form.innerHTML = this.getTemplate();
            this.attachFormEvents(form);

            return form;
        },

        getInput: function () {
            return this.getForm().querySelector('input.medium-editor-toolbar-input');
        },

        getAnchorTargetCheckbox: function () {
            return this.getForm().querySelector('.medium-editor-toolbar-anchor-target');
        },

        getAnchorButtonCheckbox: function () {
            return this.getForm().querySelector('.medium-editor-toolbar-anchor-button');
        },

        handleTextboxKeyup: function (event) {
            // For ENTER -> create the anchor
            if (event.keyCode === MediumEditor.util.keyCode.ENTER) {
                event.preventDefault();
                this.doFormSave();
                return;
            }

            // For ESCAPE -> close the form
            if (event.keyCode === MediumEditor.util.keyCode.ESCAPE) {
                event.preventDefault();
                this.doFormCancel();
            }
        },

        handleFormClick: function (event) {
            // make sure not to hide form when clicking inside the form
            event.stopPropagation();
        },

        handleSaveClick: function (event) {
            // Clicking Save -> create the anchor
            event.preventDefault();
            this.doFormSave();
        },

        handleCloseClick: function (event) {
            // Click Close -> close the form
            event.preventDefault();
            this.doFormCancel();
        }
    });

    MediumEditor.extensions.anchor = AnchorForm;
}());
(function () {
    'use strict';

    var AnchorPreview = MediumEditor.Extension.extend({
        name: 'anchor-preview',

        // Anchor Preview Options

        /* hideDelay: [number]  (previously options.anchorPreviewHideDelay)
         * time in milliseconds to show the anchor tag preview after the mouse has left the anchor tag.
         */
        hideDelay: 500,

        /* previewValueSelector: [string]
         * the default selector to locate where to put the activeAnchor value in the preview
         */
        previewValueSelector: 'a',

        init: function () {
            this.anchorPreview = this.createPreview();

            this.getEditorOption('elementsContainer').appendChild(this.anchorPreview);

            this.attachToEditables();
        },

        getPreviewElement: function () {
            return this.anchorPreview;
        },

        createPreview: function () {
            var el = this.document.createElement('div');

            el.id = 'medium-editor-anchor-preview-' + this.getEditorId();
            el.className = 'medium-editor-anchor-preview';
            el.innerHTML = this.getTemplate();

            this.on(el, 'click', this.handleClick.bind(this));

            return el;
        },

        getTemplate: function () {
            return '<div class="medium-editor-toolbar-anchor-preview" id="medium-editor-toolbar-anchor-preview">' +
                '    <a class="medium-editor-toolbar-anchor-preview-inner"></a>' +
                '</div>';
        },

        destroy: function () {
            if (this.anchorPreview) {
                if (this.anchorPreview.parentNode) {
                    this.anchorPreview.parentNode.removeChild(this.anchorPreview);
                }
                delete this.anchorPreview;
            }
        },

        hidePreview: function () {
            this.anchorPreview.classList.remove('medium-editor-anchor-preview-active');
            this.activeAnchor = null;
        },

        showPreview: function (anchorEl) {
            if (this.anchorPreview.classList.contains('medium-editor-anchor-preview-active') ||
                    anchorEl.getAttribute('data-disable-preview')) {
                return true;
            }

            if (this.previewValueSelector) {
                this.anchorPreview.querySelector(this.previewValueSelector).textContent = anchorEl.attributes.href.value;
                this.anchorPreview.querySelector(this.previewValueSelector).href = anchorEl.attributes.href.value;
            }

            this.anchorPreview.classList.add('medium-toolbar-arrow-over');
            this.anchorPreview.classList.remove('medium-toolbar-arrow-under');

            if (!this.anchorPreview.classList.contains('medium-editor-anchor-preview-active')) {
                this.anchorPreview.classList.add('medium-editor-anchor-preview-active');
            }

            this.activeAnchor = anchorEl;

            this.positionPreview();
            this.attachPreviewHandlers();

            return this;
        },

        positionPreview: function (activeAnchor) {
            activeAnchor = activeAnchor || this.activeAnchor;
            var buttonHeight = this.anchorPreview.offsetHeight,
                boundary = activeAnchor.getBoundingClientRect(),
                middleBoundary = (boundary.left + boundary.right) / 2,
                diffLeft = this.diffLeft,
                diffTop = this.diffTop,
                halfOffsetWidth,
                defaultLeft;

            halfOffsetWidth = this.anchorPreview.offsetWidth / 2;
            var toolbarExtension = this.base.getExtensionByName('toolbar');
            if (toolbarExtension) {
                diffLeft = toolbarExtension.diffLeft;
                diffTop = toolbarExtension.diffTop;
            }
            defaultLeft = diffLeft - halfOffsetWidth;

            this.anchorPreview.style.top = Math.round(buttonHeight + boundary.bottom - diffTop + this.window.pageYOffset - this.anchorPreview.offsetHeight) + 'px';
            if (middleBoundary < halfOffsetWidth) {
                this.anchorPreview.style.left = defaultLeft + halfOffsetWidth + 'px';
            } else if ((this.window.innerWidth - middleBoundary) < halfOffsetWidth) {
                this.anchorPreview.style.left = this.window.innerWidth + defaultLeft - halfOffsetWidth + 'px';
            } else {
                this.anchorPreview.style.left = defaultLeft + middleBoundary + 'px';
            }
        },

        attachToEditables: function () {
            this.subscribe('editableMouseover', this.handleEditableMouseover.bind(this));
        },

        handleClick: function (event) {
            var anchorExtension = this.base.getExtensionByName('anchor'),
                activeAnchor = this.activeAnchor;

            if (anchorExtension && activeAnchor) {
                event.preventDefault();

                this.base.selectElement(this.activeAnchor);

                // Using setTimeout + delay because:
                // We may actually be displaying the anchor form, which should be controlled by delay
                this.base.delay(function () {
                    if (activeAnchor) {
                        var opts = {
                            url: activeAnchor.attributes.href.value,
                            target: activeAnchor.getAttribute('target'),
                            buttonClass: activeAnchor.getAttribute('class')
                        };
                        anchorExtension.showForm(opts);
                        activeAnchor = null;
                    }
                }.bind(this));
            }

            this.hidePreview();
        },

        handleAnchorMouseout: function () {
            this.anchorToPreview = null;
            this.off(this.activeAnchor, 'mouseout', this.instanceHandleAnchorMouseout);
            this.instanceHandleAnchorMouseout = null;
        },

        handleEditableMouseover: function (event) {
            var target = MediumEditor.util.getClosestTag(event.target, 'a');

            if (false === target) {
                return;
            }

            // Detect empty href attributes
            // The browser will make href="" or href="#top"
            // into absolute urls when accessed as event.target.href, so check the html
            if (!/href=["']\S+["']/.test(target.outerHTML) || /href=["']#\S+["']/.test(target.outerHTML)) {
                return true;
            }

            // only show when toolbar is not present
            var toolbar = this.base.getExtensionByName('toolbar');
            if (toolbar && toolbar.isDisplayed && toolbar.isDisplayed()) {
                return true;
            }

            // detach handler for other anchor in case we hovered multiple anchors quickly
            if (this.activeAnchor && this.activeAnchor !== target) {
                this.detachPreviewHandlers();
            }

            this.anchorToPreview = target;

            this.instanceHandleAnchorMouseout = this.handleAnchorMouseout.bind(this);
            this.on(this.anchorToPreview, 'mouseout', this.instanceHandleAnchorMouseout);
            // Using setTimeout + delay because:
            // - We're going to show the anchor preview according to the configured delay
            //   if the mouse has not left the anchor tag in that time
            this.base.delay(function () {
                if (this.anchorToPreview) {
                    this.showPreview(this.anchorToPreview);
                }
            }.bind(this));
        },

        handlePreviewMouseover: function () {
            this.lastOver = (new Date()).getTime();
            this.hovering = true;
        },

        handlePreviewMouseout: function (event) {
            if (!event.relatedTarget || !/anchor-preview/.test(event.relatedTarget.className)) {
                this.hovering = false;
            }
        },

        updatePreview: function () {
            if (this.hovering) {
                return true;
            }
            var durr = (new Date()).getTime() - this.lastOver;
            if (durr > this.hideDelay) {
                // hide the preview 1/2 second after mouse leaves the link
                this.detachPreviewHandlers();
            }
        },

        detachPreviewHandlers: function () {
            // cleanup
            clearInterval(this.intervalTimer);
            if (this.instanceHandlePreviewMouseover) {
                this.off(this.anchorPreview, 'mouseover', this.instanceHandlePreviewMouseover);
                this.off(this.anchorPreview, 'mouseout', this.instanceHandlePreviewMouseout);
                if (this.activeAnchor) {
                    this.off(this.activeAnchor, 'mouseover', this.instanceHandlePreviewMouseover);
                    this.off(this.activeAnchor, 'mouseout', this.instanceHandlePreviewMouseout);
                }
            }

            this.hidePreview();

            this.hovering = this.instanceHandlePreviewMouseover = this.instanceHandlePreviewMouseout = null;
        },

        // TODO: break up method and extract out handlers
        attachPreviewHandlers: function () {
            this.lastOver = (new Date()).getTime();
            this.hovering = true;

            this.instanceHandlePreviewMouseover = this.handlePreviewMouseover.bind(this);
            this.instanceHandlePreviewMouseout = this.handlePreviewMouseout.bind(this);

            this.intervalTimer = setInterval(this.updatePreview.bind(this), 200);

            this.on(this.anchorPreview, 'mouseover', this.instanceHandlePreviewMouseover);
            this.on(this.anchorPreview, 'mouseout', this.instanceHandlePreviewMouseout);
            this.on(this.activeAnchor, 'mouseover', this.instanceHandlePreviewMouseover);
            this.on(this.activeAnchor, 'mouseout', this.instanceHandlePreviewMouseout);
        }
    });

    MediumEditor.extensions.anchorPreview = AnchorPreview;
}());

(function () {
    'use strict';

    var WHITESPACE_CHARS,
        KNOWN_TLDS_FRAGMENT,
        LINK_REGEXP_TEXT,
        KNOWN_TLDS_REGEXP;

    WHITESPACE_CHARS = [' ', '\t', '\n', '\r', '\u00A0', '\u2000', '\u2001', '\u2002', '\u2003',
                                    '\u2028', '\u2029'];
    KNOWN_TLDS_FRAGMENT = 'com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|' +
        'xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|' +
        'bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|' +
        'fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|' +
        'is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|' +
        'mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|' +
        'pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|' +
        'tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw';

    LINK_REGEXP_TEXT =
        '(' +
        // Version of Gruber URL Regexp optimized for JS: http://stackoverflow.com/a/17733640
        '((?:(https?://|ftps?://|nntp://)|www\\d{0,3}[.]|[a-z0-9.\\-]+[.](' + KNOWN_TLDS_FRAGMENT + ')\\\/)\\S+(?:[^\\s`!\\[\\]{};:\'\".,?\u00AB\u00BB\u201C\u201D\u2018\u2019]))' +
        // Addition to above Regexp to support bare domains/one level subdomains with common non-i18n TLDs and without www prefix:
        ')|(([a-z0-9\\-]+\\.)?[a-z0-9\\-]+\\.(' + KNOWN_TLDS_FRAGMENT + '))';

    KNOWN_TLDS_REGEXP = new RegExp('^(' + KNOWN_TLDS_FRAGMENT + ')$', 'i');

    function nodeIsNotInsideAnchorTag(node) {
        return !MediumEditor.util.getClosestTag(node, 'a');
    }

    var AutoLink = MediumEditor.Extension.extend({
        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.disableEventHandling = false;
            this.subscribe('editableKeypress', this.onKeypress.bind(this));
            this.subscribe('editableBlur', this.onBlur.bind(this));
            // MS IE has it's own auto-URL detect feature but ours is better in some ways. Be consistent.
            this.document.execCommand('AutoUrlDetect', false, false);
        },

        destroy: function () {
            // Turn AutoUrlDetect back on
            if (this.document.queryCommandSupported('AutoUrlDetect')) {
                this.document.execCommand('AutoUrlDetect', false, true);
            }
        },

        onBlur: function (blurEvent, editable) {
            this.performLinking(editable);
        },

        onKeypress: function (keyPressEvent) {
            if (this.disableEventHandling) {
                return;
            }

            if (MediumEditor.util.isKey(keyPressEvent, [MediumEditor.util.keyCode.SPACE, MediumEditor.util.keyCode.ENTER])) {
                clearTimeout(this.performLinkingTimeout);
                // Saving/restoring the selection in the middle of a keypress doesn't work well...
                this.performLinkingTimeout = setTimeout(function () {
                    try {
                        var sel = this.base.exportSelection();
                        if (this.performLinking(keyPressEvent.target)) {
                            // pass true for favorLaterSelectionAnchor - this is needed for links at the end of a
                            // paragraph in MS IE, or MS IE causes the link to be deleted right after adding it.
                            this.base.importSelection(sel, true);
                        }
                    } catch (e) {
                        if (window.console) {
                            window.console.error('Failed to perform linking', e);
                        }
                        this.disableEventHandling = true;
                    }
                }.bind(this), 0);
            }
        },

        performLinking: function (contenteditable) {
            // Perform linking on a paragraph level basis as otherwise the detection can wrongly find the end
            // of one paragraph and the beginning of another paragraph to constitute a link, such as a paragraph ending
            // "link." and the next paragraph beginning with "my" is interpreted into "link.my" and the code tries to create
            // a link across blockElements - which doesn't work and is terrible.
            // (Medium deletes the spaces/returns between P tags so the textContent ends up without paragraph spacing)
            var blockElements = MediumEditor.util.splitByBlockElements(contenteditable),
                documentModified = false;
            if (blockElements.length === 0) {
                blockElements = [contenteditable];
            }
            for (var i = 0; i < blockElements.length; i++) {
                documentModified = this.removeObsoleteAutoLinkSpans(blockElements[i]) || documentModified;
                documentModified = this.performLinkingWithinElement(blockElements[i]) || documentModified;
            }
            return documentModified;
        },

        removeObsoleteAutoLinkSpans: function (element) {
            if (!element || element.nodeType === 3) {
                return false;
            }

            var spans = element.querySelectorAll('span[data-auto-link="true"]'),
                documentModified = false;

            for (var i = 0; i < spans.length; i++) {
                var textContent = spans[i].textContent;
                if (textContent.indexOf('://') === -1) {
                    textContent = MediumEditor.util.ensureUrlHasProtocol(textContent);
                }
                if (spans[i].getAttribute('data-href') !== textContent && nodeIsNotInsideAnchorTag(spans[i])) {
                    documentModified = true;
                    var trimmedTextContent = textContent.replace(/\s+$/, '');
                    if (spans[i].getAttribute('data-href') === trimmedTextContent) {
                        var charactersTrimmed = textContent.length - trimmedTextContent.length,
                            subtree = MediumEditor.util.splitOffDOMTree(spans[i], this.splitTextBeforeEnd(spans[i], charactersTrimmed));
                        spans[i].parentNode.insertBefore(subtree, spans[i].nextSibling);
                    } else {
                        // Some editing has happened to the span, so just remove it entirely. The user can put it back
                        // around just the href content if they need to prevent it from linking
                        MediumEditor.util.unwrap(spans[i], this.document);
                    }
                }
            }
            return documentModified;
        },

        splitTextBeforeEnd: function (element, characterCount) {
            var treeWalker = this.document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false),
                lastChildNotExhausted = true;

            // Start the tree walker at the last descendant of the span
            while (lastChildNotExhausted) {
                lastChildNotExhausted = treeWalker.lastChild() !== null;
            }

            var currentNode,
                currentNodeValue,
                previousNode;
            while (characterCount > 0 && previousNode !== null) {
                currentNode = treeWalker.currentNode;
                currentNodeValue = currentNode.nodeValue;
                if (currentNodeValue.length > characterCount) {
                    previousNode = currentNode.splitText(currentNodeValue.length - characterCount);
                    characterCount = 0;
                } else {
                    previousNode = treeWalker.previousNode();
                    characterCount -= currentNodeValue.length;
                }
            }
            return previousNode;
        },

        performLinkingWithinElement: function (element) {
            var matches = this.findLinkableText(element),
                linkCreated = false;

            for (var matchIndex = 0; matchIndex < matches.length; matchIndex++) {
                var matchingTextNodes = MediumEditor.util.findOrCreateMatchingTextNodes(this.document, element,
                        matches[matchIndex]);
                if (this.shouldNotLink(matchingTextNodes)) {
                    continue;
                }
                this.createAutoLink(matchingTextNodes, matches[matchIndex].href);
            }
            return linkCreated;
        },

        shouldNotLink: function (textNodes) {
            var shouldNotLink = false;
            for (var i = 0; i < textNodes.length && shouldNotLink === false; i++) {
                // Do not link if the text node is either inside an anchor or inside span[data-auto-link]
                shouldNotLink = !!MediumEditor.util.traverseUp(textNodes[i], function (node) {
                    return node.nodeName.toLowerCase() === 'a' ||
                        (node.getAttribute && node.getAttribute('data-auto-link') === 'true');
                });
            }
            return shouldNotLink;
        },

        findLinkableText: function (contenteditable) {
            var linkRegExp = new RegExp(LINK_REGEXP_TEXT, 'gi'),
                textContent = contenteditable.textContent,
                match = null,
                matches = [];

            while ((match = linkRegExp.exec(textContent)) !== null) {
                var matchOk = true,
                    matchEnd = match.index + match[0].length;
                // If the regexp detected something as a link that has text immediately preceding/following it, bail out.
                matchOk = (match.index === 0 || WHITESPACE_CHARS.indexOf(textContent[match.index - 1]) !== -1) &&
                    (matchEnd === textContent.length || WHITESPACE_CHARS.indexOf(textContent[matchEnd]) !== -1);
                // If the regexp detected a bare domain that doesn't use one of our expected TLDs, bail out.
                matchOk = matchOk && (match[0].indexOf('/') !== -1 ||
                    KNOWN_TLDS_REGEXP.test(match[0].split('.').pop().split('?').shift()));

                if (matchOk) {
                    matches.push({
                        href: match[0],
                        start: match.index,
                        end: matchEnd
                    });
                }
            }
            return matches;
        },

        createAutoLink: function (textNodes, href) {
            href = MediumEditor.util.ensureUrlHasProtocol(href);
            var anchor = MediumEditor.util.createLink(this.document, textNodes, href, this.getEditorOption('targetBlank') ? '_blank' : null),
                span = this.document.createElement('span');
            span.setAttribute('data-auto-link', 'true');
            span.setAttribute('data-href', href);
            anchor.insertBefore(span, anchor.firstChild);
            while (anchor.childNodes.length > 1) {
                span.appendChild(anchor.childNodes[1]);
            }
        }

    });

    MediumEditor.extensions.autoLink = AutoLink;
}());
(function () {
    'use strict';

    var CLASS_DRAG_OVER = 'medium-editor-dragover';

    function clearClassNames(element) {
        var editable = MediumEditor.util.getContainerEditorElement(element),
            existing = Array.prototype.slice.call(editable.parentElement.querySelectorAll('.' + CLASS_DRAG_OVER));

        existing.forEach(function (el) {
            el.classList.remove(CLASS_DRAG_OVER);
        });
    }

    var FileDragging = MediumEditor.Extension.extend({
        name: 'fileDragging',

        allowedTypes: ['image'],

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.subscribe('editableDrag', this.handleDrag.bind(this));
            this.subscribe('editableDrop', this.handleDrop.bind(this));
        },

        handleDrag: function (event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';

            var target = event.target.classList ? event.target : event.target.parentElement;

            // Ensure the class gets removed from anything that had it before
            clearClassNames(target);

            if (event.type === 'dragover') {
                target.classList.add(CLASS_DRAG_OVER);
            }
        },

        handleDrop: function (event) {
            // Prevent file from opening in the current window
            event.preventDefault();
            event.stopPropagation();

            // IE9 does not support the File API, so prevent file from opening in the window
            // but also don't try to actually get the file
            if (event.dataTransfer.files) {
                Array.prototype.slice.call(event.dataTransfer.files).forEach(function (file) {
                    if (this.isAllowedFile(file)) {
                        if (file.type.match('image')) {
                            this.insertImageFile(file);
                        }
                    }
                }, this);
            }

            // Make sure we remove our class from everything
            clearClassNames(event.target);
        },

        isAllowedFile: function (file) {
            return this.allowedTypes.some(function (fileType) {
                return !!file.type.match(fileType);
            });
        },

        insertImageFile: function (file) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);

            var id = 'medium-img-' + (+new Date());
            MediumEditor.util.insertHTMLCommand(this.document, '<img class="medium-editor-image-loading" id="' + id + '" />');

            fileReader.onload = function () {
                var img = this.document.getElementById(id);
                if (img) {
                    img.removeAttribute('id');
                    img.removeAttribute('class');
                    img.src = fileReader.result;
                }
            }.bind(this);
        }
    });

    MediumEditor.extensions.fileDragging = FileDragging;
}());

(function () {
    'use strict';

    var KeyboardCommands = MediumEditor.Extension.extend({
        name: 'keyboard-commands',

        /* KeyboardCommands Options */

        /* commands: [Array]
         * Array of objects describing each command and the combination of keys that will trigger it
         * Required for each object:
         *   command [String] (argument passed to editor.execAction())
         *   key [String] (keyboard character that triggers this command)
         *   meta [boolean] (whether the ctrl/meta key has to be active or inactive)
         *   shift [boolean] (whether the shift key has to be active or inactive)
         *   alt [boolean] (whether the alt key has to be active or inactive)
         */
        commands: [
            {
                command: 'bold',
                key: 'B',
                meta: true,
                shift: false,
                alt: false
            },
            {
                command: 'italic',
                key: 'I',
                meta: true,
                shift: false,
                alt: false
            },
            {
                command: 'underline',
                key: 'U',
                meta: true,
                shift: false,
                alt: false
            }
        ],

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.subscribe('editableKeydown', this.handleKeydown.bind(this));
            this.keys = {};
            this.commands.forEach(function (command) {
                var keyCode = command.key.charCodeAt(0);
                if (!this.keys[keyCode]) {
                    this.keys[keyCode] = [];
                }
                this.keys[keyCode].push(command);
            }, this);
        },

        handleKeydown: function (event) {
            var keyCode = MediumEditor.util.getKeyCode(event);
            if (!this.keys[keyCode]) {
                return;
            }

            var isMeta = MediumEditor.util.isMetaCtrlKey(event),
                isShift = !!event.shiftKey,
                isAlt = !!event.altKey;

            this.keys[keyCode].forEach(function (data) {
                if (data.meta === isMeta &&
                    data.shift === isShift &&
                    (data.alt === isAlt ||
                     undefined === data.alt)) { // TODO deprecated: remove check for undefined === data.alt when jumping to 6.0.0
                    event.preventDefault();
                    event.stopPropagation();

                    // command can be false so the shortcut is just disabled
                    if (false !== data.command) {
                        this.execAction(data.command);
                    }
                }
            }, this);
        }
    });

    MediumEditor.extensions.keyboardCommands = KeyboardCommands;
}());

(function () {
    'use strict';

    var FontSizeForm = MediumEditor.extensions.form.extend({

        name: 'fontsize',
        action: 'fontSize',
        aria: 'increase/decrease font size',
        contentDefault: '&#xB1;', // ±
        contentFA: '<i class="fa fa-text-height"></i>',

        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);
        },

        // Called when the button the toolbar is clicked
        // Overrides ButtonExtension.handleClick
        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (!this.isDisplayed()) {
                // Get fontsize of current selection (convert to string since IE returns this as number)
                var fontSize = this.document.queryCommandValue('fontSize') + '';
                this.showForm(fontSize);
            }

            return false;
        },

        // Called by medium-editor to append form to the toolbar
        getForm: function () {
            if (!this.form) {
                this.form = this.createForm();
            }
            return this.form;
        },

        // Used by medium-editor when the default toolbar is to be displayed
        isDisplayed: function () {
            return this.getForm().style.display === 'block';
        },

        hideForm: function () {
            this.getForm().style.display = 'none';
            this.getInput().value = '';
        },

        showForm: function (fontSize) {
            var input = this.getInput();

            this.base.saveSelection();
            this.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.setToolbarPosition();

            input.value = fontSize || '';
            input.focus();
        },

        // Called by core when tearing down medium-editor (destroy)
        destroy: function () {
            if (!this.form) {
                return false;
            }

            if (this.form.parentNode) {
                this.form.parentNode.removeChild(this.form);
            }

            delete this.form;
        },

        // core methods

        doFormSave: function () {
            this.base.restoreSelection();
            this.base.checkSelection();
        },

        doFormCancel: function () {
            this.base.restoreSelection();
            this.clearFontSize();
            this.base.checkSelection();
        },

        // form creation and event handling
        createForm: function () {
            var doc = this.document,
                form = doc.createElement('div'),
                input = doc.createElement('input'),
                close = doc.createElement('a'),
                save = doc.createElement('a');

            // Font Size Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-fontsize-' + this.getEditorId();

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));

            // Add font size slider
            input.setAttribute('type', 'range');
            input.setAttribute('min', '1');
            input.setAttribute('max', '7');
            input.className = 'medium-editor-toolbar-input';
            form.appendChild(input);

            // Handle typing in the textbox
            this.on(input, 'change', this.handleSliderChange.bind(this));

            // Add save buton
            save.setAttribute('href', '#');
            save.className = 'medium-editor-toobar-save';
            save.innerHTML = this.getEditorOption('buttonLabels') === 'fontawesome' ?
                             '<i class="fa fa-check"></i>' :
                             '&#10003;';
            form.appendChild(save);

            // Handle save button clicks (capture)
            this.on(save, 'click', this.handleSaveClick.bind(this), true);

            // Add close button
            close.setAttribute('href', '#');
            close.className = 'medium-editor-toobar-close';
            close.innerHTML = this.getEditorOption('buttonLabels') === 'fontawesome' ?
                              '<i class="fa fa-times"></i>' :
                              '&times;';
            form.appendChild(close);

            // Handle close button clicks
            this.on(close, 'click', this.handleCloseClick.bind(this));

            return form;
        },

        getInput: function () {
            return this.getForm().querySelector('input.medium-editor-toolbar-input');
        },

        clearFontSize: function () {
            MediumEditor.selection.getSelectedElements(this.document).forEach(function (el) {
                if (el.nodeName.toLowerCase() === 'font' && el.hasAttribute('size')) {
                    el.removeAttribute('size');
                }
            });
        },

        handleSliderChange: function () {
            var size = this.getInput().value;
            if (size === '4') {
                this.clearFontSize();
            } else {
                this.execAction('fontSize', { size: size });
            }
        },

        handleFormClick: function (event) {
            // make sure not to hide form when clicking inside the form
            event.stopPropagation();
        },

        handleSaveClick: function (event) {
            // Clicking Save -> create the font size
            event.preventDefault();
            this.doFormSave();
        },

        handleCloseClick: function (event) {
            // Click Close -> close the form
            event.preventDefault();
            this.doFormCancel();
        }
    });

    MediumEditor.extensions.fontSize = FontSizeForm;
}());
(function () {
    'use strict';
    /*jslint regexp: true*/
    /*
        jslint does not allow character negation, because the negation
        will not match any unicode characters. In the regexes in this
        block, negation is used specifically to match the end of an html
        tag, and in fact unicode characters *should* be allowed.
    */
    function createReplacements() {
        return [
            // replace two bogus tags that begin pastes from google docs
            [new RegExp(/<[^>]*docs-internal-guid[^>]*>/gi), ''],
            [new RegExp(/<\/b>(<br[^>]*>)?$/gi), ''],

             // un-html spaces and newlines inserted by OS X
            [new RegExp(/<span class="Apple-converted-space">\s+<\/span>/g), ' '],
            [new RegExp(/<br class="Apple-interchange-newline">/g), '<br>'],

            // replace google docs italics+bold with a span to be replaced once the html is inserted
            [new RegExp(/<span[^>]*(font-style:italic;font-weight:bold|font-weight:bold;font-style:italic)[^>]*>/gi), '<span class="replace-with italic bold">'],

            // replace google docs italics with a span to be replaced once the html is inserted
            [new RegExp(/<span[^>]*font-style:italic[^>]*>/gi), '<span class="replace-with italic">'],

            //[replace google docs bolds with a span to be replaced once the html is inserted
            [new RegExp(/<span[^>]*font-weight:bold[^>]*>/gi), '<span class="replace-with bold">'],

             // replace manually entered b/i/a tags with real ones
            [new RegExp(/&lt;(\/?)(i|b|a)&gt;/gi), '<$1$2>'],

             // replace manually a tags with real ones, converting smart-quotes from google docs
            [new RegExp(/&lt;a(?:(?!href).)+href=(?:&quot;|&rdquo;|&ldquo;|"|“|”)(((?!&quot;|&rdquo;|&ldquo;|"|“|”).)*)(?:&quot;|&rdquo;|&ldquo;|"|“|”)(?:(?!&gt;).)*&gt;/gi), '<a href="$1">'],

            // Newlines between paragraphs in html have no syntactic value,
            // but then have a tendency to accidentally become additional paragraphs down the line
            [new RegExp(/<\/p>\n+/gi), '</p>'],
            [new RegExp(/\n+<p/gi), '<p'],

            // Microsoft Word makes these odd tags, like <o:p></o:p>
            [new RegExp(/<\/?o:[a-z]*>/gi), ''],

            // cleanup comments added by Chrome when pasting html
            ['<!--EndFragment-->', ''],
            ['<!--StartFragment-->', '']
        ];
    }
    /*jslint regexp: false*/

    var PasteHandler = MediumEditor.Extension.extend({
        /* Paste Options */

        /* forcePlainText: [boolean]
         * Forces pasting as plain text.
         */
        forcePlainText: true,

        /* cleanPastedHTML: [boolean]
         * cleans pasted content from different sources, like google docs etc.
         */
        cleanPastedHTML: false,

        /* cleanReplacements: [Array]
         * custom pairs (2 element arrays) of RegExp and replacement text to use during paste when
         * __forcePlainText__ or __cleanPastedHTML__ are `true` OR when calling `cleanPaste(text)` helper method.
         */
        cleanReplacements: [],

        /* cleanAttrs:: [Array]
         * list of element attributes to remove during paste when __cleanPastedHTML__ is `true` or when
         * calling `cleanPaste(text)` or `pasteHTML(html, options)` helper methods.
         */
        cleanAttrs: ['class', 'style', 'dir'],

        /* cleanTags: [Array]
         * list of element tag names to remove during paste when __cleanPastedHTML__ is `true` or when
         * calling `cleanPaste(text)` or `pasteHTML(html, options)` helper methods.
         */
        cleanTags: ['meta'],

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            if (this.forcePlainText || this.cleanPastedHTML) {
                this.subscribe('editablePaste', this.handlePaste.bind(this));
            }
        },

        handlePaste: function (event, element) {
            var paragraphs,
                html = '',
                p,
                dataFormatHTML = 'text/html',
                dataFormatPlain = 'text/plain',
                pastedHTML,
                pastedPlain;

            if (this.window.clipboardData && event.clipboardData === undefined) {
                event.clipboardData = this.window.clipboardData;
                // If window.clipboardData exists, but event.clipboardData doesn't exist,
                // we're probably in IE. IE only has two possibilities for clipboard
                // data format: 'Text' and 'URL'.
                //
                // Of the two, we want 'Text':
                dataFormatHTML = 'Text';
                dataFormatPlain = 'Text';
            }

            if (event.clipboardData &&
                    event.clipboardData.getData &&
                    !event.defaultPrevented) {
                event.preventDefault();

                pastedHTML = event.clipboardData.getData(dataFormatHTML);
                pastedPlain = event.clipboardData.getData(dataFormatPlain);

                if (this.cleanPastedHTML && pastedHTML) {
                    return this.cleanPaste(pastedHTML);
                }

                if (!(this.getEditorOption('disableReturn') || element.getAttribute('data-disable-return'))) {
                    paragraphs = pastedPlain.split(/[\r\n]+/g);
                    // If there are no \r\n in data, don't wrap in <p>
                    if (paragraphs.length > 1) {
                        for (p = 0; p < paragraphs.length; p += 1) {
                            if (paragraphs[p] !== '') {
                                html += '<p>' + MediumEditor.util.htmlEntities(paragraphs[p]) + '</p>';
                            }
                        }
                    } else {
                        html = MediumEditor.util.htmlEntities(paragraphs[0]);
                    }
                } else {
                    html = MediumEditor.util.htmlEntities(pastedPlain);
                }
                MediumEditor.util.insertHTMLCommand(this.document, html);
            }
        },

        cleanPaste: function (text) {
            var i, elList, tmp, workEl,
                multiline = /<p|<br|<div/.test(text),
                replacements = createReplacements().concat(this.cleanReplacements || []);

            for (i = 0; i < replacements.length; i += 1) {
                text = text.replace(replacements[i][0], replacements[i][1]);
            }

            if (!multiline) {
                return this.pasteHTML(text);
            }

            // create a temporary div to cleanup block elements
            tmp = this.document.createElement('div');

            // double br's aren't converted to p tags, but we want paragraphs.
            tmp.innerHTML = '<p>' + text.split('<br><br>').join('</p><p>') + '</p>';

            // block element cleanup
            elList = tmp.querySelectorAll('a,p,div,br');
            for (i = 0; i < elList.length; i += 1) {
                workEl = elList[i];

                // Microsoft Word replaces some spaces with newlines.
                // While newlines between block elements are meaningless, newlines within
                // elements are sometimes actually spaces.
                workEl.innerHTML = workEl.innerHTML.replace(/\n/gi, ' ');

                switch (workEl.nodeName.toLowerCase()) {
                    case 'p':
                    case 'div':
                        this.filterCommonBlocks(workEl);
                        break;
                    case 'br':
                        this.filterLineBreak(workEl);
                        break;
                }
            }

            this.pasteHTML(tmp.innerHTML);
        },

        pasteHTML: function (html, options) {
            options = MediumEditor.util.defaults({}, options, {
                cleanAttrs: this.cleanAttrs,
                cleanTags: this.cleanTags
            });

            var elList, workEl, i, fragmentBody, pasteBlock = this.document.createDocumentFragment();

            pasteBlock.appendChild(this.document.createElement('body'));

            fragmentBody = pasteBlock.querySelector('body');
            fragmentBody.innerHTML = html;

            this.cleanupSpans(fragmentBody);

            elList = fragmentBody.querySelectorAll('*');
            for (i = 0; i < elList.length; i += 1) {
                workEl = elList[i];

                if ('a' === workEl.nodeName.toLowerCase() && this.getEditorOption('targetBlank')) {
                    MediumEditor.util.setTargetBlank(workEl);
                }

                MediumEditor.util.cleanupAttrs(workEl, options.cleanAttrs);
                MediumEditor.util.cleanupTags(workEl, options.cleanTags);
            }

            MediumEditor.util.insertHTMLCommand(this.document, fragmentBody.innerHTML.replace(/&nbsp;/g, ' '));
        },

        isCommonBlock: function (el) {
            return (el && (el.nodeName.toLowerCase() === 'p' || el.nodeName.toLowerCase() === 'div'));
        },

        filterCommonBlocks: function (el) {
            if (/^\s*$/.test(el.textContent) && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        },

        filterLineBreak: function (el) {
            if (this.isCommonBlock(el.previousElementSibling)) {
                // remove stray br's following common block elements
                this.removeWithParent(el);
            } else if (this.isCommonBlock(el.parentNode) && (el.parentNode.firstChild === el || el.parentNode.lastChild === el)) {
                // remove br's just inside open or close tags of a div/p
                this.removeWithParent(el);
            } else if (el.parentNode && el.parentNode.childElementCount === 1 && el.parentNode.textContent === '') {
                // and br's that are the only child of elements other than div/p
                this.removeWithParent(el);
            }
        },

        // remove an element, including its parent, if it is the only element within its parent
        removeWithParent: function (el) {
            if (el && el.parentNode) {
                if (el.parentNode.parentNode && el.parentNode.childElementCount === 1) {
                    el.parentNode.parentNode.removeChild(el.parentNode);
                } else {
                    el.parentNode.removeChild(el);
                }
            }
        },

        cleanupSpans: function (containerEl) {
            var i,
                el,
                newEl,
                spans = containerEl.querySelectorAll('.replace-with'),
                isCEF = function (el) {
                    return (el && el.nodeName !== '#text' && el.getAttribute('contenteditable') === 'false');
                };

            for (i = 0; i < spans.length; i += 1) {
                el = spans[i];
                newEl = this.document.createElement(el.classList.contains('bold') ? 'b' : 'i');

                if (el.classList.contains('bold') && el.classList.contains('italic')) {
                    // add an i tag as well if this has both italics and bold
                    newEl.innerHTML = '<i>' + el.innerHTML + '</i>';
                } else {
                    newEl.innerHTML = el.innerHTML;
                }
                el.parentNode.replaceChild(newEl, el);
            }

            spans = containerEl.querySelectorAll('span');
            for (i = 0; i < spans.length; i += 1) {
                el = spans[i];

                // bail if span is in contenteditable = false
                if (MediumEditor.util.traverseUp(el, isCEF)) {
                    return false;
                }

                // remove empty spans, replace others with their contents
                MediumEditor.util.unwrap(el, this.document);
            }
        }
    });

    MediumEditor.extensions.paste = PasteHandler;
}());

(function () {
    'use strict';

    var Placeholder = MediumEditor.Extension.extend({
        name: 'placeholder',

        /* Placeholder Options */

        /* text: [string]
         * Text to display in the placeholder
         */
        text: 'Type your text',

        /* hideOnClick: [boolean]
         * Should we hide the placeholder on click (true) or when user starts typing (false)
         */
        hideOnClick: true,

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.initPlaceholders();
            this.attachEventHandlers();
        },

        initPlaceholders: function () {
            this.getEditorElements().forEach(function (el) {
                if (!el.getAttribute('data-placeholder')) {
                    el.setAttribute('data-placeholder', this.text);
                }
                this.updatePlaceholder(el);
            }, this);
        },

        destroy: function () {
            this.getEditorElements().forEach(function (el) {
                if (el.getAttribute('data-placeholder') === this.text) {
                    el.removeAttribute('data-placeholder');
                }
            }, this);
        },

        showPlaceholder: function (el) {
            if (el) {
                el.classList.add('medium-editor-placeholder');
            }
        },

        hidePlaceholder: function (el) {
            if (el) {
                el.classList.remove('medium-editor-placeholder');
            }
        },

        updatePlaceholder: function (el, dontShow) {
            // If the element has content, hide the placeholder
            if (el.querySelector('img, blockquote, ul, ol') || (el.textContent.replace(/^\s+|\s+$/g, '') !== '')) {
                return this.hidePlaceholder(el);
            }

            if (!dontShow) {
                this.showPlaceholder(el);
            }
        },

        attachEventHandlers: function () {
            if (this.hideOnClick) {
                // For the 'hideOnClick' option, the placeholder should always be hidden on focus
                this.subscribe('focus', this.handleFocus.bind(this));
            }

            // If the editor has content, it should always hide the placeholder
            this.subscribe('editableInput', this.handleInput.bind(this));

            // When the editor loses focus, check if the placeholder should be visible
            this.subscribe('blur', this.handleBlur.bind(this));
        },

        handleInput: function (event, element) {
            // If the placeholder should be hidden on focus and the
            // element has focus, don't show the placeholder
            var dontShow = this.hideOnClick && (element === this.base.getFocusedElement());

            // Editor's content has changed, check if the placeholder should be hidden
            this.updatePlaceholder(element, dontShow);
        },

        handleFocus: function (event, element) {
            // Editor has focus, hide the placeholder
            this.hidePlaceholder(element);
        },

        handleBlur: function (event, element) {
            // Editor has lost focus, check if the placeholder should be shown
            this.updatePlaceholder(element);
        }
    });

    MediumEditor.extensions.placeholder = Placeholder;
}());

(function () {
    'use strict';

    var Toolbar = MediumEditor.Extension.extend({
        name: 'toolbar',

        /* Toolbar Options */

        /* align: ['left'|'center'|'right']
         * When the __static__ option is true, this aligns the static toolbar
         * relative to the medium-editor element.
         */
        align: 'center',

        /* allowMultiParagraphSelection: [boolean]
         * enables/disables whether the toolbar should be displayed when
         * selecting multiple paragraphs/block elements
         */
        allowMultiParagraphSelection: true,

        /* buttons: [Array]
         * the names of the set of buttons to display on the toolbar.
         */
        buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote'],

        /* diffLeft: [Number]
         * value in pixels to be added to the X axis positioning of the toolbar.
         */
        diffLeft: 0,

        /* diffTop: [Number]
         * value in pixels to be added to the Y axis positioning of the toolbar.
         */
        diffTop: -10,

        /* firstButtonClass: [string]
         * CSS class added to the first button in the toolbar.
         */
        firstButtonClass: 'medium-editor-button-first',

        /* lastButtonClass: [string]
         * CSS class added to the last button in the toolbar.
         */
        lastButtonClass: 'medium-editor-button-last',

        /* standardizeSelectionStart: [boolean]
         * enables/disables standardizing how the beginning of a range is decided
         * between browsers whenever the selected text is analyzed for updating toolbar buttons status.
         */
        standardizeSelectionStart: false,

        /* static: [boolean]
         * enable/disable the toolbar always displaying in the same location
         * relative to the medium-editor element.
         */
        static: false,

        /* sticky: [boolean]
         * When the __static__ option is true, this enables/disables the toolbar
         * "sticking" to the viewport and staying visible on the screen while
         * the page scrolls.
         */
        sticky: false,

        /* updateOnEmptySelection: [boolean]
         * When the __static__ option is true, this enables/disables updating
         * the state of the toolbar buttons even when the selection is collapsed
         * (there is no selection, just a cursor).
         */
        updateOnEmptySelection: false,

        /* relativeContainer: [node]
         * appending the toolbar to a given node instead of body
         */
        relativeContainer: null,

        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.initThrottledMethods();

            if (!this.relativeContainer) {
                this.getEditorOption('elementsContainer').appendChild(this.getToolbarElement());
            } else {
                this.relativeContainer.appendChild(this.getToolbarElement());
            }
        },

        // Helper method to execute method for every extension, but ignoring the toolbar extension
        forEachExtension: function (iterator, context) {
            return this.base.extensions.forEach(function (command) {
                if (command === this) {
                    return;
                }
                return iterator.apply(context || this, arguments);
            }, this);
        },

        // Toolbar creation/deletion

        createToolbar: function () {
            var toolbar = this.document.createElement('div');

            toolbar.id = 'medium-editor-toolbar-' + this.getEditorId();
            toolbar.className = 'medium-editor-toolbar';

            if (this.static) {
                toolbar.className += ' static-toolbar';
            } else if (this.relativeContainer) {
                toolbar.className += ' medium-editor-relative-toolbar';
            } else {
                toolbar.className += ' medium-editor-stalker-toolbar';
            }

            toolbar.appendChild(this.createToolbarButtons());

            // Add any forms that extensions may have
            this.forEachExtension(function (extension) {
                if (extension.hasForm) {
                    toolbar.appendChild(extension.getForm());
                }
            });

            this.attachEventHandlers();

            return toolbar;
        },

        createToolbarButtons: function () {
            var ul = this.document.createElement('ul'),
                li,
                btn,
                buttons,
                extension,
                buttonName,
                buttonOpts;

            ul.id = 'medium-editor-toolbar-actions' + this.getEditorId();
            ul.className = 'medium-editor-toolbar-actions';
            ul.style.display = 'block';

            this.buttons.forEach(function (button) {
                if (typeof button === 'string') {
                    buttonName = button;
                    buttonOpts = null;
                } else {
                    buttonName = button.name;
                    buttonOpts = button;
                }

                // If the button already exists as an extension, it'll be returned
                // othwerise it'll create the default built-in button
                extension = this.base.addBuiltInExtension(buttonName, buttonOpts);

                if (extension && typeof extension.getButton === 'function') {
                    btn = extension.getButton(this.base);
                    li = this.document.createElement('li');
                    if (MediumEditor.util.isElement(btn)) {
                        li.appendChild(btn);
                    } else {
                        li.innerHTML = btn;
                    }
                    ul.appendChild(li);
                }
            }, this);

            buttons = ul.querySelectorAll('button');
            if (buttons.length > 0) {
                buttons[0].classList.add(this.firstButtonClass);
                buttons[buttons.length - 1].classList.add(this.lastButtonClass);
            }

            return ul;
        },

        destroy: function () {
            if (this.toolbar) {
                if (this.toolbar.parentNode) {
                    this.toolbar.parentNode.removeChild(this.toolbar);
                }
                delete this.toolbar;
            }
        },

        // Toolbar accessors

        getToolbarElement: function () {
            if (!this.toolbar) {
                this.toolbar = this.createToolbar();
            }

            return this.toolbar;
        },

        getToolbarActionsElement: function () {
            return this.getToolbarElement().querySelector('.medium-editor-toolbar-actions');
        },

        // Toolbar event handlers

        initThrottledMethods: function () {
            // throttledPositionToolbar is throttled because:
            // - It will be called when the browser is resizing, which can fire many times very quickly
            // - For some event (like resize) a slight lag in UI responsiveness is OK and provides performance benefits
            this.throttledPositionToolbar = MediumEditor.util.throttle(function () {
                if (this.base.isActive) {
                    this.positionToolbarIfShown();
                }
            }.bind(this));
        },

        attachEventHandlers: function () {
            // MediumEditor custom events for when user beings and ends interaction with a contenteditable and its elements
            this.subscribe('blur', this.handleBlur.bind(this));
            this.subscribe('focus', this.handleFocus.bind(this));

            // Updating the state of the toolbar as things change
            this.subscribe('editableClick', this.handleEditableClick.bind(this));
            this.subscribe('editableKeyup', this.handleEditableKeyup.bind(this));

            // Handle mouseup on document for updating the selection in the toolbar
            this.on(this.document.documentElement, 'mouseup', this.handleDocumentMouseup.bind(this));

            // Add a scroll event for sticky toolbar
            if (this.static && this.sticky) {
                // On scroll (capture), re-position the toolbar
                this.on(this.window, 'scroll', this.handleWindowScroll.bind(this), true);
            }

            // On resize, re-position the toolbar
            this.on(this.window, 'resize', this.handleWindowResize.bind(this));
        },

        handleWindowScroll: function () {
            this.positionToolbarIfShown();
        },

        handleWindowResize: function () {
            this.throttledPositionToolbar();
        },

        handleDocumentMouseup: function (event) {
            // Do not trigger checkState when mouseup fires over the toolbar
            if (event &&
                    event.target &&
                    MediumEditor.util.isDescendant(this.getToolbarElement(), event.target)) {
                return false;
            }
            this.checkState();
        },

        handleEditableClick: function () {
            // Delay the call to checkState to handle bug where selection is empty
            // immediately after clicking inside a pre-existing selection
            setTimeout(function () {
                this.checkState();
            }.bind(this), 0);
        },

        handleEditableKeyup: function () {
            this.checkState();
        },

        handleBlur: function () {
            // Kill any previously delayed calls to hide the toolbar
            clearTimeout(this.hideTimeout);

            // Blur may fire even if we have a selection, so we want to prevent any delayed showToolbar
            // calls from happening in this specific case
            clearTimeout(this.delayShowTimeout);

            // Delay the call to hideToolbar to handle bug with multiple editors on the page at once
            this.hideTimeout = setTimeout(function () {
                this.hideToolbar();
            }.bind(this), 1);
        },

        handleFocus: function () {
            this.checkState();
        },

        // Hiding/showing toolbar

        isDisplayed: function () {
            return this.getToolbarElement().classList.contains('medium-editor-toolbar-active');
        },

        showToolbar: function () {
            clearTimeout(this.hideTimeout);
            if (!this.isDisplayed()) {
                this.getToolbarElement().classList.add('medium-editor-toolbar-active');
                this.trigger('showToolbar', {}, this.base.getFocusedElement());
            }
        },

        hideToolbar: function () {
            if (this.isDisplayed()) {
                this.getToolbarElement().classList.remove('medium-editor-toolbar-active');
                this.trigger('hideToolbar', {}, this.base.getFocusedElement());
            }
        },

        isToolbarDefaultActionsDisplayed: function () {
            return this.getToolbarActionsElement().style.display === 'block';
        },

        hideToolbarDefaultActions: function () {
            if (this.isToolbarDefaultActionsDisplayed()) {
                this.getToolbarActionsElement().style.display = 'none';
            }
        },

        showToolbarDefaultActions: function () {
            this.hideExtensionForms();

            if (!this.isToolbarDefaultActionsDisplayed()) {
                this.getToolbarActionsElement().style.display = 'block';
            }

            // Using setTimeout + options.delay because:
            // We will actually be displaying the toolbar, which should be controlled by options.delay
            this.delayShowTimeout = this.base.delay(function () {
                this.showToolbar();
            }.bind(this));
        },

        hideExtensionForms: function () {
            // Hide all extension forms
            this.forEachExtension(function (extension) {
                if (extension.hasForm && extension.isDisplayed()) {
                    extension.hideForm();
                }
            });
        },

        // Responding to changes in user selection

        // Checks for existance of multiple block elements in the current selection
        multipleBlockElementsSelected: function () {
            var regexEmptyHTMLTags = /<[^\/>][^>]*><\/[^>]+>/gim, // http://stackoverflow.com/questions/3129738/remove-empty-tags-using-regex
                regexBlockElements = new RegExp('<(' + MediumEditor.util.blockContainerElementNames.join('|') + ')[^>]*>', 'g'),
                selectionHTML = MediumEditor.selection.getSelectionHtml(this.document).replace(regexEmptyHTMLTags, ''), // Filter out empty blocks from selection
                hasMultiParagraphs = selectionHTML.match(regexBlockElements); // Find how many block elements are within the html

            return !!hasMultiParagraphs && hasMultiParagraphs.length > 1;
        },

        modifySelection: function () {
            var selection = this.window.getSelection(),
                selectionRange = selection.getRangeAt(0);

            /*
            * In firefox, there are cases (ie doubleclick of a word) where the selectionRange start
            * will be at the very end of an element.  In other browsers, the selectionRange start
            * would instead be at the very beginning of an element that actually has content.
            * example:
            *   <span>foo</span><span>bar</span>
            *
            * If the text 'bar' is selected, most browsers will have the selectionRange start at the beginning
            * of the 'bar' span.  However, there are cases where firefox will have the selectionRange start
            * at the end of the 'foo' span.  The contenteditable behavior will be ok, but if there are any
            * properties on the 'bar' span, they won't be reflected accurately in the toolbar
            * (ie 'Bold' button wouldn't be active)
            *
            * So, for cases where the selectionRange start is at the end of an element/node, find the next
            * adjacent text node that actually has content in it, and move the selectionRange start there.
            */
            if (this.standardizeSelectionStart &&
                    selectionRange.startContainer.nodeValue &&
                    (selectionRange.startOffset === selectionRange.startContainer.nodeValue.length)) {
                var adjacentNode = MediumEditor.util.findAdjacentTextNodeWithContent(MediumEditor.selection.getSelectionElement(this.window), selectionRange.startContainer, this.document);
                if (adjacentNode) {
                    var offset = 0;
                    while (adjacentNode.nodeValue.substr(offset, 1).trim().length === 0) {
                        offset = offset + 1;
                    }
                    selectionRange = MediumEditor.selection.select(this.document, adjacentNode, offset,
                        selectionRange.endContainer, selectionRange.endOffset);
                }
            }
        },

        checkState: function () {
            if (this.base.preventSelectionUpdates) {
                return;
            }

            // If no editable has focus OR selection is inside contenteditable = false
            // hide toolbar
            if (!this.base.getFocusedElement() ||
                    MediumEditor.selection.selectionInContentEditableFalse(this.window)) {
                return this.hideToolbar();
            }

            // If there's no selection element, selection element doesn't belong to this editor
            // or toolbar is disabled for this selection element
            // hide toolbar
            var selectionElement = MediumEditor.selection.getSelectionElement(this.window);
            if (!selectionElement ||
                    this.getEditorElements().indexOf(selectionElement) === -1 ||
                    selectionElement.getAttribute('data-disable-toolbar')) {
                return this.hideToolbar();
            }

            // Now we know there's a focused editable with a selection

            // If the updateOnEmptySelection option is true, show the toolbar
            if (this.updateOnEmptySelection && this.static) {
                return this.showAndUpdateToolbar();
            }

            // If we don't have a 'valid' selection -> hide toolbar
            if (this.window.getSelection().toString().trim() === '' ||
                (this.allowMultiParagraphSelection === false && this.multipleBlockElementsSelected())) {
                return this.hideToolbar();
            }

            this.showAndUpdateToolbar();
        },

        // Updating the toolbar

        showAndUpdateToolbar: function () {
            this.modifySelection();
            this.setToolbarButtonStates();
            this.trigger('positionToolbar', {}, this.base.getFocusedElement());
            this.showToolbarDefaultActions();
            this.setToolbarPosition();
        },

        setToolbarButtonStates: function () {
            this.forEachExtension(function (extension) {
                if (typeof extension.isActive === 'function' &&
                    typeof extension.setInactive === 'function') {
                    extension.setInactive();
                }
            });

            this.checkActiveButtons();
        },

        checkActiveButtons: function () {
            var manualStateChecks = [],
                queryState = null,
                selectionRange = MediumEditor.selection.getSelectionRange(this.document),
                parentNode,
                updateExtensionState = function (extension) {
                    if (typeof extension.checkState === 'function') {
                        extension.checkState(parentNode);
                    } else if (typeof extension.isActive === 'function' &&
                               typeof extension.isAlreadyApplied === 'function' &&
                               typeof extension.setActive === 'function') {
                        if (!extension.isActive() && extension.isAlreadyApplied(parentNode)) {
                            extension.setActive();
                        }
                    }
                };

            if (!selectionRange) {
                return;
            }

            // Loop through all extensions
            this.forEachExtension(function (extension) {
                // For those extensions where we can use document.queryCommandState(), do so
                if (typeof extension.queryCommandState === 'function') {
                    queryState = extension.queryCommandState();
                    // If queryCommandState returns a valid value, we can trust the browser
                    // and don't need to do our manual checks
                    if (queryState !== null) {
                        if (queryState && typeof extension.setActive === 'function') {
                            extension.setActive();
                        }
                        return;
                    }
                }
                // We can't use queryCommandState for this extension, so add to manualStateChecks
                manualStateChecks.push(extension);
            });

            parentNode = MediumEditor.selection.getSelectedParentElement(selectionRange);

            // Make sure the selection parent isn't outside of the contenteditable
            if (!this.getEditorElements().some(function (element) {
                    return MediumEditor.util.isDescendant(element, parentNode, true);
                })) {
                return;
            }

            // Climb up the DOM and do manual checks for whether a certain extension is currently enabled for this node
            while (parentNode) {
                manualStateChecks.forEach(updateExtensionState);

                // we can abort the search upwards if we leave the contentEditable element
                if (MediumEditor.util.isMediumEditorElement(parentNode)) {
                    break;
                }
                parentNode = parentNode.parentNode;
            }
        },

        // Positioning toolbar

        positionToolbarIfShown: function () {
            if (this.isDisplayed()) {
                this.setToolbarPosition();
            }
        },

        setToolbarPosition: function () {
            var container = this.base.getFocusedElement(),
                selection = this.window.getSelection(),
                anchorPreview;

            // If there isn't a valid selection, bail
            if (!container) {
                return this;
            }

            if (this.static && !this.relativeContainer) {
                this.showToolbar();
                this.positionStaticToolbar(container);
            } else if (!selection.isCollapsed) {
                this.showToolbar();

                // we don't need any absolute positioning if relativeContainer is set
                if (!this.relativeContainer) {
                    this.positionToolbar(selection);
                }
            }

            anchorPreview = this.base.getExtensionByName('anchor-preview');

            if (anchorPreview && typeof anchorPreview.hidePreview === 'function') {
                anchorPreview.hidePreview();
            }
        },

        positionStaticToolbar: function (container) {
            // position the toolbar at left 0, so we can get the real width of the toolbar
            this.getToolbarElement().style.left = '0';

            // document.documentElement for IE 9
            var scrollTop = (this.document.documentElement && this.document.documentElement.scrollTop) || this.document.body.scrollTop,
                windowWidth = this.window.innerWidth,
                toolbarElement = this.getToolbarElement(),
                containerRect = container.getBoundingClientRect(),
                containerTop = containerRect.top + scrollTop,
                containerCenter = (containerRect.left + (containerRect.width / 2)),
                toolbarHeight = toolbarElement.offsetHeight,
                toolbarWidth = toolbarElement.offsetWidth,
                halfOffsetWidth = toolbarWidth / 2,
                targetLeft;

            if (this.sticky) {
                // If it's beyond the height of the editor, position it at the bottom of the editor
                if (scrollTop > (containerTop + container.offsetHeight - toolbarHeight)) {
                    toolbarElement.style.top = (containerTop + container.offsetHeight - toolbarHeight) + 'px';
                    toolbarElement.classList.remove('medium-editor-sticky-toolbar');

                // Stick the toolbar to the top of the window
                } else if (scrollTop > (containerTop - toolbarHeight)) {
                    toolbarElement.classList.add('medium-editor-sticky-toolbar');
                    toolbarElement.style.top = '0px';

                // Normal static toolbar position
                } else {
                    toolbarElement.classList.remove('medium-editor-sticky-toolbar');
                    toolbarElement.style.top = containerTop - toolbarHeight + 'px';
                }
            } else {
                toolbarElement.style.top = containerTop - toolbarHeight + 'px';
            }

            switch (this.align) {
                case 'left':
                    targetLeft = containerRect.left;
                    break;

                case 'right':
                    targetLeft = containerRect.right - toolbarWidth;
                    break;

                case 'center':
                    targetLeft = containerCenter - halfOffsetWidth;
                    break;
            }

            if (targetLeft < 0) {
                targetLeft = 0;
            } else if ((targetLeft + toolbarWidth) > windowWidth) {
                targetLeft = (windowWidth - Math.ceil(toolbarWidth) - 1);
            }

            toolbarElement.style.left = targetLeft + 'px';
        },

        positionToolbar: function (selection) {
            // position the toolbar at left 0, so we can get the real width of the toolbar
            this.getToolbarElement().style.left = '0';

            var windowWidth = this.window.innerWidth,
                range = selection.getRangeAt(0),
                boundary = range.getBoundingClientRect(),
                middleBoundary = (boundary.left + boundary.right) / 2,
                toolbarElement = this.getToolbarElement(),
                toolbarHeight = toolbarElement.offsetHeight,
                toolbarWidth = toolbarElement.offsetWidth,
                halfOffsetWidth = toolbarWidth / 2,
                buttonHeight = 50,
                defaultLeft = this.diffLeft - halfOffsetWidth;

            if (boundary.top < buttonHeight) {
                toolbarElement.classList.add('medium-toolbar-arrow-over');
                toolbarElement.classList.remove('medium-toolbar-arrow-under');
                toolbarElement.style.top = buttonHeight + boundary.bottom - this.diffTop + this.window.pageYOffset - toolbarHeight + 'px';
            } else {
                toolbarElement.classList.add('medium-toolbar-arrow-under');
                toolbarElement.classList.remove('medium-toolbar-arrow-over');
                toolbarElement.style.top = boundary.top + this.diffTop + this.window.pageYOffset - toolbarHeight + 'px';
            }

            if (middleBoundary < halfOffsetWidth) {
                toolbarElement.style.left = defaultLeft + halfOffsetWidth + 'px';
            } else if ((windowWidth - middleBoundary) < halfOffsetWidth) {
                toolbarElement.style.left = windowWidth + defaultLeft - halfOffsetWidth + 'px';
            } else {
                toolbarElement.style.left = defaultLeft + middleBoundary + 'px';
            }
        }
    });

    MediumEditor.extensions.toolbar = Toolbar;
}());

(function () {
    'use strict';

    var ImageDragging = MediumEditor.Extension.extend({
        init: function () {
            MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.subscribe('editableDrag', this.handleDrag.bind(this));
            this.subscribe('editableDrop', this.handleDrop.bind(this));
        },

        handleDrag: function (event) {
            var className = 'medium-editor-dragover';
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';

            if (event.type === 'dragover') {
                event.target.classList.add(className);
            } else if (event.type === 'dragleave') {
                event.target.classList.remove(className);
            }
        },

        handleDrop: function (event) {
            var className = 'medium-editor-dragover',
                files;
            event.preventDefault();
            event.stopPropagation();

            // IE9 does not support the File API, so prevent file from opening in a new window
            // but also don't try to actually get the file
            if (event.dataTransfer.files) {
                files = Array.prototype.slice.call(event.dataTransfer.files, 0);
                files.some(function (file) {
                    if (file.type.match('image')) {
                        var fileReader, id;
                        fileReader = new FileReader();
                        fileReader.readAsDataURL(file);

                        id = 'medium-img-' + (+new Date());
                        MediumEditor.util.insertHTMLCommand(this.document, '<img class="medium-editor-image-loading" id="' + id + '" />');

                        fileReader.onload = function () {
                            var img = this.document.getElementById(id);
                            if (img) {
                                img.removeAttribute('id');
                                img.removeAttribute('class');
                                img.src = fileReader.result;
                            }
                        }.bind(this);
                    }
                }.bind(this));
            }
            event.target.classList.remove(className);
        }
    });

    MediumEditor.extensions.imageDragging = ImageDragging;
}());

(function () {
    'use strict';

    // Event handlers that shouldn't be exposed externally

    function handleDisabledEnterKeydown(event, element) {
        if (this.options.disableReturn || element.getAttribute('data-disable-return')) {
            event.preventDefault();
        } else if (this.options.disableDoubleReturn || element.getAttribute('data-disable-double-return')) {
            var node = MediumEditor.selection.getSelectionStart(this.options.ownerDocument);

            // if current text selection is empty OR previous sibling text is empty
            if ((node && node.textContent.trim() === '') ||
                (node.previousElementSibling && node.previousElementSibling.textContent.trim() === '')) {
                event.preventDefault();
            }
        }
    }

    function handleTabKeydown(event) {
        // Override tab only for pre nodes
        var node = MediumEditor.selection.getSelectionStart(this.options.ownerDocument),
            tag = node && node.nodeName.toLowerCase();

        if (tag === 'pre') {
            event.preventDefault();
            MediumEditor.util.insertHTMLCommand(this.options.ownerDocument, '    ');
        }

        // Tab to indent list structures!
        if (MediumEditor.util.isListItem(node)) {
            event.preventDefault();

            // If Shift is down, outdent, otherwise indent
            if (event.shiftKey) {
                this.options.ownerDocument.execCommand('outdent', false, null);
            } else {
                this.options.ownerDocument.execCommand('indent', false, null);
            }
        }
    }

    function handleBlockDeleteKeydowns(event) {
        var p, node = MediumEditor.selection.getSelectionStart(this.options.ownerDocument),
            tagName = node.nodeName.toLowerCase(),
            isEmpty = /^(\s+|<br\/?>)?$/i,
            isHeader = /h\d/i;

        if (MediumEditor.util.isKey(event, [MediumEditor.util.keyCode.BACKSPACE, MediumEditor.util.keyCode.ENTER]) &&
                // has a preceeding sibling
                node.previousElementSibling &&
                // in a header
                isHeader.test(tagName) &&
                // at the very end of the block
                MediumEditor.selection.getCaretOffsets(node).left === 0) {
            if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.BACKSPACE) && isEmpty.test(node.previousElementSibling.innerHTML)) {
                // backspacing the begining of a header into an empty previous element will
                // change the tagName of the current node to prevent one
                // instead delete previous node and cancel the event.
                node.previousElementSibling.parentNode.removeChild(node.previousElementSibling);
                event.preventDefault();
            } else if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.ENTER)) {
                // hitting return in the begining of a header will create empty header elements before the current one
                // instead, make "<p><br></p>" element, which are what happens if you hit return in an empty paragraph
                p = this.options.ownerDocument.createElement('p');
                p.innerHTML = '<br>';
                node.previousElementSibling.parentNode.insertBefore(p, node);
                event.preventDefault();
            }
        } else if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.DELETE) &&
                    // between two sibling elements
                    node.nextElementSibling &&
                    node.previousElementSibling &&
                    // not in a header
                    !isHeader.test(tagName) &&
                    // in an empty tag
                    isEmpty.test(node.innerHTML) &&
                    // when the next tag *is* a header
                    isHeader.test(node.nextElementSibling.nodeName.toLowerCase())) {
            // hitting delete in an empty element preceding a header, ex:
            //  <p>[CURSOR]</p><h1>Header</h1>
            // Will cause the h1 to become a paragraph.
            // Instead, delete the paragraph node and move the cursor to the begining of the h1

            // remove node and move cursor to start of header
            MediumEditor.selection.moveCursor(this.options.ownerDocument, node.nextElementSibling);

            node.previousElementSibling.parentNode.removeChild(node);

            event.preventDefault();
        } else if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.BACKSPACE) &&
                tagName === 'li' &&
                // hitting backspace inside an empty li
                isEmpty.test(node.innerHTML) &&
                // is first element (no preceeding siblings)
                !node.previousElementSibling &&
                // parent also does not have a sibling
                !node.parentElement.previousElementSibling &&
                // is not the only li in a list
                node.nextElementSibling &&
                node.nextElementSibling.nodeName.toLowerCase() === 'li') {
            // backspacing in an empty first list element in the first list (with more elements) ex:
            //  <ul><li>[CURSOR]</li><li>List Item 2</li></ul>
            // will remove the first <li> but add some extra element before (varies based on browser)
            // Instead, this will:
            // 1) remove the list element
            // 2) create a paragraph before the list
            // 3) move the cursor into the paragraph

            // create a paragraph before the list
            p = this.options.ownerDocument.createElement('p');
            p.innerHTML = '<br>';
            node.parentElement.parentElement.insertBefore(p, node.parentElement);

            // move the cursor into the new paragraph
            MediumEditor.selection.moveCursor(this.options.ownerDocument, p);

            // remove the list element
            node.parentElement.removeChild(node);

            event.preventDefault();
        }
    }

    function handleKeyup(event) {
        var node = MediumEditor.selection.getSelectionStart(this.options.ownerDocument),
            tagName;

        if (!node) {
            return;
        }

        if (MediumEditor.util.isMediumEditorElement(node) && node.children.length === 0) {
            this.options.ownerDocument.execCommand('formatBlock', false, 'p');
        }

        if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.ENTER) && !MediumEditor.util.isListItem(node)) {
            tagName = node.nodeName.toLowerCase();
            // For anchor tags, unlink
            if (tagName === 'a') {
                this.options.ownerDocument.execCommand('unlink', false, null);
            } else if (!event.shiftKey && !event.ctrlKey) {
                // only format block if this is not a header tag
                if (!/h\d/.test(tagName)) {
                    this.options.ownerDocument.execCommand('formatBlock', false, 'p');
                }
            }
        }
    }

    // Internal helper methods which shouldn't be exposed externally

    function addToEditors(win) {
        if (!win._mediumEditors) {
            // To avoid breaking users who are assuming that the unique id on
            // medium-editor elements will start at 1, inserting a 'null' in the
            // array so the unique-id can always map to the index of the editor instance
            win._mediumEditors = [null];
        }

        // If this already has a unique id, re-use it
        if (!this.id) {
            this.id = win._mediumEditors.length;
        }

        win._mediumEditors[this.id] = this;
    }

    function removeFromEditors(win) {
        if (!win._mediumEditors || !win._mediumEditors[this.id]) {
            return;
        }

        /* Setting the instance to null in the array instead of deleting it allows:
         * 1) Each instance to preserve its own unique-id, even after being destroyed
         *    and initialized again
         * 2) The unique-id to always correspond to an index in the array of medium-editor
         *    instances. Thus, we will be able to look at a contenteditable, and determine
         *    which instance it belongs to, by indexing into the global array.
         */
        win._mediumEditors[this.id] = null;
    }

    function createElementsArray(selector) {
        if (!selector) {
            selector = [];
        }
        // If string, use as query selector
        if (typeof selector === 'string') {
            selector = this.options.ownerDocument.querySelectorAll(selector);
        }
        // If element, put into array
        if (MediumEditor.util.isElement(selector)) {
            selector = [selector];
        }
        // Convert NodeList (or other array like object) into an array
        var elements = Array.prototype.slice.apply(selector);

        // Loop through elements and convert textarea's into divs
        this.elements = [];
        elements.forEach(function (element, index) {
            if (element.nodeName.toLowerCase() === 'textarea') {
                this.elements.push(createContentEditable.call(this, element, index));
            } else {
                this.elements.push(element);
            }
        }, this);
    }

    function setExtensionDefaults(extension, defaults) {
        Object.keys(defaults).forEach(function (prop) {
            if (extension[prop] === undefined) {
                extension[prop] = defaults[prop];
            }
        });
        return extension;
    }

    function initExtension(extension, name, instance) {
        var extensionDefaults = {
            'window': instance.options.contentWindow,
            'document': instance.options.ownerDocument,
            'base': instance
        };

        // Add default options into the extension
        extension = setExtensionDefaults(extension, extensionDefaults);

        // Call init on the extension
        if (typeof extension.init === 'function') {
            extension.init();
        }

        // Set extension name (if not already set)
        if (!extension.name) {
            extension.name = name;
        }
        return extension;
    }

    function isToolbarEnabled() {
        // If any of the elements don't have the toolbar disabled
        // We need a toolbar
        if (this.elements.every(function (element) {
                return !!element.getAttribute('data-disable-toolbar');
            })) {
            return false;
        }

        return this.options.toolbar !== false;
    }

    function isAnchorPreviewEnabled() {
        // If toolbar is disabled, don't add
        if (!isToolbarEnabled.call(this)) {
            return false;
        }

        return this.options.anchorPreview !== false;
    }

    function isPlaceholderEnabled() {
        return this.options.placeholder !== false;
    }

    function isAutoLinkEnabled() {
        return this.options.autoLink !== false;
    }

    function isImageDraggingEnabled() {
        return this.options.imageDragging !== false;
    }

    function isKeyboardCommandsEnabled() {
        return this.options.keyboardCommands !== false;
    }

    function shouldUseFileDraggingExtension() {
        // Since the file-dragging extension replaces the image-dragging extension,
        // we need to check if the user passed an overrided image-dragging extension.
        // If they have, to avoid breaking users, we won't use file-dragging extension.
        return !this.options.extensions['imageDragging'];
    }

    function createContentEditable(textarea, id) {
        var div = this.options.ownerDocument.createElement('div'),
            now = Date.now(),
            uniqueId = 'medium-editor-' + now + '-' + id,
            atts = textarea.attributes;

        // Some browsers can move pretty fast, since we're using a timestamp
        // to make a unique-id, ensure that the id is actually unique on the page
        while (this.options.ownerDocument.getElementById(uniqueId)) {
            now++;
            uniqueId = 'medium-editor-' + now + '-' + id;
        }

        div.className = textarea.className;
        div.id = uniqueId;
        div.innerHTML = textarea.value;

        textarea.setAttribute('medium-editor-textarea-id', uniqueId);

        // re-create all attributes from the textearea to the new created div
        for (var i = 0, n = atts.length; i < n; i++) {
            // do not re-create existing attributes
            if (!div.hasAttribute(atts[i].nodeName)) {
                div.setAttribute(atts[i].nodeName, atts[i].nodeValue);
            }
        }

        textarea.classList.add('medium-editor-hidden');
        textarea.parentNode.insertBefore(
            div,
            textarea
        );

        return div;
    }

    function initElements() {
        this.elements.forEach(function (element, index) {
            if (!this.options.disableEditing && !element.getAttribute('data-disable-editing')) {
                element.setAttribute('contentEditable', true);
                element.setAttribute('spellcheck', this.options.spellcheck);
            }
            element.setAttribute('data-medium-editor-element', true);
            element.setAttribute('role', 'textbox');
            element.setAttribute('aria-multiline', true);
            element.setAttribute('medium-editor-index', index);

            if (element.hasAttribute('medium-editor-textarea-id')) {
                this.on(element, 'input', function (event) {
                    var target = event.target,
                        textarea = target.parentNode.querySelector('textarea[medium-editor-textarea-id="' + target.getAttribute('medium-editor-textarea-id') + '"]');
                    if (textarea) {
                        textarea.value = this.serialize()[target.id].value;
                    }
                }.bind(this));
            }
        }, this);
    }

    function attachHandlers() {
        var i;

        // attach to tabs
        this.subscribe('editableKeydownTab', handleTabKeydown.bind(this));

        // Bind keys which can create or destroy a block element: backspace, delete, return
        this.subscribe('editableKeydownDelete', handleBlockDeleteKeydowns.bind(this));
        this.subscribe('editableKeydownEnter', handleBlockDeleteKeydowns.bind(this));

        // disabling return or double return
        if (this.options.disableReturn || this.options.disableDoubleReturn) {
            this.subscribe('editableKeydownEnter', handleDisabledEnterKeydown.bind(this));
        } else {
            for (i = 0; i < this.elements.length; i += 1) {
                if (this.elements[i].getAttribute('data-disable-return') || this.elements[i].getAttribute('data-disable-double-return')) {
                    this.subscribe('editableKeydownEnter', handleDisabledEnterKeydown.bind(this));
                    break;
                }
            }
        }

        // if we're not disabling return, add a handler to help handle cleanup
        // for certain cases when enter is pressed
        if (!this.options.disableReturn) {
            this.elements.forEach(function (element) {
                if (!element.getAttribute('data-disable-return')) {
                    this.on(element, 'keyup', handleKeyup.bind(this));
                }
            }, this);
        }
    }

    function initExtensions() {

        this.extensions = [];

        // Passed in extensions
        Object.keys(this.options.extensions).forEach(function (name) {
            // Always save the toolbar extension for last
            if (name !== 'toolbar' && this.options.extensions[name]) {
                this.extensions.push(initExtension(this.options.extensions[name], name, this));
            }
        }, this);

        // 4 Cases for imageDragging + fileDragging extensons:
        //
        // 1. ImageDragging ON + No Custom Image Dragging Extension:
        //    * Use fileDragging extension (default options)
        // 2. ImageDragging OFF + No Custom Image Dragging Extension:
        //    * Use fileDragging extension w/ images turned off
        // 3. ImageDragging ON + Custom Image Dragging Extension:
        //    * Don't use fileDragging (could interfere with custom image dragging extension)
        // 4. ImageDragging OFF + Custom Image Dragging:
        //    * Don't use fileDragging (could interfere with custom image dragging extension)
        if (shouldUseFileDraggingExtension.call(this)) {
            var opts = this.options.fileDragging;
            if (!opts) {
                opts = {};

                // Image is in the 'allowedTypes' list by default.
                // If imageDragging is off override the 'allowedTypes' list with an empty one
                if (!isImageDraggingEnabled.call(this)) {
                    opts.allowedTypes = [];
                }
            }
            this.addBuiltInExtension('fileDragging', opts);
        }

        // Built-in extensions
        var builtIns = {
            paste: true,
            'anchor-preview': isAnchorPreviewEnabled.call(this),
            autoLink: isAutoLinkEnabled.call(this),
            keyboardCommands: isKeyboardCommandsEnabled.call(this),
            placeholder: isPlaceholderEnabled.call(this)
        };
        Object.keys(builtIns).forEach(function (name) {
            if (builtIns[name]) {
                this.addBuiltInExtension(name);
            }
        }, this);

        // Users can pass in a custom toolbar extension
        // so check for that first and if it's not present
        // just create the default toolbar
        var toolbarExtension = this.options.extensions['toolbar'];
        if (!toolbarExtension && isToolbarEnabled.call(this)) {
            // Backwards compatability
            var toolbarOptions = MediumEditor.util.extend({}, this.options.toolbar, {
                allowMultiParagraphSelection: this.options.allowMultiParagraphSelection // deprecated
            });
            toolbarExtension = new MediumEditor.extensions.toolbar(toolbarOptions);
        }

        // If the toolbar is not disabled, so we actually have an extension
        // initialize it and add it to the extensions array
        if (toolbarExtension) {
            this.extensions.push(initExtension(toolbarExtension, 'toolbar', this));
        }
    }

    function mergeOptions(defaults, options) {
        var deprecatedProperties = [
            ['allowMultiParagraphSelection', 'toolbar.allowMultiParagraphSelection']
        ];
        // warn about using deprecated properties
        if (options) {
            deprecatedProperties.forEach(function (pair) {
                if (options.hasOwnProperty(pair[0]) && options[pair[0]] !== undefined) {
                    MediumEditor.util.deprecated(pair[0], pair[1], 'v6.0.0');
                }
            });
        }

        return MediumEditor.util.defaults({}, options, defaults);
    }

    function execActionInternal(action, opts) {
        /*jslint regexp: true*/
        var appendAction = /^append-(.+)$/gi,
            justifyAction = /justify([A-Za-z]*)$/g, /* Detecting if is justifyCenter|Right|Left */
            match;
        /*jslint regexp: false*/

        // Actions starting with 'append-' should attempt to format a block of text ('formatBlock') using a specific
        // type of block element (ie append-blockquote, append-h1, append-pre, etc.)
        match = appendAction.exec(action);
        if (match) {
            return MediumEditor.util.execFormatBlock(this.options.ownerDocument, match[1]);
        }

        if (action === 'fontSize') {
            return this.options.ownerDocument.execCommand('fontSize', false, opts.size);
        }

        if (action === 'createLink') {
            return this.createLink(opts);
        }

        if (action === 'image') {
            return this.options.ownerDocument.execCommand('insertImage', false, this.options.contentWindow.getSelection());
        }

        /* Issue: https://github.com/yabwe/medium-editor/issues/595
         * If the action is to justify the text */
        if (justifyAction.exec(action)) {
            var result = this.options.ownerDocument.execCommand(action, false, null),
                parentNode = MediumEditor.selection.getSelectedParentElement(MediumEditor.selection.getSelectionRange(this.options.ownerDocument));
            if (parentNode) {
                cleanupJustifyDivFragments.call(this, MediumEditor.util.getTopBlockContainer(parentNode));
            }

            return result;
        }

        return this.options.ownerDocument.execCommand(action, false, null);
    }

    /* If we've just justified text within a container block
     * Chrome may have removed <br> elements and instead wrapped lines in <div> elements
     * with a text-align property.  If so, we want to fix this
     */
    function cleanupJustifyDivFragments(blockContainer) {
        if (!blockContainer) {
            return;
        }

        var textAlign,
            childDivs = Array.prototype.slice.call(blockContainer.childNodes).filter(function (element) {
                var isDiv = element.nodeName.toLowerCase() === 'div';
                if (isDiv && !textAlign) {
                    textAlign = element.style.textAlign;
                }
                return isDiv;
            });

        /* If we found child <div> elements with text-align style attributes
         * we should fix this by:
         *
         * 1) Unwrapping each <div> which has a text-align style
         * 2) Insert a <br> element after each set of 'unwrapped' div children
         * 3) Set the text-align style of the parent block element
         */
        if (childDivs.length) {
            // Since we're mucking with the HTML, preserve selection
            this.saveSelection();
            childDivs.forEach(function (div) {
                if (div.style.textAlign === textAlign) {
                    var lastChild = div.lastChild;
                    if (lastChild) {
                        // Instead of a div, extract the child elements and add a <br>
                        MediumEditor.util.unwrap(div, this.options.ownerDocument);
                        var br = this.options.ownerDocument.createElement('BR');
                        lastChild.parentNode.insertBefore(br, lastChild.nextSibling);
                    }
                }
            }, this);
            blockContainer.style.textAlign = textAlign;
            // We're done, so restore selection
            this.restoreSelection();
        }
    }

    MediumEditor.prototype = {
        // NOT DOCUMENTED - exposed for backwards compatability
        init: function (elements, options) {
            this.options = mergeOptions.call(this, this.defaults, options);
            this.origElements = elements;

            if (!this.options.elementsContainer) {
                this.options.elementsContainer = this.options.ownerDocument.body;
            }

            return this.setup();
        },

        setup: function () {
            if (this.isActive) {
                return;
            }

            createElementsArray.call(this, this.origElements);

            if (this.elements.length === 0) {
                return;
            }

            this.isActive = true;
            addToEditors.call(this, this.options.contentWindow);

            this.events = new MediumEditor.Events(this);

            // Call initialization helpers
            initElements.call(this);
            initExtensions.call(this);
            attachHandlers.call(this);
        },

        destroy: function () {
            if (!this.isActive) {
                return;
            }

            this.isActive = false;

            this.extensions.forEach(function (extension) {
                if (typeof extension.destroy === 'function') {
                    extension.destroy();
                }
            }, this);

            this.events.destroy();

            this.elements.forEach(function (element) {
                // Reset elements content, fix for issue where after editor destroyed the red underlines on spelling errors are left
                if (this.options.spellcheck) {
                    element.innerHTML = element.innerHTML;
                }

                // cleanup extra added attributes
                element.removeAttribute('contentEditable');
                element.removeAttribute('spellcheck');
                element.removeAttribute('data-medium-editor-element');
                element.removeAttribute('role');
                element.removeAttribute('aria-multiline');
                element.removeAttribute('medium-editor-index');

                // Remove any elements created for textareas
                if (element.hasAttribute('medium-editor-textarea-id')) {
                    var textarea = element.parentNode.querySelector('textarea[medium-editor-textarea-id="' + element.getAttribute('medium-editor-textarea-id') + '"]');
                    if (textarea) {
                        // Un-hide the textarea
                        textarea.classList.remove('medium-editor-hidden');
                    }
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                }
            }, this);
            this.elements = [];

            removeFromEditors.call(this, this.options.contentWindow);
        },

        on: function (target, event, listener, useCapture) {
            this.events.attachDOMEvent(target, event, listener, useCapture);
        },

        off: function (target, event, listener, useCapture) {
            this.events.detachDOMEvent(target, event, listener, useCapture);
        },

        subscribe: function (event, listener) {
            this.events.attachCustomEvent(event, listener);
        },

        unsubscribe: function (event, listener) {
            this.events.detachCustomEvent(event, listener);
        },

        trigger: function (name, data, editable) {
            this.events.triggerCustomEvent(name, data, editable);
        },

        delay: function (fn) {
            var self = this;
            return setTimeout(function () {
                if (self.isActive) {
                    fn();
                }
            }, this.options.delay);
        },

        serialize: function () {
            var i,
                elementid,
                content = {};
            for (i = 0; i < this.elements.length; i += 1) {
                elementid = (this.elements[i].id !== '') ? this.elements[i].id : 'element-' + i;
                content[elementid] = {
                    value: this.elements[i].innerHTML.trim()
                };
            }
            return content;
        },

        getExtensionByName: function (name) {
            var extension;
            if (this.extensions && this.extensions.length) {
                this.extensions.some(function (ext) {
                    if (ext.name === name) {
                        extension = ext;
                        return true;
                    }
                    return false;
                });
            }
            return extension;
        },

        /**
         * NOT DOCUMENTED - exposed as a helper for other extensions to use
         */
        addBuiltInExtension: function (name, opts) {
            var extension = this.getExtensionByName(name),
                merged;
            if (extension) {
                return extension;
            }

            switch (name) {
                case 'anchor':
                    merged = MediumEditor.util.extend({}, this.options.anchor, opts);
                    extension = new MediumEditor.extensions.anchor(merged);
                    break;
                case 'anchor-preview':
                    extension = new MediumEditor.extensions.anchorPreview(this.options.anchorPreview);
                    break;
                case 'autoLink':
                    extension = new MediumEditor.extensions.autoLink();
                    break;
                case 'fileDragging':
                    extension = new MediumEditor.extensions.fileDragging(opts);
                    break;
                case 'fontsize':
                    extension = new MediumEditor.extensions.fontSize(opts);
                    break;
                case 'keyboardCommands':
                    extension = new MediumEditor.extensions.keyboardCommands(this.options.keyboardCommands);
                    break;
                case 'paste':
                    extension = new MediumEditor.extensions.paste(this.options.paste);
                    break;
                case 'placeholder':
                    extension = new MediumEditor.extensions.placeholder(this.options.placeholder);
                    break;
                default:
                    // All of the built-in buttons for MediumEditor are extensions
                    // so check to see if the extension we're creating is a built-in button
                    if (MediumEditor.extensions.button.isBuiltInButton(name)) {
                        if (opts) {
                            merged = MediumEditor.util.defaults({}, opts, MediumEditor.extensions.button.prototype.defaults[name]);
                            extension = new MediumEditor.extensions.button(merged);
                        } else {
                            extension = new MediumEditor.extensions.button(name);
                        }
                    }
            }

            if (extension) {
                this.extensions.push(initExtension(extension, name, this));
            }

            return extension;
        },

        stopSelectionUpdates: function () {
            this.preventSelectionUpdates = true;
        },

        startSelectionUpdates: function () {
            this.preventSelectionUpdates = false;
        },

        checkSelection: function () {
            var toolbar = this.getExtensionByName('toolbar');
            if (toolbar) {
                toolbar.checkState();
            }
            return this;
        },

        // Wrapper around document.queryCommandState for checking whether an action has already
        // been applied to the current selection
        queryCommandState: function (action) {
            var fullAction = /^full-(.+)$/gi,
                match,
                queryState = null;

            // Actions starting with 'full-' need to be modified since this is a medium-editor concept
            match = fullAction.exec(action);
            if (match) {
                action = match[1];
            }

            try {
                queryState = this.options.ownerDocument.queryCommandState(action);
            } catch (exc) {
                queryState = null;
            }

            return queryState;
        },

        execAction: function (action, opts) {
            /*jslint regexp: true*/
            var fullAction = /^full-(.+)$/gi,
                match,
                result;
            /*jslint regexp: false*/

            // Actions starting with 'full-' should be applied to to the entire contents of the editable element
            // (ie full-bold, full-append-pre, etc.)
            match = fullAction.exec(action);
            if (match) {
                // Store the current selection to be restored after applying the action
                this.saveSelection();
                // Select all of the contents before calling the action
                this.selectAllContents();
                result = execActionInternal.call(this, match[1], opts);
                // Restore the previous selection
                this.restoreSelection();
            } else {
                result = execActionInternal.call(this, action, opts);
            }

            // do some DOM clean-up for known browser issues after the action
            if (action === 'insertunorderedlist' || action === 'insertorderedlist') {
                MediumEditor.util.cleanListDOM(this.options.ownerDocument, this.getSelectedParentElement());
            }

            this.checkSelection();
            return result;
        },

        getSelectedParentElement: function (range) {
            if (range === undefined) {
                range = this.options.contentWindow.getSelection().getRangeAt(0);
            }
            return MediumEditor.selection.getSelectedParentElement(range);
        },

        selectAllContents: function () {
            var currNode = MediumEditor.selection.getSelectionElement(this.options.contentWindow);

            if (currNode) {
                // Move to the lowest descendant node that still selects all of the contents
                while (currNode.children.length === 1) {
                    currNode = currNode.children[0];
                }

                this.selectElement(currNode);
            }
        },

        selectElement: function (element) {
            MediumEditor.selection.selectNode(element, this.options.ownerDocument);

            var selElement = MediumEditor.selection.getSelectionElement(this.options.contentWindow);
            if (selElement) {
                this.events.focusElement(selElement);
            }
        },

        getFocusedElement: function () {
            var focused;
            this.elements.some(function (element) {
                // Find the element that has focus
                if (!focused && element.getAttribute('data-medium-focused')) {
                    focused = element;
                }

                // bail if we found the element that had focus
                return !!focused;
            }, this);

            return focused;
        },

        // Export the state of the selection in respect to one of this
        // instance of MediumEditor's elements
        exportSelection: function () {
            var selectionElement = MediumEditor.selection.getSelectionElement(this.options.contentWindow),
                editableElementIndex = this.elements.indexOf(selectionElement),
                selectionState = null;

            if (editableElementIndex >= 0) {
                selectionState = MediumEditor.selection.exportSelection(selectionElement, this.options.ownerDocument);
            }

            if (selectionState !== null && editableElementIndex !== 0) {
                selectionState.editableElementIndex = editableElementIndex;
            }

            return selectionState;
        },

        saveSelection: function () {
            this.selectionState = this.exportSelection();
        },

        // Restore a selection based on a selectionState returned by a call
        // to MediumEditor.exportSelection
        importSelection: function (selectionState, favorLaterSelectionAnchor) {
            if (!selectionState) {
                return;
            }

            var editableElement = this.elements[selectionState.editableElementIndex || 0];
            MediumEditor.selection.importSelection(selectionState, editableElement, this.options.ownerDocument, favorLaterSelectionAnchor);
        },

        restoreSelection: function () {
            this.importSelection(this.selectionState);
        },

        createLink: function (opts) {
            var currentEditor = MediumEditor.selection.getSelectionElement(this.options.contentWindow),
                customEvent = {};

            // Make sure the selection is within an element this editor is tracking
            if (this.elements.indexOf(currentEditor) === -1) {
                return;
            }

            try {
                this.events.disableCustomEvent('editableInput');
                if (opts.url && opts.url.trim().length > 0) {
                    var currentSelection = this.options.contentWindow.getSelection();
                    if (currentSelection) {
                        var currRange = currentSelection.getRangeAt(0),
                            commonAncestorContainer = currRange.commonAncestorContainer,
                            exportedSelection,
                            startContainerParentElement,
                            endContainerParentElement,
                            textNodes;

                        // If the selection is contained within a single text node
                        // and the selection starts at the beginning of the text node,
                        // MSIE still says the startContainer is the parent of the text node.
                        // If the selection is contained within a single text node, we
                        // want to just use the default browser 'createLink', so we need
                        // to account for this case and adjust the commonAncestorContainer accordingly
                        if (currRange.endContainer.nodeType === 3 &&
                            currRange.startContainer.nodeType !== 3 &&
                            currRange.startOffset === 0 &&
                            currRange.startContainer.firstChild === currRange.endContainer) {
                            commonAncestorContainer = currRange.endContainer;
                        }

                        startContainerParentElement = MediumEditor.util.getClosestBlockContainer(currRange.startContainer);
                        endContainerParentElement = MediumEditor.util.getClosestBlockContainer(currRange.endContainer);

                        // If the selection is not contained within a single text node
                        // but the selection is contained within the same block element
                        // we want to make sure we create a single link, and not multiple links
                        // which can happen with the built in browser functionality
                        if (commonAncestorContainer.nodeType !== 3 && startContainerParentElement === endContainerParentElement) {
                            var parentElement = (startContainerParentElement || currentEditor),
                                fragment = this.options.ownerDocument.createDocumentFragment();

                            // since we are going to create a link from an extracted text,
                            // be sure that if we are updating a link, we won't let an empty link behind (see #754)
                            // (Workaroung for Chrome)
                            this.execAction('unlink');

                            exportedSelection = this.exportSelection();
                            fragment.appendChild(parentElement.cloneNode(true));

                            if (currentEditor === parentElement) {
                                // We have to avoid the editor itself being wiped out when it's the only block element,
                                // as our reference inside this.elements gets detached from the page when insertHTML runs.
                                // If we just use [parentElement, 0] and [parentElement, parentElement.childNodes.length]
                                // as the range boundaries, this happens whenever parentElement === currentEditor.
                                // The tradeoff to this workaround is that a orphaned tag can sometimes be left behind at
                                // the end of the editor's content.
                                // In Gecko:
                                // as an empty <strong></strong> if parentElement.lastChild is a <strong> tag.
                                // In WebKit:
                                // an invented <br /> tag at the end in the same situation
                                MediumEditor.selection.select(
                                    this.options.ownerDocument,
                                    parentElement.firstChild,
                                    0,
                                    parentElement.lastChild,
                                    parentElement.lastChild.nodeType === 3 ?
                                    parentElement.lastChild.nodeValue.length : parentElement.lastChild.childNodes.length
                                );
                            } else {
                                MediumEditor.selection.select(
                                    this.options.ownerDocument,
                                    parentElement,
                                    0,
                                    parentElement,
                                    parentElement.childNodes.length
                                );
                            }

                            var modifiedExportedSelection = this.exportSelection();

                            textNodes = MediumEditor.util.findOrCreateMatchingTextNodes(
                                this.options.ownerDocument,
                                fragment,
                                {
                                    start: exportedSelection.start - modifiedExportedSelection.start,
                                    end: exportedSelection.end - modifiedExportedSelection.start,
                                    editableElementIndex: exportedSelection.editableElementIndex
                                }
                            );

                            // Creates the link in the document fragment
                            MediumEditor.util.createLink(this.options.ownerDocument, textNodes, opts.url.trim());

                            // Chrome trims the leading whitespaces when inserting HTML, which messes up restoring the selection.
                            var leadingWhitespacesCount = (fragment.firstChild.innerHTML.match(/^\s+/) || [''])[0].length;

                            // Now move the created link back into the original document in a way to preserve undo/redo history
                            MediumEditor.util.insertHTMLCommand(this.options.ownerDocument, fragment.firstChild.innerHTML.replace(/^\s+/, ''));
                            exportedSelection.start -= leadingWhitespacesCount;
                            exportedSelection.end -= leadingWhitespacesCount;

                            this.importSelection(exportedSelection);
                        } else {
                            this.options.ownerDocument.execCommand('createLink', false, opts.url);
                        }

                        if (this.options.targetBlank || opts.target === '_blank') {
                            MediumEditor.util.setTargetBlank(MediumEditor.selection.getSelectionStart(this.options.ownerDocument), opts.url);
                        }

                        if (opts.buttonClass) {
                            MediumEditor.util.addClassToAnchors(MediumEditor.selection.getSelectionStart(this.options.ownerDocument), opts.buttonClass);
                        }
                    }
                }
                // Fire input event for backwards compatibility if anyone was listening directly to the DOM input event
                if (this.options.targetBlank || opts.target === '_blank' || opts.buttonClass) {
                    customEvent = this.options.ownerDocument.createEvent('HTMLEvents');
                    customEvent.initEvent('input', true, true, this.options.contentWindow);
                    for (var i = 0; i < this.elements.length; i += 1) {
                        this.elements[i].dispatchEvent(customEvent);
                    }
                }
            } finally {
                this.events.enableCustomEvent('editableInput');
            }
            // Fire our custom editableInput event
            this.events.triggerCustomEvent('editableInput', customEvent, currentEditor);
        },

        cleanPaste: function (text) {
            this.getExtensionByName('paste').cleanPaste(text);
        },

        pasteHTML: function (html, options) {
            this.getExtensionByName('paste').pasteHTML(html, options);
        },

        setContent: function (html, index) {
            index = index || 0;

            if (this.elements[index]) {
                var target = this.elements[index];
                target.innerHTML = html;
                this.events.updateInput(target, { target: target, currentTarget: target });
            }
        }
    };
}());

(function () {
    // summary: The default options hash used by the Editor

    MediumEditor.prototype.defaults = {
        activeButtonClass: 'medium-editor-button-active',
        buttonLabels: false,
        delay: 0,
        disableReturn: false,
        disableDoubleReturn: false,
        disableEditing: false,
        autoLink: false,
        elementsContainer: false,
        contentWindow: window,
        ownerDocument: document,
        targetBlank: false,
        extensions: {},
        spellcheck: true
    };
})();

MediumEditor.parseVersionString = function (release) {
    var split = release.split('-'),
        version = split[0].split('.'),
        preRelease = (split.length > 1) ? split[1] : '';
    return {
        major: parseInt(version[0], 10),
        minor: parseInt(version[1], 10),
        revision: parseInt(version[2], 10),
        preRelease: preRelease,
        toString: function () {
            return [version[0], version[1], version[2]].join('.') + (preRelease ? '-' + preRelease : '');
        }
    };
};

MediumEditor.version = MediumEditor.parseVersionString.call(this, ({
    // grunt-bump looks for this:
    'version': '5.8.2'
}).version);

    return MediumEditor;
}()));

},{}],2:[function(require,module,exports){
// Apply Scrollspy to side nav
'use strict';

$('.doc-pane .panel-content').scrollspy({
    target: '.bs-docs-sidebar',
    offset: 40
});

// Apply Medium Editor to all content in doc pane
var MediumEditor = require('medium-editor'),
    elements = document.querySelectorAll('.editable p'),
    editorOptions = {
    buttonLabels: 'fontawesome',
    toolbar: {
        allowMultiParagraphSelection: true,
        buttons: ['bold', 'italic', 'underline', 'strikethrough', 'anchor', 'orderedlist', 'unorderedlist', 'indent', 'outdent'],
        diffLeft: 0,
        diffTop: -10,
        firstButtonClass: 'medium-editor-button-first',
        lastButtonClass: 'medium-editor-button-last',
        standardizeSelectionStart: false,
        'static': false,
        relativeContainer: null,
        align: 'center',
        sticky: false,
        updateOnEmptySelection: false
    }
},
    editor = new MediumEditor(elements, editorOptions);

},{"medium-editor":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbWVkaXVtLWVkaXRvci9kaXN0L2pzL21lZGl1bS1lZGl0b3IuanMiLCJlOi9EYXRhL01hcmsvUHJvamVjdHMvRWRpdERvYy9zcmMvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3B5TUEsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3BDLFVBQU0sRUFBRSxrQkFBa0I7QUFDMUIsVUFBTSxFQUFFLEVBQUU7Q0FDYixDQUFDLENBQUM7OztBQUdILElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7SUFDdkMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUM7SUFDbkQsYUFBYSxHQUFHO0FBQ1osZ0JBQVksRUFBRSxhQUFhO0FBQzNCLFdBQU8sRUFBRTtBQUNMLG9DQUE0QixFQUFFLElBQUk7QUFDbEMsZUFBTyxFQUFFLENBQ0wsTUFBTSxFQUNOLFFBQVEsRUFDUixXQUFXLEVBQ1gsZUFBZSxFQUFDLFFBQVEsRUFDeEIsYUFBYSxFQUNiLGVBQWUsRUFDZixRQUFRLEVBQ1IsU0FBUyxDQUNaO0FBQ0QsZ0JBQVEsRUFBRSxDQUFDO0FBQ1gsZUFBTyxFQUFFLENBQUMsRUFBRTtBQUNaLHdCQUFnQixFQUFFLDRCQUE0QjtBQUM5Qyx1QkFBZSxFQUFFLDJCQUEyQjtBQUM1QyxpQ0FBeUIsRUFBRSxLQUFLO0FBQ2hDLGtCQUFRLEtBQUs7QUFDYix5QkFBaUIsRUFBRSxJQUFJO0FBQ3ZCLGFBQUssRUFBRSxRQUFRO0FBQ2YsY0FBTSxFQUFFLEtBQUs7QUFDYiw4QkFBc0IsRUFBRSxLQUFLO0tBQ2hDO0NBQ0o7SUFDRCxNQUFNLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuaWYgKCEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkpIHtcbiAgKGZ1bmN0aW9uICh2aWV3KSB7XG5cbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbiAgdmFyXG4gICAgICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuICAgICwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuICAgICwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cbiAgICAsIG9iakN0ciA9IE9iamVjdFxuICAgICwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG4gICAgfVxuICAgICwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyXG4gICAgICAgICAgaSA9IDBcbiAgICAgICAgLCBsZW4gPSB0aGlzLmxlbmd0aFxuICAgICAgO1xuICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICAvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcbiAgICAsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMubmFtZSA9IHR5cGU7XG4gICAgICB0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIH1cbiAgICAsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG4gICAgICBpZiAodG9rZW4gPT09IFwiXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IERPTUV4KFxuICAgICAgICAgICAgXCJTWU5UQVhfRVJSXCJcbiAgICAgICAgICAsIFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuICAgICAgICB0aHJvdyBuZXcgRE9NRXgoXG4gICAgICAgICAgICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG4gICAgICAgICAgLCBcIlN0cmluZyBjb250YWlucyBhbiBpbnZhbGlkIGNoYXJhY3RlclwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuICAgIH1cbiAgICAsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICB2YXJcbiAgICAgICAgICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG4gICAgICAgICwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG4gICAgICAgICwgaSA9IDBcbiAgICAgICAgLCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuICAgICAgO1xuICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG4gICAgICB9XG4gICAgICB0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcbiAgICAgIH07XG4gICAgfVxuICAgICwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG4gICAgLCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcbiAgICB9XG4gIDtcbiAgLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuICAvLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbiAgRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG4gIGNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuICAgIHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG4gIH07XG4gIGNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdG9rZW4gKz0gXCJcIjtcbiAgICByZXR1cm4gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSAhPT0gLTE7XG4gIH07XG4gIGNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXJcbiAgICAgICAgdG9rZW5zID0gYXJndW1lbnRzXG4gICAgICAsIGkgPSAwXG4gICAgICAsIGwgPSB0b2tlbnMubGVuZ3RoXG4gICAgICAsIHRva2VuXG4gICAgICAsIHVwZGF0ZWQgPSBmYWxzZVxuICAgIDtcbiAgICBkbyB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG4gICAgICBpZiAoY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5wdXNoKHRva2VuKTtcbiAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlICgrK2kgPCBsKTtcblxuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICB0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcbiAgICB9XG4gIH07XG4gIGNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXJcbiAgICAgICAgdG9rZW5zID0gYXJndW1lbnRzXG4gICAgICAsIGkgPSAwXG4gICAgICAsIGwgPSB0b2tlbnMubGVuZ3RoXG4gICAgICAsIHRva2VuXG4gICAgICAsIHVwZGF0ZWQgPSBmYWxzZVxuICAgICAgLCBpbmRleFxuICAgIDtcbiAgICBkbyB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG4gICAgICBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG4gICAgICB3aGlsZSAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcbiAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKCsraSA8IGwpO1xuXG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuICAgIH1cbiAgfTtcbiAgY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuICAgIHRva2VuICs9IFwiXCI7XG5cbiAgICB2YXJcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcbiAgICAgICwgbWV0aG9kID0gcmVzdWx0ID9cbiAgICAgICAgZm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuICAgICAgOlxuICAgICAgICBmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuICAgIDtcblxuICAgIGlmIChtZXRob2QpIHtcbiAgICAgIHRoaXNbbWV0aG9kXSh0b2tlbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZvcmNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICB9XG4gIH07XG4gIGNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xuICB9O1xuXG4gIGlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcbiAgICB2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG4gICAgICAgIGdldDogY2xhc3NMaXN0R2V0dGVyXG4gICAgICAsIGVudW1lcmFibGU6IHRydWVcbiAgICAgICwgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgb2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuICAgIH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuICAgICAgaWYgKGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcbiAgICAgICAgY2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuICAgICAgICBvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcbiAgICBlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xuICB9XG5cbiAgfShzZWxmKSk7XG59XG5cbi8qIEJsb2IuanNcbiAqIEEgQmxvYiBpbXBsZW1lbnRhdGlvbi5cbiAqIDIwMTQtMDctMjRcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBCeSBEZXZpbiBTYW1hcmluLCBodHRwczovL2dpdGh1Yi5jb20vZHNhbWFyaW5cbiAqIExpY2Vuc2U6IFgxMS9NSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0Jsb2IuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIHVuZXNjYXBlICovXG4vKmpzbGludCBiaXR3aXNlOiB0cnVlLCByZWdleHA6IHRydWUsIGNvbmZ1c2lvbjogdHJ1ZSwgZXM1OiB0cnVlLCB2YXJzOiB0cnVlLCB3aGl0ZTogdHJ1ZSxcbiAgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0Jsb2IuanMvYmxvYi9tYXN0ZXIvQmxvYi5qcyAqL1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmlldy5VUkwgPSB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTDtcblxuICBpZiAodmlldy5CbG9iICYmIHZpZXcuVVJMKSB7XG4gICAgdHJ5IHtcbiAgICAgIG5ldyBCbG9iO1xuICAgICAgcmV0dXJuO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICAvLyBJbnRlcm5hbGx5IHdlIHVzZSBhIEJsb2JCdWlsZGVyIGltcGxlbWVudGF0aW9uIHRvIGJhc2UgQmxvYiBvZmYgb2ZcbiAgLy8gaW4gb3JkZXIgdG8gc3VwcG9ydCBvbGRlciBicm93c2VycyB0aGF0IG9ubHkgaGF2ZSBCbG9iQnVpbGRlclxuICB2YXIgQmxvYkJ1aWxkZXIgPSB2aWV3LkJsb2JCdWlsZGVyIHx8IHZpZXcuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgdmlldy5Nb3pCbG9iQnVpbGRlciB8fCAoZnVuY3Rpb24odmlldykge1xuICAgIHZhclxuICAgICAgICBnZXRfY2xhc3MgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpLm1hdGNoKC9eXFxbb2JqZWN0XFxzKC4qKVxcXSQvKVsxXTtcbiAgICAgIH1cbiAgICAgICwgRmFrZUJsb2JCdWlsZGVyID0gZnVuY3Rpb24gQmxvYkJ1aWxkZXIoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgICAgfVxuICAgICAgLCBGYWtlQmxvYiA9IGZ1bmN0aW9uIEJsb2IoZGF0YSwgdHlwZSwgZW5jb2RpbmcpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5zaXplID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMuZW5jb2RpbmcgPSBlbmNvZGluZztcbiAgICAgIH1cbiAgICAgICwgRkJCX3Byb3RvID0gRmFrZUJsb2JCdWlsZGVyLnByb3RvdHlwZVxuICAgICAgLCBGQl9wcm90byA9IEZha2VCbG9iLnByb3RvdHlwZVxuICAgICAgLCBGaWxlUmVhZGVyU3luYyA9IHZpZXcuRmlsZVJlYWRlclN5bmNcbiAgICAgICwgRmlsZUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGhpcy5jb2RlID0gdGhpc1t0aGlzLm5hbWUgPSB0eXBlXTtcbiAgICAgIH1cbiAgICAgICwgZmlsZV9leF9jb2RlcyA9IChcbiAgICAgICAgICBcIk5PVF9GT1VORF9FUlIgU0VDVVJJVFlfRVJSIEFCT1JUX0VSUiBOT1RfUkVBREFCTEVfRVJSIEVOQ09ESU5HX0VSUiBcIlxuICAgICAgICArIFwiTk9fTU9ESUZJQ0FUSU9OX0FMTE9XRURfRVJSIElOVkFMSURfU1RBVEVfRVJSIFNZTlRBWF9FUlJcIlxuICAgICAgKS5zcGxpdChcIiBcIilcbiAgICAgICwgZmlsZV9leF9jb2RlID0gZmlsZV9leF9jb2Rlcy5sZW5ndGhcbiAgICAgICwgcmVhbF9VUkwgPSB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTCB8fCB2aWV3XG4gICAgICAsIHJlYWxfY3JlYXRlX29iamVjdF9VUkwgPSByZWFsX1VSTC5jcmVhdGVPYmplY3RVUkxcbiAgICAgICwgcmVhbF9yZXZva2Vfb2JqZWN0X1VSTCA9IHJlYWxfVVJMLnJldm9rZU9iamVjdFVSTFxuICAgICAgLCBVUkwgPSByZWFsX1VSTFxuICAgICAgLCBidG9hID0gdmlldy5idG9hXG4gICAgICAsIGF0b2IgPSB2aWV3LmF0b2JcblxuICAgICAgLCBBcnJheUJ1ZmZlciA9IHZpZXcuQXJyYXlCdWZmZXJcbiAgICAgICwgVWludDhBcnJheSA9IHZpZXcuVWludDhBcnJheVxuXG4gICAgICAsIG9yaWdpbiA9IC9eW1xcdy1dKzpcXC8qXFxbP1tcXHdcXC46LV0rXFxdPyg/OjpbMC05XSspPy9cbiAgICA7XG4gICAgRmFrZUJsb2IuZmFrZSA9IEZCX3Byb3RvLmZha2UgPSB0cnVlO1xuICAgIHdoaWxlIChmaWxlX2V4X2NvZGUtLSkge1xuICAgICAgRmlsZUV4Y2VwdGlvbi5wcm90b3R5cGVbZmlsZV9leF9jb2Rlc1tmaWxlX2V4X2NvZGVdXSA9IGZpbGVfZXhfY29kZSArIDE7XG4gICAgfVxuICAgIC8vIFBvbHlmaWxsIFVSTFxuICAgIGlmICghcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMKSB7XG4gICAgICBVUkwgPSB2aWV3LlVSTCA9IGZ1bmN0aW9uKHVyaSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIHVyaV9pbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiLCBcImFcIilcbiAgICAgICAgICAsIHVyaV9vcmlnaW5cbiAgICAgICAgO1xuICAgICAgICB1cmlfaW5mby5ocmVmID0gdXJpO1xuICAgICAgICBpZiAoIShcIm9yaWdpblwiIGluIHVyaV9pbmZvKSkge1xuICAgICAgICAgIGlmICh1cmlfaW5mby5wcm90b2NvbC50b0xvd2VyQ2FzZSgpID09PSBcImRhdGE6XCIpIHtcbiAgICAgICAgICAgIHVyaV9pbmZvLm9yaWdpbiA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVyaV9vcmlnaW4gPSB1cmkubWF0Y2gob3JpZ2luKTtcbiAgICAgICAgICAgIHVyaV9pbmZvLm9yaWdpbiA9IHVyaV9vcmlnaW4gJiYgdXJpX29yaWdpblsxXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVyaV9pbmZvO1xuICAgICAgfTtcbiAgICB9XG4gICAgVVJMLmNyZWF0ZU9iamVjdFVSTCA9IGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgIHZhclxuICAgICAgICAgIHR5cGUgPSBibG9iLnR5cGVcbiAgICAgICAgLCBkYXRhX1VSSV9oZWFkZXJcbiAgICAgIDtcbiAgICAgIGlmICh0eXBlID09PSBudWxsKSB7XG4gICAgICAgIHR5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICAgICAgfVxuICAgICAgaWYgKGJsb2IgaW5zdGFuY2VvZiBGYWtlQmxvYikge1xuICAgICAgICBkYXRhX1VSSV9oZWFkZXIgPSBcImRhdGE6XCIgKyB0eXBlO1xuICAgICAgICBpZiAoYmxvYi5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgIHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIjtiYXNlNjQsXCIgKyBibG9iLmRhdGE7XG4gICAgICAgIH0gZWxzZSBpZiAoYmxvYi5lbmNvZGluZyA9PT0gXCJVUklcIikge1xuICAgICAgICAgIHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIixcIiArIGRlY29kZVVSSUNvbXBvbmVudChibG9iLmRhdGEpO1xuICAgICAgICB9IGlmIChidG9hKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiO2Jhc2U2NCxcIiArIGJ0b2EoYmxvYi5kYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCIsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoYmxvYi5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChyZWFsX2NyZWF0ZV9vYmplY3RfVVJMKSB7XG4gICAgICAgIHJldHVybiByZWFsX2NyZWF0ZV9vYmplY3RfVVJMLmNhbGwocmVhbF9VUkwsIGJsb2IpO1xuICAgICAgfVxuICAgIH07XG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uKG9iamVjdF9VUkwpIHtcbiAgICAgIGlmIChvYmplY3RfVVJMLnN1YnN0cmluZygwLCA1KSAhPT0gXCJkYXRhOlwiICYmIHJlYWxfcmV2b2tlX29iamVjdF9VUkwpIHtcbiAgICAgICAgcmVhbF9yZXZva2Vfb2JqZWN0X1VSTC5jYWxsKHJlYWxfVVJMLCBvYmplY3RfVVJMKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIEZCQl9wcm90by5hcHBlbmQgPSBmdW5jdGlvbihkYXRhLyosIGVuZGluZ3MqLykge1xuICAgICAgdmFyIGJiID0gdGhpcy5kYXRhO1xuICAgICAgLy8gZGVjb2RlIGRhdGEgdG8gYSBiaW5hcnkgc3RyaW5nXG4gICAgICBpZiAoVWludDhBcnJheSAmJiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIHN0ciA9IFwiXCJcbiAgICAgICAgICAsIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGRhdGEpXG4gICAgICAgICAgLCBpID0gMFxuICAgICAgICAgICwgYnVmX2xlbiA9IGJ1Zi5sZW5ndGhcbiAgICAgICAgO1xuICAgICAgICBmb3IgKDsgaSA8IGJ1Zl9sZW47IGkrKykge1xuICAgICAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSk7XG4gICAgICAgIH1cbiAgICAgICAgYmIucHVzaChzdHIpO1xuICAgICAgfSBlbHNlIGlmIChnZXRfY2xhc3MoZGF0YSkgPT09IFwiQmxvYlwiIHx8IGdldF9jbGFzcyhkYXRhKSA9PT0gXCJGaWxlXCIpIHtcbiAgICAgICAgaWYgKEZpbGVSZWFkZXJTeW5jKSB7XG4gICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXJTeW5jO1xuICAgICAgICAgIGJiLnB1c2goZnIucmVhZEFzQmluYXJ5U3RyaW5nKGRhdGEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhc3luYyBGaWxlUmVhZGVyIHdvbid0IHdvcmsgYXMgQmxvYkJ1aWxkZXIgaXMgc3luY1xuICAgICAgICAgIHRocm93IG5ldyBGaWxlRXhjZXB0aW9uKFwiTk9UX1JFQURBQkxFX0VSUlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgRmFrZUJsb2IpIHtcbiAgICAgICAgaWYgKGRhdGEuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIgJiYgYXRvYikge1xuICAgICAgICAgIGJiLnB1c2goYXRvYihkYXRhLmRhdGEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLmVuY29kaW5nID09PSBcIlVSSVwiKSB7XG4gICAgICAgICAgYmIucHVzaChkZWNvZGVVUklDb21wb25lbnQoZGF0YS5kYXRhKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJyYXdcIikge1xuICAgICAgICAgIGJiLnB1c2goZGF0YS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgZGF0YSArPSBcIlwiOyAvLyBjb252ZXJ0IHVuc3VwcG9ydGVkIHR5cGVzIHRvIHN0cmluZ3NcbiAgICAgICAgfVxuICAgICAgICAvLyBkZWNvZGUgVVRGLTE2IHRvIGJpbmFyeSBzdHJpbmdcbiAgICAgICAgYmIucHVzaCh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoZGF0YSkpKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIEZCQl9wcm90by5nZXRCbG9iID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHR5cGUgPSBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBGYWtlQmxvYih0aGlzLmRhdGEuam9pbihcIlwiKSwgdHlwZSwgXCJyYXdcIik7XG4gICAgfTtcbiAgICBGQkJfcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBcIltvYmplY3QgQmxvYkJ1aWxkZXJdXCI7XG4gICAgfTtcbiAgICBGQl9wcm90by5zbGljZSA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHR5cGUpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIGlmIChhcmdzIDwgMykge1xuICAgICAgICB0eXBlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgRmFrZUJsb2IoXG4gICAgICAgICAgdGhpcy5kYXRhLnNsaWNlKHN0YXJ0LCBhcmdzID4gMSA/IGVuZCA6IHRoaXMuZGF0YS5sZW5ndGgpXG4gICAgICAgICwgdHlwZVxuICAgICAgICAsIHRoaXMuZW5jb2RpbmdcbiAgICAgICk7XG4gICAgfTtcbiAgICBGQl9wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiW29iamVjdCBCbG9iXVwiO1xuICAgIH07XG4gICAgRkJfcHJvdG8uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5kYXRhO1xuICAgIH07XG4gICAgcmV0dXJuIEZha2VCbG9iQnVpbGRlcjtcbiAgfSh2aWV3KSk7XG5cbiAgdmlldy5CbG9iID0gZnVuY3Rpb24oYmxvYlBhcnRzLCBvcHRpb25zKSB7XG4gICAgdmFyIHR5cGUgPSBvcHRpb25zID8gKG9wdGlvbnMudHlwZSB8fCBcIlwiKSA6IFwiXCI7XG4gICAgdmFyIGJ1aWxkZXIgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICBpZiAoYmxvYlBhcnRzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYmxvYlBhcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChVaW50OEFycmF5ICYmIGJsb2JQYXJ0c1tpXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICBidWlsZGVyLmFwcGVuZChibG9iUGFydHNbaV0uYnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBidWlsZGVyLmFwcGVuZChibG9iUGFydHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBibG9iID0gYnVpbGRlci5nZXRCbG9iKHR5cGUpO1xuICAgIGlmICghYmxvYi5zbGljZSAmJiBibG9iLndlYmtpdFNsaWNlKSB7XG4gICAgICBibG9iLnNsaWNlID0gYmxvYi53ZWJraXRTbGljZTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2I7XG4gIH07XG5cbiAgdmFyIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QuX19wcm90b19fO1xuICB9O1xuICB2aWV3LkJsb2IucHJvdG90eXBlID0gZ2V0UHJvdG90eXBlT2YobmV3IHZpZXcuQmxvYigpKTtcbn0odHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZiB8fCB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyB8fCB0aGlzLmNvbnRlbnQgfHwgdGhpcykpO1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhY3Rvcnk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuTWVkaXVtRWRpdG9yID0gZmFjdG9yeTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gTWVkaXVtRWRpdG9yKGVsZW1lbnRzLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHJldHVybiB0aGlzLmluaXQoZWxlbWVudHMsIG9wdGlvbnMpO1xufVxuXG5NZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucyA9IHt9O1xuLypqc2hpbnQgdW51c2VkOiB0cnVlICovXG4oZnVuY3Rpb24gKHdpbmRvdykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGNvcHlJbnRvKG92ZXJ3cml0ZSwgZGVzdCkge1xuICAgICAgICB2YXIgcHJvcCxcbiAgICAgICAgICAgIHNvdXJjZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgICAgICBkZXN0ID0gZGVzdCB8fCB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gc291cmNlc1tpXTtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcF0gIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAob3ZlcndyaXRlIHx8IGRlc3QuaGFzT3duUHJvcGVydHkocHJvcCkgPT09IGZhbHNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9jb250YWluc1xuICAgIC8vIFNvbWUgYnJvd3NlcnMgKGluY2x1ZGluZyBwaGFudG9tKSBkb24ndCByZXR1cm4gdHJ1ZSBmb3IgTm9kZS5jb250YWlucyhjaGlsZClcbiAgICAvLyBpZiBjaGlsZCBpcyBhIHRleHQgbm9kZS4gIERldGVjdCB0aGVzZSBjYXNlcyBoZXJlIGFuZCB1c2UgYSBmYWxsYmFja1xuICAgIC8vIGZvciBjYWxscyB0byBVdGlsLmlzRGVzY2VuZGFudCgpXG4gICAgdmFyIG5vZGVDb250YWluc1dvcmtzV2l0aFRleHROb2RlcyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciB0ZXN0UGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICB0ZXN0VGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyk7XG4gICAgICAgIHRlc3RQYXJlbnQuYXBwZW5kQ2hpbGQodGVzdFRleHQpO1xuICAgICAgICBub2RlQ29udGFpbnNXb3Jrc1dpdGhUZXh0Tm9kZXMgPSB0ZXN0UGFyZW50LmNvbnRhaW5zKHRlc3RUZXh0KTtcbiAgICB9IGNhdGNoIChleGMpIHt9XG5cbiAgICB2YXIgVXRpbCA9IHtcblxuICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE3OTA3NDQ1L2hvdy10by1kZXRlY3QtaWUxMSNjb21tZW50MzAxNjU4ODhfMTc5MDc1NjJcbiAgICAgICAgLy8gYnkgcmc4OVxuICAgICAgICBpc0lFOiAoKG5hdmlnYXRvci5hcHBOYW1lID09PSAnTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyJykgfHwgKChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ05ldHNjYXBlJykgJiYgKG5ldyBSZWdFeHAoJ1RyaWRlbnQvLipydjooWzAtOV17MSx9Wy4wLTldezAsfSknKS5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpICE9PSBudWxsKSkpLFxuXG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzExNzUyMDg0LzU2OTEwMVxuICAgICAgICBpc01hYzogKHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0udG9VcHBlckNhc2UoKS5pbmRleE9mKCdNQUMnKSA+PSAwKSxcblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmVcbiAgICAgICAga2V5Q29kZToge1xuICAgICAgICAgICAgQkFDS1NQQUNFOiA4LFxuICAgICAgICAgICAgVEFCOiA5LFxuICAgICAgICAgICAgRU5URVI6IDEzLFxuICAgICAgICAgICAgRVNDQVBFOiAyNyxcbiAgICAgICAgICAgIFNQQUNFOiAzMixcbiAgICAgICAgICAgIERFTEVURTogNDYsXG4gICAgICAgICAgICBLOiA3NSwgLy8gSyBrZXljb2RlLCBhbmQgbm90IGtcbiAgICAgICAgICAgIE06IDc3XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiBpdCdzIG1ldGFLZXkgb24gTWFjLCBvciBjdHJsS2V5IG9uIG5vbi1NYWMuXG4gICAgICAgICAqIFNlZSAjNTkxXG4gICAgICAgICAqL1xuICAgICAgICBpc01ldGFDdHJsS2V5OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICgoVXRpbC5pc01hYyAmJiBldmVudC5tZXRhS2V5KSB8fCAoIVV0aWwuaXNNYWMgJiYgZXZlbnQuY3RybEtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGtleSBhc3NvY2lhdGVkIHRvIHRoZSBldmVudCBpcyBpbnNpZGUga2V5cyBhcnJheVxuICAgICAgICAgKlxuICAgICAgICAgKiBAc2VlIDogaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvYmxvYi8wNzA1YmU0NzUwOTJhZWRlMWVkZGFlMDEzMTllYzkzMWZiOWM2NWZjL3NyYy9ldmVudC5qcyNMNDczLUw0ODRcbiAgICAgICAgICogQHNlZSA6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzQ0NzE1ODIvNTY5MTAxXG4gICAgICAgICAqL1xuICAgICAgICBpc0tleTogZnVuY3Rpb24gKGV2ZW50LCBrZXlzKSB7XG4gICAgICAgICAgICB2YXIga2V5Q29kZSA9IFV0aWwuZ2V0S2V5Q29kZShldmVudCk7XG5cbiAgICAgICAgICAgIC8vIGl0J3Mgbm90IGFuIGFycmF5IGxldCdzIGp1c3QgY29tcGFyZSBzdHJpbmdzIVxuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleUNvZGUgPT09IGtleXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgtMSA9PT0ga2V5cy5pbmRleE9mKGtleUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRLZXlDb2RlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBrZXlDb2RlID0gZXZlbnQud2hpY2g7XG5cbiAgICAgICAgICAgIC8vIGdldHRpbmcgdGhlIGtleSBjb2RlIGZyb20gZXZlbnRcbiAgICAgICAgICAgIGlmIChudWxsID09PSBrZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAga2V5Q29kZSA9IGV2ZW50LmNoYXJDb2RlICE9PSBudWxsID8gZXZlbnQuY2hhckNvZGUgOiBldmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ga2V5Q29kZTtcbiAgICAgICAgfSxcblxuICAgICAgICBibG9ja0NvbnRhaW5lckVsZW1lbnROYW1lczogW1xuICAgICAgICAgICAgLy8gZWxlbWVudHMgb3VyIGVkaXRvciBnZW5lcmF0ZXNcbiAgICAgICAgICAgICdwJywgJ2gxJywgJ2gyJywgJ2gzJywgJ2g0JywgJ2g1JywgJ2g2JywgJ2Jsb2NrcXVvdGUnLCAncHJlJywgJ3VsJywgJ2xpJywgJ29sJyxcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBrbm93biBibG9jayBlbGVtZW50c1xuICAgICAgICAgICAgJ2FkZHJlc3MnLCAnYXJ0aWNsZScsICdhc2lkZScsICdhdWRpbycsICdjYW52YXMnLCAnZGQnLCAnZGwnLCAnZHQnLCAnZmllbGRzZXQnLFxuICAgICAgICAgICAgJ2ZpZ2NhcHRpb24nLCAnZmlndXJlJywgJ2Zvb3RlcicsICdmb3JtJywgJ2hlYWRlcicsICdoZ3JvdXAnLCAnbWFpbicsICduYXYnLFxuICAgICAgICAgICAgJ25vc2NyaXB0JywgJ291dHB1dCcsICdzZWN0aW9uJywgJ3ZpZGVvJyxcbiAgICAgICAgICAgICd0YWJsZScsICd0aGVhZCcsICd0Ym9keScsICd0Zm9vdCcsICd0cicsICd0aCcsICd0ZCdcbiAgICAgICAgXSxcblxuICAgICAgICBlbXB0eUVsZW1lbnROYW1lczogWydicicsICdjb2wnLCAnY29sZ3JvdXAnLCAnaHInLCAnaW1nJywgJ2lucHV0JywgJ3NvdXJjZScsICd3YnInXSxcblxuICAgICAgICBleHRlbmQ6IGZ1bmN0aW9uIGV4dGVuZCgvKiBkZXN0LCBzb3VyY2UxLCBzb3VyY2UyLCAuLi4qLykge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvcHlJbnRvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZmF1bHRzOiBmdW5jdGlvbiBkZWZhdWx0cygvKmRlc3QsIHNvdXJjZTEsIHNvdXJjZTIsIC4uLiovKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtmYWxzZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvcHlJbnRvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXG4gICAgICAgICAqIENyZWF0ZSBhIGxpbmsgYXJvdW5kIHRoZSBwcm92aWRlZCB0ZXh0IG5vZGVzIHdoaWNoIG11c3QgYmUgYWRqYWNlbnQgdG8gZWFjaCBvdGhlciBhbmQgYWxsIGJlXG4gICAgICAgICAqIGRlc2NlbmRhbnRzIG9mIHRoZSBzYW1lIGNsb3Nlc3QgYmxvY2sgY29udGFpbmVyLiBJZiB0aGUgcHJlY29uZGl0aW9ucyBhcmUgbm90IG1ldCwgdW5leHBlY3RlZFxuICAgICAgICAgKiBiZWhhdmlvciB3aWxsIHJlc3VsdC5cbiAgICAgICAgICovXG4gICAgICAgIGNyZWF0ZUxpbms6IGZ1bmN0aW9uIChkb2N1bWVudCwgdGV4dE5vZGVzLCBocmVmLCB0YXJnZXQpIHtcbiAgICAgICAgICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBVdGlsLm1vdmVUZXh0UmFuZ2VJbnRvRWxlbWVudCh0ZXh0Tm9kZXNbMF0sIHRleHROb2Rlc1t0ZXh0Tm9kZXMubGVuZ3RoIC0gMV0sIGFuY2hvcik7XG4gICAgICAgICAgICBhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgaHJlZik7XG4gICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgdGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhbmNob3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcbiAgICAgICAgICogR2l2ZW4gdGhlIHByb3ZpZGVkIG1hdGNoIGluIHRoZSBmb3JtYXQge3N0YXJ0OiAxLCBlbmQ6IDJ9IHdoZXJlIHN0YXJ0IGFuZCBlbmQgYXJlIGluZGljZXMgaW50byB0aGVcbiAgICAgICAgICogdGV4dENvbnRlbnQgb2YgdGhlIHByb3ZpZGVkIGVsZW1lbnQgYXJndW1lbnQsIG1vZGlmeSB0aGUgRE9NIGluc2lkZSBlbGVtZW50IHRvIGVuc3VyZSB0aGF0IHRoZSB0ZXh0XG4gICAgICAgICAqIGlkZW50aWZpZWQgYnkgdGhlIHByb3ZpZGVkIG1hdGNoIGNhbiBiZSByZXR1cm5lZCBhcyB0ZXh0IG5vZGVzIHRoYXQgY29udGFpbiBleGFjdGx5IHRoYXQgdGV4dCwgd2l0aG91dFxuICAgICAgICAgKiBhbnkgYWRkaXRpb25hbCB0ZXh0IGF0IHRoZSBiZWdpbm5pbmcgb3IgZW5kIG9mIHRoZSByZXR1cm5lZCBhcnJheSBvZiBhZGphY2VudCB0ZXh0IG5vZGVzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgb25seSBET00gbWFuaXB1bGF0aW9uIHBlcmZvcm1lZCBieSB0aGlzIGZ1bmN0aW9uIGlzIHNwbGl0dGluZyB0aGUgdGV4dCBub2Rlcywgbm9uLXRleHQgbm9kZXMgYXJlXG4gICAgICAgICAqIG5vdCBhZmZlY3RlZCBpbiBhbnkgd2F5LlxuICAgICAgICAgKi9cbiAgICAgICAgZmluZE9yQ3JlYXRlTWF0Y2hpbmdUZXh0Tm9kZXM6IGZ1bmN0aW9uIChkb2N1bWVudCwgZWxlbWVudCwgbWF0Y2gpIHtcbiAgICAgICAgICAgIHZhciB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihlbGVtZW50LCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpLFxuICAgICAgICAgICAgICAgIG1hdGNoZWROb2RlcyA9IFtdLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRUZXh0SW5kZXggPSAwLFxuICAgICAgICAgICAgICAgIHN0YXJ0UmVhY2hlZCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlID0gbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gbnVsbDtcblxuICAgICAgICAgICAgd2hpbGUgKChjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIubmV4dE5vZGUoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0UmVhY2hlZCAmJiBtYXRjaC5zdGFydCA8IChjdXJyZW50VGV4dEluZGV4ICsgY3VycmVudE5vZGUubm9kZVZhbHVlLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRSZWFjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZSA9IFV0aWwuc3BsaXRTdGFydE5vZGVJZk5lZWRlZChjdXJyZW50Tm9kZSwgbWF0Y2guc3RhcnQsIGN1cnJlbnRUZXh0SW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIFV0aWwuc3BsaXRFbmROb2RlSWZOZWVkZWQoY3VycmVudE5vZGUsIG5ld05vZGUsIG1hdGNoLmVuZCwgY3VycmVudFRleHRJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGFydFJlYWNoZWQgJiYgY3VycmVudFRleHRJbmRleCA9PT0gbWF0Y2guZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBGb3VuZCB0aGUgbm9kZShzKSBjb3JyZXNwb25kaW5nIHRvIHRoZSBsaW5rLiBCcmVhayBvdXQgYW5kIG1vdmUgb24gdG8gdGhlIG5leHQuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGFydFJlYWNoZWQgJiYgY3VycmVudFRleHRJbmRleCA+IChtYXRjaC5lbmQgKyAxKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BlcmZvcm1MaW5raW5nIG92ZXJzaG90IHRoZSB0YXJnZXQhJyk7IC8vIHNob3VsZCBuZXZlciBoYXBwZW4uLi5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZWROb2Rlcy5wdXNoKG5ld05vZGUgfHwgY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1cnJlbnRUZXh0SW5kZXggKz0gY3VycmVudE5vZGUubm9kZVZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobmV3Tm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGV4dEluZGV4ICs9IG5ld05vZGUubm9kZVZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCB0aGUgbmV3Tm9kZSBhcyB3ZSdsbCBhbHJlYWR5IGhhdmUgcHVzaGVkIGl0IHRvIHRoZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgIHRyZWVXYWxrZXIubmV4dE5vZGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlZE5vZGVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qXG4gICAgICAgICAqIEdpdmVuIHRoZSBwcm92aWRlZCB0ZXh0IG5vZGUgYW5kIHRleHQgY29vcmRpbmF0ZXMsIHNwbGl0IHRoZSB0ZXh0IG5vZGUgaWYgbmVlZGVkIHRvIG1ha2UgaXQgYWxpZ25cbiAgICAgICAgICogcHJlY2lzZWx5IHdpdGggdGhlIGNvb3JkaW5hdGVzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIGNhbGxlZCBmcm9tIFV0aWwuZmluZE9yQ3JlYXRlTWF0Y2hpbmdUZXh0Tm9kZXMuXG4gICAgICAgICAqL1xuICAgICAgICBzcGxpdFN0YXJ0Tm9kZUlmTmVlZGVkOiBmdW5jdGlvbiAoY3VycmVudE5vZGUsIG1hdGNoU3RhcnRJbmRleCwgY3VycmVudFRleHRJbmRleCkge1xuICAgICAgICAgICAgaWYgKG1hdGNoU3RhcnRJbmRleCAhPT0gY3VycmVudFRleHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50Tm9kZS5zcGxpdFRleHQobWF0Y2hTdGFydEluZGV4IC0gY3VycmVudFRleHRJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKlxuICAgICAgICAgKiBHaXZlbiB0aGUgcHJvdmlkZWQgdGV4dCBub2RlIGFuZCB0ZXh0IGNvb3JkaW5hdGVzLCBzcGxpdCB0aGUgdGV4dCBub2RlIGlmIG5lZWRlZCB0byBtYWtlIGl0IGFsaWduXG4gICAgICAgICAqIHByZWNpc2VseSB3aXRoIHRoZSBjb29yZGluYXRlcy4gVGhlIG5ld05vZGUgYXJndW1lbnQgc2hvdWxkIGZyb20gdGhlIHJlc3VsdCBvZiBVdGlsLnNwbGl0U3RhcnROb2RlSWZOZWVkZWQsXG4gICAgICAgICAqIGlmIHRoYXQgZnVuY3Rpb24gaGFzIGJlZW4gY2FsbGVkIG9uIHRoZSBzYW1lIGN1cnJlbnROb2RlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIGNhbGxlZCBmcm9tIFV0aWwuZmluZE9yQ3JlYXRlTWF0Y2hpbmdUZXh0Tm9kZXMuXG4gICAgICAgICAqL1xuICAgICAgICBzcGxpdEVuZE5vZGVJZk5lZWRlZDogZnVuY3Rpb24gKGN1cnJlbnROb2RlLCBuZXdOb2RlLCBtYXRjaEVuZEluZGV4LCBjdXJyZW50VGV4dEluZGV4KSB7XG4gICAgICAgICAgICB2YXIgdGV4dEluZGV4T2ZFbmRPZkZhcnRoZXN0Tm9kZSxcbiAgICAgICAgICAgICAgICBlbmRTcGxpdFBvaW50O1xuICAgICAgICAgICAgdGV4dEluZGV4T2ZFbmRPZkZhcnRoZXN0Tm9kZSA9IGN1cnJlbnRUZXh0SW5kZXggKyAobmV3Tm9kZSB8fCBjdXJyZW50Tm9kZSkubm9kZVZhbHVlLmxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAgIChuZXdOb2RlID8gY3VycmVudE5vZGUubm9kZVZhbHVlLmxlbmd0aCA6IDApIC1cbiAgICAgICAgICAgICAgICAgICAgMTtcbiAgICAgICAgICAgIGVuZFNwbGl0UG9pbnQgPSAobmV3Tm9kZSB8fCBjdXJyZW50Tm9kZSkubm9kZVZhbHVlLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgICh0ZXh0SW5kZXhPZkVuZE9mRmFydGhlc3ROb2RlICsgMSAtIG1hdGNoRW5kSW5kZXgpO1xuICAgICAgICAgICAgaWYgKHRleHRJbmRleE9mRW5kT2ZGYXJ0aGVzdE5vZGUgPj0gbWF0Y2hFbmRJbmRleCAmJlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGV4dEluZGV4ICE9PSB0ZXh0SW5kZXhPZkVuZE9mRmFydGhlc3ROb2RlICYmXG4gICAgICAgICAgICAgICAgICAgIGVuZFNwbGl0UG9pbnQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAobmV3Tm9kZSB8fCBjdXJyZW50Tm9kZSkuc3BsaXRUZXh0KGVuZFNwbGl0UG9pbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qXG4gICAgICAgICogVGFrZSBhbiBlbGVtZW50LCBhbmQgYnJlYWsgdXAgYWxsIG9mIGl0cyB0ZXh0IGNvbnRlbnQgaW50byB1bmlxdWUgcGllY2VzIHN1Y2ggdGhhdDpcbiAgICAgICAgICogMSkgQWxsIHRleHQgY29udGVudCBvZiB0aGUgZWxlbWVudHMgYXJlIGluIHNlcGFyYXRlIGJsb2Nrcy4gTm8gcGllY2Ugb2YgdGV4dCBjb250ZW50IHNob3VsZCBzcGFuXG4gICAgICAgICAqICAgIHNwYW4gbXVsdGlwbGUgYmxvY2tzLiBUaGlzIG1lYW5zIG5vIGVsZW1lbnQgcmV0dXJuIGJ5IHRoaXMgZnVuY3Rpb24gc2hvdWxkIGhhdmVcbiAgICAgICAgICogICAgYW55IGJsb2NrcyBhcyBjaGlsZHJlbi5cbiAgICAgICAgICogMikgVGhlIHVuaW9uIG9mIHRoZSB0ZXh0Y29udGVudCBvZiBhbGwgb2YgdGhlIGVsZW1lbnRzIHJldHVybmVkIGhlcmUgY292ZXJzIGFsbFxuICAgICAgICAgKiAgICBvZiB0aGUgdGV4dCB3aXRoaW4gdGhlIGVsZW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqIEVYQU1QTEU6XG4gICAgICAgICAqIEluIHRoZSBldmVudCB0aGF0IHdlIGhhdmUgc29tZXRoaW5nIGxpa2U6XG4gICAgICAgICAqXG4gICAgICAgICAqIDxibG9ja3F1b3RlPlxuICAgICAgICAgKiAgIDxwPlNvbWUgVGV4dDwvcD5cbiAgICAgICAgICogICA8b2w+XG4gICAgICAgICAqICAgICA8bGk+TGlzdCBJdGVtIDE8L2xpPlxuICAgICAgICAgKiAgICAgPGxpPkxpc3QgSXRlbSAyPC9saT5cbiAgICAgICAgICogICA8L29sPlxuICAgICAgICAgKiA8L2Jsb2NrcXVvdGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gd291bGQgcmV0dXJuIHRoZXNlIGVsZW1lbnRzIGFzIGFuIGFycmF5OlxuICAgICAgICAgKiAgIFsgPHA+U29tZSBUZXh0PC9wPiwgPGxpPkxpc3QgSXRlbSAxPC9saT4sIDxsaT5MaXN0IEl0ZW0gMjwvbGk+IF1cbiAgICAgICAgICpcbiAgICAgICAgICogU2luY2UgdGhlIDxibG9ja3F1b3RlPiBhbmQgPG9sPiBlbGVtZW50cyBjb250YWluIGJsb2NrcyB3aXRoaW4gdGhlbSB0aGV5IGFyZSBub3QgcmV0dXJuZWQuXG4gICAgICAgICAqIFNpbmNlIHRoZSA8cD4gYW5kIDxsaT4ncyBkb24ndCBjb250YWluIGJsb2NrIGVsZW1lbnRzIGFuZCBjb3ZlciBhbGwgdGhlIHRleHQgY29udGVudCBvZiB0aGVcbiAgICAgICAgICogPGJsb2NrcXVvdGU+IGNvbnRhaW5lciwgdGhleSBhcmUgdGhlIGVsZW1lbnRzIHJldHVybmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgc3BsaXRCeUJsb2NrRWxlbWVudHM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgdG9SZXQgPSBbXSxcbiAgICAgICAgICAgICAgICBibG9ja0VsZW1lbnRRdWVyeSA9IE1lZGl1bUVkaXRvci51dGlsLmJsb2NrQ29udGFpbmVyRWxlbWVudE5hbWVzLmpvaW4oJywnKTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IDMgfHwgZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKGJsb2NrRWxlbWVudFF1ZXJ5KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2VsZW1lbnRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnQuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9SZXQucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2NrRWxlbWVudHMgPSBjaGlsZC5xdWVyeVNlbGVjdG9yQWxsKGJsb2NrRWxlbWVudFF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrRWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b1JldC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvUmV0ID0gdG9SZXQuY29uY2F0KE1lZGl1bUVkaXRvci51dGlsLnNwbGl0QnlCbG9ja0VsZW1lbnRzKGNoaWxkKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0b1JldDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIERPTSB0cmVlIHRoYXQgcmVwcmVzZW50cyBhbnkgdGV4dCB0aGF0IGlzIGJlaW5nXG4gICAgICAgIC8vIGRpc3BsYXllZCBkaXJlY3RseSBuZXh0IHRvIHRoZSB0YXJnZXROb2RlIChwYXNzZWQgYXMgYW4gYXJndW1lbnQpXG4gICAgICAgIC8vIFRleHQgdGhhdCBhcHBlYXJzIGRpcmVjdGx5IG5leHQgdG8gdGhlIGN1cnJlbnQgbm9kZSBjYW4gYmU6XG4gICAgICAgIC8vICAtIEEgc2libGluZyB0ZXh0IG5vZGVcbiAgICAgICAgLy8gIC0gQSBkZXNjZW5kYW50IG9mIGEgc2libGluZyBlbGVtZW50XG4gICAgICAgIC8vICAtIEEgc2libGluZyB0ZXh0IG5vZGUgb2YgYW4gYW5jZXN0b3JcbiAgICAgICAgLy8gIC0gQSBkZXNjZW5kYW50IG9mIGEgc2libGluZyBlbGVtZW50IG9mIGFuIGFuY2VzdG9yXG4gICAgICAgIGZpbmRBZGphY2VudFRleHROb2RlV2l0aENvbnRlbnQ6IGZ1bmN0aW9uIGZpbmRBZGphY2VudFRleHROb2RlV2l0aENvbnRlbnQocm9vdE5vZGUsIHRhcmdldE5vZGUsIG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXN0VGFyZ2V0ID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbmV4dE5vZGUsXG4gICAgICAgICAgICAgICAgbm9kZUl0ZXJhdG9yID0gb3duZXJEb2N1bWVudC5jcmVhdGVOb2RlSXRlcmF0b3Iocm9vdE5vZGUsIE5vZGVGaWx0ZXIuU0hPV19URVhULCBudWxsLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzZSBhIG5hdGl2ZSBOb2RlSXRlcmF0b3IgdG8gaXRlcmF0ZSBvdmVyIGFsbCB0aGUgdGV4dCBub2RlcyB0aGF0IGFyZSBkZXNjZW5kYW50c1xuICAgICAgICAgICAgLy8gb2YgdGhlIHJvb3ROb2RlLiAgT25jZSBwYXN0IHRoZSB0YXJnZXROb2RlLCBjaG9vc2UgdGhlIGZpcnN0IG5vbi1lbXB0eSB0ZXh0IG5vZGVcbiAgICAgICAgICAgIG5leHROb2RlID0gbm9kZUl0ZXJhdG9yLm5leHROb2RlKCk7XG4gICAgICAgICAgICB3aGlsZSAobmV4dE5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV4dE5vZGUgPT09IHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFzdFRhcmdldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXN0VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0Tm9kZS5ub2RlVHlwZSA9PT0gMyAmJiBuZXh0Tm9kZS5ub2RlVmFsdWUgJiYgbmV4dE5vZGUubm9kZVZhbHVlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXh0Tm9kZSA9IG5vZGVJdGVyYXRvci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNEZXNjZW5kYW50OiBmdW5jdGlvbiBpc0Rlc2NlbmRhbnQocGFyZW50LCBjaGlsZCwgY2hlY2tFcXVhbGl0eSkge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnQgfHwgIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcmVudCA9PT0gY2hpbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFjaGVja0VxdWFsaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgcGFyZW50IGlzIG5vdCBhbiBlbGVtZW50LCBpdCBjYW4ndCBoYXZlIGFueSBkZXNjZW5kYW50c1xuICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlQ29udGFpbnNXb3Jrc1dpdGhUZXh0Tm9kZXMgfHwgY2hpbGQubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50LmNvbnRhaW5zKGNoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIHdoaWxlIChub2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmVcbiAgICAgICAgaXNFbGVtZW50OiBmdW5jdGlvbiBpc0VsZW1lbnQob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlXG4gICAgICAgIHRocm90dGxlOiBmdW5jdGlvbiAoZnVuYywgd2FpdCkge1xuICAgICAgICAgICAgdmFyIFRIUk9UVExFX0lOVEVSVkFMID0gNTAsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgIHJlc3VsdCxcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbCxcbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IDAsXG4gICAgICAgICAgICAgICAgbGF0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCF3YWl0ICYmIHdhaXQgIT09IDApIHtcbiAgICAgICAgICAgICAgICB3YWl0ID0gVEhST1RUTEVfSU5URVJWQUw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgdHJhdmVyc2VVcDogZnVuY3Rpb24gKGN1cnJlbnQsIHRlc3RFbGVtZW50RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGlmICghY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0RWxlbWVudEZ1bmN0aW9uKGN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3QgdHJhdmVyc2UgdXB3YXJkcyBwYXN0IHRoZSBuZWFyZXN0IGNvbnRhaW5pbmcgZWRpdG9yXG4gICAgICAgICAgICAgICAgICAgIGlmIChVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudChjdXJyZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH0gd2hpbGUgKGN1cnJlbnQpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaHRtbEVudGl0aWVzOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0cyBzcGVjaWFsIGNoYXJhY3RlcnMgKGxpa2UgPCkgaW50byB0aGVpciBlc2NhcGVkL2VuY29kZWQgdmFsdWVzIChsaWtlICZsdDspLlxuICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3MgeW91IHRvIHNob3cgdG8gZGlzcGxheSB0aGUgc3RyaW5nIHdpdGhvdXQgdGhlIGJyb3dzZXIgcmVhZGluZyBpdCBhcyBIVE1MLlxuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhzdHIpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82NjkwNzUyL2luc2VydC1odG1sLWF0LWNhcmV0LWluLWEtY29udGVudGVkaXRhYmxlLWRpdlxuICAgICAgICBpbnNlcnRIVE1MQ29tbWFuZDogZnVuY3Rpb24gKGRvYywgaHRtbCkge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiwgcmFuZ2UsIGVsLCBmcmFnbWVudCwgbm9kZSwgbGFzdE5vZGUsIHRvUmVwbGFjZTtcblxuICAgICAgICAgICAgaWYgKGRvYy5xdWVyeUNvbW1hbmRTdXBwb3J0ZWQoJ2luc2VydEhUTUwnKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2MuZXhlY0NvbW1hbmQoJ2luc2VydEhUTUwnLCBmYWxzZSwgaHRtbCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2MuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uLnJhbmdlQ291bnQpIHtcbiAgICAgICAgICAgICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgICAgIHRvUmVwbGFjZSA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3lhYndlL21lZGl1bS1lZGl0b3IvaXNzdWVzLzc0OFxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBzZWxlY3Rpb24gaXMgYW4gZW1wdHkgZWRpdG9yIGVsZW1lbnQsIGNyZWF0ZSBhIHRlbXBvcmFyeSB0ZXh0IG5vZGUgaW5zaWRlIG9mIHRoZSBlZGl0b3JcbiAgICAgICAgICAgICAgICAvLyBhbmQgc2VsZWN0IGl0IHNvIHRoYXQgd2UgZG9uJ3QgZGVsZXRlIHRoZSBlZGl0b3IgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudCh0b1JlcGxhY2UpICYmICF0b1JlcGxhY2UuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlKHRvUmVwbGFjZS5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUoJycpKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgodG9SZXBsYWNlLm5vZGVUeXBlID09PSAzICYmIHJhbmdlLnN0YXJ0T2Zmc2V0ID09PSAwICYmIHJhbmdlLmVuZE9mZnNldCA9PT0gdG9SZXBsYWNlLm5vZGVWYWx1ZS5sZW5ndGgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAodG9SZXBsYWNlLm5vZGVUeXBlICE9PSAzICYmIHRvUmVwbGFjZS5pbm5lckhUTUwgPT09IHJhbmdlLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSByYW5nZSBjb3ZlcnMgbWF4aW11bSBhbW91bnQgb2Ygbm9kZXMgYXMgcG9zc2libGVcbiAgICAgICAgICAgICAgICAgICAgLy8gQnkgbW92aW5nIHVwIHRoZSBET00gYW5kIHNlbGVjdGluZyBhbmNlc3RvcnMgd2hvc2Ugb25seSBjaGlsZCBpcyB0aGUgcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCFVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudCh0b1JlcGxhY2UpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9SZXBsYWNlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1JlcGxhY2UucGFyZW50Tm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudCh0b1JlcGxhY2UucGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvUmVwbGFjZSA9IHRvUmVwbGFjZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlLnNlbGVjdE5vZGUodG9SZXBsYWNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmFuZ2UuZGVsZXRlQ29udGVudHMoKTtcblxuICAgICAgICAgICAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBlbC5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGZyYWdtZW50LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByYW5nZS5pbnNlcnROb2RlKGZyYWdtZW50KTtcblxuICAgICAgICAgICAgICAgIC8vIFByZXNlcnZlIHRoZSBzZWxlY3Rpb246XG4gICAgICAgICAgICAgICAgaWYgKGxhc3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlID0gcmFuZ2UuY2xvbmVSYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICByYW5nZS5zZXRTdGFydEFmdGVyKGxhc3ROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXhlY0Zvcm1hdEJsb2NrOiBmdW5jdGlvbiAoZG9jLCB0YWdOYW1lKSB7XG4gICAgICAgICAgICAvLyBHZXQgdGhlIHRvcCBsZXZlbCBibG9jayBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgdmFyIGJsb2NrQ29udGFpbmVyID0gVXRpbC5nZXRUb3BCbG9ja0NvbnRhaW5lcihNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvblN0YXJ0KGRvYykpO1xuXG4gICAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBibG9ja3F1b3RlXG4gICAgICAgICAgICBpZiAodGFnTmFtZSA9PT0gJ2Jsb2NrcXVvdGUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGJsb2NrQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYmxvY2tDb250YWluZXIuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBibG9ja3F1b3RlIGhhcyBhIGJsb2NrIGVsZW1lbnQgYXMgYSBjaGlsZCAobmVzdGVkIGJsb2NrcylcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkTm9kZXMuc29tZShmdW5jdGlvbiAoY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXRpbC5pc0Jsb2NrQ29udGFpbmVyKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGRiBoYW5kbGVzIGJsb2NrcXVvdGUgZGlmZmVyZW50bHkgb24gZm9ybWF0QmxvY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbG93aW5nIG5lc3RpbmcsIHdlIG5lZWQgdG8gdXNlIG91dGRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvUmljaC1UZXh0X0VkaXRpbmdfaW5fTW96aWxsYVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvYy5leGVjQ29tbWFuZCgnb3V0ZGVudCcsIGZhbHNlLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdoZW4gSUUgYmxvY2txdW90ZSBuZWVkcyB0byBiZSBjYWxsZWQgYXMgaW5kZW50XG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODE2MjIzL3JpY2gtdGV4dC1lZGl0b3Itd2l0aC1ibG9ja3F1b3RlLWZ1bmN0aW9uLzE4MjE3NzcjMTgyMTc3N1xuICAgICAgICAgICAgICAgIGlmIChVdGlsLmlzSUUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvYy5leGVjQ29tbWFuZCgnaW5kZW50JywgZmFsc2UsIHRhZ05hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlIGJsb2NrQ29udGFpbmVyIGlzIGFscmVhZHkgdGhlIGVsZW1lbnQgdHlwZSBiZWluZyBwYXNzZWQgaW5cbiAgICAgICAgICAgIC8vIHRyZWF0IGl0IGFzICd1bmRvJyBmb3JtYXR0aW5nIGFuZCBqdXN0IGNvbnZlcnQgaXQgdG8gYSA8cD5cbiAgICAgICAgICAgIGlmIChibG9ja0NvbnRhaW5lciAmJiB0YWdOYW1lID09PSBibG9ja0NvbnRhaW5lci5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgdGFnTmFtZSA9ICdwJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiBJRSB3ZSBuZWVkIHRvIGFkZCA8PiB0byBoZWFkaW5nIGVsZW1lbnRzXG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNzQxODMxL2V4ZWNjb21tYW5kLWZvcm1hdGJsb2NrLWhlYWRpbmdzLWluLWllXG4gICAgICAgICAgICBpZiAoVXRpbC5pc0lFKSB7XG4gICAgICAgICAgICAgICAgdGFnTmFtZSA9ICc8JyArIHRhZ05hbWUgKyAnPic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jLmV4ZWNDb21tYW5kKCdmb3JtYXRCbG9jaycsIGZhbHNlLCB0YWdOYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRhcmdldCB0byBibGFuayBvbiB0aGUgZ2l2ZW4gZWwgZWxlbWVudFxuICAgICAgICAgKlxuICAgICAgICAgKiBUT0RPOiBub3Qgc3VyZSBpZiB0aGlzIHNob3VsZCBiZSBoZXJlXG4gICAgICAgICAqXG4gICAgICAgICAqIFdoZW4gY3JlYXRpbmcgYSBsaW5rICh1c2luZyBjb3JlIC0+IGNyZWF0ZUxpbmspIHRoZSBzZWxlY3Rpb24gcmV0dXJuZWQgYnkgRmlyZWZveCB3aWxsIGJlIHRoZSBwYXJlbnQgb2YgdGhlIGNyZWF0ZWQgbGlua1xuICAgICAgICAgKiBpbnN0ZWFkIG9mIHRoZSBjcmVhdGVkIGxpbmsgaXRzZWxmIChhcyBpdCBpcyBmb3IgQ2hyb21lIGZvciBleGFtcGxlKSwgc28gd2UgcmV0cmlldmUgYWxsIFwiYVwiIGNoaWxkcmVuIHRvIGdyYWIgdGhlIGdvb2Qgb25lIGJ5XG4gICAgICAgICAqIHVzaW5nIGBhbmNob3JVcmxgIHRvIGVuc3VyZSB0aGF0IHdlIGFyZSBhZGRpbmcgdGFyZ2V0PVwiX2JsYW5rXCIgb24gdGhlIGdvb2Qgb25lLlxuICAgICAgICAgKiBUaGlzIGlzbid0IGEgYnVsbGV0cHJvb2Ygc29sdXRpb24gYW55d2F5IC4uXG4gICAgICAgICAqL1xuICAgICAgICBzZXRUYXJnZXRCbGFuazogZnVuY3Rpb24gKGVsLCBhbmNob3JVcmwpIHtcbiAgICAgICAgICAgIHZhciBpLCB1cmwgPSBhbmNob3JVcmwgfHwgZmFsc2U7XG4gICAgICAgICAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnKSB7XG4gICAgICAgICAgICAgICAgZWwudGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsID0gZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKTtcblxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFsc2UgPT09IHVybCB8fCB1cmwgPT09IGVsW2ldLmF0dHJpYnV0ZXMuaHJlZi52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxbaV0udGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkQ2xhc3NUb0FuY2hvcnM6IGZ1bmN0aW9uIChlbCwgYnV0dG9uQ2xhc3MpIHtcbiAgICAgICAgICAgIHZhciBjbGFzc2VzID0gYnV0dG9uQ2xhc3Muc3BsaXQoJyAnKSxcbiAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNsYXNzZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbGFzc2VzW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsID0gZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNsYXNzZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsW2ldLmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNMaXN0SXRlbTogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdsaScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgdGFnTmFtZSA9IHBhcmVudE5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHdoaWxlICh0YWdOYW1lID09PSAnbGknIHx8ICghVXRpbC5pc0Jsb2NrQ29udGFpbmVyKHBhcmVudE5vZGUpICYmIHRhZ05hbWUgIT09ICdkaXYnKSkge1xuICAgICAgICAgICAgICAgIGlmICh0YWdOYW1lID09PSAnbGknKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSBwYXJlbnROb2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhbkxpc3RET006IGZ1bmN0aW9uIChvd25lckRvY3VtZW50LCBlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9PSAnbGknKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbGlzdCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcblxuICAgICAgICAgICAgaWYgKGxpc3QucGFyZW50RWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAncCcpIHsgLy8geWVzIHdlIG5lZWQgdG8gY2xlYW4gdXBcbiAgICAgICAgICAgICAgICBVdGlsLnVud3JhcChsaXN0LnBhcmVudEVsZW1lbnQsIG93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBjdXJzb3IgYXQgdGhlIGVuZCBvZiB0aGUgdGV4dCBpbnNpZGUgdGhlIGxpc3RcbiAgICAgICAgICAgICAgICAvLyBmb3Igc29tZSB1bmtub3duIHJlYXNvbiwgdGhlIGN1cnNvciBpcyBtb3ZlZCB0byBlbmQgb2YgdGhlIFwidmlzdWFsXCIgbGluZVxuICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci5zZWxlY3Rpb24ubW92ZUN1cnNvcihvd25lckRvY3VtZW50LCBlbGVtZW50LmZpcnN0Q2hpbGQsIGVsZW1lbnQuZmlyc3RDaGlsZC50ZXh0Q29udGVudC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qIHNwbGl0RE9NVHJlZVxuICAgICAgICAgKlxuICAgICAgICAgKiBHaXZlbiBhIHJvb3QgZWxlbWVudCBzb21lIGRlc2NlbmRhbnQgZWxlbWVudCwgc3BsaXQgdGhlIHJvb3QgZWxlbWVudFxuICAgICAgICAgKiBpbnRvIGl0cyBvd24gZWxlbWVudCBjb250YWluaW5nIHRoZSBkZXNjZW5kYW50IGVsZW1lbnQgYW5kIGFsbCBlbGVtZW50c1xuICAgICAgICAgKiBvbiB0aGUgbGVmdCBvciByaWdodCBzaWRlIG9mIHRoZSBkZXNjZW5kYW50ICgncmlnaHQnIGlzIGRlZmF1bHQpXG4gICAgICAgICAqXG4gICAgICAgICAqIGV4YW1wbGU6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgPGRpdj5cbiAgICAgICAgICogICAgICAvICAgIHwgICBcXFxuICAgICAgICAgKiAgPHNwYW4+IDxzcGFuPiA8c3Bhbj5cbiAgICAgICAgICogICAvIFxcICAgIC8gXFwgICAgLyBcXFxuICAgICAgICAgKiAgMSAgIDIgIDMgICA0ICA1ICAgNlxuICAgICAgICAgKlxuICAgICAgICAgKiAgSWYgSSB3YW50ZWQgdG8gc3BsaXQgdGhpcyB0cmVlIGdpdmVuIHRoZSA8ZGl2PiBhcyB0aGUgcm9vdCBhbmQgXCI0XCIgYXMgdGhlIGxlYWZcbiAgICAgICAgICogIHRoZSByZXN1bHQgd291bGQgYmUgKHRoZSBwcmltZSAnIG1hcmtzIGluZGljYXRlcyBub2RlcyB0aGF0IGFyZSBjcmVhdGVkIGFzIGNsb25lcyk6XG4gICAgICAgICAqXG4gICAgICAgICAqICAgU1BMSVRUSU5HIE9GRiAnUklHSFQnIFRSRUUgICAgICAgU1BMSVRUSU5HIE9GRiAnTEVGVCcgVFJFRVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgPGRpdj4gICAgICAgICAgICA8ZGl2PicgICAgICAgICAgICAgIDxkaXY+JyAgICAgIDxkaXY+XG4gICAgICAgICAqICAgICAgLyBcXCAgICAgICAgICAgICAgLyBcXCAgICAgICAgICAgICAgICAgLyBcXCAgICAgICAgICB8XG4gICAgICAgICAqIDxzcGFuPiA8c3Bhbj4gICA8c3Bhbj4nIDxzcGFuPiAgICAgICA8c3Bhbj4gPHNwYW4+ICAgPHNwYW4+XG4gICAgICAgICAqICAgLyBcXCAgICB8ICAgICAgICB8ICAgICAgLyBcXCAgICAgICAgICAgL1xcICAgICAvXFwgICAgICAgL1xcXG4gICAgICAgICAqICAxICAgMiAgIDMgICAgICAgIDQgICAgIDUgICA2ICAgICAgICAgMSAgMiAgIDMgIDQgICAgIDUgIDZcbiAgICAgICAgICpcbiAgICAgICAgICogIFRoZSBhYm92ZSBleGFtcGxlIHJlcHJlc2VudHMgc3BsaXR0aW5nIG9mZiB0aGUgJ3JpZ2h0JyBvciAnbGVmdCcgcGFydCBvZiBhIHRyZWUsIHdoZXJlXG4gICAgICAgICAqICB0aGUgPGRpdj4nIHdvdWxkIGJlIHJldHVybmVkIGFzIGFuIGVsZW1lbnQgbm90IGFwcGVuZGVkIHRvIHRoZSBET00sIGFuZCB0aGUgPGRpdj5cbiAgICAgICAgICogIHdvdWxkIHJlbWFpbiBpbiBwbGFjZSB3aGVyZSBpdCB3YXNcbiAgICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgc3BsaXRPZmZET01UcmVlOiBmdW5jdGlvbiAocm9vdE5vZGUsIGxlYWZOb2RlLCBzcGxpdExlZnQpIHtcbiAgICAgICAgICAgIHZhciBzcGxpdE9uTm9kZSA9IGxlYWZOb2RlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWROb2RlID0gbnVsbCxcbiAgICAgICAgICAgICAgICBzcGxpdFJpZ2h0ID0gIXNwbGl0TGVmdDtcblxuICAgICAgICAgICAgLy8gbG9vcCB1bnRpbCB3ZSBoaXQgdGhlIHJvb3RcbiAgICAgICAgICAgIHdoaWxlIChzcGxpdE9uTm9kZSAhPT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyclBhcmVudCA9IHNwbGl0T25Ob2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgICAgIG5ld1BhcmVudCA9IGN1cnJQYXJlbnQuY2xvbmVOb2RlKGZhbHNlKSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZSA9IChzcGxpdFJpZ2h0ID8gc3BsaXRPbk5vZGUgOiBjdXJyUGFyZW50LmZpcnN0Q2hpbGQpLFxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRMYXN0O1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IHBhcmVudCBlbGVtZW50IHdoaWNoIGlzIGEgY2xvbmUgb2YgdGhlIGN1cnJlbnQgcGFyZW50XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGxpdFJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSdyZSBzcGxpdHRpbmcgcmlnaHQsIGFkZCBwcmV2aW91cyBjcmVhdGVkIGVsZW1lbnQgYmVmb3JlIHNpYmxpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdQYXJlbnQuYXBwZW5kQ2hpbGQoY3JlYXRlZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UncmUgc3BsaXR0aW5nIGxlZnQsIGFkZCBwcmV2aW91cyBjcmVhdGVkIGVsZW1lbnQgbGFzdFxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kTGFzdCA9IGNyZWF0ZWROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNyZWF0ZWROb2RlID0gbmV3UGFyZW50O1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpYmxpbmcgPSB0YXJnZXROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgJ3NwbGl0Tm9kZSdcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUgPT09IHNwbGl0T25Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldE5vZGUuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgdGhlIG5vZGUgd2UncmUgc3BsaXR0aW5nIG9uLCBpZiBpdCBoYXMgY2hpbGRyZW4sIHdlIG5lZWQgdG8gY2xvbmUgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmQgbm90IGp1c3QgbW92ZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSB0YXJnZXROb2RlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVzdWx0aW5nIHNwbGl0IG5vZGUgaGFzIGNvbnRlbnQsIGFkZCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUudGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkTm9kZS5hcHBlbmRDaGlsZCh0YXJnZXROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZSA9IChzcGxpdFJpZ2h0ID8gc2libGluZyA6IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGdlbmVyYWwgY2FzZSwganVzdCByZW1vdmUgdGhlIGVsZW1lbnQgYW5kIG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBpdCB0byB0aGUgc3BsaXQgdHJlZSBpZiBpdCBjb250YWlucyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXROb2RlLmhhc0NoaWxkTm9kZXMoKSB8fCB0YXJnZXROb2RlLnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZE5vZGUuYXBwZW5kQ2hpbGQodGFyZ2V0Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBzaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgaGFkIGFuIGVsZW1lbnQgd2Ugd2FudGVkIHRvIGFwcGVuZCBhdCB0aGUgZW5kLCBkbyB0aGF0IG5vd1xuICAgICAgICAgICAgICAgIGlmIChhcHBlbmRMYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWROb2RlLmFwcGVuZENoaWxkKGFwcGVuZExhc3QpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNwbGl0T25Ob2RlID0gY3VyclBhcmVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZWROb2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vdmVUZXh0UmFuZ2VJbnRvRWxlbWVudDogZnVuY3Rpb24gKHN0YXJ0Tm9kZSwgZW5kTm9kZSwgbmV3RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKCFzdGFydE5vZGUgfHwgIWVuZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByb290Tm9kZSA9IFV0aWwuZmluZENvbW1vblJvb3Qoc3RhcnROb2RlLCBlbmROb2RlKTtcbiAgICAgICAgICAgIGlmICghcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbmROb2RlID09PSBzdGFydE5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IHN0YXJ0Tm9kZS5wYXJlbnROb2RlLFxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nID0gc3RhcnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIHRlbXAucmVtb3ZlQ2hpbGQoc3RhcnROb2RlKTtcbiAgICAgICAgICAgICAgICBuZXdFbGVtZW50LmFwcGVuZENoaWxkKHN0YXJ0Tm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNpYmxpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcC5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgc2libGluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcC5hcHBlbmRDaGlsZChuZXdFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld0VsZW1lbnQuaGFzQ2hpbGROb2RlcygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjcmVhdGUgcm9vdENoaWxkcmVuIGFycmF5IHdoaWNoIGluY2x1ZGVzIGFsbCB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIC8vIHdlIGNhcmUgYWJvdXRcbiAgICAgICAgICAgIHZhciByb290Q2hpbGRyZW4gPSBbXSxcbiAgICAgICAgICAgICAgICBmaXJzdENoaWxkLFxuICAgICAgICAgICAgICAgIGxhc3RDaGlsZCxcbiAgICAgICAgICAgICAgICBuZXh0Tm9kZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm9vdE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG5leHROb2RlID0gcm9vdE5vZGUuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFV0aWwuaXNEZXNjZW5kYW50KG5leHROb2RlLCBzdGFydE5vZGUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdENoaWxkID0gbmV4dE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoVXRpbC5pc0Rlc2NlbmRhbnQobmV4dE5vZGUsIGVuZE5vZGUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Q2hpbGQgPSBuZXh0Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdENoaWxkcmVuLnB1c2gobmV4dE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYWZ0ZXJMYXN0ID0gbGFzdENoaWxkLm5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gcm9vdE5vZGUub3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAgICAgICAgIC8vIGJ1aWxkIHVwIGZyYWdtZW50IG9uIHN0YXJ0Tm9kZSBzaWRlIG9mIHRyZWVcbiAgICAgICAgICAgIGlmIChmaXJzdENoaWxkID09PSBzdGFydE5vZGUpIHtcbiAgICAgICAgICAgICAgICBmaXJzdENoaWxkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKFV0aWwuc3BsaXRPZmZET01UcmVlKGZpcnN0Q2hpbGQsIHN0YXJ0Tm9kZSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhZGQgYW55IGVsZW1lbnRzIGJldHdlZW4gZmlyc3RDaGlsZCAmIGxhc3RDaGlsZFxuICAgICAgICAgICAgcm9vdENoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYnVpbGQgdXAgZnJhZ21lbnQgb24gZW5kTm9kZSBzaWRlIG9mIHRoZSB0cmVlXG4gICAgICAgICAgICBpZiAobGFzdENoaWxkID09PSBlbmROb2RlKSB7XG4gICAgICAgICAgICAgICAgbGFzdENoaWxkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGFzdENoaWxkKTtcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChsYXN0Q2hpbGQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChVdGlsLnNwbGl0T2ZmRE9NVHJlZShsYXN0Q2hpbGQsIGVuZE5vZGUsIHRydWUpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIGZyYWdtZW50IGludG8gcGFzc2VkIGluIGVsZW1lbnRcbiAgICAgICAgICAgIG5ld0VsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuXG4gICAgICAgICAgICBpZiAobGFzdENoaWxkLnBhcmVudE5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgbGFzdCBjaGlsZCBpcyBpbiB0aGUgcm9vdCwgaW5zZXJ0IG5ld0VsZW1lbnQgaW4gZnJvbnQgb2YgaXRcbiAgICAgICAgICAgICAgICByb290Tm9kZS5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgbGFzdENoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWZ0ZXJMYXN0KSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgbGFzdCBjaGlsZCB3YXMgcmVtb3ZlZCwgYnV0IGl0IGhhZCBhIHNpYmxpbmcsIGluc2VydCBpbiBmcm9udCBvZiBpdFxuICAgICAgICAgICAgICAgIHJvb3ROb2RlLmluc2VydEJlZm9yZShuZXdFbGVtZW50LCBhZnRlckxhc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBsYXN0Q2hpbGQgd2FzIHJlbW92ZWQgYW5kIHdhcyB0aGUgbGFzdCBhY3R1YWwgZWxlbWVudCBqdXN0IGFwcGVuZFxuICAgICAgICAgICAgICAgIHJvb3ROb2RlLmFwcGVuZENoaWxkKG5ld0VsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3RWxlbWVudC5oYXNDaGlsZE5vZGVzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogYmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjE4MzA2OSAqL1xuICAgICAgICBkZXB0aE9mTm9kZTogZnVuY3Rpb24gKGluTm9kZSkge1xuICAgICAgICAgICAgdmFyIHRoZURlcHRoID0gMCxcbiAgICAgICAgICAgICAgICBub2RlID0gaW5Ob2RlO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgdGhlRGVwdGgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGVEZXB0aDtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kQ29tbW9uUm9vdDogZnVuY3Rpb24gKGluTm9kZTEsIGluTm9kZTIpIHtcbiAgICAgICAgICAgIHZhciBkZXB0aDEgPSBVdGlsLmRlcHRoT2ZOb2RlKGluTm9kZTEpLFxuICAgICAgICAgICAgICAgIGRlcHRoMiA9IFV0aWwuZGVwdGhPZk5vZGUoaW5Ob2RlMiksXG4gICAgICAgICAgICAgICAgbm9kZTEgPSBpbk5vZGUxLFxuICAgICAgICAgICAgICAgIG5vZGUyID0gaW5Ob2RlMjtcblxuICAgICAgICAgICAgd2hpbGUgKGRlcHRoMSAhPT0gZGVwdGgyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlcHRoMSA+IGRlcHRoMikge1xuICAgICAgICAgICAgICAgICAgICBub2RlMSA9IG5vZGUxLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGRlcHRoMSAtPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUyID0gbm9kZTIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgZGVwdGgyIC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAobm9kZTEgIT09IG5vZGUyKSB7XG4gICAgICAgICAgICAgICAgbm9kZTEgPSBub2RlMS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIG5vZGUyID0gbm9kZTIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5vZGUxO1xuICAgICAgICB9LFxuICAgICAgICAvKiBFTkQgLSBiYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82MTgzMDY5ICovXG5cbiAgICAgICAgaXNFbGVtZW50QXRCZWdpbm5pbmdPZkJsb2NrOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIHRleHRWYWwsXG4gICAgICAgICAgICAgICAgc2libGluZztcbiAgICAgICAgICAgIHdoaWxlICghVXRpbC5pc0Jsb2NrQ29udGFpbmVyKG5vZGUpICYmICFVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudChub2RlKSkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmcgPSBub2RlO1xuICAgICAgICAgICAgICAgIHdoaWxlIChzaWJsaW5nID0gc2libGluZy5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dFZhbCA9IHNpYmxpbmcubm9kZVR5cGUgPT09IDMgPyBzaWJsaW5nLm5vZGVWYWx1ZSA6IHNpYmxpbmcudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0VmFsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNNZWRpdW1FZGl0b3JFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUgJiYgISFlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1tZWRpdW0tZWRpdG9yLWVsZW1lbnQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDb250YWluZXJFZGl0b3JFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIFV0aWwudHJhdmVyc2VVcChlbGVtZW50LCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudChub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzQmxvY2tDb250YWluZXI6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlICE9PSAzICYmIFV0aWwuYmxvY2tDb250YWluZXJFbGVtZW50TmFtZXMuaW5kZXhPZihlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDbG9zZXN0QmxvY2tDb250YWluZXI6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gVXRpbC50cmF2ZXJzZVVwKG5vZGUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFV0aWwuaXNCbG9ja0NvbnRhaW5lcihub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFRvcEJsb2NrQ29udGFpbmVyOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHRvcEJsb2NrID0gZWxlbWVudDtcbiAgICAgICAgICAgIFV0aWwudHJhdmVyc2VVcChlbGVtZW50LCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoVXRpbC5pc0Jsb2NrQ29udGFpbmVyKGVsKSkge1xuICAgICAgICAgICAgICAgICAgICB0b3BCbG9jayA9IGVsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0b3BCbG9jaztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRGaXJzdFNlbGVjdGFibGVMZWFmTm9kZTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gc2V0IHRoZSBzZWxlY3Rpb24gdG8gYW4gZWxlbWVudCB0aGF0IGNhbid0IGhhdmUgY2hpbGRyZW4sIHRoaXMgbWVzc2VzIHVwIEdlY2tvLlxuICAgICAgICAgICAgZWxlbWVudCA9IFV0aWwudHJhdmVyc2VVcChlbGVtZW50LCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXRpbC5lbXB0eUVsZW1lbnROYW1lcy5pbmRleE9mKGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpID09PSAtMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gU2VsZWN0aW5nIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSB0YWJsZSBkb2Vzbid0IHdvcmsgaW4gUGhhbnRvbUpTLlxuICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RhYmxlJykge1xuICAgICAgICAgICAgICAgIHZhciBmaXJzdENlbGwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RoLCB0ZCcpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdENlbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IGZpcnN0Q2VsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRGaXJzdFRleHROb2RlOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dE5vZGUgPSBVdGlsLmdldEZpcnN0VGV4dE5vZGUoZWxlbWVudC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAodGV4dE5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRleHROb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVuc3VyZVVybEhhc1Byb3RvY29sOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoJzovLycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnaHR0cDovLycgKyB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdhcm46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuY29uc29sZSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB3aW5kb3cuY29uc29sZS53YXJuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2Fybi5hcHBseSh3aW5kb3cuY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXByZWNhdGVkOiBmdW5jdGlvbiAob2xkTmFtZSwgbmV3TmFtZSwgdmVyc2lvbikge1xuICAgICAgICAgICAgLy8gc2ltcGxlIGRlcHJlY2F0aW9uIHdhcm5pbmcgbWVjaGFuaXNtLlxuICAgICAgICAgICAgdmFyIG0gPSBvbGROYW1lICsgJyBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlICcgKyBuZXdOYW1lICsgJyBpbnN0ZWFkLic7XG4gICAgICAgICAgICBpZiAodmVyc2lvbikge1xuICAgICAgICAgICAgICAgIG0gKz0gJyBXaWxsIGJlIHJlbW92ZWQgaW4gJyArIHZlcnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBVdGlsLndhcm4obSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVwcmVjYXRlZE1ldGhvZDogZnVuY3Rpb24gKG9sZE5hbWUsIG5ld05hbWUsIGFyZ3MsIHZlcnNpb24pIHtcbiAgICAgICAgICAgIC8vIHJ1biB0aGUgcmVwbGFjZW1lbnQgYW5kIHdhcm4gd2hlbiBzb21lb25lIGNhbGxzIGEgZGVwcmVjYXRlZCBtZXRob2RcbiAgICAgICAgICAgIFV0aWwuZGVwcmVjYXRlZChvbGROYW1lLCBuZXdOYW1lLCB2ZXJzaW9uKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tuZXdOYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRoaXNbbmV3TmFtZV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYW51cEF0dHJzOiBmdW5jdGlvbiAoZWwsIGF0dHJzKSB7XG4gICAgICAgICAgICBhdHRycy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYW51cFRhZ3M6IGZ1bmN0aW9uIChlbCwgdGFncykge1xuICAgICAgICAgICAgdGFncy5mb3JFYWNoKGZ1bmN0aW9uICh0YWcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGFnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGdldCB0aGUgY2xvc2VzdCBwYXJlbnRcbiAgICAgICAgZ2V0Q2xvc2VzdFRhZzogZnVuY3Rpb24gKGVsLCB0YWcpIHtcbiAgICAgICAgICAgIHJldHVybiBVdGlsLnRyYXZlcnNlVXAoZWwsIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bndyYXA6IGZ1bmN0aW9uIChlbCwgZG9jKSB7XG4gICAgICAgICAgICB2YXIgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgICAgIG5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWwuY2hpbGROb2Rlcyk7XG5cbiAgICAgICAgICAgIC8vIGNhc3Qgbm9kZUxpc3QgdG8gYXJyYXkgc2luY2UgYXBwZW5kaW5nIGNoaWxkXG4gICAgICAgICAgICAvLyB0byBhIGRpZmZlcmVudCBub2RlIHdpbGwgYWx0ZXIgbGVuZ3RoIG9mIGVsLmNoaWxkTm9kZXNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChub2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGZyYWdtZW50LCBlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIE1lZGl1bUVkaXRvci51dGlsID0gVXRpbDtcbn0od2luZG93KSk7XG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEV4dGVuc2lvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgRXh0ZW5zaW9uLmV4dGVuZCA9IGZ1bmN0aW9uIChwcm90b1Byb3BzKSB7XG4gICAgICAgIC8vIG1hZ2ljIGV4dGVuZGVyIHRoaW5nZXIuIG1vc3RseSBib3Jyb3dlZCBmcm9tIGJhY2tib25lL2dvb2cuaW5oZXJpdHNcbiAgICAgICAgLy8gcGxhY2UgdGhpcyBmdW5jdGlvbiBvbiBzb21lIHRoaW5nIHlvdSB3YW50IGV4dGVuZC1hYmxlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBleGFtcGxlOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIGZ1bmN0aW9uIFRoaW5nKGFyZ3Mpe1xuICAgICAgICAvLyAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBhcmdzO1xuICAgICAgICAvLyAgICAgIH1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICBUaGluZy5wcm90b3R5cGUgPSB7IGZvbzogXCJiYXJcIiB9O1xuICAgICAgICAvLyAgICAgIFRoaW5nLmV4dGVuZCA9IGV4dGVuZGVyaWZ5O1xuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIHZhciBUaGluZ1R3byA9IFRoaW5nLmV4dGVuZCh7IGZvbzogXCJiYXpcIiB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICB2YXIgdGhpbmdPbmUgPSBuZXcgVGhpbmcoKTsgLy8gZm9vID09PSBcImJhclwiXG4gICAgICAgIC8vICAgICAgdmFyIHRoaW5nVHdvID0gbmV3IFRoaW5nVHdvKCk7IC8vIGZvbyA9PT0gXCJiYXpcIlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIHdoaWNoIHNlZW1zIGxpa2Ugc29tZSBzaW1wbHkgc2hhbGxvdyBjb3B5IG5vbnNlbnNlXG4gICAgICAgIC8vICAgICAgYXQgZmlyc3QsIGJ1dCBhIGxvdCBtb3JlIGlzIGdvaW5nIG9uIHRoZXJlLlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIHBhc3NpbmcgYSBgY29uc3RydWN0b3JgIHRvIHRoZSBleHRlbmQgcHJvcHNcbiAgICAgICAgLy8gICAgICB3aWxsIGNhdXNlIHRoZSBpbnN0YW5jZSB0byBpbnN0YW50aWF0ZSB0aHJvdWdoIHRoYXRcbiAgICAgICAgLy8gICAgICBpbnN0ZWFkIG9mIHRoZSBwYXJlbnQncyBjb25zdHJ1Y3Rvci5cblxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcyxcbiAgICAgICAgICAgIGNoaWxkO1xuXG4gICAgICAgIC8vIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIG5ldyBzdWJjbGFzcyBpcyBlaXRoZXIgZGVmaW5lZCBieSB5b3VcbiAgICAgICAgLy8gKHRoZSBcImNvbnN0cnVjdG9yXCIgcHJvcGVydHkgaW4geW91ciBgZXh0ZW5kYCBkZWZpbml0aW9uKSwgb3IgZGVmYXVsdGVkXG4gICAgICAgIC8vIGJ5IHVzIHRvIHNpbXBseSBjYWxsIHRoZSBwYXJlbnQncyBjb25zdHJ1Y3Rvci5cblxuICAgICAgICBpZiAocHJvdG9Qcm9wcyAmJiBwcm90b1Byb3BzLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpKSB7XG4gICAgICAgICAgICBjaGlsZCA9IHByb3RvUHJvcHMuY29uc3RydWN0b3I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaGlsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGFzIHN0YXRpY3MgKC5leHRlbmQgY29tZXMgb3Zlciwgc28geW91ciBzdWJjbGFzcyBjYW4gaGF2ZSBzdWJjbGFzc2VzIHRvbylcbiAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuZXh0ZW5kKGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgICAgIC8vIFNldCB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGluaGVyaXQgZnJvbSBgcGFyZW50YCwgd2l0aG91dCBjYWxsaW5nXG4gICAgICAgIC8vIGBwYXJlbnRgJ3MgY29uc3RydWN0b3IgZnVuY3Rpb24uXG4gICAgICAgIHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgICAgIH07XG4gICAgICAgIFN1cnJvZ2F0ZS5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgICAgICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgU3Vycm9nYXRlKCk7XG5cbiAgICAgICAgaWYgKHByb3RvUHJvcHMpIHtcbiAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogJHN1cGVyP1xuXG4gICAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9O1xuXG4gICAgRXh0ZW5zaW9uLnByb3RvdHlwZSA9IHtcbiAgICAgICAgLyogaW5pdDogW2Z1bmN0aW9uXVxuICAgICAgICAgKlxuICAgICAgICAgKiBDYWxsZWQgYnkgTWVkaXVtRWRpdG9yIGR1cmluZyBpbml0aWFsaXphdGlvbi5cbiAgICAgICAgICogVGhlIC5iYXNlIHByb3BlcnR5IHdpbGwgYWxyZWFkeSBoYXZlIGJlZW4gc2V0IHRvXG4gICAgICAgICAqIGN1cnJlbnQgaW5zdGFuY2Ugb2YgTWVkaXVtRWRpdG9yIHdoZW4gdGhpcyBpcyBjYWxsZWQuXG4gICAgICAgICAqIEFsbCBoZWxwZXIgbWV0aG9kcyB3aWxsIGV4aXN0IGFzIHdlbGxcbiAgICAgICAgICovXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHt9LFxuXG4gICAgICAgIC8qIGJhc2U6IFtNZWRpdW1FZGl0b3IgaW5zdGFuY2VdXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIG5vdCBvdmVycmlkZW4sIHRoaXMgd2lsbCBiZSBzZXQgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2VcbiAgICAgICAgICogb2YgTWVkaXVtRWRpdG9yLCBiZWZvcmUgdGhlIGluaXQgbWV0aG9kIGlzIGNhbGxlZFxuICAgICAgICAgKi9cbiAgICAgICAgYmFzZTogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIG5hbWU6IFtzdHJpbmddXG4gICAgICAgICAqXG4gICAgICAgICAqICduYW1lJyBvZiB0aGUgZXh0ZW5zaW9uLCB1c2VkIGZvciByZXRyaWV2aW5nIHRoZSBleHRlbnNpb24uXG4gICAgICAgICAqIElmIG5vdCBzZXQsIE1lZGl1bUVkaXRvciB3aWxsIHNldCB0aGlzIHRvIGJlIHRoZSBrZXlcbiAgICAgICAgICogdXNlZCB3aGVuIHBhc3NpbmcgdGhlIGV4dGVuc2lvbiBpbnRvIE1lZGl1bUVkaXRvciB2aWEgdGhlXG4gICAgICAgICAqICdleHRlbnNpb25zJyBvcHRpb25cbiAgICAgICAgICovXG4gICAgICAgIG5hbWU6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKiBjaGVja1N0YXRlOiBbZnVuY3Rpb24gKG5vZGUpXVxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiBpbXBsZW1lbnRlZCwgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBvbmUgb3IgbW9yZSB0aW1lc1xuICAgICAgICAgKiB0aGUgc3RhdGUgb2YgdGhlIGVkaXRvciAmIHRvb2xiYXIgYXJlIHVwZGF0ZWQuXG4gICAgICAgICAqIFdoZW4gdGhlIHN0YXRlIGlzIHVwZGF0ZWQsIHRoZSBlZGl0b3IgZG9lcyB0aGUgZm9sbG93aW5nOlxuICAgICAgICAgKlxuICAgICAgICAgKiAxKSBGaW5kIHRoZSBwYXJlbnQgbm9kZSBjb250YWluaW5nIHRoZSBjdXJyZW50IHNlbGVjdGlvblxuICAgICAgICAgKiAyKSBDYWxsIGNoZWNrU3RhdGUgb24gdGhlIGV4dGVuc2lvbiwgcGFzc2luZyB0aGUgbm9kZSBhcyBhbiBhcmd1bWVudFxuICAgICAgICAgKiAzKSBHZXQgdGhlIHBhcmVudCBub2RlIG9mIHRoZSBwcmV2aW91cyBub2RlXG4gICAgICAgICAqIDQpIFJlcGVhdCBzdGVwcyAjMiBhbmQgIzMgdW50aWwgd2UgbW92ZSBvdXRzaWRlIHRoZSBwYXJlbnQgY29udGVudGVkaXRhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBjaGVja1N0YXRlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogZGVzdHJveTogW2Z1bmN0aW9uICgpXVxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgcmVtb3ZlIGFueSBjcmVhdGVkIGh0bWwsIGN1c3RvbSBldmVudCBoYW5kbGVyc1xuICAgICAgICAgKiBvciBhbnkgb3RoZXIgY2xlYW51cCB0YXNrcyB0aGF0IHNob3VsZCBiZSBwZXJmb3JtZWQuXG4gICAgICAgICAqIElmIGltcGxlbWVudGVkLCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW4gTWVkaXVtRWRpdG9yJ3NcbiAgICAgICAgICogZGVzdHJveSBtZXRob2QgaGFzIGJlZW4gY2FsbGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgZGVzdHJveTogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIEFzIGFsdGVybmF0aXZlcyB0byBjaGVja1N0YXRlLCB0aGVzZSBmdW5jdGlvbnMgcHJvdmlkZSBhIG1vcmUgc3RydWN0dXJlZFxuICAgICAgICAgKiBwYXRoIHRvIHVwZGF0aW5nIHRoZSBzdGF0ZSBvZiBhbiBleHRlbnNpb24gKHVzdWFsbHkgYSBidXR0b24pIHdoZW5ldmVyXG4gICAgICAgICAqIHRoZSBzdGF0ZSBvZiB0aGUgZWRpdG9yICYgdG9vbGJhciBhcmUgdXBkYXRlZC5cbiAgICAgICAgICovXG5cbiAgICAgICAgLyogcXVlcnlDb21tYW5kU3RhdGU6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgaW1wbGVtZW50ZWQsIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgb25jZSBvbiBlYWNoIGV4dGVuc2lvblxuICAgICAgICAgKiB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgZWRpdG9yL3Rvb2xiYXIgaXMgYmVpbmcgdXBkYXRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgdGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgbm9uLW51bGwgdmFsdWUsIHRoZSBleHRlbnNpb24gd2lsbFxuICAgICAgICAgKiBiZSBpZ25vcmVkIGFzIHRoZSBjb2RlIGNsaW1icyB0aGUgZG9tIHRyZWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIHRoaXMgZnVuY3Rpb24gcmV0dXJucyB0cnVlLCBhbmQgdGhlIHNldEFjdGl2ZSgpIGZ1bmN0aW9uIGlzIGRlZmluZWRcbiAgICAgICAgICogc2V0QWN0aXZlKCkgd2lsbCBiZSBjYWxsZWRcbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5Q29tbWFuZFN0YXRlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogaXNBY3RpdmU6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgaW1wbGVtZW50ZWQsIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbiBNZWRpdW1FZGl0b3JcbiAgICAgICAgICogaGFzIGRldGVybWluZWQgdGhhdCB0aGlzIGV4dGVuc2lvbiBpcyAnYWN0aXZlJyBmb3IgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgICAgICAgKiBUaGlzIG1heSBiZSBjYWxsZWQgd2hlbiB0aGUgZWRpdG9yICYgdG9vbGJhciBhcmUgYmVpbmcgdXBkYXRlZCxcbiAgICAgICAgICogYnV0IG9ubHkgaWYgcXVlcnlDb21tYW5kU3RhdGUoKSBvciBpc0FscmVhZHlBcHBsaWVkKCkgZnVuY3Rpb25zXG4gICAgICAgICAqIGFyZSBpbXBsZW1lbnRlZCwgYW5kIHdoZW4gY2FsbGVkLCByZXR1cm4gdHJ1ZS5cbiAgICAgICAgICovXG4gICAgICAgIGlzQWN0aXZlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogaXNBbHJlYWR5QXBwbGllZDogW2Z1bmN0aW9uIChub2RlKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgaW1wbGVtZW50ZWQsIHRoaXMgZnVuY3Rpb24gaXMgc2ltaWxhciB0byBjaGVja1N0YXRlKCkgaW5cbiAgICAgICAgICogdGhhdCBpdCB3aWxsIGJlIGNhbGxlZCByZXBlYXRlZGx5IGFzIE1lZGl1bUVkaXRvciBtb3ZlcyB1cFxuICAgICAgICAgKiB0aGUgRE9NIHRvIHVwZGF0ZSB0aGUgZWRpdG9yICYgdG9vbGJhciBhZnRlciBhIHN0YXRlIGNoYW5nZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTk9URTogVGhpcyBmdW5jdGlvbiB3aWxsIE5PVCBiZSBjYWxsZWQgaWYgY2hlY2tTdGF0ZSgpIGhhc1xuICAgICAgICAgKiBiZWVuIGltcGxlbWVudGVkLiBUaGlzIGZ1bmN0aW9uIHdpbGwgTk9UIGJlIGNhbGxlZCBpZlxuICAgICAgICAgKiBxdWVyeUNvbW1hbmRTdGF0ZSgpIGlzIGltcGxlbWVudGVkIGFuZCByZXR1cm5zIGEgbm9uLW51bGxcbiAgICAgICAgICogdmFsdWUgd2hlbiBjYWxsZWRcbiAgICAgICAgICovXG4gICAgICAgIGlzQWxyZWFkeUFwcGxpZWQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKiBzZXRBY3RpdmU6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgaW1wbGVtZW50ZWQsIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gTWVkaXVtRWRpdG9yIGtub3dzXG4gICAgICAgICAqIHRoYXQgdGhpcyBleHRlbnNpb24gaXMgY3VycmVudGx5IGVuYWJsZWQuICBDdXJyZW50bHksIHRoaXNcbiAgICAgICAgICogZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gdXBkYXRpbmcgdGhlIGVkaXRvciAmIHRvb2xiYXIsIGFuZFxuICAgICAgICAgKiBvbmx5IGlmIHF1ZXJ5Q29tbWFuZFN0YXRlKCkgb3IgaXNBbHJlYWR5QXBwbGllZChub2RlKSByZXR1cm5cbiAgICAgICAgICogdHJ1ZSB3aGVuIGNhbGxlZFxuICAgICAgICAgKi9cbiAgICAgICAgc2V0QWN0aXZlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogc2V0SW5hY3RpdmU6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgaW1wbGVtZW50ZWQsIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gTWVkaXVtRWRpdG9yIGtub3dzXG4gICAgICAgICAqIHRoYXQgdGhpcyBleHRlbnNpb24gaXMgY3VycmVudGx5IGRpc2FibGVkLiAgQ3VyZW50bHksIHRoaXNcbiAgICAgICAgICogaXMgY2FsbGVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgZWFjaCBzdGF0ZSBjaGFuZ2UgZm9yXG4gICAgICAgICAqIHRoZSBlZGl0b3IgJiB0b29sYmFyLiBBZnRlciBjYWxsaW5nIHRoaXMsIE1lZGl1bUVkaXRvclxuICAgICAgICAgKiB3aWxsIGF0dGVtcHQgdG8gdXBkYXRlIHRoZSBleHRlbnNpb24sIGVpdGhlciB2aWEgY2hlY2tTdGF0ZSgpXG4gICAgICAgICAqIG9yIHRoZSBjb21iaW5hdGlvbiBvZiBxdWVyeUNvbW1hbmRTdGF0ZSgpLCBpc0FscmVhZHlBcHBsaWVkKG5vZGUpLFxuICAgICAgICAgKiBpc0FjdGl2ZSgpLCBhbmQgc2V0QWN0aXZlKClcbiAgICAgICAgICovXG4gICAgICAgIHNldEluYWN0aXZlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKiBIZWxwZXJzICoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgKiBUaGUgZm9sbG93aW5nIGFyZSBoZWxwZXJzIHRoYXQgYXJlIGVpdGhlciBzZXQgYnkgTWVkaXVtRWRpdG9yXG4gICAgICAgICAqIGR1cmluZyBpbml0aWFsaXphdGlvbiwgb3IgYXJlIGhlbHBlciBtZXRob2RzIHdoaWNoIGVpdGhlclxuICAgICAgICAgKiByb3V0ZSBjYWxscyB0byB0aGUgTWVkaXVtRWRpdG9yIGluc3RhbmNlIG9yIHByb3ZpZGUgY29tbW9uXG4gICAgICAgICAqIGZ1bmN0aW9uYWxpdHkgZm9yIGFsbCBleHRlbnNpb25zXG4gICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogd2luZG93OiBbV2luZG93XVxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiBub3Qgb3ZlcnJpZGVuLCB0aGlzIHdpbGwgYmUgc2V0IHRvIHRoZSB3aW5kb3cgb2JqZWN0XG4gICAgICAgICAqIHRvIGJlIHVzZWQgYnkgTWVkaXVtRWRpdG9yIGFuZCBpdHMgZXh0ZW5zaW9ucy4gIFRoaXMgaXNcbiAgICAgICAgICogcGFzc2VkIHZpYSB0aGUgJ2NvbnRlbnRXaW5kb3cnIG9wdGlvbiB0byBNZWRpdW1FZGl0b3JcbiAgICAgICAgICogYW5kIGlzIHRoZSBnbG9iYWwgJ3dpbmRvdycgb2JqZWN0IGJ5IGRlZmF1bHRcbiAgICAgICAgICovXG4gICAgICAgICd3aW5kb3cnOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogZG9jdW1lbnQ6IFtEb2N1bWVudF1cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgbm90IG92ZXJyaWRlbiwgdGhpcyB3aWxsIGJlIHNldCB0byB0aGUgZG9jdW1lbnQgb2JqZWN0XG4gICAgICAgICAqIHRvIGJlIHVzZWQgYnkgTWVkaXVtRWRpdG9yIGFuZCBpdHMgZXh0ZW5zaW9ucy4gVGhpcyBpc1xuICAgICAgICAgKiBwYXNzZWQgdmlhIHRoZSAnb3duZXJEb2N1bWVudCcgb3B0aW4gdG8gTWVkaXVtRWRpdG9yXG4gICAgICAgICAqIGFuZCBpcyB0aGUgZ2xvYmFsICdkb2N1bWVudCcgb2JqZWN0IGJ5IGRlZmF1bHRcbiAgICAgICAgICovXG4gICAgICAgICdkb2N1bWVudCc6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKiBnZXRFZGl0b3JFbGVtZW50czogW2Z1bmN0aW9uICgpXVxuICAgICAgICAgKlxuICAgICAgICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhbiBhcnJheSBjb250YWluaW5nXG4gICAgICAgICAqIGFsbCB0aGUgY29udGVudGVkaXRhYmxlIGVsZW1lbnRzIGZvciB0aGlzIGluc3RhbmNlXG4gICAgICAgICAqIG9mIE1lZGl1bUVkaXRvclxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0RWRpdG9yRWxlbWVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJhc2UuZWxlbWVudHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogZ2V0RWRpdG9ySWQ6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSB1bmlxdWUgaWRlbnRpZmllclxuICAgICAgICAgKiBmb3IgdGhpcyBpbnN0YW5jZSBvZiBNZWRpdW1FZGl0b3JcbiAgICAgICAgICovXG4gICAgICAgIGdldEVkaXRvcklkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iYXNlLmlkO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qIGdldEVkaXRvck9wdGlvbnM6IFtmdW5jdGlvbiAob3B0aW9uKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHZhbHVlIG9mIGFuIG9wdGlvblxuICAgICAgICAgKiB1c2VkIHRvIGluaXRpYWxpemUgdGhpcyBpbnN0YW5jZSBvZiBNZWRpdW1FZGl0b3JcbiAgICAgICAgICovXG4gICAgICAgIGdldEVkaXRvck9wdGlvbjogZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZS5vcHRpb25zW29wdGlvbl07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogTGlzdCBvZiBtZXRob2QgbmFtZXMgdG8gYWRkIHRvIHRoZSBwcm90b3R5cGUgb2YgRXh0ZW5zaW9uXG4gICAgICogRWFjaCBvZiB0aGVzZSBtZXRob2RzIHdpbGwgYmUgZGVmaW5lZCBhcyBoZWxwZXJzIHRoYXRcbiAgICAgKiBqdXN0IGNhbGwgZGlyZWN0bHkgaW50byB0aGUgTWVkaXVtRWRpdG9yIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogZXhhbXBsZSBmb3IgJ29uJyBtZXRob2Q6XG4gICAgICogRXh0ZW5zaW9uLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgKiAgICAgcmV0dXJuIHRoaXMuYmFzZS5vbi5hcHBseSh0aGlzLmJhc2UsIGFyZ3VtZW50cyk7XG4gICAgICogfVxuICAgICAqL1xuICAgIFtcbiAgICAgICAgLy8gZ2VuZXJhbCBoZWxwZXJzXG4gICAgICAgICdleGVjQWN0aW9uJyxcblxuICAgICAgICAvLyBldmVudCBoYW5kbGluZ1xuICAgICAgICAnb24nLFxuICAgICAgICAnb2ZmJyxcbiAgICAgICAgJ3N1YnNjcmliZScsXG4gICAgICAgICd0cmlnZ2VyJ1xuXG4gICAgXS5mb3JFYWNoKGZ1bmN0aW9uIChoZWxwZXIpIHtcbiAgICAgICAgRXh0ZW5zaW9uLnByb3RvdHlwZVtoZWxwZXJdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZVtoZWxwZXJdLmFwcGx5KHRoaXMuYmFzZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIE1lZGl1bUVkaXRvci5FeHRlbnNpb24gPSBFeHRlbnNpb247XG59KSgpO1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGZpbHRlck9ubHlQYXJlbnRFbGVtZW50cyhub2RlKSB7XG4gICAgICAgIGlmIChNZWRpdW1FZGl0b3IudXRpbC5pc0Jsb2NrQ29udGFpbmVyKG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX1NLSVA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgU2VsZWN0aW9uID0ge1xuICAgICAgICBmaW5kTWF0Y2hpbmdTZWxlY3Rpb25QYXJlbnQ6IGZ1bmN0aW9uICh0ZXN0RWxlbWVudEZ1bmN0aW9uLCBjb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGVudFdpbmRvdy5nZXRTZWxlY3Rpb24oKSxcbiAgICAgICAgICAgICAgICByYW5nZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50O1xuXG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICBjdXJyZW50ID0gcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG5cbiAgICAgICAgICAgIHJldHVybiBNZWRpdW1FZGl0b3IudXRpbC50cmF2ZXJzZVVwKGN1cnJlbnQsIHRlc3RFbGVtZW50RnVuY3Rpb24pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNlbGVjdGlvbkVsZW1lbnQ6IGZ1bmN0aW9uIChjb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maW5kTWF0Y2hpbmdTZWxlY3Rpb25QYXJlbnQoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1lZGl1bUVkaXRvci51dGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudChlbCk7XG4gICAgICAgICAgICB9LCBjb250ZW50V2luZG93KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE3Njc4ODQzL2NhbnQtcmVzdG9yZS1zZWxlY3Rpb24tYWZ0ZXItaHRtbC1tb2RpZnktZXZlbi1pZi1pdHMtdGhlLXNhbWUtaHRtbFxuICAgICAgICAvLyBUaW0gRG93blxuICAgICAgICBleHBvcnRTZWxlY3Rpb246IGZ1bmN0aW9uIChyb290LCBkb2MpIHtcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uU3RhdGUgPSBudWxsLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbiA9IGRvYy5nZXRTZWxlY3Rpb24oKTtcblxuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLFxuICAgICAgICAgICAgICAgICAgICBwcmVTZWxlY3Rpb25SYW5nZSA9IHJhbmdlLmNsb25lUmFuZ2UoKSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ7XG5cbiAgICAgICAgICAgICAgICBwcmVTZWxlY3Rpb25SYW5nZS5zZWxlY3ROb2RlQ29udGVudHMocm9vdCk7XG4gICAgICAgICAgICAgICAgcHJlU2VsZWN0aW9uUmFuZ2Uuc2V0RW5kKHJhbmdlLnN0YXJ0Q29udGFpbmVyLCByYW5nZS5zdGFydE9mZnNldCk7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBwcmVTZWxlY3Rpb25SYW5nZS50b1N0cmluZygpLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXRlID0ge1xuICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGVuZDogc3RhcnQgKyByYW5nZS50b1N0cmluZygpLmxlbmd0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gSWYgc3RhcnQgPSAwIHRoZXJlIG1heSBzdGlsbCBiZSBhbiBlbXB0eSBwYXJhZ3JhcGggYmVmb3JlIGl0LCBidXQgd2UgZG9uJ3QgY2FyZS5cbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVtcHR5QmxvY2tzSW5kZXggPSB0aGlzLmdldEluZGV4UmVsYXRpdmVUb0FkamFjZW50RW1wdHlCbG9ja3MoZG9jLCByb290LCByYW5nZS5zdGFydENvbnRhaW5lciwgcmFuZ2Uuc3RhcnRPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1wdHlCbG9ja3NJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXRlLmVtcHR5QmxvY2tzSW5kZXggPSBlbXB0eUJsb2Nrc0luZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0aW9uU3RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNzY3ODg0My9jYW50LXJlc3RvcmUtc2VsZWN0aW9uLWFmdGVyLWh0bWwtbW9kaWZ5LWV2ZW4taWYtaXRzLXRoZS1zYW1lLWh0bWxcbiAgICAgICAgLy8gVGltIERvd25cbiAgICAgICAgLy9cbiAgICAgICAgLy8ge29iamVjdH0gc2VsZWN0aW9uU3RhdGUgLSB0aGUgc2VsZWN0aW9uIHRvIGltcG9ydFxuICAgICAgICAvLyB7RE9NRWxlbWVudH0gcm9vdCAtIHRoZSByb290IGVsZW1lbnQgdGhlIHNlbGVjdGlvbiBpcyBiZWluZyByZXN0b3JlZCBpbnNpZGUgb2ZcbiAgICAgICAgLy8ge0RvY3VtZW50fSBkb2MgLSB0aGUgZG9jdW1lbnQgdG8gdXNlIGZvciBtYW5hZ2luZyBzZWxlY3Rpb25cbiAgICAgICAgLy8ge2Jvb2xlYW59IFtmYXZvckxhdGVyU2VsZWN0aW9uQW5jaG9yXSAtIGRlZmF1bHRzIHRvIGZhbHNlLiBJZiB0cnVlLCBpbXBvcnQgdGhlIGN1cnNvciBpbW1lZGlhdGVseVxuICAgICAgICAvLyAgICAgIHN1YnNlcXVlbnQgdG8gYW4gYW5jaG9yIHRhZyBpZiBpdCB3b3VsZCBvdGhlcndpc2UgYmUgcGxhY2VkIHJpZ2h0IGF0IHRoZSB0cmFpbGluZyBlZGdlIGluc2lkZSB0aGVcbiAgICAgICAgLy8gICAgICBhbmNob3IuIFRoaXMgY3Vyc29yIHBvc2l0aW9uaW5nLCBldmVuIHRob3VnaCB2aXN1YWxseSBlcXVpdmFsZW50IHRvIHRoZSB1c2VyLCBjYW4gYWZmZWN0IGJlaGF2aW9yXG4gICAgICAgIC8vICAgICAgaW4gTVMgSUUuXG4gICAgICAgIGltcG9ydFNlbGVjdGlvbjogZnVuY3Rpb24gKHNlbGVjdGlvblN0YXRlLCByb290LCBkb2MsIGZhdm9yTGF0ZXJTZWxlY3Rpb25BbmNob3IpIHtcbiAgICAgICAgICAgIGlmICghc2VsZWN0aW9uU3RhdGUgfHwgIXJvb3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQocm9vdCwgMCk7XG4gICAgICAgICAgICByYW5nZS5jb2xsYXBzZSh0cnVlKTtcblxuICAgICAgICAgICAgdmFyIG5vZGUgPSByb290LFxuICAgICAgICAgICAgICAgIG5vZGVTdGFjayA9IFtdLFxuICAgICAgICAgICAgICAgIGNoYXJJbmRleCA9IDAsXG4gICAgICAgICAgICAgICAgZm91bmRTdGFydCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN0b3AgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBuZXh0Q2hhckluZGV4O1xuXG4gICAgICAgICAgICB3aGlsZSAoIXN0b3AgJiYgbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDaGFySW5kZXggPSBjaGFySW5kZXggKyBub2RlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFN0YXJ0ICYmIHNlbGVjdGlvblN0YXRlLnN0YXJ0ID49IGNoYXJJbmRleCAmJiBzZWxlY3Rpb25TdGF0ZS5zdGFydCA8PSBuZXh0Q2hhckluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zZXRTdGFydChub2RlLCBzZWxlY3Rpb25TdGF0ZS5zdGFydCAtIGNoYXJJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZFN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRTdGFydCAmJiBzZWxlY3Rpb25TdGF0ZS5lbmQgPj0gY2hhckluZGV4ICYmIHNlbGVjdGlvblN0YXRlLmVuZCA8PSBuZXh0Q2hhckluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zZXRFbmQobm9kZSwgc2VsZWN0aW9uU3RhdGUuZW5kIC0gY2hhckluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNoYXJJbmRleCA9IG5leHRDaGFySW5kZXg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBub2RlLmNoaWxkTm9kZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVN0YWNrLnB1c2gobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5vZGVTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0aW9uU3RhdGUuZW1wdHlCbG9ja3NJbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByYW5nZSA9IHRoaXMuaW1wb3J0U2VsZWN0aW9uTW92ZUN1cnNvclBhc3RCbG9ja3MoZG9jLCByb290LCBzZWxlY3Rpb25TdGF0ZS5lbXB0eUJsb2Nrc0luZGV4LCByYW5nZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBzZWxlY3Rpb24gaXMgcmlnaHQgYXQgdGhlIGVuZGluZyBlZGdlIG9mIGEgbGluaywgcHV0IGl0IG91dHNpZGUgdGhlIGFuY2hvciB0YWcgaW5zdGVhZCBvZiBpbnNpZGUuXG4gICAgICAgICAgICBpZiAoZmF2b3JMYXRlclNlbGVjdGlvbkFuY2hvcikge1xuICAgICAgICAgICAgICAgIHJhbmdlID0gdGhpcy5pbXBvcnRTZWxlY3Rpb25Nb3ZlQ3Vyc29yUGFzdEFuY2hvcihzZWxlY3Rpb25TdGF0ZSwgcmFuZ2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2VsID0gZG9jLmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBVdGlsaXR5IG1ldGhvZCBjYWxsZWQgZnJvbSBpbXBvcnRTZWxlY3Rpb24gb25seVxuICAgICAgICBpbXBvcnRTZWxlY3Rpb25Nb3ZlQ3Vyc29yUGFzdEFuY2hvcjogZnVuY3Rpb24gKHNlbGVjdGlvblN0YXRlLCByYW5nZSkge1xuICAgICAgICAgICAgdmFyIG5vZGVJbnNpZGVBbmNob3JUYWdGdW5jdGlvbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25TdGF0ZS5zdGFydCA9PT0gc2VsZWN0aW9uU3RhdGUuZW5kICYmXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVUeXBlID09PSAzICYmXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlLnN0YXJ0T2Zmc2V0ID09PSByYW5nZS5zdGFydENvbnRhaW5lci5ub2RlVmFsdWUubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLnRyYXZlcnNlVXAocmFuZ2Uuc3RhcnRDb250YWluZXIsIG5vZGVJbnNpZGVBbmNob3JUYWdGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJldk5vZGUgPSByYW5nZS5zdGFydENvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUgPSByYW5nZS5zdGFydENvbnRhaW5lci5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAhPT0gbnVsbCAmJiBjdXJyZW50Tm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9PSAnYScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlLmNoaWxkTm9kZXNbY3VycmVudE5vZGUuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSAhPT0gcHJldk5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZOb2RlID0gY3VycmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlICE9PSBudWxsICYmIGN1cnJlbnROb2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGVJbmRleCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBjdXJyZW50Tm9kZUluZGV4ID09PSBudWxsICYmIGkgPCBjdXJyZW50Tm9kZS5wYXJlbnROb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZS5wYXJlbnROb2RlLmNoaWxkTm9kZXNbaV0gPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGVJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQoY3VycmVudE5vZGUucGFyZW50Tm9kZSwgY3VycmVudE5vZGVJbmRleCArIDEpO1xuICAgICAgICAgICAgICAgICAgICByYW5nZS5jb2xsYXBzZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gVXNlcyB0aGUgZW1wdHlCbG9ja3NJbmRleCBjYWxjdWxhdGVkIGJ5IGdldEluZGV4UmVsYXRpdmVUb0FkamFjZW50RW1wdHlCbG9ja3NcbiAgICAgICAgLy8gdG8gbW92ZSB0aGUgY3Vyc29yIGJhY2sgdG8gdGhlIHN0YXJ0IG9mIHRoZSBjb3JyZWN0IHBhcmFncmFwaFxuICAgICAgICBpbXBvcnRTZWxlY3Rpb25Nb3ZlQ3Vyc29yUGFzdEJsb2NrczogZnVuY3Rpb24gKGRvYywgcm9vdCwgaW5kZXgsIHJhbmdlKSB7XG4gICAgICAgICAgICB2YXIgdHJlZVdhbGtlciA9IGRvYy5jcmVhdGVUcmVlV2Fsa2VyKHJvb3QsIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5ULCBmaWx0ZXJPbmx5UGFyZW50RWxlbWVudHMsIGZhbHNlKSxcbiAgICAgICAgICAgICAgICBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyLFxuICAgICAgICAgICAgICAgIHN0YXJ0QmxvY2ssXG4gICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZSxcbiAgICAgICAgICAgICAgICBjdXJySW5kZXggPSAwO1xuICAgICAgICAgICAgaW5kZXggPSBpbmRleCB8fCAxOyAvLyBJZiBpbmRleCBpcyAwLCB3ZSBzdGlsbCB3YW50IHRvIG1vdmUgdG8gdGhlIG5leHQgYmxvY2tcblxuICAgICAgICAgICAgLy8gQ2hyb21lIGNvdW50cyBuZXdsaW5lcyBhbmQgc3BhY2VzIHRoYXQgc2VwYXJhdGUgYmxvY2sgZWxlbWVudHMgYXMgYWN0dWFsIGVsZW1lbnRzLlxuICAgICAgICAgICAgLy8gSWYgdGhlIHNlbGVjdGlvbiBpcyBpbnNpZGUgb25lIG9mIHRoZXNlIHRleHQgbm9kZXMsIGFuZCBpdCBoYXMgYSBwcmV2aW91cyBzaWJsaW5nXG4gICAgICAgICAgICAvLyB3aGljaCBpcyBhIGJsb2NrIGVsZW1lbnQsIHdlIHdhbnQgdGhlIHRyZWV3YWxrZXIgdG8gc3RhcnQgYXQgdGhlIHByZXZpb3VzIHNpYmxpbmdcbiAgICAgICAgICAgIC8vIGFuZCBOT1QgYXQgdGhlIHBhcmVudCBvZiB0aGUgdGV4dG5vZGVcbiAgICAgICAgICAgIGlmIChzdGFydENvbnRhaW5lci5ub2RlVHlwZSA9PT0gMyAmJiBNZWRpdW1FZGl0b3IudXRpbC5pc0Jsb2NrQ29udGFpbmVyKHN0YXJ0Q29udGFpbmVyLnByZXZpb3VzU2libGluZykpIHtcbiAgICAgICAgICAgICAgICBzdGFydEJsb2NrID0gc3RhcnRDb250YWluZXIucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGFydEJsb2NrID0gTWVkaXVtRWRpdG9yLnV0aWwuZ2V0Q2xvc2VzdEJsb2NrQ29udGFpbmVyKHN0YXJ0Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2tpcCBvdmVyIGVtcHR5IGJsb2NrcyB1bnRpbCB3ZSBoaXQgdGhlIGJsb2NrIHdlIHdhbnQgdGhlIHNlbGVjdGlvbiB0byBiZSBpblxuICAgICAgICAgICAgd2hpbGUgKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIGJsb2NrcyB1bnRpbCB3ZSBoaXQgdGhlIHN0YXJ0aW5nIGJsb2NrIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0QmxvY2sgPT09IHRyZWVXYWxrZXIuY3VycmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZSA9IHRyZWVXYWxrZXIuY3VycmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBoaXQgdGhlIHRhcmdldCBpbmRleCwgYmFpbFxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyckluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZmluZCBhIG5vbi1lbXB0eSBibG9jaywgaWdub3JlIHRoZSBlbXB0eUJsb2Nrc0luZGV4IGFuZCBqdXN0IHB1dCBzZWxlY3Rpb24gaGVyZVxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Tm9kZS50ZXh0Q29udGVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2UncmUgc2VsZWN0aW5nIGEgaGlnaC1sZXZlbCBibG9jayBub2RlLCBzbyBtYWtlIHN1cmUgdGhlIGN1cnNvciBnZXRzIG1vdmVkIGludG8gdGhlIGRlZXBlc3RcbiAgICAgICAgICAgIC8vIGVsZW1lbnQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYmxvY2tcbiAgICAgICAgICAgIHJhbmdlLnNldFN0YXJ0KE1lZGl1bUVkaXRvci51dGlsLmdldEZpcnN0U2VsZWN0YWJsZUxlYWZOb2RlKHRhcmdldE5vZGUpLCAwKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJhbmdlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFJldHVybnMgLTEgdW5sZXNzIHRoZSBjdXJzb3IgaXMgYXQgdGhlIGJlZ2lubmluZyBvZiBhIHBhcmFncmFwaC9ibG9ja1xuICAgICAgICAvLyBJZiB0aGUgcGFyYWdyYXBoL2Jsb2NrIGlzIHByZWNlZWRlZCBieSBlbXB0eSBwYXJhZ3JhcGhzL2Jsb2NrICh3aXRoIG5vIHRleHQpXG4gICAgICAgIC8vIGl0IHdpbGwgcmV0dXJuIHRoZSBudW1iZXIgb2YgZW1wdHkgcGFyYWdyYXBocyBiZWZvcmUgdGhlIGN1cnNvci5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiAwLCB3aGljaCBpbmRpY2F0ZXMgdGhlIGN1cnNvciBpcyBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgIC8vIG9mIGEgcGFyYWdyYXBoL2Jsb2NrLCBhbmQgbm90IGF0IHRoZSBlbmQgb2YgdGhlIHBhcmFncmFwaC9ibG9jayBiZWZvcmUgaXRcbiAgICAgICAgZ2V0SW5kZXhSZWxhdGl2ZVRvQWRqYWNlbnRFbXB0eUJsb2NrczogZnVuY3Rpb24gKGRvYywgcm9vdCwgY3Vyc29yQ29udGFpbmVyLCBjdXJzb3JPZmZzZXQpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIHRleHQgaW4gZnJvbnQgb2YgdGhlIGN1cnNvciwgdGhhdCBtZWFucyB0aGVyZSBpc24ndCBvbmx5IGVtcHR5IGJsb2NrcyBiZWZvcmUgaXRcbiAgICAgICAgICAgIGlmIChjdXJzb3JDb250YWluZXIudGV4dENvbnRlbnQubGVuZ3RoID4gMCAmJiBjdXJzb3JPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgYmxvY2sgdGhhdCBjb250YWlucyB0aGUgY3Vyc29yIGhhcyBhbnkgb3RoZXIgdGV4dCBpbiBmcm9udCBvZiB0aGUgY3Vyc29yXG4gICAgICAgICAgICB2YXIgbm9kZSA9IGN1cnNvckNvbnRhaW5lcjtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGN1cnNvckNvbnRhaW5lci5jaGlsZE5vZGVzW2N1cnNvck9mZnNldF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiAhTWVkaXVtRWRpdG9yLnV0aWwuaXNFbGVtZW50QXRCZWdpbm5pbmdPZkJsb2NrKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXYWxrIG92ZXIgYmxvY2sgZWxlbWVudHMsIGNvdW50aW5nIG51bWJlciBvZiBlbXB0eSBibG9ja3MgYmV0d2VlbiBsYXN0IHBpZWNlIG9mIHRleHRcbiAgICAgICAgICAgIC8vIGFuZCB0aGUgYmxvY2sgdGhlIGN1cnNvciBpcyBpblxuICAgICAgICAgICAgdmFyIGNsb3Nlc3RCbG9jayA9IE1lZGl1bUVkaXRvci51dGlsLmdldENsb3Nlc3RCbG9ja0NvbnRhaW5lcihjdXJzb3JDb250YWluZXIpLFxuICAgICAgICAgICAgICAgIHRyZWVXYWxrZXIgPSBkb2MuY3JlYXRlVHJlZVdhbGtlcihyb290LCBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCwgZmlsdGVyT25seVBhcmVudEVsZW1lbnRzLCBmYWxzZSksXG4gICAgICAgICAgICAgICAgZW1wdHlCbG9ja3NDb3VudCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrSXNFbXB0eSA9IHRyZWVXYWxrZXIuY3VycmVudE5vZGUudGV4dENvbnRlbnQgPT09ICcnO1xuICAgICAgICAgICAgICAgIGlmIChibG9ja0lzRW1wdHkgfHwgZW1wdHlCbG9ja3NDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZW1wdHlCbG9ja3NDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHJlZVdhbGtlci5jdXJyZW50Tm9kZSA9PT0gY2xvc2VzdEJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbXB0eUJsb2Nrc0NvdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWJsb2NrSXNFbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICBlbXB0eUJsb2Nrc0NvdW50ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBlbXB0eUJsb2Nrc0NvdW50O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNlbGVjdGlvbkluQ29udGVudEVkaXRhYmxlRmFsc2U6IGZ1bmN0aW9uIChjb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAvLyBkZXRlcm1pbmUgaWYgdGhlIGN1cnJlbnQgc2VsZWN0aW9uIGlzIGV4Y2x1c2l2ZWx5IGluc2lkZVxuICAgICAgICAgICAgLy8gYSBjb250ZW50ZWRpdGFibGU9XCJmYWxzZVwiLCB0aG91Z2ggdHJlYXQgdGhlIGNhc2Ugb2YgYW5cbiAgICAgICAgICAgIC8vIGV4cGxpY2l0IGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIiBpbnNpZGUgYSBcImZhbHNlXCIgYXMgZmFsc2UuXG4gICAgICAgICAgICB2YXIgc2F3dHJ1ZSxcbiAgICAgICAgICAgICAgICBzYXdmYWxzZSA9IHRoaXMuZmluZE1hdGNoaW5nU2VsZWN0aW9uUGFyZW50KGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2UgPSBlbCAmJiBlbC5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2UgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2F3dHJ1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLm5vZGVOYW1lICE9PSAnI3RleHQnICYmIGNlID09PSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIH0sIGNvbnRlbnRXaW5kb3cpO1xuXG4gICAgICAgICAgICByZXR1cm4gIXNhd3RydWUgJiYgc2F3ZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80MTc2OTIzL2h0bWwtb2Ytc2VsZWN0ZWQtdGV4dFxuICAgICAgICAvLyBieSBUaW0gRG93blxuICAgICAgICBnZXRTZWxlY3Rpb25IdG1sOiBmdW5jdGlvbiBnZXRTZWxlY3Rpb25IdG1sKGRvYykge1xuICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgaHRtbCA9ICcnLFxuICAgICAgICAgICAgICAgIHNlbCA9IGRvYy5nZXRTZWxlY3Rpb24oKSxcbiAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgY29udGFpbmVyO1xuICAgICAgICAgICAgaWYgKHNlbC5yYW5nZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHNlbC5yYW5nZUNvdW50OyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNlbC5nZXRSYW5nZUF0KGkpLmNsb25lQ29udGVudHMoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwgPSBjb250YWluZXIuaW5uZXJIVE1MO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqICBGaW5kIHRoZSBjYXJldCBwb3NpdGlvbiB3aXRoaW4gYW4gZWxlbWVudCBpcnJlc3BlY3RpdmUgb2YgYW55IGlubGluZSB0YWdzIGl0IG1heSBjb250YWluLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgQHBhcmFtIHtET01FbGVtZW50fSBBbiBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIGN1cnNvciB0byBmaW5kIG9mZnNldHMgcmVsYXRpdmUgdG8uXG4gICAgICAgICAqICBAcGFyYW0ge1JhbmdlfSBBIFJhbmdlIHJlcHJlc2VudGluZyBjdXJzb3IgcG9zaXRpb24uIFdpbGwgd2luZG93LmdldFNlbGVjdGlvbiBpZiBub25lIGlzIHBhc3NlZC5cbiAgICAgICAgICogIEByZXR1cm4ge09iamVjdH0gJ2xlZnQnIGFuZCAncmlnaHQnIGF0dHJpYnV0ZXMgY29udGFpbiBvZmZzZXRzIGZyb20gYmVnaW5pbmcgYW5kIGVuZCBvZiBFbGVtZW50XG4gICAgICAgICAqL1xuICAgICAgICBnZXRDYXJldE9mZnNldHM6IGZ1bmN0aW9uIGdldENhcmV0T2Zmc2V0cyhlbGVtZW50LCByYW5nZSkge1xuICAgICAgICAgICAgdmFyIHByZUNhcmV0UmFuZ2UsIHBvc3RDYXJldFJhbmdlO1xuXG4gICAgICAgICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgICAgICAgICAgcmFuZ2UgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZ2V0UmFuZ2VBdCgwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJlQ2FyZXRSYW5nZSA9IHJhbmdlLmNsb25lUmFuZ2UoKTtcbiAgICAgICAgICAgIHBvc3RDYXJldFJhbmdlID0gcmFuZ2UuY2xvbmVSYW5nZSgpO1xuXG4gICAgICAgICAgICBwcmVDYXJldFJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhlbGVtZW50KTtcbiAgICAgICAgICAgIHByZUNhcmV0UmFuZ2Uuc2V0RW5kKHJhbmdlLmVuZENvbnRhaW5lciwgcmFuZ2UuZW5kT2Zmc2V0KTtcblxuICAgICAgICAgICAgcG9zdENhcmV0UmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGVsZW1lbnQpO1xuICAgICAgICAgICAgcG9zdENhcmV0UmFuZ2Uuc2V0U3RhcnQocmFuZ2UuZW5kQ29udGFpbmVyLCByYW5nZS5lbmRPZmZzZXQpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGxlZnQ6IHByZUNhcmV0UmFuZ2UudG9TdHJpbmcoKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBvc3RDYXJldFJhbmdlLnRvU3RyaW5nKCkubGVuZ3RoXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTU4Njc1NDIvcmFuZ2Utb2JqZWN0LWdldC1zZWxlY3Rpb24tcGFyZW50LW5vZGUtY2hyb21lLXZzLWZpcmVmb3hcbiAgICAgICAgcmFuZ2VTZWxlY3RzU2luZ2xlTm9kZTogZnVuY3Rpb24gKHJhbmdlKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnROb2RlID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlID09PSByYW5nZS5lbmRDb250YWluZXIgJiZcbiAgICAgICAgICAgICAgICBzdGFydE5vZGUuaGFzQ2hpbGROb2RlcygpICYmXG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kT2Zmc2V0ID09PSByYW5nZS5zdGFydE9mZnNldCArIDE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U2VsZWN0ZWRQYXJlbnRFbGVtZW50OiBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgICAgICAgICAgIGlmICghcmFuZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2VsZWN0aW9uIGVuY29tcGFzc2VzIGEgc2luZ2xlIGVsZW1lbnRcbiAgICAgICAgICAgIGlmICh0aGlzLnJhbmdlU2VsZWN0c1NpbmdsZU5vZGUocmFuZ2UpICYmIHJhbmdlLnN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXNbcmFuZ2Uuc3RhcnRPZmZzZXRdLm5vZGVUeXBlICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhbmdlLnN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXNbcmFuZ2Uuc3RhcnRPZmZzZXRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWxlY3Rpb24gcmFuZ2Ugc3RhcnRzIGluc2lkZSBhIHRleHQgbm9kZSwgc28gZ2V0IGl0cyBwYXJlbnRcbiAgICAgICAgICAgIGlmIChyYW5nZS5zdGFydENvbnRhaW5lci5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiByYW5nZS5zdGFydENvbnRhaW5lci5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZWxlY3Rpb24gc3RhcnRzIGluc2lkZSBhbiBlbGVtZW50XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U2VsZWN0ZWRFbGVtZW50czogZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGRvYy5nZXRTZWxlY3Rpb24oKSxcbiAgICAgICAgICAgICAgICByYW5nZSxcbiAgICAgICAgICAgICAgICB0b1JldCxcbiAgICAgICAgICAgICAgICBjdXJyTm9kZTtcblxuICAgICAgICAgICAgaWYgKCFzZWxlY3Rpb24ucmFuZ2VDb3VudCB8fCBzZWxlY3Rpb24uaXNDb2xsYXBzZWQgfHwgIXNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuXG4gICAgICAgICAgICBpZiAocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICB0b1JldCA9IFtdO1xuICAgICAgICAgICAgICAgIGN1cnJOb2RlID0gcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1cnJOb2RlLnBhcmVudE5vZGUgJiYgY3Vyck5vZGUucGFyZW50Tm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0b1JldC5wdXNoKGN1cnJOb2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvUmV0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gW10uZmlsdGVyLmNhbGwocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSwgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygc2VsZWN0aW9uLmNvbnRhaW5zTm9kZSA9PT0gJ2Z1bmN0aW9uJykgPyBzZWxlY3Rpb24uY29udGFpbnNOb2RlKGVsLCB0cnVlKSA6IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZWxlY3ROb2RlOiBmdW5jdGlvbiAobm9kZSwgZG9jKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2MuY3JlYXRlUmFuZ2UoKSxcbiAgICAgICAgICAgICAgICBzZWwgPSBkb2MuZ2V0U2VsZWN0aW9uKCk7XG5cbiAgICAgICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICAgICAgICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZG9jLCBzdGFydE5vZGUsIHN0YXJ0T2Zmc2V0LCBlbmROb2RlLCBlbmRPZmZzZXQpIHtcbiAgICAgICAgICAgIGRvYy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQoc3RhcnROb2RlLCBzdGFydE9mZnNldCk7XG4gICAgICAgICAgICBpZiAoZW5kTm9kZSkge1xuICAgICAgICAgICAgICAgIHJhbmdlLnNldEVuZChlbmROb2RlLCBlbmRPZmZzZXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByYW5nZS5jb2xsYXBzZSh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvYy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vdmUgY3Vyc29yIHRvIHRoZSBnaXZlbiBub2RlIHdpdGggdGhlIGdpdmVuIG9mZnNldC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtICB7RG9tRG9jdW1lbnR9IGRvYyAgICAgQ3VycmVudCBkb2N1bWVudFxuICAgICAgICAgKiBAcGFyYW0gIHtEb21FbGVtZW50fSAgbm9kZSAgICBFbGVtZW50IHdoZXJlIHRvIGp1bXBcbiAgICAgICAgICogQHBhcmFtICB7aW50ZWdlcn0gICAgIG9mZnNldCAgV2hlcmUgaW4gdGhlIGVsZW1lbnQgc2hvdWxkIHdlIGp1bXAsIDAgYnkgZGVmYXVsdFxuICAgICAgICAgKi9cbiAgICAgICAgbW92ZUN1cnNvcjogZnVuY3Rpb24gKGRvYywgbm9kZSwgb2Zmc2V0KSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdChkb2MsIG5vZGUsIG9mZnNldCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U2VsZWN0aW9uUmFuZ2U6IGZ1bmN0aW9uIChvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uID0gb3duZXJEb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb24ucmFuZ2VDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTE5NzQwMS9ob3ctY2FuLWktZ2V0LXRoZS1lbGVtZW50LXRoZS1jYXJldC1pcy1pbi13aXRoLWphdmFzY3JpcHQtd2hlbi11c2luZy1jb250ZW50ZWRpXG4gICAgICAgIC8vIGJ5IFlvdVxuICAgICAgICBnZXRTZWxlY3Rpb25TdGFydDogZnVuY3Rpb24gKG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gb3duZXJEb2N1bWVudC5nZXRTZWxlY3Rpb24oKS5hbmNob3JOb2RlLFxuICAgICAgICAgICAgICAgIHN0YXJ0Tm9kZSA9IChub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IDMgPyBub2RlLnBhcmVudE5vZGUgOiBub2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uID0gU2VsZWN0aW9uO1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRXZlbnRzID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuYmFzZSA9IGluc3RhbmNlO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLmJhc2Uub3B0aW9ucztcbiAgICAgICAgdGhpcy5ldmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNhYmxlZEV2ZW50cyA9IHt9O1xuICAgICAgICB0aGlzLmN1c3RvbUV2ZW50cyA9IHt9O1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xuICAgIH07XG5cbiAgICBFdmVudHMucHJvdG90eXBlID0ge1xuICAgICAgICBJbnB1dEV2ZW50T25Db250ZW50ZWRpdGFibGVTdXBwb3J0ZWQ6ICFNZWRpdW1FZGl0b3IudXRpbC5pc0lFLFxuXG4gICAgICAgIC8vIEhlbHBlcnMgZm9yIGV2ZW50IGhhbmRsaW5nXG5cbiAgICAgICAgYXR0YWNoRE9NRXZlbnQ6IGZ1bmN0aW9uICh0YXJnZXQsIGV2ZW50LCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnB1c2goW3RhcmdldCwgZXZlbnQsIGxpc3RlbmVyLCB1c2VDYXB0dXJlXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV0YWNoRE9NRXZlbnQ6IGZ1bmN0aW9uICh0YXJnZXQsIGV2ZW50LCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mTGlzdGVuZXIodGFyZ2V0LCBldmVudCwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpLFxuICAgICAgICAgICAgICAgIGU7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgZSA9IHRoaXMuZXZlbnRzLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICAgICAgZVswXS5yZW1vdmVFdmVudExpc3RlbmVyKGVbMV0sIGVbMl0sIGVbM10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGluZGV4T2ZMaXN0ZW5lcjogZnVuY3Rpb24gKHRhcmdldCwgZXZlbnQsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICB2YXIgaSwgbiwgaXRlbTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSB0aGlzLmV2ZW50cy5sZW5ndGg7IGkgPCBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gdGhpcy5ldmVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1bMF0gPT09IHRhcmdldCAmJiBpdGVtWzFdID09PSBldmVudCAmJiBpdGVtWzJdID09PSBsaXN0ZW5lciAmJiBpdGVtWzNdID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRhY2hBbGxET01FdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlID0gdGhpcy5ldmVudHMucG9wKCk7XG4gICAgICAgICAgICB3aGlsZSAoZSkge1xuICAgICAgICAgICAgICAgIGVbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihlWzFdLCBlWzJdLCBlWzNdKTtcbiAgICAgICAgICAgICAgICBlID0gdGhpcy5ldmVudHMucG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5hYmxlQ3VzdG9tRXZlbnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWRFdmVudHNbZXZlbnRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5kaXNhYmxlZEV2ZW50c1tldmVudF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlzYWJsZUN1c3RvbUV2ZW50OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZWRFdmVudHNbZXZlbnRdID0gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBjdXN0b20gZXZlbnRzXG4gICAgICAgIGF0dGFjaEN1c3RvbUV2ZW50OiBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLnNldHVwTGlzdGVuZXIoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRhY2hDdXN0b21FdmVudDogZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mQ3VzdG9tTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBJZiBhcnJheSBpcyBlbXB0eSwgc2hvdWxkIGRldGFjaCBpbnRlcm5hbCBsaXN0ZW5lcnMgdmlhIGRlc3Ryb3lMaXN0ZW5lcigpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5kZXhPZkN1c3RvbUxpc3RlbmVyOiBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSB8fCAhdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRhY2hBbGxDdXN0b21FdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzID0ge307XG4gICAgICAgICAgICAvLyBUT0RPOiBTaG91bGQgZGV0YWNoIGludGVybmFsIGxpc3RlbmVycyBoZXJlIHZpYSBkZXN0cm95TGlzdGVuZXIoKVxuICAgICAgICB9LFxuXG4gICAgICAgIHRyaWdnZXJDdXN0b21FdmVudDogZnVuY3Rpb24gKG5hbWUsIGRhdGEsIGVkaXRhYmxlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHNbbmFtZV0gJiYgIXRoaXMuZGlzYWJsZWRFdmVudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcihkYXRhLCBlZGl0YWJsZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQ2xlYW5pbmcgdXBcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmRldGFjaEFsbERPTUV2ZW50cygpO1xuICAgICAgICAgICAgdGhpcy5kZXRhY2hBbGxDdXN0b21FdmVudHMoKTtcbiAgICAgICAgICAgIHRoaXMuZGV0YWNoRXhlY0NvbW1hbmQoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuYmFzZS5lbGVtZW50cykge1xuICAgICAgICAgICAgICAgIHRoaXMuYmFzZS5lbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW1lZGl1bS1mb2N1c2VkJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTGlzdGVuaW5nIHRvIGNhbGxzIHRvIGRvY3VtZW50LmV4ZWNDb21tYW5kXG5cbiAgICAgICAgLy8gQXR0YWNoIGEgbGlzdGVuZXIgdG8gYmUgbm90aWZpZWQgd2hlbiBkb2N1bWVudC5leGVjQ29tbWFuZCBpcyBjYWxsZWRcbiAgICAgICAgYXR0YWNoVG9FeGVjQ29tbWFuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZXhlY0NvbW1hbmRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3RvcmUgYW4gaW5zdGFuY2Ugb2YgdGhlIGxpc3RlbmVyIHNvOlxuICAgICAgICAgICAgLy8gMSkgV2Ugb25seSBhdHRhY2ggdG8gZXhlY0NvbW1hbmQgb25jZVxuICAgICAgICAgICAgLy8gMikgV2UgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgbGF0ZXJcbiAgICAgICAgICAgIHRoaXMuZXhlY0NvbW1hbmRMaXN0ZW5lciA9IGZ1bmN0aW9uIChleGVjSW5mbykge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRG9jdW1lbnRFeGVjQ29tbWFuZChleGVjSW5mbyk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IGV4ZWNDb21tYW5kIGhhcyBiZWVuIHdyYXBwZWQgY29ycmVjdGx5XG4gICAgICAgICAgICB0aGlzLndyYXBFeGVjQ29tbWFuZCgpO1xuXG4gICAgICAgICAgICAvLyBBZGQgbGlzdGVuZXIgdG8gbGlzdCBvZiBleGVjQ29tbWFuZCBsaXN0ZW5lcnNcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmV4ZWNDb21tYW5kLmxpc3RlbmVycy5wdXNoKHRoaXMuZXhlY0NvbW1hbmRMaXN0ZW5lcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmVtb3ZlIG91ciBsaXN0ZW5lciBmb3IgY2FsbHMgdG8gZG9jdW1lbnQuZXhlY0NvbW1hbmRcbiAgICAgICAgZGV0YWNoRXhlY0NvbW1hbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgIGlmICghdGhpcy5leGVjQ29tbWFuZExpc3RlbmVyIHx8ICFkb2MuZXhlY0NvbW1hbmQubGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBpbmRleCBvZiB0aGlzIGxpc3RlbmVyIGluIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgc28gaXQgY2FuIGJlIHJlbW92ZWRcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGRvYy5leGVjQ29tbWFuZC5saXN0ZW5lcnMuaW5kZXhPZih0aGlzLmV4ZWNDb21tYW5kTGlzdGVuZXIpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGRvYy5leGVjQ29tbWFuZC5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlIGxpc3Qgb2YgbGlzdGVuZXJzIGlzIG5vdyBlbXB0eSwgcHV0IGV4ZWNDb21tYW5kIGJhY2sgdG8gaXRzIG9yaWdpbmFsIHN0YXRlXG4gICAgICAgICAgICBpZiAoIWRvYy5leGVjQ29tbWFuZC5saXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51bndyYXBFeGVjQ29tbWFuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFdyYXAgZG9jdW1lbnQuZXhlY0NvbW1hbmQgaW4gYSBjdXN0b20gbWV0aG9kIHNvIHdlIGNhbiBsaXN0ZW4gdG8gY2FsbHMgdG8gaXRcbiAgICAgICAgd3JhcEV4ZWNDb21tYW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZG9jID0gdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQ7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSBhbGwgaW5zdGFuY2Ugb2YgTWVkaXVtRWRpdG9yIG9ubHkgd3JhcCBleGVjQ29tbWFuZCBvbmNlXG4gICAgICAgICAgICBpZiAoZG9jLmV4ZWNDb21tYW5kLmxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgd3JhcHBlciBtZXRob2QgZm9yIGV4ZWNDb21tYW5kIHdoaWNoIHdpbGw6XG4gICAgICAgICAgICAvLyAxKSBDYWxsIGRvY3VtZW50LmV4ZWNDb21tYW5kIHdpdGggdGhlIGNvcnJlY3QgYXJndW1lbnRzXG4gICAgICAgICAgICAvLyAyKSBMb29wIHRocm91Z2ggYW55IGxpc3RlbmVycyBhbmQgbm90aWZ5IHRoZW0gdGhhdCBleGVjQ29tbWFuZCB3YXMgY2FsbGVkXG4gICAgICAgICAgICAvLyAgICBwYXNzaW5nIGV4dHJhIGluZm8gb24gdGhlIGNhbGxcbiAgICAgICAgICAgIC8vIDMpIFJldHVybiB0aGUgcmVzdWx0XG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uIChhQ29tbWFuZE5hbWUsIGFTaG93RGVmYXVsdFVJLCBhVmFsdWVBcmd1bWVudCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBkb2MuZXhlY0NvbW1hbmQub3JpZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkb2MuZXhlY0NvbW1hbmQubGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIGRvYy5leGVjQ29tbWFuZC5saXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZDogYUNvbW1hbmROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGFWYWx1ZUFyZ3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogYXJncyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBleGVjQ29tbWFuZFxuICAgICAgICAgICAgd3JhcHBlci5vcmlnID0gZG9jLmV4ZWNDb21tYW5kO1xuXG4gICAgICAgICAgICAvLyBBdHRhY2ggYW4gYXJyYXkgZm9yIHN0b3JpbmcgbGlzdGVuZXJzXG4gICAgICAgICAgICB3cmFwcGVyLmxpc3RlbmVycyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBPdmVyd3JpdGUgZXhlY0NvbW1hbmRcbiAgICAgICAgICAgIGRvYy5leGVjQ29tbWFuZCA9IHdyYXBwZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmV2ZXJ0IGRvY3VtZW50LmV4ZWNDb21tYW5kIGJhY2sgdG8gaXRzIG9yaWdpbmFsIHNlbGZcbiAgICAgICAgdW53cmFwRXhlY0NvbW1hbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgIGlmICghZG9jLmV4ZWNDb21tYW5kLm9yaWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSB0aGUgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBleGVjQ29tbWFuZCB0byByZXZlcnQgYmFja1xuICAgICAgICAgICAgZG9jLmV4ZWNDb21tYW5kID0gZG9jLmV4ZWNDb21tYW5kLm9yaWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTGlzdGVuaW5nIHRvIGJyb3dzZXIgZXZlbnRzIHRvIGVtaXQgZXZlbnRzIG1lZGl1bS1lZGl0b3IgY2FyZXMgYWJvdXRcbiAgICAgICAgc2V0dXBMaXN0ZW5lcjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RlbmVyc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZXh0ZXJuYWxJbnRlcmFjdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyB3aGVuIHVzZXIgaGFzIGludGVyYWN0ZWQgd2l0aCBlbGVtZW50cyBvdXRzaWRlIG9mIE1lZGl1bUVkaXRvclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaERPTUV2ZW50KHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmJvZHksICdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZUJvZHlNb3VzZWRvd24uYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoRE9NRXZlbnQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuYm9keSwgJ2NsaWNrJywgdGhpcy5oYW5kbGVCb2R5Q2xpY2suYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoRE9NRXZlbnQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuYm9keSwgJ2ZvY3VzJywgdGhpcy5oYW5kbGVCb2R5Rm9jdXMuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2JsdXInOlxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlY3Rpbmcgd2hlbiBmb2N1cyBpcyBsb3N0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBMaXN0ZW5lcignZXh0ZXJuYWxJbnRlcmFjdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdmb2N1cyc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyB3aGVuIGZvY3VzIG1vdmVzIGludG8gc29tZSBwYXJ0IG9mIE1lZGl1bUVkaXRvclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHVwTGlzdGVuZXIoJ2V4dGVybmFsSW50ZXJhY3Rpb24nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVJbnB1dCc6XG4gICAgICAgICAgICAgICAgICAgIC8vIHNldHVwIGNhY2hlIGZvciBrbm93aW5nIHdoZW4gdGhlIGNvbnRlbnQgaGFzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50Q2FjaGUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iYXNlLmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudENhY2hlW2VsZW1lbnQuZ2V0QXR0cmlidXRlKCdtZWRpdW0tZWRpdG9yLWluZGV4JyldID0gZWxlbWVudC5pbm5lckhUTUw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGFjaCB0byB0aGUgJ29uaW5wdXQnIGV2ZW50LCBoYW5kbGVkIGNvcnJlY3RseSBieSBtb3N0IGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5JbnB1dEV2ZW50T25Db250ZW50ZWRpdGFibGVTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaERPTUV2ZW50KGVsZW1lbnQsICdpbnB1dCcsIHRoaXMuaGFuZGxlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGJyb3dzZXJzIHdoaWNoIGRvbid0IHN1cHBvcnQgdGhlIGlucHV0IGV2ZW50IG9uIGNvbnRlbnRlZGl0YWJsZSAoSUUpXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlJ2xsIGF0dGFjaCB0byAnc2VsZWN0aW9uY2hhbmdlJyBvbiB0aGUgZG9jdW1lbnQgYW5kICdrZXlwcmVzcycgb24gdGhlIGVkaXRhYmxlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuSW5wdXRFdmVudE9uQ29udGVudGVkaXRhYmxlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHVwTGlzdGVuZXIoJ2VkaXRhYmxlS2V5cHJlc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMua2V5cHJlc3NVcGRhdGVJbnB1dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaERPTUV2ZW50KGRvY3VtZW50LCAnc2VsZWN0aW9uY2hhbmdlJywgdGhpcy5oYW5kbGVEb2N1bWVudFNlbGVjdGlvbkNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpc3RlbiB0byBjYWxscyB0byBleGVjQ29tbWFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb0V4ZWNDb21tYW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVDbGljayc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyBjbGljayBpbiB0aGUgY29udGVudGVkaXRhYmxlc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvRWFjaEVsZW1lbnQoJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VkaXRhYmxlQmx1cic6XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyBibHVyIGluIHRoZSBjb250ZW50ZWRpdGFibGVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoVG9FYWNoRWxlbWVudCgnYmx1cicsIHRoaXMuaGFuZGxlQmx1cik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VkaXRhYmxlS2V5cHJlc3MnOlxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlY3Rpbmcga2V5cHJlc3MgaW4gdGhlIGNvbnRlbnRlZGl0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb0VhY2hFbGVtZW50KCdrZXlwcmVzcycsIHRoaXMuaGFuZGxlS2V5cHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdlZGl0YWJsZUtleXVwJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIGtleXVwIGluIHRoZSBjb250ZW50ZWRpdGFibGVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoVG9FYWNoRWxlbWVudCgna2V5dXAnLCB0aGlzLmhhbmRsZUtleXVwKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVLZXlkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIGtleWRvd24gb24gdGhlIGNvbnRlbnRlZGl0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb0VhY2hFbGVtZW50KCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlkb3duKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVLZXlkb3duRW50ZXInOlxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlY3Rpbmcga2V5ZG93biBmb3IgRU5URVIgb24gdGhlIGNvbnRlbnRlZGl0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR1cExpc3RlbmVyKCdlZGl0YWJsZUtleWRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVLZXlkb3duVGFiJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIGtleWRvd24gZm9yIFRBQiBvbiB0aGUgY29udGVudGVkaXRhYmxlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBMaXN0ZW5lcignZWRpdGFibGVLZXlkb3duJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VkaXRhYmxlS2V5ZG93bkRlbGV0ZSc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVjdGluZyBrZXlkb3duIGZvciBERUxFVEUvQkFDS1NQQUNFIG9uIHRoZSBjb250ZW50ZWRpdGFibGVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBMaXN0ZW5lcignZWRpdGFibGVLZXlkb3duJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2VkaXRhYmxlTW91c2VvdmVyJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIG1vdXNlb3ZlciBvbiB0aGUgY29udGVudGVkaXRhYmxlc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvRWFjaEVsZW1lbnQoJ21vdXNlb3ZlcicsIHRoaXMuaGFuZGxlTW91c2VvdmVyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGFibGVEcmFnJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIGRyYWdvdmVyIGFuZCBkcmFnbGVhdmUgb24gdGhlIGNvbnRlbnRlZGl0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb0VhY2hFbGVtZW50KCdkcmFnb3ZlcicsIHRoaXMuaGFuZGxlRHJhZ2dpbmcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvRWFjaEVsZW1lbnQoJ2RyYWdsZWF2ZScsIHRoaXMuaGFuZGxlRHJhZ2dpbmcpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdlZGl0YWJsZURyb3AnOlxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlY3RpbmcgZHJvcCBvbiB0aGUgY29udGVudGVkaXRhYmxlc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvRWFjaEVsZW1lbnQoJ2Ryb3AnLCB0aGlzLmhhbmRsZURyb3ApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdlZGl0YWJsZVBhc3RlJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZWN0aW5nIHBhc3RlIG9uIHRoZSBjb250ZW50ZWRpdGFibGVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoVG9FYWNoRWxlbWVudCgncGFzdGUnLCB0aGlzLmhhbmRsZVBhc3RlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXR0YWNoVG9FYWNoRWxlbWVudDogZnVuY3Rpb24gKG5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYmFzZS5lbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hET01FdmVudChlbGVtZW50LCBuYW1lLCBoYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9jdXNFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGb2N1cyhlbGVtZW50LCB7IHRhcmdldDogZWxlbWVudCwgdHlwZTogJ2ZvY3VzJyB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVGb2N1czogZnVuY3Rpb24gKHRhcmdldCwgZXZlbnRPYmopIHtcbiAgICAgICAgICAgIHZhciB0b29sYmFyID0gdGhpcy5iYXNlLmdldEV4dGVuc2lvbkJ5TmFtZSgndG9vbGJhcicpLFxuICAgICAgICAgICAgICAgIHRvb2xiYXJFbCA9IHRvb2xiYXIgPyB0b29sYmFyLmdldFRvb2xiYXJFbGVtZW50KCkgOiBudWxsLFxuICAgICAgICAgICAgICAgIGFuY2hvclByZXZpZXcgPSB0aGlzLmJhc2UuZ2V0RXh0ZW5zaW9uQnlOYW1lKCdhbmNob3ItcHJldmlldycpLFxuICAgICAgICAgICAgICAgIHByZXZpZXdFbCA9IChhbmNob3JQcmV2aWV3ICYmIGFuY2hvclByZXZpZXcuZ2V0UHJldmlld0VsZW1lbnQpID8gYW5jaG9yUHJldmlldy5nZXRQcmV2aWV3RWxlbWVudCgpIDogbnVsbCxcbiAgICAgICAgICAgICAgICBoYWRGb2N1cyA9IHRoaXMuYmFzZS5nZXRGb2N1c2VkRWxlbWVudCgpLFxuICAgICAgICAgICAgICAgIHRvRm9jdXM7XG5cbiAgICAgICAgICAgIC8vIEZvciBjbGlja3MsIHdlIG5lZWQgdG8ga25vdyBpZiB0aGUgbW91c2Vkb3duIHRoYXQgY2F1c2VkIHRoZSBjbGljayBoYXBwZW5lZCBpbnNpZGUgdGhlIGV4aXN0aW5nIGZvY3VzZWQgZWxlbWVudC5cbiAgICAgICAgICAgIC8vIElmIHNvLCB3ZSBkb24ndCB3YW50IHRvIGZvY3VzIGFub3RoZXIgZWxlbWVudFxuICAgICAgICAgICAgaWYgKGhhZEZvY3VzICYmXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50T2JqLnR5cGUgPT09ICdjbGljaycgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0TW91c2Vkb3duVGFyZ2V0ICYmXG4gICAgICAgICAgICAgICAgICAgIChNZWRpdW1FZGl0b3IudXRpbC5pc0Rlc2NlbmRhbnQoaGFkRm9jdXMsIHRoaXMubGFzdE1vdXNlZG93blRhcmdldCwgdHJ1ZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudCh0b29sYmFyRWwsIHRoaXMubGFzdE1vdXNlZG93blRhcmdldCwgdHJ1ZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudChwcmV2aWV3RWwsIHRoaXMubGFzdE1vdXNlZG93blRhcmdldCwgdHJ1ZSkpKSB7XG4gICAgICAgICAgICAgICAgdG9Gb2N1cyA9IGhhZEZvY3VzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJhc2UuZWxlbWVudHMuc29tZShmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIHBhcnQgb2YgYW4gZWRpdG9yIGVsZW1lbnQsIHRoaXMgaXMgdGhlIGVsZW1lbnQgZ2V0dGluZyBmb2N1c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRvRm9jdXMgJiYgKE1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudChlbGVtZW50LCB0YXJnZXQsIHRydWUpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9Gb2N1cyA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBiYWlsIGlmIHdlIGZvdW5kIGFuIGVsZW1lbnQgdGhhdCdzIGdldHRpbmcgZm9jdXNcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEhdG9Gb2N1cztcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHRhcmdldCBpcyBleHRlcm5hbCAobm90IHBhcnQgb2YgdGhlIGVkaXRvciwgdG9vbGJhciwgb3IgYW5jaG9ycHJldmlldylcbiAgICAgICAgICAgIHZhciBleHRlcm5hbEV2ZW50ID0gIU1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudChoYWRGb2N1cywgdGFyZ2V0LCB0cnVlKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhTWVkaXVtRWRpdG9yLnV0aWwuaXNEZXNjZW5kYW50KHRvb2xiYXJFbCwgdGFyZ2V0LCB0cnVlKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhTWVkaXVtRWRpdG9yLnV0aWwuaXNEZXNjZW5kYW50KHByZXZpZXdFbCwgdGFyZ2V0LCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKHRvRm9jdXMgIT09IGhhZEZvY3VzKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgZWxlbWVudCBoYXMgZm9jdXMsIGFuZCBmb2N1cyBpcyBnb2luZyBvdXRzaWRlIG9mIGVkaXRvclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGJsdXIgZm9jdXNlZCBlbGVtZW50IGlmIGNsaWNraW5nIG9uIGVkaXRvciwgdG9vbGJhciwgb3IgYW5jaG9ycHJldmlld1xuICAgICAgICAgICAgICAgIGlmIChoYWRGb2N1cyAmJiBleHRlcm5hbEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgYmx1ciBvbiB0aGUgZWRpdGFibGUgdGhhdCBoYXMgbG9zdCBmb2N1c1xuICAgICAgICAgICAgICAgICAgICBoYWRGb2N1cy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtbWVkaXVtLWZvY3VzZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2JsdXInLCBldmVudE9iaiwgaGFkRm9jdXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIGZvY3VzIGlzIGdvaW5nIGludG8gYW4gZWRpdG9yIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBpZiAodG9Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIGZvY3VzIG9uIHRoZSBlZGl0YWJsZSB0aGF0IG5vdyBoYXMgZm9jdXNcbiAgICAgICAgICAgICAgICAgICAgdG9Gb2N1cy5zZXRBdHRyaWJ1dGUoJ2RhdGEtbWVkaXVtLWZvY3VzZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2ZvY3VzJywgZXZlbnRPYmosIHRvRm9jdXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4dGVybmFsRXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZXh0ZXJuYWxJbnRlcmFjdGlvbicsIGV2ZW50T2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVJbnB1dDogZnVuY3Rpb24gKHRhcmdldCwgZXZlbnRPYmopIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jb250ZW50Q2FjaGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBbiBldmVudCB0cmlnZ2VyZWQgd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIHVzZXIgbWF5IGhhdmUgY2hhbmdlZCBzb21ldGluZ1xuICAgICAgICAgICAgLy8gTG9vayBpbiBvdXIgY2FjaGUgb2YgaW5wdXQgZm9yIHRoZSBjb250ZW50ZWRpdGFibGVzIHRvIHNlZSBpZiBzb21ldGhpbmcgY2hhbmdlZFxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnbWVkaXVtLWVkaXRvci1pbmRleCcpO1xuICAgICAgICAgICAgaWYgKHRhcmdldC5pbm5lckhUTUwgIT09IHRoaXMuY29udGVudENhY2hlW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjb250ZW50IGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgd2UgY2hlY2tlZCwgZmlyZSB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVJbnB1dCcsIGV2ZW50T2JqLCB0YXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb250ZW50Q2FjaGVbaW5kZXhdID0gdGFyZ2V0LmlubmVySFRNTDtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEb2N1bWVudFNlbGVjdGlvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBXaGVuIHNlbGVjdGlvbmNoYW5nZSBmaXJlcywgdGFyZ2V0IGFuZCBjdXJyZW50IHRhcmdldCBhcmUgc2V0XG4gICAgICAgICAgICAvLyB0byBkb2N1bWVudCwgc2luY2UgdGhpcyBpcyB3aGVyZSB0aGUgZXZlbnQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gSG93ZXZlciwgY3VycmVudFRhcmdldCB3aWxsIGhhdmUgYW4gJ2FjdGl2ZUVsZW1lbnQnIHByb3BlcnR5XG4gICAgICAgICAgICAvLyB3aGljaCB3aWxsIHBvaW50IHRvIHdoYXRldmVyIGVsZW1lbnQgaGFzIGZvY3VzLlxuICAgICAgICAgICAgaWYgKGV2ZW50LmN1cnJlbnRUYXJnZXQgJiYgZXZlbnQuY3VycmVudFRhcmdldC5hY3RpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0LmFjdGl2ZUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQ7XG4gICAgICAgICAgICAgICAgLy8gV2UgY2FuIGxvb2sgYXQgdGhlICdhY3RpdmVFbGVtZW50JyB0byBkZXRlcm1pbmUgaWYgdGhlIHNlbGVjdGlvbmNoYW5nZSBoYXNcbiAgICAgICAgICAgICAgICAvLyBoYXBwZW5lZCB3aXRoaW4gYSBjb250ZW50ZWRpdGFibGUgb3duZWQgYnkgdGhpcyBpbnN0YW5jZSBvZiBNZWRpdW1FZGl0b3JcbiAgICAgICAgICAgICAgICB0aGlzLmJhc2UuZWxlbWVudHMuc29tZShmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNEZXNjZW5kYW50KGVsZW1lbnQsIGFjdGl2ZUVsZW1lbnQsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGFyZ2V0ID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIFdlIGtub3cgc2VsZWN0aW9uY2hhbmdlIGZpcmVkIHdpdGhpbiBvbmUgb2Ygb3VyIGNvbnRlbnRlZGl0YWJsZXNcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0KGN1cnJlbnRUYXJnZXQsIHsgdGFyZ2V0OiBhY3RpdmVFbGVtZW50LCBjdXJyZW50VGFyZ2V0OiBjdXJyZW50VGFyZ2V0IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEb2N1bWVudEV4ZWNDb21tYW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBkb2N1bWVudC5leGVjQ29tbWFuZCBoYXMgYmVlbiBjYWxsZWRcbiAgICAgICAgICAgIC8vIElmIG9uZSBvZiBvdXIgY29udGVudGVkaXRhYmxlcyBjdXJyZW50bHkgaGFzIGZvY3VzLCB3ZSBzaG91bGRcbiAgICAgICAgICAgIC8vIGF0dGVtcHQgdG8gdHJpZ2dlciB0aGUgJ2VkaXRhYmxlSW5wdXQnIGV2ZW50XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5iYXNlLmdldEZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJbnB1dCh0YXJnZXQsIHsgdGFyZ2V0OiB0YXJnZXQsIGN1cnJlbnRUYXJnZXQ6IHRhcmdldCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVCb2R5Q2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGb2N1cyhldmVudC50YXJnZXQsIGV2ZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVCb2R5Rm9jdXM6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGb2N1cyhldmVudC50YXJnZXQsIGV2ZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVCb2R5TW91c2Vkb3duOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdE1vdXNlZG93blRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVJbnB1dDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0KGV2ZW50LmN1cnJlbnRUYXJnZXQsIGV2ZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVDbGljaycsIGV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVCbHVyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbUV2ZW50KCdlZGl0YWJsZUJsdXInLCBldmVudCwgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlS2V5cHJlc3M6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2VkaXRhYmxlS2V5cHJlc3MnLCBldmVudCwgZXZlbnQuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIGRvaW5nIG1hbnVhbCBkZXRlY3Rpb24gb2YgdGhlIGVkaXRhYmxlSW5wdXQgZXZlbnQgd2UgbmVlZFxuICAgICAgICAgICAgLy8gdG8gY2hlY2sgZm9yIGlucHV0IGNoYW5nZXMgZHVyaW5nICdrZXlwcmVzcydcbiAgICAgICAgICAgIGlmICh0aGlzLmtleXByZXNzVXBkYXRlSW5wdXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmogPSB7IHRhcmdldDogZXZlbnQudGFyZ2V0LCBjdXJyZW50VGFyZ2V0OiBldmVudC5jdXJyZW50VGFyZ2V0IH07XG5cbiAgICAgICAgICAgICAgICAvLyBJbiBJRSwgd2UgbmVlZCB0byBsZXQgdGhlIHJlc3Qgb2YgdGhlIGV2ZW50IHN0YWNrIGNvbXBsZXRlIGJlZm9yZSB3ZSBkZXRlY3RcbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2VzIHRvIGlucHV0LCBzbyB1c2luZyBzZXRUaW1lb3V0IGhlcmVcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJbnB1dChldmVudE9iai5jdXJyZW50VGFyZ2V0LCBldmVudE9iaik7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVLZXl1cDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVLZXl1cCcsIGV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVNb3VzZW92ZXI6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2VkaXRhYmxlTW91c2VvdmVyJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZURyYWdnaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbUV2ZW50KCdlZGl0YWJsZURyYWcnLCBldmVudCwgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRHJvcDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVEcm9wJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZVBhc3RlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbUV2ZW50KCdlZGl0YWJsZVBhc3RlJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUtleWRvd246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2VkaXRhYmxlS2V5ZG93bicsIGV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KTtcblxuICAgICAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLmlzS2V5KGV2ZW50LCBNZWRpdW1FZGl0b3IudXRpbC5rZXlDb2RlLkVOVEVSKSB8fCAoZXZlbnQuY3RybEtleSAmJiBNZWRpdW1FZGl0b3IudXRpbC5pc0tleShldmVudCwgTWVkaXVtRWRpdG9yLnV0aWwua2V5Q29kZS5NKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmlnZ2VyQ3VzdG9tRXZlbnQoJ2VkaXRhYmxlS2V5ZG93bkVudGVyJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuVEFCKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVLZXlkb3duVGFiJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIFtNZWRpdW1FZGl0b3IudXRpbC5rZXlDb2RlLkRFTEVURSwgTWVkaXVtRWRpdG9yLnV0aWwua2V5Q29kZS5CQUNLU1BBQ0VdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVLZXlkb3duRGVsZXRlJywgZXZlbnQsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIE1lZGl1bUVkaXRvci5FdmVudHMgPSBFdmVudHM7XG59KCkpO1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBCdXR0b24gPSBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLmV4dGVuZCh7XG5cbiAgICAgICAgLyogQnV0dG9uIE9wdGlvbnMgKi9cblxuICAgICAgICAvKiBhY3Rpb246IFtzdHJpbmddXG4gICAgICAgICAqIFRoZSBhY3Rpb24gYXJndW1lbnQgdG8gcGFzcyB0byBNZWRpdW1FZGl0b3IuZXhlY0FjdGlvbigpXG4gICAgICAgICAqIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkXG4gICAgICAgICAqL1xuICAgICAgICBhY3Rpb246IHVuZGVmaW5lZCxcblxuICAgICAgICAvKiBhcmlhOiBbc3RyaW5nXVxuICAgICAgICAgKiBUaGUgdmFsdWUgdG8gYWRkIGFzIHRoZSBhcmlhLWxhYmVsIGF0dHJpYnV0ZSBvZiB0aGUgYnV0dG9uXG4gICAgICAgICAqIGVsZW1lbnQgZGlzcGxheWVkIGluIHRoZSB0b29sYmFyLlxuICAgICAgICAgKiBUaGlzIGlzIGFsc28gdXNlZCBhcyB0aGUgdG9vbHRpcCBmb3IgdGhlIGJ1dHRvblxuICAgICAgICAgKi9cbiAgICAgICAgYXJpYTogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIHRhZ05hbWVzOiBbQXJyYXldXG4gICAgICAgICAqIE5PVEU6IFRoaXMgaXMgbm90IHVzZWQgaWYgdXNlUXVlcnlTdGF0ZSBpcyBzZXQgdG8gdHJ1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQXJyYXkgb2YgZWxlbWVudCB0YWcgbmFtZXMgdGhhdCB3b3VsZCBpbmRpY2F0ZSB0aGF0IHRoaXNcbiAgICAgICAgICogYnV0dG9uIGhhcyBhbHJlYWR5IGJlZW4gYXBwbGllZC4gSWYgdGhpcyBhY3Rpb24gaGFzIGFscmVhZHlcbiAgICAgICAgICogYmVlbiBhcHBsaWVkLCB0aGUgYnV0dG9uIHdpbGwgYmUgZGlzcGxheWVkIGFzICdhY3RpdmUnIGluIHRoZSB0b29sYmFyXG4gICAgICAgICAqXG4gICAgICAgICAqIEV4YW1wbGU6XG4gICAgICAgICAqIEZvciAnYm9sZCcsIGlmIHRoZSB0ZXh0IGlzIGV2ZXIgd2l0aGluIGEgPGI+IG9yIDxzdHJvbmc+XG4gICAgICAgICAqIHRhZyB0aGF0IGluZGljYXRlcyB0aGUgdGV4dCBpcyBhbHJlYWR5IGJvbGQuIFNvIHRoZSBhcnJheVxuICAgICAgICAgKiBvZiB0YWdOYW1lcyBmb3IgYm9sZCB3b3VsZCBiZTogWydiJywgJ3N0cm9uZyddXG4gICAgICAgICAqL1xuICAgICAgICB0YWdOYW1lczogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIHN0eWxlOiBbT2JqZWN0XVxuICAgICAgICAgKiBOT1RFOiBUaGlzIGlzIG5vdCB1c2VkIGlmIHVzZVF1ZXJ5U3RhdGUgaXMgc2V0IHRvIHRydWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEEgcGFpciBvZiBjc3MgcHJvcGVydHkgJiB2YWx1ZShzKSB0aGF0IGluZGljYXRlIHRoYXQgdGhpc1xuICAgICAgICAgKiBidXR0b24gaGFzIGFscmVhZHkgYmVlbiBhcHBsaWVkLiBJZiB0aGlzIGFjdGlvbiBoYXMgYWxyZWFkeVxuICAgICAgICAgKiBiZWVuIGFwcGxpZWQsIHRoZSBidXR0b24gd2lsbCBiZSBkaXNwbGF5ZWQgYXMgJ2FjdGl2ZScgaW4gdGhlIHRvb2xiYXJcbiAgICAgICAgICogUHJvcGVydGllcyBvZiB0aGUgb2JqZWN0OlxuICAgICAgICAgKiAgIHByb3AgW1N0cmluZ106IG5hbWUgb2YgdGhlIGNzcyBwcm9wZXJ0eVxuICAgICAgICAgKiAgIHZhbHVlIFtTdHJpbmddOiB2YWx1ZShzKSBvZiB0aGUgY3NzIHByb3BlcnR5XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgIG11bHRpcGxlIHZhbHVlcyBjYW4gYmUgc2VwYXJhdGVkIGJ5IGEgJ3wnXG4gICAgICAgICAqXG4gICAgICAgICAqIEV4YW1wbGU6XG4gICAgICAgICAqIEZvciAnYm9sZCcsIGlmIHRoZSB0ZXh0IGlzIGV2ZXIgd2l0aGluIGFuIGVsZW1lbnQgd2l0aCBhICdmb250LXdlaWdodCdcbiAgICAgICAgICogc3R5bGUgcHJvcGVydHkgc2V0IHRvICc3MDAnIG9yICdib2xkJywgdGhhdCBpbmRpY2F0ZXMgdGhlIHRleHRcbiAgICAgICAgICogaXMgYWxyZWFkeSBib2xkLiAgU28gdGhlIHN0eWxlIG9iamVjdCBmb3IgYm9sZCB3b3VsZCBiZTpcbiAgICAgICAgICogeyBwcm9wOiAnZm9udC13ZWlnaHQnLCB2YWx1ZTogJzcwMHxib2xkJyB9XG4gICAgICAgICAqL1xuICAgICAgICBzdHlsZTogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIHVzZVF1ZXJ5U3RhdGU6IFtib29sZWFuXVxuICAgICAgICAgKiBFbmFibGVzL2Rpc2FibGVzIHdoZXRoZXIgdGhpcyBidXR0b24gc2hvdWxkIHVzZSB0aGUgYnVpbHQtaW5cbiAgICAgICAgICogZG9jdW1lbnQucXVlcnlDb21tYW5kU3RhdGUoKSBtZXRob2QgdG8gZGV0ZXJtaW5lIHdoZXRoZXJcbiAgICAgICAgICogdGhlIGFjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGFwcGxpZWQuICBJZiB0aGUgYWN0aW9uIGhhcyBhbHJlYWR5XG4gICAgICAgICAqIGJlZW4gYXBwbGllZCwgdGhlIGJ1dHRvbiB3aWxsIGJlIGRpc3BsYXllZCBhcyAnYWN0aXZlJyBpbiB0aGUgdG9vbGJhclxuICAgICAgICAgKlxuICAgICAgICAgKiBFeGFtcGxlOlxuICAgICAgICAgKiBGb3IgJ2JvbGQnLCBpZiB0aGlzIGlzIHNldCB0byB0cnVlLCB0aGUgY29kZSB3aWxsIGNhbGw6XG4gICAgICAgICAqIGRvY3VtZW50LnF1ZXJ5Q29tbWFuZFN0YXRlKCdib2xkJykgd2hpY2ggd2lsbCByZXR1cm4gdHJ1ZSBpZiB0aGVcbiAgICAgICAgICogYnJvd3NlciB0aGlua3MgdGhlIHRleHQgaXMgYWxyZWFkeSBib2xkLCBhbmQgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICAgICAqL1xuICAgICAgICB1c2VRdWVyeVN0YXRlOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogY29udGVudERlZmF1bHQ6IFtzdHJpbmddXG4gICAgICAgICAqIERlZmF1bHQgaW5uZXJIVE1MIHRvIHB1dCBpbnNpZGUgdGhlIGJ1dHRvblxuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudERlZmF1bHQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKiBjb250ZW50RkE6IFtzdHJpbmddXG4gICAgICAgICAqIFRoZSBpbm5lckhUTUwgdG8gdXNlIGZvciB0aGUgY29udGVudCBvZiB0aGUgYnV0dG9uXG4gICAgICAgICAqIGlmIHRoZSBgYnV0dG9uTGFiZWxzYCBvcHRpb24gZm9yIE1lZGl1bUVkaXRvciBpcyBzZXQgdG8gJ2ZvbnRhd2Vzb21lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudEZBOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyogY2xhc3NMaXN0OiBbQXJyYXldXG4gICAgICAgICAqIEFuIGFycmF5IG9mIGNsYXNzTmFtZXMgKHN0cmluZ3MpIHRvIGJlIGFkZGVkIHRvIHRoZSBidXR0b25cbiAgICAgICAgICovXG4gICAgICAgIGNsYXNzTGlzdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qIGF0dHJzOiBbb2JqZWN0XVxuICAgICAgICAgKiBBIHNldCBvZiBrZXktdmFsdWUgcGFpcnMgdG8gYWRkIHRvIHRoZSBidXR0b24gYXMgY3VzdG9tIGF0dHJpYnV0ZXNcbiAgICAgICAgICovXG4gICAgICAgIGF0dHJzOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLy8gVGhlIGJ1dHRvbiBjb25zdHJ1Y3RvciBjYW4gb3B0aW9uYWxseSBhY2NlcHQgdGhlIG5hbWUgb2YgYSBidWlsdC1pbiBidXR0b25cbiAgICAgICAgLy8gKGllICdib2xkJywgJ2l0YWxpYycsIGV0Yy4pXG4gICAgICAgIC8vIFdoZW4gdGhlIG5hbWUgb2YgYSBidXR0b24gaXMgcGFzc2VkLCBpdCB3aWxsIGluaXRpYWxpemUgaXRzZWxmIHdpdGggdGhlXG4gICAgICAgIC8vIGNvbmZpZ3VyYXRpb24gZm9yIHRoYXQgYnV0dG9uXG4gICAgICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKEJ1dHRvbi5pc0J1aWx0SW5CdXR0b24ob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLmNhbGwodGhpcywgdGhpcy5kZWZhdWx0c1tvcHRpb25zXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci5FeHRlbnNpb24uY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHRoaXMuYnV0dG9uID0gdGhpcy5jcmVhdGVCdXR0b24oKTtcbiAgICAgICAgICAgIHRoaXMub24odGhpcy5idXR0b24sICdjbGljaycsIHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogZ2V0QnV0dG9uOiBbZnVuY3Rpb24gKCldXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIGltcGxlbWVudGVkLCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5cbiAgICAgICAgICogdGhlIHRvb2xiYXIgaXMgYmVpbmcgY3JlYXRlZC4gIFRoZSBET00gRWxlbWVudCByZXR1cm5lZFxuICAgICAgICAgKiBieSB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgYXBwZW5kZWQgdG8gdGhlIHRvb2xiYXIgYWxvbmdcbiAgICAgICAgICogd2l0aCBhbnkgb3RoZXIgYnV0dG9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGdldEJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnV0dG9uO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgdGhpcy5hY3Rpb24gPT09ICdmdW5jdGlvbicpID8gdGhpcy5hY3Rpb24odGhpcy5iYXNlLm9wdGlvbnMpIDogdGhpcy5hY3Rpb247XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QXJpYTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgdGhpcy5hcmlhID09PSAnZnVuY3Rpb24nKSA/IHRoaXMuYXJpYSh0aGlzLmJhc2Uub3B0aW9ucykgOiB0aGlzLmFyaWE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0VGFnTmFtZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHRoaXMudGFnTmFtZXMgPT09ICdmdW5jdGlvbicpID8gdGhpcy50YWdOYW1lcyh0aGlzLmJhc2Uub3B0aW9ucykgOiB0aGlzLnRhZ05hbWVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHRoaXMuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyksXG4gICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuY29udGVudERlZmF1bHQsXG4gICAgICAgICAgICAgICAgYXJpYUxhYmVsID0gdGhpcy5nZXRBcmlhKCksXG4gICAgICAgICAgICAgICAgYnV0dG9uTGFiZWxzID0gdGhpcy5nZXRFZGl0b3JPcHRpb24oJ2J1dHRvbkxhYmVscycpO1xuICAgICAgICAgICAgLy8gQWRkIGNsYXNzIG5hbWVzXG4gICAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZCgnbWVkaXVtLWVkaXRvci1hY3Rpb24nKTtcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdtZWRpdW0tZWRpdG9yLWFjdGlvbi0nICsgdGhpcy5uYW1lKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzTGlzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmZvckVhY2goZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBZGQgYXR0cmlidXRlc1xuICAgICAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGF0YS1hY3Rpb24nLCB0aGlzLmdldEFjdGlvbigpKTtcbiAgICAgICAgICAgIGlmIChhcmlhTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBidXR0b24uc2V0QXR0cmlidXRlKCd0aXRsZScsIGFyaWFMYWJlbCk7XG4gICAgICAgICAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGFyaWFMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMuYXR0cnMpLmZvckVhY2goZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZShhdHRyLCB0aGlzLmF0dHJzW2F0dHJdKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJ1dHRvbkxhYmVscyA9PT0gJ2ZvbnRhd2Vzb21lJyAmJiB0aGlzLmNvbnRlbnRGQSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLmNvbnRlbnRGQTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBjb250ZW50O1xuICAgICAgICAgICAgcmV0dXJuIGJ1dHRvbjtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLmdldEFjdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjQWN0aW9uKGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJ1dHRvbi5jbGFzc0xpc3QuY29udGFpbnModGhpcy5nZXRFZGl0b3JPcHRpb24oJ2FjdGl2ZUJ1dHRvbkNsYXNzJykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEluYWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuZ2V0RWRpdG9yT3B0aW9uKCdhY3RpdmVCdXR0b25DbGFzcycpKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmtub3duU3RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0QWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmJ1dHRvbi5jbGFzc0xpc3QuYWRkKHRoaXMuZ2V0RWRpdG9yT3B0aW9uKCdhY3RpdmVCdXR0b25DbGFzcycpKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmtub3duU3RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcXVlcnlDb21tYW5kU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBxdWVyeVN0YXRlID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLnVzZVF1ZXJ5U3RhdGUpIHtcbiAgICAgICAgICAgICAgICBxdWVyeVN0YXRlID0gdGhpcy5iYXNlLnF1ZXJ5Q29tbWFuZFN0YXRlKHRoaXMuZ2V0QWN0aW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5U3RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNBbHJlYWR5QXBwbGllZDogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBpc01hdGNoID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgdGFnTmFtZXMgPSB0aGlzLmdldFRhZ05hbWVzKCksXG4gICAgICAgICAgICAgICAgc3R5bGVWYWxzLFxuICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmtub3duU3RhdGUgPT09IGZhbHNlIHx8IHRoaXMua25vd25TdGF0ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmtub3duU3RhdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YWdOYW1lcyAmJiB0YWdOYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaXNNYXRjaCA9IHRhZ05hbWVzLmluZGV4T2Yobm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSAhPT0gLTE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNNYXRjaCAmJiB0aGlzLnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVWYWxzID0gdGhpcy5zdHlsZS52YWx1ZS5zcGxpdCgnfCcpO1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSB0aGlzLndpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUsIG51bGwpLmdldFByb3BlcnR5VmFsdWUodGhpcy5zdHlsZS5wcm9wKTtcbiAgICAgICAgICAgICAgICBzdHlsZVZhbHMuZm9yRWFjaChmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5rbm93blN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoID0gKGNvbXB1dGVkU3R5bGUuaW5kZXhPZih2YWwpICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXh0LWRlY29yYXRpb24gaXMgbm90IGluaGVyaXRlZCBieSBkZWZhdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyBpZiB0aGUgY29tcHV0ZWQgc3R5bGUgZm9yIHRleHQtZGVjb3JhdGlvbiBkb2Vzbid0IG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCB3cml0ZSB0byBrbm93blN0YXRlIHNvIHdlIGNhbiBmYWxsYmFjayB0byBvdGhlciBjaGVja3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01hdGNoIHx8IHRoaXMuc3R5bGUucHJvcCAhPT0gJ3RleHQtZGVjb3JhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmtub3duU3RhdGUgPSBpc01hdGNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpc01hdGNoO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBCdXR0b24uaXNCdWlsdEluQnV0dG9uID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpICYmIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbi5wcm90b3R5cGUuZGVmYXVsdHMuaGFzT3duUHJvcGVydHkobmFtZSk7XG4gICAgfTtcblxuICAgIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbiA9IEJ1dHRvbjtcbn0oKSk7XG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyogTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuYnV0dG9uLmRlZmF1bHRzOiBbT2JqZWN0XVxuICAgICAqIFNldCBvZiBkZWZhdWx0IGNvbmZpZyBvcHRpb25zIGZvciBhbGwgb2YgdGhlIGJ1aWx0LWluIE1lZGl1bUVkaXRvciBidXR0b25zXG4gICAgICovXG4gICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuYnV0dG9uLnByb3RvdHlwZS5kZWZhdWx0cyA9IHtcbiAgICAgICAgJ2JvbGQnOiB7XG4gICAgICAgICAgICBuYW1lOiAnYm9sZCcsXG4gICAgICAgICAgICBhY3Rpb246ICdib2xkJyxcbiAgICAgICAgICAgIGFyaWE6ICdib2xkJyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ2InLCAnc3Ryb25nJ10sXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHByb3A6ICdmb250LXdlaWdodCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICc3MDB8Ym9sZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VRdWVyeVN0YXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj5CPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWJvbGRcIj48L2k+J1xuICAgICAgICB9LFxuICAgICAgICAnaXRhbGljJzoge1xuICAgICAgICAgICAgbmFtZTogJ2l0YWxpYycsXG4gICAgICAgICAgICBhY3Rpb246ICdpdGFsaWMnLFxuICAgICAgICAgICAgYXJpYTogJ2l0YWxpYycsXG4gICAgICAgICAgICB0YWdOYW1lczogWydpJywgJ2VtJ10sXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHByb3A6ICdmb250LXN0eWxlJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ2l0YWxpYydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VRdWVyeVN0YXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj48aT5JPC9pPjwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1pdGFsaWNcIj48L2k+J1xuICAgICAgICB9LFxuICAgICAgICAndW5kZXJsaW5lJzoge1xuICAgICAgICAgICAgbmFtZTogJ3VuZGVybGluZScsXG4gICAgICAgICAgICBhY3Rpb246ICd1bmRlcmxpbmUnLFxuICAgICAgICAgICAgYXJpYTogJ3VuZGVybGluZScsXG4gICAgICAgICAgICB0YWdOYW1lczogWyd1J10sXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHByb3A6ICd0ZXh0LWRlY29yYXRpb24nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAndW5kZXJsaW5lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZVF1ZXJ5U3RhdGU6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPjx1PlU8L3U+PC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLXVuZGVybGluZVwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdzdHJpa2V0aHJvdWdoJzoge1xuICAgICAgICAgICAgbmFtZTogJ3N0cmlrZXRocm91Z2gnLFxuICAgICAgICAgICAgYWN0aW9uOiAnc3RyaWtldGhyb3VnaCcsXG4gICAgICAgICAgICBhcmlhOiAnc3RyaWtlIHRocm91Z2gnLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFsnc3RyaWtlJ10sXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHByb3A6ICd0ZXh0LWRlY29yYXRpb24nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZVF1ZXJ5U3RhdGU6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxzPkE8L3M+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtc3RyaWtldGhyb3VnaFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdzdXBlcnNjcmlwdCc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdzdXBlcnNjcmlwdCcsXG4gICAgICAgICAgICBhY3Rpb246ICdzdXBlcnNjcmlwdCcsXG4gICAgICAgICAgICBhcmlhOiAnc3VwZXJzY3JpcHQnLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFsnc3VwJ10sXG4gICAgICAgICAgICAvKiBmaXJlZm94IGRvZXNuJ3QgYmVoYXZlIHRoZSB3YXkgd2Ugd2FudCBpdCB0bywgc28gd2UgQ0FOJ1QgdXNlIHF1ZXJ5Q29tbWFuZFN0YXRlIGZvciBzdXBlcnNjcmlwdFxuICAgICAgICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2d1YXJkaWFuL3NjcmliZS9ibG9iL21hc3Rlci9CUk9XU0VSSU5DT05TSVNURU5DSUVTLm1kI2RvY3VtZW50cXVlcnljb21tYW5kc3RhdGUgKi9cbiAgICAgICAgICAgIC8vIHVzZVF1ZXJ5U3RhdGU6IHRydWVcbiAgICAgICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+eDxzdXA+MTwvc3VwPjwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1zdXBlcnNjcmlwdFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdzdWJzY3JpcHQnOiB7XG4gICAgICAgICAgICBuYW1lOiAnc3Vic2NyaXB0JyxcbiAgICAgICAgICAgIGFjdGlvbjogJ3N1YnNjcmlwdCcsXG4gICAgICAgICAgICBhcmlhOiAnc3Vic2NyaXB0JyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ3N1YiddLFxuICAgICAgICAgICAgLyogZmlyZWZveCBkb2Vzbid0IGJlaGF2ZSB0aGUgd2F5IHdlIHdhbnQgaXQgdG8sIHNvIHdlIENBTidUIHVzZSBxdWVyeUNvbW1hbmRTdGF0ZSBmb3Igc3Vic2NyaXB0XG4gICAgICAgICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vZ3VhcmRpYW4vc2NyaWJlL2Jsb2IvbWFzdGVyL0JST1dTRVJJTkNPTlNJU1RFTkNJRVMubWQjZG9jdW1lbnRxdWVyeWNvbW1hbmRzdGF0ZSAqL1xuICAgICAgICAgICAgLy8gdXNlUXVlcnlTdGF0ZTogdHJ1ZVxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj54PHN1Yj4xPC9zdWI+PC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLXN1YnNjcmlwdFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdpbWFnZSc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdpbWFnZScsXG4gICAgICAgICAgICBhY3Rpb246ICdpbWFnZScsXG4gICAgICAgICAgICBhcmlhOiAnaW1hZ2UnLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFsnaW1nJ10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPmltYWdlPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLXBpY3R1cmUtb1wiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdvcmRlcmVkbGlzdCc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdvcmRlcmVkbGlzdCcsXG4gICAgICAgICAgICBhY3Rpb246ICdpbnNlcnRvcmRlcmVkbGlzdCcsXG4gICAgICAgICAgICBhcmlhOiAnb3JkZXJlZCBsaXN0JyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ29sJ10sXG4gICAgICAgICAgICB1c2VRdWVyeVN0YXRlOiB0cnVlLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj4xLjwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1saXN0LW9sXCI+PC9pPidcbiAgICAgICAgfSxcbiAgICAgICAgJ3Vub3JkZXJlZGxpc3QnOiB7XG4gICAgICAgICAgICBuYW1lOiAndW5vcmRlcmVkbGlzdCcsXG4gICAgICAgICAgICBhY3Rpb246ICdpbnNlcnR1bm9yZGVyZWRsaXN0JyxcbiAgICAgICAgICAgIGFyaWE6ICd1bm9yZGVyZWQgbGlzdCcsXG4gICAgICAgICAgICB0YWdOYW1lczogWyd1bCddLFxuICAgICAgICAgICAgdXNlUXVlcnlTdGF0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+JmJ1bGw7PC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWxpc3QtdWxcIj48L2k+J1xuICAgICAgICB9LFxuICAgICAgICAnaW5kZW50Jzoge1xuICAgICAgICAgICAgbmFtZTogJ2luZGVudCcsXG4gICAgICAgICAgICBhY3Rpb246ICdpbmRlbnQnLFxuICAgICAgICAgICAgYXJpYTogJ2luZGVudCcsXG4gICAgICAgICAgICB0YWdOYW1lczogW10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPiZyYXJyOzwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1pbmRlbnRcIj48L2k+J1xuICAgICAgICB9LFxuICAgICAgICAnb3V0ZGVudCc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdvdXRkZW50JyxcbiAgICAgICAgICAgIGFjdGlvbjogJ291dGRlbnQnLFxuICAgICAgICAgICAgYXJpYTogJ291dGRlbnQnLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFtdLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj4mbGFycjs8L2I+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtb3V0ZGVudFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdqdXN0aWZ5Q2VudGVyJzoge1xuICAgICAgICAgICAgbmFtZTogJ2p1c3RpZnlDZW50ZXInLFxuICAgICAgICAgICAgYWN0aW9uOiAnanVzdGlmeUNlbnRlcicsXG4gICAgICAgICAgICBhcmlhOiAnY2VudGVyIGp1c3RpZnknLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFtdLFxuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICBwcm9wOiAndGV4dC1hbGlnbicsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdjZW50ZXInXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj5DPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWFsaWduLWNlbnRlclwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdqdXN0aWZ5RnVsbCc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdqdXN0aWZ5RnVsbCcsXG4gICAgICAgICAgICBhY3Rpb246ICdqdXN0aWZ5RnVsbCcsXG4gICAgICAgICAgICBhcmlhOiAnZnVsbCBqdXN0aWZ5JyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbXSxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgcHJvcDogJ3RleHQtYWxpZ24nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnanVzdGlmeSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPko8L2I+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtYWxpZ24tanVzdGlmeVwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdqdXN0aWZ5TGVmdCc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdqdXN0aWZ5TGVmdCcsXG4gICAgICAgICAgICBhY3Rpb246ICdqdXN0aWZ5TGVmdCcsXG4gICAgICAgICAgICBhcmlhOiAnbGVmdCBqdXN0aWZ5JyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbXSxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgcHJvcDogJ3RleHQtYWxpZ24nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnbGVmdCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPkw8L2I+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtYWxpZ24tbGVmdFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgICdqdXN0aWZ5UmlnaHQnOiB7XG4gICAgICAgICAgICBuYW1lOiAnanVzdGlmeVJpZ2h0JyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2p1c3RpZnlSaWdodCcsXG4gICAgICAgICAgICBhcmlhOiAncmlnaHQganVzdGlmeScsXG4gICAgICAgICAgICB0YWdOYW1lczogW10sXG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIHByb3A6ICd0ZXh0LWFsaWduJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3JpZ2h0J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+UjwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1hbGlnbi1yaWdodFwiPjwvaT4nXG4gICAgICAgIH0sXG4gICAgICAgIC8vIEtub3duIGlubGluZSBlbGVtZW50cyB0aGF0IGFyZSBub3QgcmVtb3ZlZCwgb3Igbm90IHJlbW92ZWQgY29uc2lzdGFudGx5IGFjcm9zcyBicm93c2VyczpcbiAgICAgICAgLy8gPHNwYW4+LCA8bGFiZWw+LCA8YnI+XG4gICAgICAgICdyZW1vdmVGb3JtYXQnOiB7XG4gICAgICAgICAgICBuYW1lOiAncmVtb3ZlRm9ybWF0JyxcbiAgICAgICAgICAgIGFyaWE6ICdyZW1vdmUgZm9ybWF0dGluZycsXG4gICAgICAgICAgICBhY3Rpb246ICdyZW1vdmVGb3JtYXQnLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj5YPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWVyYXNlclwiPjwvaT4nXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqKioqIEJ1dHRvbnMgZm9yIGFwcGVuZGluZyBibG9jayBlbGVtZW50cyAoYXBwZW5kLTxlbGVtZW50PiBhY3Rpb24pICoqKioqL1xuXG4gICAgICAgICdxdW90ZSc6IHtcbiAgICAgICAgICAgIG5hbWU6ICdxdW90ZScsXG4gICAgICAgICAgICBhY3Rpb246ICdhcHBlbmQtYmxvY2txdW90ZScsXG4gICAgICAgICAgICBhcmlhOiAnYmxvY2txdW90ZScsXG4gICAgICAgICAgICB0YWdOYW1lczogWydibG9ja3F1b3RlJ10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPiZsZHF1bzs8L2I+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtcXVvdGUtcmlnaHRcIj48L2k+J1xuICAgICAgICB9LFxuICAgICAgICAncHJlJzoge1xuICAgICAgICAgICAgbmFtZTogJ3ByZScsXG4gICAgICAgICAgICBhY3Rpb246ICdhcHBlbmQtcHJlJyxcbiAgICAgICAgICAgIGFyaWE6ICdwcmVmb3JtYXR0ZWQgdGV4dCcsXG4gICAgICAgICAgICB0YWdOYW1lczogWydwcmUnXSxcbiAgICAgICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+MDEwMTwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1jb2RlIGZhLWxnXCI+PC9pPidcbiAgICAgICAgfSxcbiAgICAgICAgJ2gxJzoge1xuICAgICAgICAgICAgbmFtZTogJ2gxJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2FwcGVuZC1oMScsXG4gICAgICAgICAgICBhcmlhOiAnaGVhZGVyIHR5cGUgb25lJyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ2gxJ10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPkgxPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWhlYWRlclwiPjxzdXA+MTwvc3VwPidcbiAgICAgICAgfSxcbiAgICAgICAgJ2gyJzoge1xuICAgICAgICAgICAgbmFtZTogJ2gyJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2FwcGVuZC1oMicsXG4gICAgICAgICAgICBhcmlhOiAnaGVhZGVyIHR5cGUgdHdvJyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ2gyJ10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPkgyPC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWhlYWRlclwiPjxzdXA+Mjwvc3VwPidcbiAgICAgICAgfSxcbiAgICAgICAgJ2gzJzoge1xuICAgICAgICAgICAgbmFtZTogJ2gzJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2FwcGVuZC1oMycsXG4gICAgICAgICAgICBhcmlhOiAnaGVhZGVyIHR5cGUgdGhyZWUnLFxuICAgICAgICAgICAgdGFnTmFtZXM6IFsnaDMnXSxcbiAgICAgICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+SDM8L2I+JyxcbiAgICAgICAgICAgIGNvbnRlbnRGQTogJzxpIGNsYXNzPVwiZmEgZmEtaGVhZGVyXCI+PHN1cD4zPC9zdXA+J1xuICAgICAgICB9LFxuICAgICAgICAnaDQnOiB7XG4gICAgICAgICAgICBuYW1lOiAnaDQnLFxuICAgICAgICAgICAgYWN0aW9uOiAnYXBwZW5kLWg0JyxcbiAgICAgICAgICAgIGFyaWE6ICdoZWFkZXIgdHlwZSBmb3VyJyxcbiAgICAgICAgICAgIHRhZ05hbWVzOiBbJ2g0J10sXG4gICAgICAgICAgICBjb250ZW50RGVmYXVsdDogJzxiPkg0PC9iPicsXG4gICAgICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWhlYWRlclwiPjxzdXA+NDwvc3VwPidcbiAgICAgICAgfSxcbiAgICAgICAgJ2g1Jzoge1xuICAgICAgICAgICAgbmFtZTogJ2g1JyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2FwcGVuZC1oNScsXG4gICAgICAgICAgICBhcmlhOiAnaGVhZGVyIHR5cGUgZml2ZScsXG4gICAgICAgICAgICB0YWdOYW1lczogWydoNSddLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj5INTwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1oZWFkZXJcIj48c3VwPjU8L3N1cD4nXG4gICAgICAgIH0sXG4gICAgICAgICdoNic6IHtcbiAgICAgICAgICAgIG5hbWU6ICdoNicsXG4gICAgICAgICAgICBhY3Rpb246ICdhcHBlbmQtaDYnLFxuICAgICAgICAgICAgYXJpYTogJ2hlYWRlciB0eXBlIHNpeCcsXG4gICAgICAgICAgICB0YWdOYW1lczogWydoNiddLFxuICAgICAgICAgICAgY29udGVudERlZmF1bHQ6ICc8Yj5INjwvYj4nLFxuICAgICAgICAgICAgY29udGVudEZBOiAnPGkgY2xhc3M9XCJmYSBmYS1oZWFkZXJcIj48c3VwPjY8L3N1cD4nXG4gICAgICAgIH1cbiAgICB9O1xuXG59KSgpO1xuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKiBCYXNlIGZ1bmN0aW9uYWxpdHkgZm9yIGFuIGV4dGVuc2lvbiB3aGljaCB3aWxsIGRpc3BsYXlcbiAgICAgKiBhICdmb3JtJyBpbnNpZGUgdGhlIHRvb2xiYXJcbiAgICAgKi9cbiAgICB2YXIgRm9ybUV4dGVuc2lvbiA9IE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbi5leHRlbmQoe1xuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbi5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGRlZmF1bHQgbGFiZWxzIGZvciB0aGUgZm9ybSBidXR0b25zXG4gICAgICAgIGZvcm1TYXZlTGFiZWw6ICcmIzEwMDAzOycsXG4gICAgICAgIGZvcm1DbG9zZUxhYmVsOiAnJnRpbWVzOycsXG5cbiAgICAgICAgLyogaGFzRm9ybTogW2Jvb2xlYW5dXG4gICAgICAgICAqXG4gICAgICAgICAqIFNldHRpbmcgdGhpcyB0byB0cnVlIHdpbGwgY2F1c2UgZ2V0Rm9ybSgpIHRvIGJlIGNhbGxlZFxuICAgICAgICAgKiB3aGVuIHRoZSB0b29sYmFyIGlzIGNyZWF0ZWQsIHNvIHRoZSBmb3JtIGNhbiBiZSBhcHBlbmRlZFxuICAgICAgICAgKiBpbnNpZGUgdGhlIHRvb2xiYXIgY29udGFpbmVyXG4gICAgICAgICAqL1xuICAgICAgICBoYXNGb3JtOiB0cnVlLFxuXG4gICAgICAgIC8qIGdldEZvcm06IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogV2hlbiBoYXNGb3JtIGlzIHRydWUsIHRoaXMgZnVuY3Rpb24gbXVzdCBiZSBpbXBsZW1lbnRlZFxuICAgICAgICAgKiBhbmQgcmV0dXJuIGEgRE9NIEVsZW1lbnQgd2hpY2ggd2lsbCBiZSBhcHBlbmRlZCB0b1xuICAgICAgICAgKiB0aGUgdG9vbGJhciBjb250YWluZXIuIFRoZSBmb3JtIHNob3VsZCBzdGFydCBoaWRkZW4sIGFuZFxuICAgICAgICAgKiB0aGUgZXh0ZW5zaW9uIGNhbiBjaG9vc2Ugd2hlbiB0byBoaWRlL3Nob3cgaXRcbiAgICAgICAgICovXG4gICAgICAgIGdldEZvcm06IGZ1bmN0aW9uICgpIHt9LFxuXG4gICAgICAgIC8qIGlzRGlzcGxheWVkOiBbZnVuY3Rpb24gKCldXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlL2ZhbHNlIHJlZmxlY3RpbmdcbiAgICAgICAgICogd2hldGhlciB0aGUgZm9ybSBpcyBjdXJyZW50bHkgZGlzcGxheWVkXG4gICAgICAgICAqL1xuICAgICAgICBpc0Rpc3BsYXllZDogZnVuY3Rpb24gKCkge30sXG5cbiAgICAgICAgLyogaGlkZUZvcm06IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgaGlkZSB0aGUgZm9ybSBlbGVtZW50IGluc2lkZVxuICAgICAgICAgKiB0aGUgdG9vbGJhciBjb250YWluZXJcbiAgICAgICAgICovXG4gICAgICAgIGhpZGVGb3JtOiBmdW5jdGlvbiAoKSB7fSxcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqIEhlbHBlcnMgKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqIFRoZSBmb2xsb3dpbmcgYXJlIGhlbHBlcnMgdGhhdCBhcmUgZWl0aGVyIHNldCBieSBNZWRpdW1FZGl0b3JcbiAgICAgICAgICogZHVyaW5nIGluaXRpYWxpemF0aW9uLCBvciBhcmUgaGVscGVyIG1ldGhvZHMgd2hpY2ggZWl0aGVyXG4gICAgICAgICAqIHJvdXRlIGNhbGxzIHRvIHRoZSBNZWRpdW1FZGl0b3IgaW5zdGFuY2Ugb3IgcHJvdmlkZSBjb21tb25cbiAgICAgICAgICogZnVuY3Rpb25hbGl0eSBmb3IgYWxsIGZvcm0gZXh0ZW5zaW9uc1xuICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIHNob3dUb29sYmFyRGVmYXVsdEFjdGlvbnM6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSGVscGVyIG1ldGhvZCB3aGljaCB3aWxsIHR1cm4gYmFjayB0aGUgdG9vbGJhciBhZnRlciBjYW5jZWxpbmdcbiAgICAgICAgICogdGhlIGN1c3RvbWl6ZWQgZm9ybVxuICAgICAgICAgKi9cbiAgICAgICAgc2hvd1Rvb2xiYXJEZWZhdWx0QWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRvb2xiYXIgPSB0aGlzLmJhc2UuZ2V0RXh0ZW5zaW9uQnlOYW1lKCd0b29sYmFyJyk7XG4gICAgICAgICAgICBpZiAodG9vbGJhcikge1xuICAgICAgICAgICAgICAgIHRvb2xiYXIuc2hvd1Rvb2xiYXJEZWZhdWx0QWN0aW9ucygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qIGhpZGVUb29sYmFyRGVmYXVsdEFjdGlvbnM6IFtmdW5jdGlvbiAoKV1cbiAgICAgICAgICpcbiAgICAgICAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgaGlkZSB0aGUgZGVmYXVsdCBjb250ZW50cyBvZiB0aGVcbiAgICAgICAgICogdG9vbGJhciwgYnV0IGxlYXZlIHRoZSB0b29sYmFyIGNvbnRhaW5lciBpbiB0aGUgc2FtZSBzdGF0ZVxuICAgICAgICAgKiB0byBhbGxvdyBhIGZvcm0gdG8gZGlzcGxheSBpdHMgY3VzdG9tIGNvbnRlbnRzIGluc2lkZSB0aGUgdG9vbGJhclxuICAgICAgICAgKi9cbiAgICAgICAgaGlkZVRvb2xiYXJEZWZhdWx0QWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRvb2xiYXIgPSB0aGlzLmJhc2UuZ2V0RXh0ZW5zaW9uQnlOYW1lKCd0b29sYmFyJyk7XG4gICAgICAgICAgICBpZiAodG9vbGJhcikge1xuICAgICAgICAgICAgICAgIHRvb2xiYXIuaGlkZVRvb2xiYXJEZWZhdWx0QWN0aW9ucygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qIHNldFRvb2xiYXJQb3NpdGlvbjogW2Z1bmN0aW9uICgpXVxuICAgICAgICAgKlxuICAgICAgICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggd2lsbCB1cGRhdGUgdGhlIHNpemUgYW5kIHBvc2l0aW9uXG4gICAgICAgICAqIG9mIHRoZSB0b29sYmFyIGJhc2VkIG9uIHRoZSB0b29sYmFyIGNvbnRlbnQgYW5kIHRoZSBjdXJyZW50XG4gICAgICAgICAqIHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3Mgc2VsZWN0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBzZXRUb29sYmFyUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0b29sYmFyID0gdGhpcy5iYXNlLmdldEV4dGVuc2lvbkJ5TmFtZSgndG9vbGJhcicpO1xuICAgICAgICAgICAgaWYgKHRvb2xiYXIpIHtcbiAgICAgICAgICAgICAgICB0b29sYmFyLnNldFRvb2xiYXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5mb3JtID0gRm9ybUV4dGVuc2lvbjtcbn0pKCk7XG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBBbmNob3JGb3JtID0gTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuZm9ybS5leHRlbmQoe1xuICAgICAgICAvKiBBbmNob3IgRm9ybSBPcHRpb25zICovXG5cbiAgICAgICAgLyogY3VzdG9tQ2xhc3NPcHRpb246IFtzdHJpbmddICAocHJldmlvdXNseSBvcHRpb25zLmFuY2hvckJ1dHRvbiArIG9wdGlvbnMuYW5jaG9yQnV0dG9uQ2xhc3MpXG4gICAgICAgICAqIEN1c3RvbSBjbGFzcyBuYW1lIHRoZSB1c2VyIGNhbiBvcHRpb25hbGx5IGhhdmUgYWRkZWQgdG8gdGhlaXIgY3JlYXRlZCBsaW5rcyAoaWUgJ2J1dHRvbicpLlxuICAgICAgICAgKiBJZiBwYXNzZWQgYXMgYSBub24tZW1wdHkgc3RyaW5nLCBhIGNoZWNrYm94IHdpbGwgYmUgZGlzcGxheWVkIGFsbG93aW5nIHRoZSB1c2VyIHRvIGNob29zZVxuICAgICAgICAgKiB3aGV0aGVyIHRvIGhhdmUgdGhlIGNsYXNzIGFkZGVkIHRvIHRoZSBjcmVhdGVkIGxpbmsgb3Igbm90LlxuICAgICAgICAgKi9cbiAgICAgICAgY3VzdG9tQ2xhc3NPcHRpb246IG51bGwsXG5cbiAgICAgICAgLyogY3VzdG9tQ2xhc3NPcHRpb25UZXh0OiBbc3RyaW5nXVxuICAgICAgICAgKiB0ZXh0IHRvIGJlIHNob3duIGluIHRoZSBjaGVja2JveCB3aGVuIHRoZSBfX2N1c3RvbUNsYXNzT3B0aW9uX18gaXMgYmVpbmcgdXNlZC5cbiAgICAgICAgICovXG4gICAgICAgIGN1c3RvbUNsYXNzT3B0aW9uVGV4dDogJ0J1dHRvbicsXG5cbiAgICAgICAgLyogbGlua1ZhbGlkYXRpb246IFtib29sZWFuXSAgKHByZXZpb3VzbHkgb3B0aW9ucy5jaGVja0xpbmtGb3JtYXQpXG4gICAgICAgICAqIGVuYWJsZXMvZGlzYWJsZXMgY2hlY2sgZm9yIGNvbW1vbiBVUkwgcHJvdG9jb2xzIG9uIGFuY2hvciBsaW5rcy5cbiAgICAgICAgICovXG4gICAgICAgIGxpbmtWYWxpZGF0aW9uOiBmYWxzZSxcblxuICAgICAgICAvKiBwbGFjZWhvbGRlclRleHQ6IFtzdHJpbmddICAocHJldmlvdXNseSBvcHRpb25zLmFuY2hvcklucHV0UGxhY2Vob2xkZXIpXG4gICAgICAgICAqIHRleHQgdG8gYmUgc2hvd24gYXMgcGxhY2Vob2xkZXIgb2YgdGhlIGFuY2hvciBpbnB1dC5cbiAgICAgICAgICovXG4gICAgICAgIHBsYWNlaG9sZGVyVGV4dDogJ1Bhc3RlIG9yIHR5cGUgYSBsaW5rJyxcblxuICAgICAgICAvKiB0YXJnZXRDaGVja2JveDogW2Jvb2xlYW5dICAocHJldmlvdXNseSBvcHRpb25zLmFuY2hvclRhcmdldClcbiAgICAgICAgICogZW5hYmxlcy9kaXNhYmxlcyBkaXNwbGF5aW5nIGEgXCJPcGVuIGluIG5ldyB3aW5kb3dcIiBjaGVja2JveCwgd2hpY2ggd2hlbiBjaGVja2VkXG4gICAgICAgICAqIGNoYW5nZXMgdGhlIGB0YXJnZXRgIGF0dHJpYnV0ZSBvZiB0aGUgY3JlYXRlZCBsaW5rLlxuICAgICAgICAgKi9cbiAgICAgICAgdGFyZ2V0Q2hlY2tib3g6IGZhbHNlLFxuXG4gICAgICAgIC8qIHRhcmdldENoZWNrYm94VGV4dDogW3N0cmluZ10gIChwcmV2aW91c2x5IG9wdGlvbnMuYW5jaG9ySW5wdXRDaGVja2JveExhYmVsKVxuICAgICAgICAgKiB0ZXh0IHRvIGJlIHNob3duIGluIHRoZSBjaGVja2JveCBlbmFibGVkIHZpYSB0aGUgX190YXJnZXRDaGVja2JveF9fIG9wdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIHRhcmdldENoZWNrYm94VGV4dDogJ09wZW4gaW4gbmV3IHdpbmRvdycsXG5cbiAgICAgICAgLy8gT3B0aW9ucyBmb3IgdGhlIEJ1dHRvbiBiYXNlIGNsYXNzXG4gICAgICAgIG5hbWU6ICdhbmNob3InLFxuICAgICAgICBhY3Rpb246ICdjcmVhdGVMaW5rJyxcbiAgICAgICAgYXJpYTogJ2xpbmsnLFxuICAgICAgICB0YWdOYW1lczogWydhJ10sXG4gICAgICAgIGNvbnRlbnREZWZhdWx0OiAnPGI+IzwvYj4nLFxuICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLWxpbmtcIj48L2k+JyxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5mb3JtLnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZUtleWRvd24nLCB0aGlzLmhhbmRsZUtleWRvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGJ1dHRvbiB0aGUgdG9vbGJhciBpcyBjbGlja2VkXG4gICAgICAgIC8vIE92ZXJyaWRlcyBCdXR0b25FeHRlbnNpb24uaGFuZGxlQ2xpY2tcbiAgICAgICAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvblJhbmdlKHRoaXMuZG9jdW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAocmFuZ2Uuc3RhcnRDb250YWluZXIubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnIHx8XG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kQ29udGFpbmVyLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJyB8fFxuICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmdldENsb3Nlc3RUYWcoTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3RlZFBhcmVudEVsZW1lbnQocmFuZ2UpLCAnYScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FjdGlvbigndW5saW5rJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5pc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93Rm9ybSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdXNlciBoaXRzIHRoZSBkZWZpbmVkIHNob3J0Y3V0IChDVFJMIC8gQ09NTUFORCArIEspXG4gICAgICAgIGhhbmRsZUtleWRvd246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLmlzS2V5KGV2ZW50LCBNZWRpdW1FZGl0b3IudXRpbC5rZXlDb2RlLkspICYmIE1lZGl1bUVkaXRvci51dGlsLmlzTWV0YUN0cmxLZXkoZXZlbnQpICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlQ2xpY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIENhbGxlZCBieSBtZWRpdW0tZWRpdG9yIHRvIGFwcGVuZCBmb3JtIHRvIHRoZSB0b29sYmFyXG4gICAgICAgIGdldEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mb3JtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gdGhpcy5jcmVhdGVGb3JtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBbXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibWVkaXVtLWVkaXRvci10b29sYmFyLWlucHV0XCIgcGxhY2Vob2xkZXI9XCInLCB0aGlzLnBsYWNlaG9sZGVyVGV4dCwgJ1wiPidcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHRlbXBsYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJtZWRpdW0tZWRpdG9yLXRvb2xiYXItc2F2ZVwiPicsXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRFZGl0b3JPcHRpb24oJ2J1dHRvbkxhYmVscycpID09PSAnZm9udGF3ZXNvbWUnID8gJzxpIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj48L2k+JyA6IHRoaXMuZm9ybVNhdmVMYWJlbCxcbiAgICAgICAgICAgICAgICAnPC9hPidcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRlbXBsYXRlLnB1c2goJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJtZWRpdW0tZWRpdG9yLXRvb2xiYXItY2xvc2VcIj4nLFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RWRpdG9yT3B0aW9uKCdidXR0b25MYWJlbHMnKSA9PT0gJ2ZvbnRhd2Vzb21lJyA/ICc8aSBjbGFzcz1cImZhIGZhLXRpbWVzXCI+PC9pPicgOiB0aGlzLmZvcm1DbG9zZUxhYmVsLFxuICAgICAgICAgICAgICAgICc8L2E+Jyk7XG5cbiAgICAgICAgICAgIC8vIGJvdGggb2YgdGhlc2Ugb3B0aW9ucyBhcmUgc2xpZ2h0bHkgbW9vdCB3aXRoIHRoZSBhYmlsaXR5IHRvXG4gICAgICAgICAgICAvLyBvdmVycmlkZSB0aGUgdmFyaW91cyBmb3JtIGJ1aWxkdXAvc2VyaWFsaXplIGZ1bmN0aW9ucy5cblxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Q2hlY2tib3gpIHtcbiAgICAgICAgICAgICAgICAvLyBmaXhtZTogaWRlYWxseSwgdGhpcyB0YXJnZXRDaGVja2JveFRleHQgd291bGQgYmUgYSBmb3JtTGFiZWwgdG9vLFxuICAgICAgICAgICAgICAgIC8vIGZpZ3VyZSBvdXQgaG93IHRvIGRlcHJlY2F0ZT8gYWxzbyBjb25zaWRlciBgZmEtYCBpY29uIGRlZmF1bHQgaW1wbGNhdGlvbnMuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtZWRpdW0tZWRpdG9yLXRvb2xiYXItZm9ybS1yb3dcIj4nLFxuICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNsYXNzPVwibWVkaXVtLWVkaXRvci10b29sYmFyLWFuY2hvci10YXJnZXRcIj4nLFxuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsPicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Q2hlY2tib3hUZXh0LFxuICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nLFxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUNsYXNzT3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gZml4bWU6IGV4cG9zZSB0aGlzIGBCdXR0b25gIHRleHQgYXMgYSBmb3JtTGFiZWwgcHJvcGVydHksIHRvb1xuICAgICAgICAgICAgICAgIC8vIGFuZCBwcm92aWRlIHNpbWlsYXIgYWNjZXNzIHRvIGEgYGZhLWAgaWNvbiBkZWZhdWx0LlxuICAgICAgICAgICAgICAgIHRlbXBsYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWVkaXVtLWVkaXRvci10b29sYmFyLWZvcm0tcm93XCI+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cIm1lZGl1bS1lZGl0b3ItdG9vbGJhci1hbmNob3ItYnV0dG9uXCI+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbD4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUNsYXNzT3B0aW9uVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyxcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUuam9pbignJyk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvLyBVc2VkIGJ5IG1lZGl1bS1lZGl0b3Igd2hlbiB0aGUgZGVmYXVsdCB0b29sYmFyIGlzIHRvIGJlIGRpc3BsYXllZFxuICAgICAgICBpc0Rpc3BsYXllZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rm9ybSgpLnN0eWxlLmRpc3BsYXkgPT09ICdibG9jayc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZUZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0Rm9ybSgpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmdldElucHV0KCkudmFsdWUgPSAnJztcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93Rm9ybTogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuZ2V0SW5wdXQoKSxcbiAgICAgICAgICAgICAgICB0YXJnZXRDaGVja2JveCA9IHRoaXMuZ2V0QW5jaG9yVGFyZ2V0Q2hlY2tib3goKSxcbiAgICAgICAgICAgICAgICBidXR0b25DaGVja2JveCA9IHRoaXMuZ2V0QW5jaG9yQnV0dG9uQ2hlY2tib3goKTtcblxuICAgICAgICAgICAgb3B0cyA9IG9wdHMgfHwgeyB1cmw6ICcnIH07XG4gICAgICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBzdXBwb3J0IHRoZSAnc3RyaW5nJyBhcmd1bWVudCBpbiA2LjAuMFxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogb3B0c1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYmFzZS5zYXZlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLmhpZGVUb29sYmFyRGVmYXVsdEFjdGlvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuZ2V0Rm9ybSgpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgdGhpcy5zZXRUb29sYmFyUG9zaXRpb24oKTtcblxuICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBvcHRzLnVybDtcbiAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSB0YXJnZXQgY2hlY2tib3gsIHdlIHdhbnQgaXQgdG8gYmUgY2hlY2tlZC91bmNoZWNrZWRcbiAgICAgICAgICAgIC8vIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGV4aXN0aW5nIGxpbmsgaGFzIHRhcmdldD1fYmxhbmtcbiAgICAgICAgICAgIGlmICh0YXJnZXRDaGVja2JveCkge1xuICAgICAgICAgICAgICAgIHRhcmdldENoZWNrYm94LmNoZWNrZWQgPSBvcHRzLnRhcmdldCA9PT0gJ19ibGFuayc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBjdXN0b20gY2xhc3MgY2hlY2tib3gsIHdlIHdhbnQgaXQgdG8gYmUgY2hlY2tlZC91bmNoZWNrZWRcbiAgICAgICAgICAgIC8vIGJhc2VkIG9uIHdoZXRoZXIgYW4gZXhpc3RpbmcgbGluayBhbHJlYWR5IGhhcyB0aGUgY2xhc3NcbiAgICAgICAgICAgIGlmIChidXR0b25DaGVja2JveCkge1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSBvcHRzLmJ1dHRvbkNsYXNzID8gb3B0cy5idXR0b25DbGFzcy5zcGxpdCgnICcpIDogW107XG4gICAgICAgICAgICAgICAgYnV0dG9uQ2hlY2tib3guY2hlY2tlZCA9IChjbGFzc0xpc3QuaW5kZXhPZih0aGlzLmN1c3RvbUNsYXNzT3B0aW9uKSAhPT0gLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIENhbGxlZCBieSBjb3JlIHdoZW4gdGVhcmluZyBkb3duIG1lZGl1bS1lZGl0b3IgKGRlc3Ryb3kpXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mb3JtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5mb3JtLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmZvcm0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5mb3JtO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGNvcmUgbWV0aG9kc1xuXG4gICAgICAgIGdldEZvcm1PcHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBubyBub3Rpb24gb2YgcHJpdmF0ZSBmdW5jdGlvbnM/IHdhbnRlZCBgX2dldEZvcm1PcHRzYFxuICAgICAgICAgICAgdmFyIHRhcmdldENoZWNrYm94ID0gdGhpcy5nZXRBbmNob3JUYXJnZXRDaGVja2JveCgpLFxuICAgICAgICAgICAgICAgIGJ1dHRvbkNoZWNrYm94ID0gdGhpcy5nZXRBbmNob3JCdXR0b25DaGVja2JveCgpLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy5nZXRJbnB1dCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlua1ZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICBvcHRzLnVybCA9IHRoaXMuY2hlY2tMaW5rRm9ybWF0KG9wdHMudXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0cy50YXJnZXQgPSAnX3NlbGYnO1xuICAgICAgICAgICAgaWYgKHRhcmdldENoZWNrYm94ICYmIHRhcmdldENoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICBvcHRzLnRhcmdldCA9ICdfYmxhbmsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYnV0dG9uQ2hlY2tib3ggJiYgYnV0dG9uQ2hlY2tib3guY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgIG9wdHMuYnV0dG9uQ2xhc3MgPSB0aGlzLmN1c3RvbUNsYXNzT3B0aW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3B0cztcbiAgICAgICAgfSxcblxuICAgICAgICBkb0Zvcm1TYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMuZ2V0Rm9ybU9wdHMoKTtcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGVGb3JtU2F2ZShvcHRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjb21wbGV0ZUZvcm1TYXZlOiBmdW5jdGlvbiAob3B0cykge1xuICAgICAgICAgICAgdGhpcy5iYXNlLnJlc3RvcmVTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHRoaXMuZXhlY0FjdGlvbih0aGlzLmFjdGlvbiwgb3B0cyk7XG4gICAgICAgICAgICB0aGlzLmJhc2UuY2hlY2tTZWxlY3Rpb24oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjaGVja0xpbmtGb3JtYXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlID0gL14oaHR0cHM/fGZ0cHM/fHJ0bXB0Pyk6XFwvXFwvfG1haWx0bzovO1xuICAgICAgICAgICAgcmV0dXJuIChyZS50ZXN0KHZhbHVlKSA/ICcnIDogJ2h0dHA6Ly8nKSArIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRvRm9ybUNhbmNlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5iYXNlLnJlc3RvcmVTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHRoaXMuYmFzZS5jaGVja1NlbGVjdGlvbigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGZvcm0gY3JlYXRpb24gYW5kIGV2ZW50IGhhbmRsaW5nXG4gICAgICAgIGF0dGFjaEZvcm1FdmVudHM6IGZ1bmN0aW9uIChmb3JtKSB7XG4gICAgICAgICAgICB2YXIgY2xvc2UgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy5tZWRpdW0tZWRpdG9yLXRvb2xiYXItY2xvc2UnKSxcbiAgICAgICAgICAgICAgICBzYXZlID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcubWVkaXVtLWVkaXRvci10b29sYmFyLXNhdmUnKSxcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGZvcm0ucXVlcnlTZWxlY3RvcignLm1lZGl1bS1lZGl0b3ItdG9vbGJhci1pbnB1dCcpO1xuXG4gICAgICAgICAgICAvLyBIYW5kbGUgY2xpY2tzIG9uIHRoZSBmb3JtIGl0c2VsZlxuICAgICAgICAgICAgdGhpcy5vbihmb3JtLCAnY2xpY2snLCB0aGlzLmhhbmRsZUZvcm1DbGljay5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgLy8gSGFuZGxlIHR5cGluZyBpbiB0aGUgdGV4dGJveFxuICAgICAgICAgICAgdGhpcy5vbihpbnB1dCwgJ2tleXVwJywgdGhpcy5oYW5kbGVUZXh0Ym94S2V5dXAuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBjbG9zZSBidXR0b24gY2xpY2tzXG4gICAgICAgICAgICB0aGlzLm9uKGNsb3NlLCAnY2xpY2snLCB0aGlzLmhhbmRsZUNsb3NlQ2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBzYXZlIGJ1dHRvbiBjbGlja3MgKGNhcHR1cmUpXG4gICAgICAgICAgICB0aGlzLm9uKHNhdmUsICdjbGljaycsIHRoaXMuaGFuZGxlU2F2ZUNsaWNrLmJpbmQodGhpcyksIHRydWUpO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlRm9ybTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRvYyA9IHRoaXMuZG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgZm9ybSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICAgICAgLy8gQW5jaG9yIEZvcm0gKGRpdilcbiAgICAgICAgICAgIGZvcm0uY2xhc3NOYW1lID0gJ21lZGl1bS1lZGl0b3ItdG9vbGJhci1mb3JtJztcbiAgICAgICAgICAgIGZvcm0uaWQgPSAnbWVkaXVtLWVkaXRvci10b29sYmFyLWZvcm0tYW5jaG9yLScgKyB0aGlzLmdldEVkaXRvcklkKCk7XG4gICAgICAgICAgICBmb3JtLmlubmVySFRNTCA9IHRoaXMuZ2V0VGVtcGxhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoRm9ybUV2ZW50cyhmb3JtKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0SW5wdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEZvcm0oKS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5tZWRpdW0tZWRpdG9yLXRvb2xiYXItaW5wdXQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBbmNob3JUYXJnZXRDaGVja2JveDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rm9ybSgpLnF1ZXJ5U2VsZWN0b3IoJy5tZWRpdW0tZWRpdG9yLXRvb2xiYXItYW5jaG9yLXRhcmdldCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEFuY2hvckJ1dHRvbkNoZWNrYm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGb3JtKCkucXVlcnlTZWxlY3RvcignLm1lZGl1bS1lZGl0b3ItdG9vbGJhci1hbmNob3ItYnV0dG9uJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlVGV4dGJveEtleXVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIEZvciBFTlRFUiAtPiBjcmVhdGUgdGhlIGFuY2hvclxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuRU5URVIpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZG9Gb3JtU2F2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRm9yIEVTQ0FQRSAtPiBjbG9zZSB0aGUgZm9ybVxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuRVNDQVBFKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvRm9ybUNhbmNlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUZvcm1DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgbm90IHRvIGhpZGUgZm9ybSB3aGVuIGNsaWNraW5nIGluc2lkZSB0aGUgZm9ybVxuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlU2F2ZUNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIENsaWNraW5nIFNhdmUgLT4gY3JlYXRlIHRoZSBhbmNob3JcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLmRvRm9ybVNhdmUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVDbG9zZUNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIENsaWNrIENsb3NlIC0+IGNsb3NlIHRoZSBmb3JtXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5kb0Zvcm1DYW5jZWwoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuYW5jaG9yID0gQW5jaG9yRm9ybTtcbn0oKSk7XG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBBbmNob3JQcmV2aWV3ID0gTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5leHRlbmQoe1xuICAgICAgICBuYW1lOiAnYW5jaG9yLXByZXZpZXcnLFxuXG4gICAgICAgIC8vIEFuY2hvciBQcmV2aWV3IE9wdGlvbnNcblxuICAgICAgICAvKiBoaWRlRGVsYXk6IFtudW1iZXJdICAocHJldmlvdXNseSBvcHRpb25zLmFuY2hvclByZXZpZXdIaWRlRGVsYXkpXG4gICAgICAgICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHNob3cgdGhlIGFuY2hvciB0YWcgcHJldmlldyBhZnRlciB0aGUgbW91c2UgaGFzIGxlZnQgdGhlIGFuY2hvciB0YWcuXG4gICAgICAgICAqL1xuICAgICAgICBoaWRlRGVsYXk6IDUwMCxcblxuICAgICAgICAvKiBwcmV2aWV3VmFsdWVTZWxlY3RvcjogW3N0cmluZ11cbiAgICAgICAgICogdGhlIGRlZmF1bHQgc2VsZWN0b3IgdG8gbG9jYXRlIHdoZXJlIHRvIHB1dCB0aGUgYWN0aXZlQW5jaG9yIHZhbHVlIGluIHRoZSBwcmV2aWV3XG4gICAgICAgICAqL1xuICAgICAgICBwcmV2aWV3VmFsdWVTZWxlY3RvcjogJ2EnLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldyA9IHRoaXMuY3JlYXRlUHJldmlldygpO1xuXG4gICAgICAgICAgICB0aGlzLmdldEVkaXRvck9wdGlvbignZWxlbWVudHNDb250YWluZXInKS5hcHBlbmRDaGlsZCh0aGlzLmFuY2hvclByZXZpZXcpO1xuXG4gICAgICAgICAgICB0aGlzLmF0dGFjaFRvRWRpdGFibGVzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0UHJldmlld0VsZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFuY2hvclByZXZpZXc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlUHJldmlldzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGVsID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICAgICAgZWwuaWQgPSAnbWVkaXVtLWVkaXRvci1hbmNob3ItcHJldmlldy0nICsgdGhpcy5nZXRFZGl0b3JJZCgpO1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ21lZGl1bS1lZGl0b3ItYW5jaG9yLXByZXZpZXcnO1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gdGhpcy5nZXRUZW1wbGF0ZSgpO1xuXG4gICAgICAgICAgICB0aGlzLm9uKGVsLCAnY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cIm1lZGl1bS1lZGl0b3ItdG9vbGJhci1hbmNob3ItcHJldmlld1wiIGlkPVwibWVkaXVtLWVkaXRvci10b29sYmFyLWFuY2hvci1wcmV2aWV3XCI+JyArXG4gICAgICAgICAgICAgICAgJyAgICA8YSBjbGFzcz1cIm1lZGl1bS1lZGl0b3ItdG9vbGJhci1hbmNob3ItcHJldmlldy1pbm5lclwiPjwvYT4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgfSxcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hbmNob3JQcmV2aWV3KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYW5jaG9yUHJldmlldy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuYW5jaG9yUHJldmlldyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFuY2hvclByZXZpZXc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZVByZXZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5jbGFzc0xpc3QucmVtb3ZlKCdtZWRpdW0tZWRpdG9yLWFuY2hvci1wcmV2aWV3LWFjdGl2ZScpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVBbmNob3IgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3dQcmV2aWV3OiBmdW5jdGlvbiAoYW5jaG9yRWwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFuY2hvclByZXZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKCdtZWRpdW0tZWRpdG9yLWFuY2hvci1wcmV2aWV3LWFjdGl2ZScpIHx8XG4gICAgICAgICAgICAgICAgICAgIGFuY2hvckVsLmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXByZXZpZXcnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2aWV3VmFsdWVTZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5xdWVyeVNlbGVjdG9yKHRoaXMucHJldmlld1ZhbHVlU2VsZWN0b3IpLnRleHRDb250ZW50ID0gYW5jaG9yRWwuYXR0cmlidXRlcy5ocmVmLnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5xdWVyeVNlbGVjdG9yKHRoaXMucHJldmlld1ZhbHVlU2VsZWN0b3IpLmhyZWYgPSBhbmNob3JFbC5hdHRyaWJ1dGVzLmhyZWYudmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5jbGFzc0xpc3QuYWRkKCdtZWRpdW0tdG9vbGJhci1hcnJvdy1vdmVyJyk7XG4gICAgICAgICAgICB0aGlzLmFuY2hvclByZXZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnbWVkaXVtLXRvb2xiYXItYXJyb3ctdW5kZXInKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFuY2hvclByZXZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKCdtZWRpdW0tZWRpdG9yLWFuY2hvci1wcmV2aWV3LWFjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmNob3JQcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ21lZGl1bS1lZGl0b3ItYW5jaG9yLXByZXZpZXctYWN0aXZlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQW5jaG9yID0gYW5jaG9yRWw7XG5cbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25QcmV2aWV3KCk7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaFByZXZpZXdIYW5kbGVycygpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBwb3NpdGlvblByZXZpZXc6IGZ1bmN0aW9uIChhY3RpdmVBbmNob3IpIHtcbiAgICAgICAgICAgIGFjdGl2ZUFuY2hvciA9IGFjdGl2ZUFuY2hvciB8fCB0aGlzLmFjdGl2ZUFuY2hvcjtcbiAgICAgICAgICAgIHZhciBidXR0b25IZWlnaHQgPSB0aGlzLmFuY2hvclByZXZpZXcub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgICAgIGJvdW5kYXJ5ID0gYWN0aXZlQW5jaG9yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICAgICAgICAgIG1pZGRsZUJvdW5kYXJ5ID0gKGJvdW5kYXJ5LmxlZnQgKyBib3VuZGFyeS5yaWdodCkgLyAyLFxuICAgICAgICAgICAgICAgIGRpZmZMZWZ0ID0gdGhpcy5kaWZmTGVmdCxcbiAgICAgICAgICAgICAgICBkaWZmVG9wID0gdGhpcy5kaWZmVG9wLFxuICAgICAgICAgICAgICAgIGhhbGZPZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICBkZWZhdWx0TGVmdDtcblxuICAgICAgICAgICAgaGFsZk9mZnNldFdpZHRoID0gdGhpcy5hbmNob3JQcmV2aWV3Lm9mZnNldFdpZHRoIC8gMjtcbiAgICAgICAgICAgIHZhciB0b29sYmFyRXh0ZW5zaW9uID0gdGhpcy5iYXNlLmdldEV4dGVuc2lvbkJ5TmFtZSgndG9vbGJhcicpO1xuICAgICAgICAgICAgaWYgKHRvb2xiYXJFeHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICBkaWZmTGVmdCA9IHRvb2xiYXJFeHRlbnNpb24uZGlmZkxlZnQ7XG4gICAgICAgICAgICAgICAgZGlmZlRvcCA9IHRvb2xiYXJFeHRlbnNpb24uZGlmZlRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHRMZWZ0ID0gZGlmZkxlZnQgLSBoYWxmT2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5zdHlsZS50b3AgPSBNYXRoLnJvdW5kKGJ1dHRvbkhlaWdodCArIGJvdW5kYXJ5LmJvdHRvbSAtIGRpZmZUb3AgKyB0aGlzLndpbmRvdy5wYWdlWU9mZnNldCAtIHRoaXMuYW5jaG9yUHJldmlldy5vZmZzZXRIZWlnaHQpICsgJ3B4JztcbiAgICAgICAgICAgIGlmIChtaWRkbGVCb3VuZGFyeSA8IGhhbGZPZmZzZXRXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5zdHlsZS5sZWZ0ID0gZGVmYXVsdExlZnQgKyBoYWxmT2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgodGhpcy53aW5kb3cuaW5uZXJXaWR0aCAtIG1pZGRsZUJvdW5kYXJ5KSA8IGhhbGZPZmZzZXRXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUHJldmlldy5zdHlsZS5sZWZ0ID0gdGhpcy53aW5kb3cuaW5uZXJXaWR0aCArIGRlZmF1bHRMZWZ0IC0gaGFsZk9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmNob3JQcmV2aWV3LnN0eWxlLmxlZnQgPSBkZWZhdWx0TGVmdCArIG1pZGRsZUJvdW5kYXJ5ICsgJ3B4JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhdHRhY2hUb0VkaXRhYmxlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlTW91c2VvdmVyJywgdGhpcy5oYW5kbGVFZGl0YWJsZU1vdXNlb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgYW5jaG9yRXh0ZW5zaW9uID0gdGhpcy5iYXNlLmdldEV4dGVuc2lvbkJ5TmFtZSgnYW5jaG9yJyksXG4gICAgICAgICAgICAgICAgYWN0aXZlQW5jaG9yID0gdGhpcy5hY3RpdmVBbmNob3I7XG5cbiAgICAgICAgICAgIGlmIChhbmNob3JFeHRlbnNpb24gJiYgYWN0aXZlQW5jaG9yKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYmFzZS5zZWxlY3RFbGVtZW50KHRoaXMuYWN0aXZlQW5jaG9yKTtcblxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIHNldFRpbWVvdXQgKyBkZWxheSBiZWNhdXNlOlxuICAgICAgICAgICAgICAgIC8vIFdlIG1heSBhY3R1YWxseSBiZSBkaXNwbGF5aW5nIHRoZSBhbmNob3IgZm9ybSwgd2hpY2ggc2hvdWxkIGJlIGNvbnRyb2xsZWQgYnkgZGVsYXlcbiAgICAgICAgICAgICAgICB0aGlzLmJhc2UuZGVsYXkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlQW5jaG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFjdGl2ZUFuY2hvci5hdHRyaWJ1dGVzLmhyZWYudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBhY3RpdmVBbmNob3IuZ2V0QXR0cmlidXRlKCd0YXJnZXQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25DbGFzczogYWN0aXZlQW5jaG9yLmdldEF0dHJpYnV0ZSgnY2xhc3MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuY2hvckV4dGVuc2lvbi5zaG93Rm9ybShvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUFuY2hvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmhpZGVQcmV2aWV3KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlQW5jaG9yTW91c2VvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYW5jaG9yVG9QcmV2aWV3ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMub2ZmKHRoaXMuYWN0aXZlQW5jaG9yLCAnbW91c2VvdXQnLCB0aGlzLmluc3RhbmNlSGFuZGxlQW5jaG9yTW91c2VvdXQpO1xuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZUhhbmRsZUFuY2hvck1vdXNlb3V0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVFZGl0YWJsZU1vdXNlb3ZlcjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gTWVkaXVtRWRpdG9yLnV0aWwuZ2V0Q2xvc2VzdFRhZyhldmVudC50YXJnZXQsICdhJyk7XG5cbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEZXRlY3QgZW1wdHkgaHJlZiBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAvLyBUaGUgYnJvd3NlciB3aWxsIG1ha2UgaHJlZj1cIlwiIG9yIGhyZWY9XCIjdG9wXCJcbiAgICAgICAgICAgIC8vIGludG8gYWJzb2x1dGUgdXJscyB3aGVuIGFjY2Vzc2VkIGFzIGV2ZW50LnRhcmdldC5ocmVmLCBzbyBjaGVjayB0aGUgaHRtbFxuICAgICAgICAgICAgaWYgKCEvaHJlZj1bXCInXVxcUytbXCInXS8udGVzdCh0YXJnZXQub3V0ZXJIVE1MKSB8fCAvaHJlZj1bXCInXSNcXFMrW1wiJ10vLnRlc3QodGFyZ2V0Lm91dGVySFRNTCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gb25seSBzaG93IHdoZW4gdG9vbGJhciBpcyBub3QgcHJlc2VudFxuICAgICAgICAgICAgdmFyIHRvb2xiYXIgPSB0aGlzLmJhc2UuZ2V0RXh0ZW5zaW9uQnlOYW1lKCd0b29sYmFyJyk7XG4gICAgICAgICAgICBpZiAodG9vbGJhciAmJiB0b29sYmFyLmlzRGlzcGxheWVkICYmIHRvb2xiYXIuaXNEaXNwbGF5ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkZXRhY2ggaGFuZGxlciBmb3Igb3RoZXIgYW5jaG9yIGluIGNhc2Ugd2UgaG92ZXJlZCBtdWx0aXBsZSBhbmNob3JzIHF1aWNrbHlcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZUFuY2hvciAmJiB0aGlzLmFjdGl2ZUFuY2hvciAhPT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXRhY2hQcmV2aWV3SGFuZGxlcnMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hbmNob3JUb1ByZXZpZXcgPSB0YXJnZXQ7XG5cbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VIYW5kbGVBbmNob3JNb3VzZW91dCA9IHRoaXMuaGFuZGxlQW5jaG9yTW91c2VvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMub24odGhpcy5hbmNob3JUb1ByZXZpZXcsICdtb3VzZW91dCcsIHRoaXMuaW5zdGFuY2VIYW5kbGVBbmNob3JNb3VzZW91dCk7XG4gICAgICAgICAgICAvLyBVc2luZyBzZXRUaW1lb3V0ICsgZGVsYXkgYmVjYXVzZTpcbiAgICAgICAgICAgIC8vIC0gV2UncmUgZ29pbmcgdG8gc2hvdyB0aGUgYW5jaG9yIHByZXZpZXcgYWNjb3JkaW5nIHRvIHRoZSBjb25maWd1cmVkIGRlbGF5XG4gICAgICAgICAgICAvLyAgIGlmIHRoZSBtb3VzZSBoYXMgbm90IGxlZnQgdGhlIGFuY2hvciB0YWcgaW4gdGhhdCB0aW1lXG4gICAgICAgICAgICB0aGlzLmJhc2UuZGVsYXkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmFuY2hvclRvUHJldmlldykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dQcmV2aWV3KHRoaXMuYW5jaG9yVG9QcmV2aWV3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZVByZXZpZXdNb3VzZW92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdE92ZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdGhpcy5ob3ZlcmluZyA9IHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlUHJldmlld01vdXNlb3V0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghZXZlbnQucmVsYXRlZFRhcmdldCB8fCAhL2FuY2hvci1wcmV2aWV3Ly50ZXN0KGV2ZW50LnJlbGF0ZWRUYXJnZXQuY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaG92ZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVQcmV2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ob3ZlcmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGR1cnIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC0gdGhpcy5sYXN0T3ZlcjtcbiAgICAgICAgICAgIGlmIChkdXJyID4gdGhpcy5oaWRlRGVsYXkpIHtcbiAgICAgICAgICAgICAgICAvLyBoaWRlIHRoZSBwcmV2aWV3IDEvMiBzZWNvbmQgYWZ0ZXIgbW91c2UgbGVhdmVzIHRoZSBsaW5rXG4gICAgICAgICAgICAgICAgdGhpcy5kZXRhY2hQcmV2aWV3SGFuZGxlcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXRhY2hQcmV2aWV3SGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIGNsZWFudXBcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbFRpbWVyKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmluc3RhbmNlSGFuZGxlUHJldmlld01vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKHRoaXMuYW5jaG9yUHJldmlldywgJ21vdXNlb3ZlcicsIHRoaXMuaW5zdGFuY2VIYW5kbGVQcmV2aWV3TW91c2VvdmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZih0aGlzLmFuY2hvclByZXZpZXcsICdtb3VzZW91dCcsIHRoaXMuaW5zdGFuY2VIYW5kbGVQcmV2aWV3TW91c2VvdXQpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZUFuY2hvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9mZih0aGlzLmFjdGl2ZUFuY2hvciwgJ21vdXNlb3ZlcicsIHRoaXMuaW5zdGFuY2VIYW5kbGVQcmV2aWV3TW91c2VvdmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYodGhpcy5hY3RpdmVBbmNob3IsICdtb3VzZW91dCcsIHRoaXMuaW5zdGFuY2VIYW5kbGVQcmV2aWV3TW91c2VvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5oaWRlUHJldmlldygpO1xuXG4gICAgICAgICAgICB0aGlzLmhvdmVyaW5nID0gdGhpcy5pbnN0YW5jZUhhbmRsZVByZXZpZXdNb3VzZW92ZXIgPSB0aGlzLmluc3RhbmNlSGFuZGxlUHJldmlld01vdXNlb3V0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBUT0RPOiBicmVhayB1cCBtZXRob2QgYW5kIGV4dHJhY3Qgb3V0IGhhbmRsZXJzXG4gICAgICAgIGF0dGFjaFByZXZpZXdIYW5kbGVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0T3ZlciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB0aGlzLmhvdmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZUhhbmRsZVByZXZpZXdNb3VzZW92ZXIgPSB0aGlzLmhhbmRsZVByZXZpZXdNb3VzZW92ZXIuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VIYW5kbGVQcmV2aWV3TW91c2VvdXQgPSB0aGlzLmhhbmRsZVByZXZpZXdNb3VzZW91dC5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB0aGlzLmludGVydmFsVGltZXIgPSBzZXRJbnRlcnZhbCh0aGlzLnVwZGF0ZVByZXZpZXcuYmluZCh0aGlzKSwgMjAwKTtcblxuICAgICAgICAgICAgdGhpcy5vbih0aGlzLmFuY2hvclByZXZpZXcsICdtb3VzZW92ZXInLCB0aGlzLmluc3RhbmNlSGFuZGxlUHJldmlld01vdXNlb3Zlcik7XG4gICAgICAgICAgICB0aGlzLm9uKHRoaXMuYW5jaG9yUHJldmlldywgJ21vdXNlb3V0JywgdGhpcy5pbnN0YW5jZUhhbmRsZVByZXZpZXdNb3VzZW91dCk7XG4gICAgICAgICAgICB0aGlzLm9uKHRoaXMuYWN0aXZlQW5jaG9yLCAnbW91c2VvdmVyJywgdGhpcy5pbnN0YW5jZUhhbmRsZVByZXZpZXdNb3VzZW92ZXIpO1xuICAgICAgICAgICAgdGhpcy5vbih0aGlzLmFjdGl2ZUFuY2hvciwgJ21vdXNlb3V0JywgdGhpcy5pbnN0YW5jZUhhbmRsZVByZXZpZXdNb3VzZW91dCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmFuY2hvclByZXZpZXcgPSBBbmNob3JQcmV2aWV3O1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgV0hJVEVTUEFDRV9DSEFSUyxcbiAgICAgICAgS05PV05fVExEU19GUkFHTUVOVCxcbiAgICAgICAgTElOS19SRUdFWFBfVEVYVCxcbiAgICAgICAgS05PV05fVExEU19SRUdFWFA7XG5cbiAgICBXSElURVNQQUNFX0NIQVJTID0gWycgJywgJ1xcdCcsICdcXG4nLCAnXFxyJywgJ1xcdTAwQTAnLCAnXFx1MjAwMCcsICdcXHUyMDAxJywgJ1xcdTIwMDInLCAnXFx1MjAwMycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFx1MjAyOCcsICdcXHUyMDI5J107XG4gICAgS05PV05fVExEU19GUkFHTUVOVCA9ICdjb218bmV0fG9yZ3xlZHV8Z292fG1pbHxhZXJvfGFzaWF8Yml6fGNhdHxjb29wfGluZm98aW50fGpvYnN8bW9iaXxtdXNldW18bmFtZXxwb3N0fHByb3x0ZWx8dHJhdmVsfCcgK1xuICAgICAgICAneHh4fGFjfGFkfGFlfGFmfGFnfGFpfGFsfGFtfGFufGFvfGFxfGFyfGFzfGF0fGF1fGF3fGF4fGF6fGJhfGJifGJkfGJlfGJmfGJnfGJofGJpfGJqfGJtfGJufGJvfGJyfGJzfGJ0fGJ2fGJ3fGJ5fCcgK1xuICAgICAgICAnYnp8Y2F8Y2N8Y2R8Y2Z8Y2d8Y2h8Y2l8Y2t8Y2x8Y218Y258Y298Y3J8Y3N8Y3V8Y3Z8Y3h8Y3l8Y3p8ZGR8ZGV8ZGp8ZGt8ZG18ZG98ZHp8ZWN8ZWV8ZWd8ZWh8ZXJ8ZXN8ZXR8ZXV8Zml8Zmp8JyArXG4gICAgICAgICdma3xmbXxmb3xmcnxnYXxnYnxnZHxnZXxnZnxnZ3xnaHxnaXxnbHxnbXxnbnxncHxncXxncnxnc3xndHxndXxnd3xneXxoa3xobXxobnxocnxodHxodXxpZHxpZXxpbHxpbXxpbnxpb3xpcXxpcnwnICtcbiAgICAgICAgJ2lzfGl0fGplfGptfGpvfGpwfGtlfGtnfGtofGtpfGttfGtufGtwfGtyfGt3fGt5fGt6fGxhfGxifGxjfGxpfGxrfGxyfGxzfGx0fGx1fGx2fGx5fG1hfG1jfG1kfG1lfG1nfG1ofG1rfG1sfG1tfCcgK1xuICAgICAgICAnbW58bW98bXB8bXF8bXJ8bXN8bXR8bXV8bXZ8bXd8bXh8bXl8bXp8bmF8bmN8bmV8bmZ8bmd8bml8bmx8bm98bnB8bnJ8bnV8bnp8b218cGF8cGV8cGZ8cGd8cGh8cGt8cGx8cG18cG58cHJ8cHN8JyArXG4gICAgICAgICdwdHxwd3xweXxxYXxyZXxyb3xyc3xydXxyd3xzYXxzYnxzY3xzZHxzZXxzZ3xzaHxzaXxzanxqYXxza3xzbHxzbXxzbnxzb3xzcnxzc3xzdHxzdXxzdnxzeHxzeXxzenx0Y3x0ZHx0Znx0Z3x0aHwnICtcbiAgICAgICAgJ3RqfHRrfHRsfHRtfHRufHRvfHRwfHRyfHR0fHR2fHR3fHR6fHVhfHVnfHVrfHVzfHV5fHV6fHZhfHZjfHZlfHZnfHZpfHZufHZ1fHdmfHdzfHllfHl0fHl1fHphfHptfHp3JztcblxuICAgIExJTktfUkVHRVhQX1RFWFQgPVxuICAgICAgICAnKCcgK1xuICAgICAgICAvLyBWZXJzaW9uIG9mIEdydWJlciBVUkwgUmVnZXhwIG9wdGltaXplZCBmb3IgSlM6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE3NzMzNjQwXG4gICAgICAgICcoKD86KGh0dHBzPzovL3xmdHBzPzovL3xubnRwOi8vKXx3d3dcXFxcZHswLDN9Wy5dfFthLXowLTkuXFxcXC1dK1suXSgnICsgS05PV05fVExEU19GUkFHTUVOVCArICcpXFxcXFxcLylcXFxcUysoPzpbXlxcXFxzYCFcXFxcW1xcXFxde307OlxcJ1xcXCIuLD9cXHUwMEFCXFx1MDBCQlxcdTIwMUNcXHUyMDFEXFx1MjAxOFxcdTIwMTldKSknICtcbiAgICAgICAgLy8gQWRkaXRpb24gdG8gYWJvdmUgUmVnZXhwIHRvIHN1cHBvcnQgYmFyZSBkb21haW5zL29uZSBsZXZlbCBzdWJkb21haW5zIHdpdGggY29tbW9uIG5vbi1pMThuIFRMRHMgYW5kIHdpdGhvdXQgd3d3IHByZWZpeDpcbiAgICAgICAgJyl8KChbYS16MC05XFxcXC1dK1xcXFwuKT9bYS16MC05XFxcXC1dK1xcXFwuKCcgKyBLTk9XTl9UTERTX0ZSQUdNRU5UICsgJykpJztcblxuICAgIEtOT1dOX1RMRFNfUkVHRVhQID0gbmV3IFJlZ0V4cCgnXignICsgS05PV05fVExEU19GUkFHTUVOVCArICcpJCcsICdpJyk7XG5cbiAgICBmdW5jdGlvbiBub2RlSXNOb3RJbnNpZGVBbmNob3JUYWcobm9kZSkge1xuICAgICAgICByZXR1cm4gIU1lZGl1bUVkaXRvci51dGlsLmdldENsb3Nlc3RUYWcobm9kZSwgJ2EnKTtcbiAgICB9XG5cbiAgICB2YXIgQXV0b0xpbmsgPSBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLmV4dGVuZCh7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE1lZGl1bUVkaXRvci5FeHRlbnNpb24ucHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgdGhpcy5kaXNhYmxlRXZlbnRIYW5kbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlS2V5cHJlc3MnLCB0aGlzLm9uS2V5cHJlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSgnZWRpdGFibGVCbHVyJywgdGhpcy5vbkJsdXIuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAvLyBNUyBJRSBoYXMgaXQncyBvd24gYXV0by1VUkwgZGV0ZWN0IGZlYXR1cmUgYnV0IG91cnMgaXMgYmV0dGVyIGluIHNvbWUgd2F5cy4gQmUgY29uc2lzdGVudC5cbiAgICAgICAgICAgIHRoaXMuZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ0F1dG9VcmxEZXRlY3QnLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFR1cm4gQXV0b1VybERldGVjdCBiYWNrIG9uXG4gICAgICAgICAgICBpZiAodGhpcy5kb2N1bWVudC5xdWVyeUNvbW1hbmRTdXBwb3J0ZWQoJ0F1dG9VcmxEZXRlY3QnKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ0F1dG9VcmxEZXRlY3QnLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25CbHVyOiBmdW5jdGlvbiAoYmx1ckV2ZW50LCBlZGl0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5wZXJmb3JtTGlua2luZyhlZGl0YWJsZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25LZXlwcmVzczogZnVuY3Rpb24gKGtleVByZXNzRXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc2FibGVFdmVudEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoa2V5UHJlc3NFdmVudCwgW01lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuU1BBQ0UsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuRU5URVJdKSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnBlcmZvcm1MaW5raW5nVGltZW91dCk7XG4gICAgICAgICAgICAgICAgLy8gU2F2aW5nL3Jlc3RvcmluZyB0aGUgc2VsZWN0aW9uIGluIHRoZSBtaWRkbGUgb2YgYSBrZXlwcmVzcyBkb2Vzbid0IHdvcmsgd2VsbC4uLlxuICAgICAgICAgICAgICAgIHRoaXMucGVyZm9ybUxpbmtpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhpcy5iYXNlLmV4cG9ydFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucGVyZm9ybUxpbmtpbmcoa2V5UHJlc3NFdmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFzcyB0cnVlIGZvciBmYXZvckxhdGVyU2VsZWN0aW9uQW5jaG9yIC0gdGhpcyBpcyBuZWVkZWQgZm9yIGxpbmtzIGF0IHRoZSBlbmQgb2YgYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmFncmFwaCBpbiBNUyBJRSwgb3IgTVMgSUUgY2F1c2VzIHRoZSBsaW5rIHRvIGJlIGRlbGV0ZWQgcmlnaHQgYWZ0ZXIgYWRkaW5nIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFzZS5pbXBvcnRTZWxlY3Rpb24oc2VsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5jb25zb2xlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwZXJmb3JtIGxpbmtpbmcnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZUV2ZW50SGFuZGxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwZXJmb3JtTGlua2luZzogZnVuY3Rpb24gKGNvbnRlbnRlZGl0YWJsZSkge1xuICAgICAgICAgICAgLy8gUGVyZm9ybSBsaW5raW5nIG9uIGEgcGFyYWdyYXBoIGxldmVsIGJhc2lzIGFzIG90aGVyd2lzZSB0aGUgZGV0ZWN0aW9uIGNhbiB3cm9uZ2x5IGZpbmQgdGhlIGVuZFxuICAgICAgICAgICAgLy8gb2Ygb25lIHBhcmFncmFwaCBhbmQgdGhlIGJlZ2lubmluZyBvZiBhbm90aGVyIHBhcmFncmFwaCB0byBjb25zdGl0dXRlIGEgbGluaywgc3VjaCBhcyBhIHBhcmFncmFwaCBlbmRpbmdcbiAgICAgICAgICAgIC8vIFwibGluay5cIiBhbmQgdGhlIG5leHQgcGFyYWdyYXBoIGJlZ2lubmluZyB3aXRoIFwibXlcIiBpcyBpbnRlcnByZXRlZCBpbnRvIFwibGluay5teVwiIGFuZCB0aGUgY29kZSB0cmllcyB0byBjcmVhdGVcbiAgICAgICAgICAgIC8vIGEgbGluayBhY3Jvc3MgYmxvY2tFbGVtZW50cyAtIHdoaWNoIGRvZXNuJ3Qgd29yayBhbmQgaXMgdGVycmlibGUuXG4gICAgICAgICAgICAvLyAoTWVkaXVtIGRlbGV0ZXMgdGhlIHNwYWNlcy9yZXR1cm5zIGJldHdlZW4gUCB0YWdzIHNvIHRoZSB0ZXh0Q29udGVudCBlbmRzIHVwIHdpdGhvdXQgcGFyYWdyYXBoIHNwYWNpbmcpXG4gICAgICAgICAgICB2YXIgYmxvY2tFbGVtZW50cyA9IE1lZGl1bUVkaXRvci51dGlsLnNwbGl0QnlCbG9ja0VsZW1lbnRzKGNvbnRlbnRlZGl0YWJsZSksXG4gICAgICAgICAgICAgICAgZG9jdW1lbnRNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGJsb2NrRWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tFbGVtZW50cyA9IFtjb250ZW50ZWRpdGFibGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9ja0VsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnRNb2RpZmllZCA9IHRoaXMucmVtb3ZlT2Jzb2xldGVBdXRvTGlua1NwYW5zKGJsb2NrRWxlbWVudHNbaV0pIHx8IGRvY3VtZW50TW9kaWZpZWQ7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnRNb2RpZmllZCA9IHRoaXMucGVyZm9ybUxpbmtpbmdXaXRoaW5FbGVtZW50KGJsb2NrRWxlbWVudHNbaV0pIHx8IGRvY3VtZW50TW9kaWZpZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnRNb2RpZmllZDtcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmVPYnNvbGV0ZUF1dG9MaW5rU3BhbnM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoIWVsZW1lbnQgfHwgZWxlbWVudC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNwYW5zID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuW2RhdGEtYXV0by1saW5rPVwidHJ1ZVwiXScpLFxuICAgICAgICAgICAgICAgIGRvY3VtZW50TW9kaWZpZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0Q29udGVudCA9IHNwYW5zW2ldLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC5pbmRleE9mKCc6Ly8nKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSBNZWRpdW1FZGl0b3IudXRpbC5lbnN1cmVVcmxIYXNQcm90b2NvbCh0ZXh0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzcGFuc1tpXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaHJlZicpICE9PSB0ZXh0Q29udGVudCAmJiBub2RlSXNOb3RJbnNpZGVBbmNob3JUYWcoc3BhbnNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50TW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHJpbW1lZFRleHRDb250ZW50ID0gdGV4dENvbnRlbnQucmVwbGFjZSgvXFxzKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGFuc1tpXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaHJlZicpID09PSB0cmltbWVkVGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGFyYWN0ZXJzVHJpbW1lZCA9IHRleHRDb250ZW50Lmxlbmd0aCAtIHRyaW1tZWRUZXh0Q29udGVudC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJlZSA9IE1lZGl1bUVkaXRvci51dGlsLnNwbGl0T2ZmRE9NVHJlZShzcGFuc1tpXSwgdGhpcy5zcGxpdFRleHRCZWZvcmVFbmQoc3BhbnNbaV0sIGNoYXJhY3RlcnNUcmltbWVkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFuc1tpXS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdWJ0cmVlLCBzcGFuc1tpXS5uZXh0U2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTb21lIGVkaXRpbmcgaGFzIGhhcHBlbmVkIHRvIHRoZSBzcGFuLCBzbyBqdXN0IHJlbW92ZSBpdCBlbnRpcmVseS4gVGhlIHVzZXIgY2FuIHB1dCBpdCBiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcm91bmQganVzdCB0aGUgaHJlZiBjb250ZW50IGlmIHRoZXkgbmVlZCB0byBwcmV2ZW50IGl0IGZyb20gbGlua2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwudW53cmFwKHNwYW5zW2ldLCB0aGlzLmRvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudE1vZGlmaWVkO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNwbGl0VGV4dEJlZm9yZUVuZDogZnVuY3Rpb24gKGVsZW1lbnQsIGNoYXJhY3RlckNvdW50KSB7XG4gICAgICAgICAgICB2YXIgdHJlZVdhbGtlciA9IHRoaXMuZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihlbGVtZW50LCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpLFxuICAgICAgICAgICAgICAgIGxhc3RDaGlsZE5vdEV4aGF1c3RlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSB0cmVlIHdhbGtlciBhdCB0aGUgbGFzdCBkZXNjZW5kYW50IG9mIHRoZSBzcGFuXG4gICAgICAgICAgICB3aGlsZSAobGFzdENoaWxkTm90RXhoYXVzdGVkKSB7XG4gICAgICAgICAgICAgICAgbGFzdENoaWxkTm90RXhoYXVzdGVkID0gdHJlZVdhbGtlci5sYXN0Q2hpbGQoKSAhPT0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnROb2RlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlVmFsdWUsXG4gICAgICAgICAgICAgICAgcHJldmlvdXNOb2RlO1xuICAgICAgICAgICAgd2hpbGUgKGNoYXJhY3RlckNvdW50ID4gMCAmJiBwcmV2aW91c05vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIuY3VycmVudE5vZGU7XG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGVWYWx1ZSA9IGN1cnJlbnROb2RlLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE5vZGVWYWx1ZS5sZW5ndGggPiBjaGFyYWN0ZXJDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c05vZGUgPSBjdXJyZW50Tm9kZS5zcGxpdFRleHQoY3VycmVudE5vZGVWYWx1ZS5sZW5ndGggLSBjaGFyYWN0ZXJDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c05vZGUgPSB0cmVlV2Fsa2VyLnByZXZpb3VzTm9kZSgpO1xuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJDb3VudCAtPSBjdXJyZW50Tm9kZVZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXNOb2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBlcmZvcm1MaW5raW5nV2l0aGluRWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gdGhpcy5maW5kTGlua2FibGVUZXh0KGVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIGxpbmtDcmVhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAodmFyIG1hdGNoSW5kZXggPSAwOyBtYXRjaEluZGV4IDwgbWF0Y2hlcy5sZW5ndGg7IG1hdGNoSW5kZXgrKykge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ1RleHROb2RlcyA9IE1lZGl1bUVkaXRvci51dGlsLmZpbmRPckNyZWF0ZU1hdGNoaW5nVGV4dE5vZGVzKHRoaXMuZG9jdW1lbnQsIGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVzW21hdGNoSW5kZXhdKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zaG91bGROb3RMaW5rKG1hdGNoaW5nVGV4dE5vZGVzKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVBdXRvTGluayhtYXRjaGluZ1RleHROb2RlcywgbWF0Y2hlc1ttYXRjaEluZGV4XS5ocmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaW5rQ3JlYXRlZDtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG91bGROb3RMaW5rOiBmdW5jdGlvbiAodGV4dE5vZGVzKSB7XG4gICAgICAgICAgICB2YXIgc2hvdWxkTm90TGluayA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0Tm9kZXMubGVuZ3RoICYmIHNob3VsZE5vdExpbmsgPT09IGZhbHNlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBEbyBub3QgbGluayBpZiB0aGUgdGV4dCBub2RlIGlzIGVpdGhlciBpbnNpZGUgYW4gYW5jaG9yIG9yIGluc2lkZSBzcGFuW2RhdGEtYXV0by1saW5rXVxuICAgICAgICAgICAgICAgIHNob3VsZE5vdExpbmsgPSAhIU1lZGl1bUVkaXRvci51dGlsLnRyYXZlcnNlVXAodGV4dE5vZGVzW2ldLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChub2RlLmdldEF0dHJpYnV0ZSAmJiBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1hdXRvLWxpbmsnKSA9PT0gJ3RydWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzaG91bGROb3RMaW5rO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmRMaW5rYWJsZVRleHQ6IGZ1bmN0aW9uIChjb250ZW50ZWRpdGFibGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5rUmVnRXhwID0gbmV3IFJlZ0V4cChMSU5LX1JFR0VYUF9URVhULCAnZ2knKSxcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IGNvbnRlbnRlZGl0YWJsZS50ZXh0Q29udGVudCxcbiAgICAgICAgICAgICAgICBtYXRjaCA9IG51bGwsXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IFtdO1xuXG4gICAgICAgICAgICB3aGlsZSAoKG1hdGNoID0gbGlua1JlZ0V4cC5leGVjKHRleHRDb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hPayA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoRW5kID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlZ2V4cCBkZXRlY3RlZCBzb21ldGhpbmcgYXMgYSBsaW5rIHRoYXQgaGFzIHRleHQgaW1tZWRpYXRlbHkgcHJlY2VkaW5nL2ZvbGxvd2luZyBpdCwgYmFpbCBvdXQuXG4gICAgICAgICAgICAgICAgbWF0Y2hPayA9IChtYXRjaC5pbmRleCA9PT0gMCB8fCBXSElURVNQQUNFX0NIQVJTLmluZGV4T2YodGV4dENvbnRlbnRbbWF0Y2guaW5kZXggLSAxXSkgIT09IC0xKSAmJlxuICAgICAgICAgICAgICAgICAgICAobWF0Y2hFbmQgPT09IHRleHRDb250ZW50Lmxlbmd0aCB8fCBXSElURVNQQUNFX0NIQVJTLmluZGV4T2YodGV4dENvbnRlbnRbbWF0Y2hFbmRdKSAhPT0gLTEpO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZWdleHAgZGV0ZWN0ZWQgYSBiYXJlIGRvbWFpbiB0aGF0IGRvZXNuJ3QgdXNlIG9uZSBvZiBvdXIgZXhwZWN0ZWQgVExEcywgYmFpbCBvdXQuXG4gICAgICAgICAgICAgICAgbWF0Y2hPayA9IG1hdGNoT2sgJiYgKG1hdGNoWzBdLmluZGV4T2YoJy8nKSAhPT0gLTEgfHxcbiAgICAgICAgICAgICAgICAgICAgS05PV05fVExEU19SRUdFWFAudGVzdChtYXRjaFswXS5zcGxpdCgnLicpLnBvcCgpLnNwbGl0KCc/Jykuc2hpZnQoKSkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoT2spIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG1hdGNoLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBtYXRjaEVuZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVBdXRvTGluazogZnVuY3Rpb24gKHRleHROb2RlcywgaHJlZikge1xuICAgICAgICAgICAgaHJlZiA9IE1lZGl1bUVkaXRvci51dGlsLmVuc3VyZVVybEhhc1Byb3RvY29sKGhyZWYpO1xuICAgICAgICAgICAgdmFyIGFuY2hvciA9IE1lZGl1bUVkaXRvci51dGlsLmNyZWF0ZUxpbmsodGhpcy5kb2N1bWVudCwgdGV4dE5vZGVzLCBocmVmLCB0aGlzLmdldEVkaXRvck9wdGlvbigndGFyZ2V0QmxhbmsnKSA/ICdfYmxhbmsnIDogbnVsbCksXG4gICAgICAgICAgICAgICAgc3BhbiA9IHRoaXMuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgc3Bhbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtYXV0by1saW5rJywgJ3RydWUnKTtcbiAgICAgICAgICAgIHNwYW4uc2V0QXR0cmlidXRlKCdkYXRhLWhyZWYnLCBocmVmKTtcbiAgICAgICAgICAgIGFuY2hvci5pbnNlcnRCZWZvcmUoc3BhbiwgYW5jaG9yLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgd2hpbGUgKGFuY2hvci5jaGlsZE5vZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGFuY2hvci5jaGlsZE5vZGVzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5hdXRvTGluayA9IEF1dG9MaW5rO1xufSgpKTtcbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIENMQVNTX0RSQUdfT1ZFUiA9ICdtZWRpdW0tZWRpdG9yLWRyYWdvdmVyJztcblxuICAgIGZ1bmN0aW9uIGNsZWFyQ2xhc3NOYW1lcyhlbGVtZW50KSB7XG4gICAgICAgIHZhciBlZGl0YWJsZSA9IE1lZGl1bUVkaXRvci51dGlsLmdldENvbnRhaW5lckVkaXRvckVsZW1lbnQoZWxlbWVudCksXG4gICAgICAgICAgICBleGlzdGluZyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVkaXRhYmxlLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBDTEFTU19EUkFHX09WRVIpKTtcblxuICAgICAgICBleGlzdGluZy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShDTEFTU19EUkFHX09WRVIpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgRmlsZURyYWdnaW5nID0gTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5leHRlbmQoe1xuICAgICAgICBuYW1lOiAnZmlsZURyYWdnaW5nJyxcblxuICAgICAgICBhbGxvd2VkVHlwZXM6IFsnaW1hZ2UnXSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZURyYWcnLCB0aGlzLmhhbmRsZURyYWcuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSgnZWRpdGFibGVEcm9wJywgdGhpcy5oYW5kbGVEcm9wLmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZURyYWc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknO1xuXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNsYXNzTGlzdCA/IGV2ZW50LnRhcmdldCA6IGV2ZW50LnRhcmdldC5wYXJlbnRFbGVtZW50O1xuXG4gICAgICAgICAgICAvLyBFbnN1cmUgdGhlIGNsYXNzIGdldHMgcmVtb3ZlZCBmcm9tIGFueXRoaW5nIHRoYXQgaGFkIGl0IGJlZm9yZVxuICAgICAgICAgICAgY2xlYXJDbGFzc05hbWVzKHRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSAnZHJhZ292ZXInKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5hZGQoQ0xBU1NfRFJBR19PVkVSKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEcm9wOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIFByZXZlbnQgZmlsZSBmcm9tIG9wZW5pbmcgaW4gdGhlIGN1cnJlbnQgd2luZG93XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIC8vIElFOSBkb2VzIG5vdCBzdXBwb3J0IHRoZSBGaWxlIEFQSSwgc28gcHJldmVudCBmaWxlIGZyb20gb3BlbmluZyBpbiB0aGUgd2luZG93XG4gICAgICAgICAgICAvLyBidXQgYWxzbyBkb24ndCB0cnkgdG8gYWN0dWFsbHkgZ2V0IHRoZSBmaWxlXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzKSB7XG4gICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQWxsb3dlZEZpbGUoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLnR5cGUubWF0Y2goJ2ltYWdlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydEltYWdlRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgcmVtb3ZlIG91ciBjbGFzcyBmcm9tIGV2ZXJ5dGhpbmdcbiAgICAgICAgICAgIGNsZWFyQ2xhc3NOYW1lcyhldmVudC50YXJnZXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzQWxsb3dlZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hbGxvd2VkVHlwZXMuc29tZShmdW5jdGlvbiAoZmlsZVR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFmaWxlLnR5cGUubWF0Y2goZmlsZVR5cGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5zZXJ0SW1hZ2VGaWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXG4gICAgICAgICAgICB2YXIgaWQgPSAnbWVkaXVtLWltZy0nICsgKCtuZXcgRGF0ZSgpKTtcbiAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmluc2VydEhUTUxDb21tYW5kKHRoaXMuZG9jdW1lbnQsICc8aW1nIGNsYXNzPVwibWVkaXVtLWVkaXRvci1pbWFnZS1sb2FkaW5nXCIgaWQ9XCInICsgaWQgKyAnXCIgLz4nKTtcblxuICAgICAgICAgICAgZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGltZyA9IHRoaXMuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAgICAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnNyYyA9IGZpbGVSZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuZmlsZURyYWdnaW5nID0gRmlsZURyYWdnaW5nO1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgS2V5Ym9hcmRDb21tYW5kcyA9IE1lZGl1bUVkaXRvci5FeHRlbnNpb24uZXh0ZW5kKHtcbiAgICAgICAgbmFtZTogJ2tleWJvYXJkLWNvbW1hbmRzJyxcblxuICAgICAgICAvKiBLZXlib2FyZENvbW1hbmRzIE9wdGlvbnMgKi9cblxuICAgICAgICAvKiBjb21tYW5kczogW0FycmF5XVxuICAgICAgICAgKiBBcnJheSBvZiBvYmplY3RzIGRlc2NyaWJpbmcgZWFjaCBjb21tYW5kIGFuZCB0aGUgY29tYmluYXRpb24gb2Yga2V5cyB0aGF0IHdpbGwgdHJpZ2dlciBpdFxuICAgICAgICAgKiBSZXF1aXJlZCBmb3IgZWFjaCBvYmplY3Q6XG4gICAgICAgICAqICAgY29tbWFuZCBbU3RyaW5nXSAoYXJndW1lbnQgcGFzc2VkIHRvIGVkaXRvci5leGVjQWN0aW9uKCkpXG4gICAgICAgICAqICAga2V5IFtTdHJpbmddIChrZXlib2FyZCBjaGFyYWN0ZXIgdGhhdCB0cmlnZ2VycyB0aGlzIGNvbW1hbmQpXG4gICAgICAgICAqICAgbWV0YSBbYm9vbGVhbl0gKHdoZXRoZXIgdGhlIGN0cmwvbWV0YSBrZXkgaGFzIHRvIGJlIGFjdGl2ZSBvciBpbmFjdGl2ZSlcbiAgICAgICAgICogICBzaGlmdCBbYm9vbGVhbl0gKHdoZXRoZXIgdGhlIHNoaWZ0IGtleSBoYXMgdG8gYmUgYWN0aXZlIG9yIGluYWN0aXZlKVxuICAgICAgICAgKiAgIGFsdCBbYm9vbGVhbl0gKHdoZXRoZXIgdGhlIGFsdCBrZXkgaGFzIHRvIGJlIGFjdGl2ZSBvciBpbmFjdGl2ZSlcbiAgICAgICAgICovXG4gICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29tbWFuZDogJ2JvbGQnLFxuICAgICAgICAgICAgICAgIGtleTogJ0InLFxuICAgICAgICAgICAgICAgIG1ldGE6IHRydWUsXG4gICAgICAgICAgICAgICAgc2hpZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29tbWFuZDogJ2l0YWxpYycsXG4gICAgICAgICAgICAgICAga2V5OiAnSScsXG4gICAgICAgICAgICAgICAgbWV0YTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzaGlmdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgYWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kOiAndW5kZXJsaW5lJyxcbiAgICAgICAgICAgICAgICBrZXk6ICdVJyxcbiAgICAgICAgICAgICAgICBtZXRhOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNoaWZ0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhbHQ6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSgnZWRpdGFibGVLZXlkb3duJywgdGhpcy5oYW5kbGVLZXlkb3duLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5rZXlzID0ge307XG4gICAgICAgICAgICB0aGlzLmNvbW1hbmRzLmZvckVhY2goZnVuY3Rpb24gKGNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5Q29kZSA9IGNvbW1hbmQua2V5LmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmtleXNba2V5Q29kZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5rZXlzW2tleUNvZGVdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMua2V5c1trZXlDb2RlXS5wdXNoKGNvbW1hbmQpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlS2V5ZG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIga2V5Q29kZSA9IE1lZGl1bUVkaXRvci51dGlsLmdldEtleUNvZGUoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmtleXNba2V5Q29kZV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpc01ldGEgPSBNZWRpdW1FZGl0b3IudXRpbC5pc01ldGFDdHJsS2V5KGV2ZW50KSxcbiAgICAgICAgICAgICAgICBpc1NoaWZ0ID0gISFldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgICAgICBpc0FsdCA9ICEhZXZlbnQuYWx0S2V5O1xuXG4gICAgICAgICAgICB0aGlzLmtleXNba2V5Q29kZV0uZm9yRWFjaChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLm1ldGEgPT09IGlzTWV0YSAmJlxuICAgICAgICAgICAgICAgICAgICBkYXRhLnNoaWZ0ID09PSBpc1NoaWZ0ICYmXG4gICAgICAgICAgICAgICAgICAgIChkYXRhLmFsdCA9PT0gaXNBbHQgfHxcbiAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCA9PT0gZGF0YS5hbHQpKSB7IC8vIFRPRE8gZGVwcmVjYXRlZDogcmVtb3ZlIGNoZWNrIGZvciB1bmRlZmluZWQgPT09IGRhdGEuYWx0IHdoZW4ganVtcGluZyB0byA2LjAuMFxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb21tYW5kIGNhbiBiZSBmYWxzZSBzbyB0aGUgc2hvcnRjdXQgaXMganVzdCBkaXNhYmxlZFxuICAgICAgICAgICAgICAgICAgICBpZiAoZmFsc2UgIT09IGRhdGEuY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjQWN0aW9uKGRhdGEuY29tbWFuZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMua2V5Ym9hcmRDb21tYW5kcyA9IEtleWJvYXJkQ29tbWFuZHM7XG59KCkpO1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBGb250U2l6ZUZvcm0gPSBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5mb3JtLmV4dGVuZCh7XG5cbiAgICAgICAgbmFtZTogJ2ZvbnRzaXplJyxcbiAgICAgICAgYWN0aW9uOiAnZm9udFNpemUnLFxuICAgICAgICBhcmlhOiAnaW5jcmVhc2UvZGVjcmVhc2UgZm9udCBzaXplJyxcbiAgICAgICAgY29udGVudERlZmF1bHQ6ICcmI3hCMTsnLCAvLyDCsVxuICAgICAgICBjb250ZW50RkE6ICc8aSBjbGFzcz1cImZhIGZhLXRleHQtaGVpZ2h0XCI+PC9pPicsXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuZm9ybS5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIENhbGxlZCB3aGVuIHRoZSBidXR0b24gdGhlIHRvb2xiYXIgaXMgY2xpY2tlZFxuICAgICAgICAvLyBPdmVycmlkZXMgQnV0dG9uRXh0ZW5zaW9uLmhhbmRsZUNsaWNrXG4gICAgICAgIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRGlzcGxheWVkKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgZm9udHNpemUgb2YgY3VycmVudCBzZWxlY3Rpb24gKGNvbnZlcnQgdG8gc3RyaW5nIHNpbmNlIElFIHJldHVybnMgdGhpcyBhcyBudW1iZXIpXG4gICAgICAgICAgICAgICAgdmFyIGZvbnRTaXplID0gdGhpcy5kb2N1bWVudC5xdWVyeUNvbW1hbmRWYWx1ZSgnZm9udFNpemUnKSArICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Zvcm0oZm9udFNpemUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IG1lZGl1bS1lZGl0b3IgdG8gYXBwZW5kIGZvcm0gdG8gdGhlIHRvb2xiYXJcbiAgICAgICAgZ2V0Rm9ybTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmZvcm0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSB0aGlzLmNyZWF0ZUZvcm0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvcm07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gVXNlZCBieSBtZWRpdW0tZWRpdG9yIHdoZW4gdGhlIGRlZmF1bHQgdG9vbGJhciBpcyB0byBiZSBkaXNwbGF5ZWRcbiAgICAgICAgaXNEaXNwbGF5ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEZvcm0oKS5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVGb3JtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmdldEZvcm0oKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5nZXRJbnB1dCgpLnZhbHVlID0gJyc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvd0Zvcm06IGZ1bmN0aW9uIChmb250U2l6ZSkge1xuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy5nZXRJbnB1dCgpO1xuXG4gICAgICAgICAgICB0aGlzLmJhc2Uuc2F2ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5oaWRlVG9vbGJhckRlZmF1bHRBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLmdldEZvcm0oKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHRoaXMuc2V0VG9vbGJhclBvc2l0aW9uKCk7XG5cbiAgICAgICAgICAgIGlucHV0LnZhbHVlID0gZm9udFNpemUgfHwgJyc7XG4gICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIENhbGxlZCBieSBjb3JlIHdoZW4gdGVhcmluZyBkb3duIG1lZGl1bS1lZGl0b3IgKGRlc3Ryb3kpXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mb3JtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5mb3JtLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmZvcm0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5mb3JtO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGNvcmUgbWV0aG9kc1xuXG4gICAgICAgIGRvRm9ybVNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYmFzZS5yZXN0b3JlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLmJhc2UuY2hlY2tTZWxlY3Rpb24oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkb0Zvcm1DYW5jZWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuYmFzZS5yZXN0b3JlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRm9udFNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuYmFzZS5jaGVja1NlbGVjdGlvbigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIGZvcm0gY3JlYXRpb24gYW5kIGV2ZW50IGhhbmRsaW5nXG4gICAgICAgIGNyZWF0ZUZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzLmRvY3VtZW50LFxuICAgICAgICAgICAgICAgIGZvcm0gPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBkb2MuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSxcbiAgICAgICAgICAgICAgICBjbG9zZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdhJyksXG4gICAgICAgICAgICAgICAgc2F2ZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgICAgICAgICAgIC8vIEZvbnQgU2l6ZSBGb3JtIChkaXYpXG4gICAgICAgICAgICBmb3JtLmNsYXNzTmFtZSA9ICdtZWRpdW0tZWRpdG9yLXRvb2xiYXItZm9ybSc7XG4gICAgICAgICAgICBmb3JtLmlkID0gJ21lZGl1bS1lZGl0b3ItdG9vbGJhci1mb3JtLWZvbnRzaXplLScgKyB0aGlzLmdldEVkaXRvcklkKCk7XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBjbGlja3Mgb24gdGhlIGZvcm0gaXRzZWxmXG4gICAgICAgICAgICB0aGlzLm9uKGZvcm0sICdjbGljaycsIHRoaXMuaGFuZGxlRm9ybUNsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgICAgICAvLyBBZGQgZm9udCBzaXplIHNsaWRlclxuICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhbmdlJyk7XG4gICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ21pbicsICcxJyk7XG4gICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ21heCcsICc3Jyk7XG4gICAgICAgICAgICBpbnB1dC5jbGFzc05hbWUgPSAnbWVkaXVtLWVkaXRvci10b29sYmFyLWlucHV0JztcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgICAgICAgICAvLyBIYW5kbGUgdHlwaW5nIGluIHRoZSB0ZXh0Ym94XG4gICAgICAgICAgICB0aGlzLm9uKGlucHV0LCAnY2hhbmdlJywgdGhpcy5oYW5kbGVTbGlkZXJDaGFuZ2UuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIC8vIEFkZCBzYXZlIGJ1dG9uXG4gICAgICAgICAgICBzYXZlLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyk7XG4gICAgICAgICAgICBzYXZlLmNsYXNzTmFtZSA9ICdtZWRpdW0tZWRpdG9yLXRvb2Jhci1zYXZlJztcbiAgICAgICAgICAgIHNhdmUuaW5uZXJIVE1MID0gdGhpcy5nZXRFZGl0b3JPcHRpb24oJ2J1dHRvbkxhYmVscycpID09PSAnZm9udGF3ZXNvbWUnID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj48L2k+JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICcmIzEwMDAzOyc7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZENoaWxkKHNhdmUpO1xuXG4gICAgICAgICAgICAvLyBIYW5kbGUgc2F2ZSBidXR0b24gY2xpY2tzIChjYXB0dXJlKVxuICAgICAgICAgICAgdGhpcy5vbihzYXZlLCAnY2xpY2snLCB0aGlzLmhhbmRsZVNhdmVDbGljay5iaW5kKHRoaXMpLCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvblxuICAgICAgICAgICAgY2xvc2Uuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnKTtcbiAgICAgICAgICAgIGNsb3NlLmNsYXNzTmFtZSA9ICdtZWRpdW0tZWRpdG9yLXRvb2Jhci1jbG9zZSc7XG4gICAgICAgICAgICBjbG9zZS5pbm5lckhUTUwgPSB0aGlzLmdldEVkaXRvck9wdGlvbignYnV0dG9uTGFiZWxzJykgPT09ICdmb250YXdlc29tZScgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtdGltZXNcIj48L2k+JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJnRpbWVzOyc7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGNsb3NlKTtcblxuICAgICAgICAgICAgLy8gSGFuZGxlIGNsb3NlIGJ1dHRvbiBjbGlja3NcbiAgICAgICAgICAgIHRoaXMub24oY2xvc2UsICdjbGljaycsIHRoaXMuaGFuZGxlQ2xvc2VDbGljay5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0SW5wdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEZvcm0oKS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5tZWRpdW0tZWRpdG9yLXRvb2xiYXItaW5wdXQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhckZvbnRTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGVkRWxlbWVudHModGhpcy5kb2N1bWVudCkuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2ZvbnQnICYmIGVsLmhhc0F0dHJpYnV0ZSgnc2l6ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnc2l6ZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZVNsaWRlckNoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNpemUgPSB0aGlzLmdldElucHV0KCkudmFsdWU7XG4gICAgICAgICAgICBpZiAoc2l6ZSA9PT0gJzQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckZvbnRTaXplKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhlY0FjdGlvbignZm9udFNpemUnLCB7IHNpemU6IHNpemUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRm9ybUNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBub3QgdG8gaGlkZSBmb3JtIHdoZW4gY2xpY2tpbmcgaW5zaWRlIHRoZSBmb3JtXG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVTYXZlQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgLy8gQ2xpY2tpbmcgU2F2ZSAtPiBjcmVhdGUgdGhlIGZvbnQgc2l6ZVxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuZG9Gb3JtU2F2ZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUNsb3NlQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgLy8gQ2xpY2sgQ2xvc2UgLT4gY2xvc2UgdGhlIGZvcm1cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLmRvRm9ybUNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5mb250U2l6ZSA9IEZvbnRTaXplRm9ybTtcbn0oKSk7XG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvKmpzbGludCByZWdleHA6IHRydWUqL1xuICAgIC8qXG4gICAgICAgIGpzbGludCBkb2VzIG5vdCBhbGxvdyBjaGFyYWN0ZXIgbmVnYXRpb24sIGJlY2F1c2UgdGhlIG5lZ2F0aW9uXG4gICAgICAgIHdpbGwgbm90IG1hdGNoIGFueSB1bmljb2RlIGNoYXJhY3RlcnMuIEluIHRoZSByZWdleGVzIGluIHRoaXNcbiAgICAgICAgYmxvY2ssIG5lZ2F0aW9uIGlzIHVzZWQgc3BlY2lmaWNhbGx5IHRvIG1hdGNoIHRoZSBlbmQgb2YgYW4gaHRtbFxuICAgICAgICB0YWcsIGFuZCBpbiBmYWN0IHVuaWNvZGUgY2hhcmFjdGVycyAqc2hvdWxkKiBiZSBhbGxvd2VkLlxuICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlUmVwbGFjZW1lbnRzKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgLy8gcmVwbGFjZSB0d28gYm9ndXMgdGFncyB0aGF0IGJlZ2luIHBhc3RlcyBmcm9tIGdvb2dsZSBkb2NzXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvPFtePl0qZG9jcy1pbnRlcm5hbC1ndWlkW14+XSo+L2dpKSwgJyddLFxuICAgICAgICAgICAgW25ldyBSZWdFeHAoLzxcXC9iPig8YnJbXj5dKj4pPyQvZ2kpLCAnJ10sXG5cbiAgICAgICAgICAgICAvLyB1bi1odG1sIHNwYWNlcyBhbmQgbmV3bGluZXMgaW5zZXJ0ZWQgYnkgT1MgWFxuICAgICAgICAgICAgW25ldyBSZWdFeHAoLzxzcGFuIGNsYXNzPVwiQXBwbGUtY29udmVydGVkLXNwYWNlXCI+XFxzKzxcXC9zcGFuPi9nKSwgJyAnXSxcbiAgICAgICAgICAgIFtuZXcgUmVnRXhwKC88YnIgY2xhc3M9XCJBcHBsZS1pbnRlcmNoYW5nZS1uZXdsaW5lXCI+L2cpLCAnPGJyPiddLFxuXG4gICAgICAgICAgICAvLyByZXBsYWNlIGdvb2dsZSBkb2NzIGl0YWxpY3MrYm9sZCB3aXRoIGEgc3BhbiB0byBiZSByZXBsYWNlZCBvbmNlIHRoZSBodG1sIGlzIGluc2VydGVkXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvPHNwYW5bXj5dKihmb250LXN0eWxlOml0YWxpYztmb250LXdlaWdodDpib2xkfGZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zdHlsZTppdGFsaWMpW14+XSo+L2dpKSwgJzxzcGFuIGNsYXNzPVwicmVwbGFjZS13aXRoIGl0YWxpYyBib2xkXCI+J10sXG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgZ29vZ2xlIGRvY3MgaXRhbGljcyB3aXRoIGEgc3BhbiB0byBiZSByZXBsYWNlZCBvbmNlIHRoZSBodG1sIGlzIGluc2VydGVkXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvPHNwYW5bXj5dKmZvbnQtc3R5bGU6aXRhbGljW14+XSo+L2dpKSwgJzxzcGFuIGNsYXNzPVwicmVwbGFjZS13aXRoIGl0YWxpY1wiPiddLFxuXG4gICAgICAgICAgICAvL1tyZXBsYWNlIGdvb2dsZSBkb2NzIGJvbGRzIHdpdGggYSBzcGFuIHRvIGJlIHJlcGxhY2VkIG9uY2UgdGhlIGh0bWwgaXMgaW5zZXJ0ZWRcbiAgICAgICAgICAgIFtuZXcgUmVnRXhwKC88c3BhbltePl0qZm9udC13ZWlnaHQ6Ym9sZFtePl0qPi9naSksICc8c3BhbiBjbGFzcz1cInJlcGxhY2Utd2l0aCBib2xkXCI+J10sXG5cbiAgICAgICAgICAgICAvLyByZXBsYWNlIG1hbnVhbGx5IGVudGVyZWQgYi9pL2EgdGFncyB3aXRoIHJlYWwgb25lc1xuICAgICAgICAgICAgW25ldyBSZWdFeHAoLyZsdDsoXFwvPykoaXxifGEpJmd0Oy9naSksICc8JDEkMj4nXSxcblxuICAgICAgICAgICAgIC8vIHJlcGxhY2UgbWFudWFsbHkgYSB0YWdzIHdpdGggcmVhbCBvbmVzLCBjb252ZXJ0aW5nIHNtYXJ0LXF1b3RlcyBmcm9tIGdvb2dsZSBkb2NzXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvJmx0O2EoPzooPyFocmVmKS4pK2hyZWY9KD86JnF1b3Q7fCZyZHF1bzt8JmxkcXVvO3xcInzigJx84oCdKSgoKD8hJnF1b3Q7fCZyZHF1bzt8JmxkcXVvO3xcInzigJx84oCdKS4pKikoPzomcXVvdDt8JnJkcXVvO3wmbGRxdW87fFwifOKAnHzigJ0pKD86KD8hJmd0OykuKSomZ3Q7L2dpKSwgJzxhIGhyZWY9XCIkMVwiPiddLFxuXG4gICAgICAgICAgICAvLyBOZXdsaW5lcyBiZXR3ZWVuIHBhcmFncmFwaHMgaW4gaHRtbCBoYXZlIG5vIHN5bnRhY3RpYyB2YWx1ZSxcbiAgICAgICAgICAgIC8vIGJ1dCB0aGVuIGhhdmUgYSB0ZW5kZW5jeSB0byBhY2NpZGVudGFsbHkgYmVjb21lIGFkZGl0aW9uYWwgcGFyYWdyYXBocyBkb3duIHRoZSBsaW5lXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvPFxcL3A+XFxuKy9naSksICc8L3A+J10sXG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvXFxuKzxwL2dpKSwgJzxwJ10sXG5cbiAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBXb3JkIG1ha2VzIHRoZXNlIG9kZCB0YWdzLCBsaWtlIDxvOnA+PC9vOnA+XG4gICAgICAgICAgICBbbmV3IFJlZ0V4cCgvPFxcLz9vOlthLXpdKj4vZ2kpLCAnJ10sXG5cbiAgICAgICAgICAgIC8vIGNsZWFudXAgY29tbWVudHMgYWRkZWQgYnkgQ2hyb21lIHdoZW4gcGFzdGluZyBodG1sXG4gICAgICAgICAgICBbJzwhLS1FbmRGcmFnbWVudC0tPicsICcnXSxcbiAgICAgICAgICAgIFsnPCEtLVN0YXJ0RnJhZ21lbnQtLT4nLCAnJ11cbiAgICAgICAgXTtcbiAgICB9XG4gICAgLypqc2xpbnQgcmVnZXhwOiBmYWxzZSovXG5cbiAgICB2YXIgUGFzdGVIYW5kbGVyID0gTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5leHRlbmQoe1xuICAgICAgICAvKiBQYXN0ZSBPcHRpb25zICovXG5cbiAgICAgICAgLyogZm9yY2VQbGFpblRleHQ6IFtib29sZWFuXVxuICAgICAgICAgKiBGb3JjZXMgcGFzdGluZyBhcyBwbGFpbiB0ZXh0LlxuICAgICAgICAgKi9cbiAgICAgICAgZm9yY2VQbGFpblRleHQ6IHRydWUsXG5cbiAgICAgICAgLyogY2xlYW5QYXN0ZWRIVE1MOiBbYm9vbGVhbl1cbiAgICAgICAgICogY2xlYW5zIHBhc3RlZCBjb250ZW50IGZyb20gZGlmZmVyZW50IHNvdXJjZXMsIGxpa2UgZ29vZ2xlIGRvY3MgZXRjLlxuICAgICAgICAgKi9cbiAgICAgICAgY2xlYW5QYXN0ZWRIVE1MOiBmYWxzZSxcblxuICAgICAgICAvKiBjbGVhblJlcGxhY2VtZW50czogW0FycmF5XVxuICAgICAgICAgKiBjdXN0b20gcGFpcnMgKDIgZWxlbWVudCBhcnJheXMpIG9mIFJlZ0V4cCBhbmQgcmVwbGFjZW1lbnQgdGV4dCB0byB1c2UgZHVyaW5nIHBhc3RlIHdoZW5cbiAgICAgICAgICogX19mb3JjZVBsYWluVGV4dF9fIG9yIF9fY2xlYW5QYXN0ZWRIVE1MX18gYXJlIGB0cnVlYCBPUiB3aGVuIGNhbGxpbmcgYGNsZWFuUGFzdGUodGV4dClgIGhlbHBlciBtZXRob2QuXG4gICAgICAgICAqL1xuICAgICAgICBjbGVhblJlcGxhY2VtZW50czogW10sXG5cbiAgICAgICAgLyogY2xlYW5BdHRyczo6IFtBcnJheV1cbiAgICAgICAgICogbGlzdCBvZiBlbGVtZW50IGF0dHJpYnV0ZXMgdG8gcmVtb3ZlIGR1cmluZyBwYXN0ZSB3aGVuIF9fY2xlYW5QYXN0ZWRIVE1MX18gaXMgYHRydWVgIG9yIHdoZW5cbiAgICAgICAgICogY2FsbGluZyBgY2xlYW5QYXN0ZSh0ZXh0KWAgb3IgYHBhc3RlSFRNTChodG1sLCBvcHRpb25zKWAgaGVscGVyIG1ldGhvZHMuXG4gICAgICAgICAqL1xuICAgICAgICBjbGVhbkF0dHJzOiBbJ2NsYXNzJywgJ3N0eWxlJywgJ2RpciddLFxuXG4gICAgICAgIC8qIGNsZWFuVGFnczogW0FycmF5XVxuICAgICAgICAgKiBsaXN0IG9mIGVsZW1lbnQgdGFnIG5hbWVzIHRvIHJlbW92ZSBkdXJpbmcgcGFzdGUgd2hlbiBfX2NsZWFuUGFzdGVkSFRNTF9fIGlzIGB0cnVlYCBvciB3aGVuXG4gICAgICAgICAqIGNhbGxpbmcgYGNsZWFuUGFzdGUodGV4dClgIG9yIGBwYXN0ZUhUTUwoaHRtbCwgb3B0aW9ucylgIGhlbHBlciBtZXRob2RzLlxuICAgICAgICAgKi9cbiAgICAgICAgY2xlYW5UYWdzOiBbJ21ldGEnXSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZvcmNlUGxhaW5UZXh0IHx8IHRoaXMuY2xlYW5QYXN0ZWRIVE1MKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlUGFzdGUnLCB0aGlzLmhhbmRsZVBhc3RlLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZVBhc3RlOiBmdW5jdGlvbiAoZXZlbnQsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJhZ3JhcGhzLFxuICAgICAgICAgICAgICAgIGh0bWwgPSAnJyxcbiAgICAgICAgICAgICAgICBwLFxuICAgICAgICAgICAgICAgIGRhdGFGb3JtYXRIVE1MID0gJ3RleHQvaHRtbCcsXG4gICAgICAgICAgICAgICAgZGF0YUZvcm1hdFBsYWluID0gJ3RleHQvcGxhaW4nLFxuICAgICAgICAgICAgICAgIHBhc3RlZEhUTUwsXG4gICAgICAgICAgICAgICAgcGFzdGVkUGxhaW47XG5cbiAgICAgICAgICAgIGlmICh0aGlzLndpbmRvdy5jbGlwYm9hcmREYXRhICYmIGV2ZW50LmNsaXBib2FyZERhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LmNsaXBib2FyZERhdGEgPSB0aGlzLndpbmRvdy5jbGlwYm9hcmREYXRhO1xuICAgICAgICAgICAgICAgIC8vIElmIHdpbmRvdy5jbGlwYm9hcmREYXRhIGV4aXN0cywgYnV0IGV2ZW50LmNsaXBib2FyZERhdGEgZG9lc24ndCBleGlzdCxcbiAgICAgICAgICAgICAgICAvLyB3ZSdyZSBwcm9iYWJseSBpbiBJRS4gSUUgb25seSBoYXMgdHdvIHBvc3NpYmlsaXRpZXMgZm9yIGNsaXBib2FyZFxuICAgICAgICAgICAgICAgIC8vIGRhdGEgZm9ybWF0OiAnVGV4dCcgYW5kICdVUkwnLlxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gT2YgdGhlIHR3bywgd2Ugd2FudCAnVGV4dCc6XG4gICAgICAgICAgICAgICAgZGF0YUZvcm1hdEhUTUwgPSAnVGV4dCc7XG4gICAgICAgICAgICAgICAgZGF0YUZvcm1hdFBsYWluID0gJ1RleHQnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQuY2xpcGJvYXJkRGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICAgICAgcGFzdGVkSFRNTCA9IGV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YShkYXRhRm9ybWF0SFRNTCk7XG4gICAgICAgICAgICAgICAgcGFzdGVkUGxhaW4gPSBldmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEoZGF0YUZvcm1hdFBsYWluKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsZWFuUGFzdGVkSFRNTCAmJiBwYXN0ZWRIVE1MKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsZWFuUGFzdGUocGFzdGVkSFRNTCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEodGhpcy5nZXRFZGl0b3JPcHRpb24oJ2Rpc2FibGVSZXR1cm4nKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXJldHVybicpKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhZ3JhcGhzID0gcGFzdGVkUGxhaW4uc3BsaXQoL1tcXHJcXG5dKy9nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIFxcclxcbiBpbiBkYXRhLCBkb24ndCB3cmFwIGluIDxwPlxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYWdyYXBocy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHAgPSAwOyBwIDwgcGFyYWdyYXBocy5sZW5ndGg7IHAgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJhZ3JhcGhzW3BdICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sICs9ICc8cD4nICsgTWVkaXVtRWRpdG9yLnV0aWwuaHRtbEVudGl0aWVzKHBhcmFncmFwaHNbcF0pICsgJzwvcD4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBNZWRpdW1FZGl0b3IudXRpbC5odG1sRW50aXRpZXMocGFyYWdyYXBoc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBodG1sID0gTWVkaXVtRWRpdG9yLnV0aWwuaHRtbEVudGl0aWVzKHBhc3RlZFBsYWluKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuaW5zZXJ0SFRNTENvbW1hbmQodGhpcy5kb2N1bWVudCwgaHRtbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYW5QYXN0ZTogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIHZhciBpLCBlbExpc3QsIHRtcCwgd29ya0VsLFxuICAgICAgICAgICAgICAgIG11bHRpbGluZSA9IC88cHw8YnJ8PGRpdi8udGVzdCh0ZXh0KSxcbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudHMgPSBjcmVhdGVSZXBsYWNlbWVudHMoKS5jb25jYXQodGhpcy5jbGVhblJlcGxhY2VtZW50cyB8fCBbXSk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCByZXBsYWNlbWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlcGxhY2VtZW50c1tpXVswXSwgcmVwbGFjZW1lbnRzW2ldWzFdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFtdWx0aWxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXN0ZUhUTUwodGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHRlbXBvcmFyeSBkaXYgdG8gY2xlYW51cCBibG9jayBlbGVtZW50c1xuICAgICAgICAgICAgdG1wID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICAgICAgLy8gZG91YmxlIGJyJ3MgYXJlbid0IGNvbnZlcnRlZCB0byBwIHRhZ3MsIGJ1dCB3ZSB3YW50IHBhcmFncmFwaHMuXG4gICAgICAgICAgICB0bXAuaW5uZXJIVE1MID0gJzxwPicgKyB0ZXh0LnNwbGl0KCc8YnI+PGJyPicpLmpvaW4oJzwvcD48cD4nKSArICc8L3A+JztcblxuICAgICAgICAgICAgLy8gYmxvY2sgZWxlbWVudCBjbGVhbnVwXG4gICAgICAgICAgICBlbExpc3QgPSB0bXAucXVlcnlTZWxlY3RvckFsbCgnYSxwLGRpdixicicpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGVsTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHdvcmtFbCA9IGVsTGlzdFtpXTtcblxuICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBXb3JkIHJlcGxhY2VzIHNvbWUgc3BhY2VzIHdpdGggbmV3bGluZXMuXG4gICAgICAgICAgICAgICAgLy8gV2hpbGUgbmV3bGluZXMgYmV0d2VlbiBibG9jayBlbGVtZW50cyBhcmUgbWVhbmluZ2xlc3MsIG5ld2xpbmVzIHdpdGhpblxuICAgICAgICAgICAgICAgIC8vIGVsZW1lbnRzIGFyZSBzb21ldGltZXMgYWN0dWFsbHkgc3BhY2VzLlxuICAgICAgICAgICAgICAgIHdvcmtFbC5pbm5lckhUTUwgPSB3b3JrRWwuaW5uZXJIVE1MLnJlcGxhY2UoL1xcbi9naSwgJyAnKTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAod29ya0VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncCc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Rpdic6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbHRlckNvbW1vbkJsb2Nrcyh3b3JrRWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyTGluZUJyZWFrKHdvcmtFbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucGFzdGVIVE1MKHRtcC5pbm5lckhUTUwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhc3RlSFRNTDogZnVuY3Rpb24gKGh0bWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBNZWRpdW1FZGl0b3IudXRpbC5kZWZhdWx0cyh7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGNsZWFuQXR0cnM6IHRoaXMuY2xlYW5BdHRycyxcbiAgICAgICAgICAgICAgICBjbGVhblRhZ3M6IHRoaXMuY2xlYW5UYWdzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIGVsTGlzdCwgd29ya0VsLCBpLCBmcmFnbWVudEJvZHksIHBhc3RlQmxvY2sgPSB0aGlzLmRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgICAgICAgcGFzdGVCbG9jay5hcHBlbmRDaGlsZCh0aGlzLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKSk7XG5cbiAgICAgICAgICAgIGZyYWdtZW50Qm9keSA9IHBhc3RlQmxvY2sucXVlcnlTZWxlY3RvcignYm9keScpO1xuICAgICAgICAgICAgZnJhZ21lbnRCb2R5LmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICAgICAgICAgIHRoaXMuY2xlYW51cFNwYW5zKGZyYWdtZW50Qm9keSk7XG5cbiAgICAgICAgICAgIGVsTGlzdCA9IGZyYWdtZW50Qm9keS5xdWVyeVNlbGVjdG9yQWxsKCcqJyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZWxMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgd29ya0VsID0gZWxMaXN0W2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCdhJyA9PT0gd29ya0VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgJiYgdGhpcy5nZXRFZGl0b3JPcHRpb24oJ3RhcmdldEJsYW5rJykpIHtcbiAgICAgICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuc2V0VGFyZ2V0Qmxhbmsod29ya0VsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3IudXRpbC5jbGVhbnVwQXR0cnMod29ya0VsLCBvcHRpb25zLmNsZWFuQXR0cnMpO1xuICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmNsZWFudXBUYWdzKHdvcmtFbCwgb3B0aW9ucy5jbGVhblRhZ3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IudXRpbC5pbnNlcnRIVE1MQ29tbWFuZCh0aGlzLmRvY3VtZW50LCBmcmFnbWVudEJvZHkuaW5uZXJIVE1MLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0NvbW1vbkJsb2NrOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiAoZWwgJiYgKGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdwJyB8fCBlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGl2JykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbHRlckNvbW1vbkJsb2NrczogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoL15cXHMqJC8udGVzdChlbC50ZXh0Q29udGVudCkgJiYgZWwucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGZpbHRlckxpbmVCcmVhazogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NvbW1vbkJsb2NrKGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHN0cmF5IGJyJ3MgZm9sbG93aW5nIGNvbW1vbiBibG9jayBlbGVtZW50c1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlV2l0aFBhcmVudChlbCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNDb21tb25CbG9jayhlbC5wYXJlbnROb2RlKSAmJiAoZWwucGFyZW50Tm9kZS5maXJzdENoaWxkID09PSBlbCB8fCBlbC5wYXJlbnROb2RlLmxhc3RDaGlsZCA9PT0gZWwpKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGJyJ3MganVzdCBpbnNpZGUgb3BlbiBvciBjbG9zZSB0YWdzIG9mIGEgZGl2L3BcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVdpdGhQYXJlbnQoZWwpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUuY2hpbGRFbGVtZW50Q291bnQgPT09IDEgJiYgZWwucGFyZW50Tm9kZS50ZXh0Q29udGVudCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAvLyBhbmQgYnIncyB0aGF0IGFyZSB0aGUgb25seSBjaGlsZCBvZiBlbGVtZW50cyBvdGhlciB0aGFuIGRpdi9wXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVXaXRoUGFyZW50KGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyByZW1vdmUgYW4gZWxlbWVudCwgaW5jbHVkaW5nIGl0cyBwYXJlbnQsIGlmIGl0IGlzIHRoZSBvbmx5IGVsZW1lbnQgd2l0aGluIGl0cyBwYXJlbnRcbiAgICAgICAgcmVtb3ZlV2l0aFBhcmVudDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwgJiYgZWwucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiYgZWwucGFyZW50Tm9kZS5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFudXBTcGFuczogZnVuY3Rpb24gKGNvbnRhaW5lckVsKSB7XG4gICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICBlbCxcbiAgICAgICAgICAgICAgICBuZXdFbCxcbiAgICAgICAgICAgICAgICBzcGFucyA9IGNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5yZXBsYWNlLXdpdGgnKSxcbiAgICAgICAgICAgICAgICBpc0NFRiA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGVsICYmIGVsLm5vZGVOYW1lICE9PSAnI3RleHQnICYmIGVsLmdldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJykgPT09ICdmYWxzZScpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGVsID0gc3BhbnNbaV07XG4gICAgICAgICAgICAgICAgbmV3RWwgPSB0aGlzLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdib2xkJykgPyAnYicgOiAnaScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVsLmNsYXNzTGlzdC5jb250YWlucygnYm9sZCcpICYmIGVsLmNsYXNzTGlzdC5jb250YWlucygnaXRhbGljJykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGFuIGkgdGFnIGFzIHdlbGwgaWYgdGhpcyBoYXMgYm90aCBpdGFsaWNzIGFuZCBib2xkXG4gICAgICAgICAgICAgICAgICAgIG5ld0VsLmlubmVySFRNTCA9ICc8aT4nICsgZWwuaW5uZXJIVE1MICsgJzwvaT4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0VsLmlubmVySFRNTCA9IGVsLmlubmVySFRNTDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWwucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3RWwsIGVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3BhbnMgPSBjb250YWluZXJFbC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJyk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3BhbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBlbCA9IHNwYW5zW2ldO1xuXG4gICAgICAgICAgICAgICAgLy8gYmFpbCBpZiBzcGFuIGlzIGluIGNvbnRlbnRlZGl0YWJsZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLnRyYXZlcnNlVXAoZWwsIGlzQ0VGKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGVtcHR5IHNwYW5zLCByZXBsYWNlIG90aGVycyB3aXRoIHRoZWlyIGNvbnRlbnRzXG4gICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwudW53cmFwKGVsLCB0aGlzLmRvY3VtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMucGFzdGUgPSBQYXN0ZUhhbmRsZXI7XG59KCkpO1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBQbGFjZWhvbGRlciA9IE1lZGl1bUVkaXRvci5FeHRlbnNpb24uZXh0ZW5kKHtcbiAgICAgICAgbmFtZTogJ3BsYWNlaG9sZGVyJyxcblxuICAgICAgICAvKiBQbGFjZWhvbGRlciBPcHRpb25zICovXG5cbiAgICAgICAgLyogdGV4dDogW3N0cmluZ11cbiAgICAgICAgICogVGV4dCB0byBkaXNwbGF5IGluIHRoZSBwbGFjZWhvbGRlclxuICAgICAgICAgKi9cbiAgICAgICAgdGV4dDogJ1R5cGUgeW91ciB0ZXh0JyxcblxuICAgICAgICAvKiBoaWRlT25DbGljazogW2Jvb2xlYW5dXG4gICAgICAgICAqIFNob3VsZCB3ZSBoaWRlIHRoZSBwbGFjZWhvbGRlciBvbiBjbGljayAodHJ1ZSkgb3Igd2hlbiB1c2VyIHN0YXJ0cyB0eXBpbmcgKGZhbHNlKVxuICAgICAgICAgKi9cbiAgICAgICAgaGlkZU9uQ2xpY2s6IHRydWUsXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICB0aGlzLmluaXRQbGFjZWhvbGRlcnMoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRQbGFjZWhvbGRlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0RWRpdG9yRWxlbWVudHMoKS5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIGlmICghZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsYWNlaG9sZGVyJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLXBsYWNlaG9sZGVyJywgdGhpcy50ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQbGFjZWhvbGRlcihlbCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmdldEVkaXRvckVsZW1lbnRzKCkuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsYWNlaG9sZGVyJykgPT09IHRoaXMudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGxhY2Vob2xkZXInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93UGxhY2Vob2xkZXI6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnbWVkaXVtLWVkaXRvci1wbGFjZWhvbGRlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVQbGFjZWhvbGRlcjogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdtZWRpdW0tZWRpdG9yLXBsYWNlaG9sZGVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlUGxhY2Vob2xkZXI6IGZ1bmN0aW9uIChlbCwgZG9udFNob3cpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBjb250ZW50LCBoaWRlIHRoZSBwbGFjZWhvbGRlclxuICAgICAgICAgICAgaWYgKGVsLnF1ZXJ5U2VsZWN0b3IoJ2ltZywgYmxvY2txdW90ZSwgdWwsIG9sJykgfHwgKGVsLnRleHRDb250ZW50LnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKSAhPT0gJycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlkZVBsYWNlaG9sZGVyKGVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkb250U2hvdykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1BsYWNlaG9sZGVyKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhdHRhY2hFdmVudEhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oaWRlT25DbGljaykge1xuICAgICAgICAgICAgICAgIC8vIEZvciB0aGUgJ2hpZGVPbkNsaWNrJyBvcHRpb24sIHRoZSBwbGFjZWhvbGRlciBzaG91bGQgYWx3YXlzIGJlIGhpZGRlbiBvbiBmb2N1c1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdmb2N1cycsIHRoaXMuaGFuZGxlRm9jdXMuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBlZGl0b3IgaGFzIGNvbnRlbnQsIGl0IHNob3VsZCBhbHdheXMgaGlkZSB0aGUgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZUlucHV0JywgdGhpcy5oYW5kbGVJbnB1dC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZWRpdG9yIGxvc2VzIGZvY3VzLCBjaGVjayBpZiB0aGUgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIHZpc2libGVcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdibHVyJywgdGhpcy5oYW5kbGVCbHVyLmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUlucHV0OiBmdW5jdGlvbiAoZXZlbnQsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBwbGFjZWhvbGRlciBzaG91bGQgYmUgaGlkZGVuIG9uIGZvY3VzIGFuZCB0aGVcbiAgICAgICAgICAgIC8vIGVsZW1lbnQgaGFzIGZvY3VzLCBkb24ndCBzaG93IHRoZSBwbGFjZWhvbGRlclxuICAgICAgICAgICAgdmFyIGRvbnRTaG93ID0gdGhpcy5oaWRlT25DbGljayAmJiAoZWxlbWVudCA9PT0gdGhpcy5iYXNlLmdldEZvY3VzZWRFbGVtZW50KCkpO1xuXG4gICAgICAgICAgICAvLyBFZGl0b3IncyBjb250ZW50IGhhcyBjaGFuZ2VkLCBjaGVjayBpZiB0aGUgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIGhpZGRlblxuICAgICAgICAgICAgdGhpcy51cGRhdGVQbGFjZWhvbGRlcihlbGVtZW50LCBkb250U2hvdyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRm9jdXM6IGZ1bmN0aW9uIChldmVudCwgZWxlbWVudCkge1xuICAgICAgICAgICAgLy8gRWRpdG9yIGhhcyBmb2N1cywgaGlkZSB0aGUgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIHRoaXMuaGlkZVBsYWNlaG9sZGVyKGVsZW1lbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUJsdXI6IGZ1bmN0aW9uIChldmVudCwgZWxlbWVudCkge1xuICAgICAgICAgICAgLy8gRWRpdG9yIGhhcyBsb3N0IGZvY3VzLCBjaGVjayBpZiB0aGUgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIHNob3duXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBsYWNlaG9sZGVyKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5wbGFjZWhvbGRlciA9IFBsYWNlaG9sZGVyO1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgVG9vbGJhciA9IE1lZGl1bUVkaXRvci5FeHRlbnNpb24uZXh0ZW5kKHtcbiAgICAgICAgbmFtZTogJ3Rvb2xiYXInLFxuXG4gICAgICAgIC8qIFRvb2xiYXIgT3B0aW9ucyAqL1xuXG4gICAgICAgIC8qIGFsaWduOiBbJ2xlZnQnfCdjZW50ZXInfCdyaWdodCddXG4gICAgICAgICAqIFdoZW4gdGhlIF9fc3RhdGljX18gb3B0aW9uIGlzIHRydWUsIHRoaXMgYWxpZ25zIHRoZSBzdGF0aWMgdG9vbGJhclxuICAgICAgICAgKiByZWxhdGl2ZSB0byB0aGUgbWVkaXVtLWVkaXRvciBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgYWxpZ246ICdjZW50ZXInLFxuXG4gICAgICAgIC8qIGFsbG93TXVsdGlQYXJhZ3JhcGhTZWxlY3Rpb246IFtib29sZWFuXVxuICAgICAgICAgKiBlbmFibGVzL2Rpc2FibGVzIHdoZXRoZXIgdGhlIHRvb2xiYXIgc2hvdWxkIGJlIGRpc3BsYXllZCB3aGVuXG4gICAgICAgICAqIHNlbGVjdGluZyBtdWx0aXBsZSBwYXJhZ3JhcGhzL2Jsb2NrIGVsZW1lbnRzXG4gICAgICAgICAqL1xuICAgICAgICBhbGxvd011bHRpUGFyYWdyYXBoU2VsZWN0aW9uOiB0cnVlLFxuXG4gICAgICAgIC8qIGJ1dHRvbnM6IFtBcnJheV1cbiAgICAgICAgICogdGhlIG5hbWVzIG9mIHRoZSBzZXQgb2YgYnV0dG9ucyB0byBkaXNwbGF5IG9uIHRoZSB0b29sYmFyLlxuICAgICAgICAgKi9cbiAgICAgICAgYnV0dG9uczogWydib2xkJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnYW5jaG9yJywgJ2gyJywgJ2gzJywgJ3F1b3RlJ10sXG5cbiAgICAgICAgLyogZGlmZkxlZnQ6IFtOdW1iZXJdXG4gICAgICAgICAqIHZhbHVlIGluIHBpeGVscyB0byBiZSBhZGRlZCB0byB0aGUgWCBheGlzIHBvc2l0aW9uaW5nIG9mIHRoZSB0b29sYmFyLlxuICAgICAgICAgKi9cbiAgICAgICAgZGlmZkxlZnQ6IDAsXG5cbiAgICAgICAgLyogZGlmZlRvcDogW051bWJlcl1cbiAgICAgICAgICogdmFsdWUgaW4gcGl4ZWxzIHRvIGJlIGFkZGVkIHRvIHRoZSBZIGF4aXMgcG9zaXRpb25pbmcgb2YgdGhlIHRvb2xiYXIuXG4gICAgICAgICAqL1xuICAgICAgICBkaWZmVG9wOiAtMTAsXG5cbiAgICAgICAgLyogZmlyc3RCdXR0b25DbGFzczogW3N0cmluZ11cbiAgICAgICAgICogQ1NTIGNsYXNzIGFkZGVkIHRvIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIHRvb2xiYXIuXG4gICAgICAgICAqL1xuICAgICAgICBmaXJzdEJ1dHRvbkNsYXNzOiAnbWVkaXVtLWVkaXRvci1idXR0b24tZmlyc3QnLFxuXG4gICAgICAgIC8qIGxhc3RCdXR0b25DbGFzczogW3N0cmluZ11cbiAgICAgICAgICogQ1NTIGNsYXNzIGFkZGVkIHRvIHRoZSBsYXN0IGJ1dHRvbiBpbiB0aGUgdG9vbGJhci5cbiAgICAgICAgICovXG4gICAgICAgIGxhc3RCdXR0b25DbGFzczogJ21lZGl1bS1lZGl0b3ItYnV0dG9uLWxhc3QnLFxuXG4gICAgICAgIC8qIHN0YW5kYXJkaXplU2VsZWN0aW9uU3RhcnQ6IFtib29sZWFuXVxuICAgICAgICAgKiBlbmFibGVzL2Rpc2FibGVzIHN0YW5kYXJkaXppbmcgaG93IHRoZSBiZWdpbm5pbmcgb2YgYSByYW5nZSBpcyBkZWNpZGVkXG4gICAgICAgICAqIGJldHdlZW4gYnJvd3NlcnMgd2hlbmV2ZXIgdGhlIHNlbGVjdGVkIHRleHQgaXMgYW5hbHl6ZWQgZm9yIHVwZGF0aW5nIHRvb2xiYXIgYnV0dG9ucyBzdGF0dXMuXG4gICAgICAgICAqL1xuICAgICAgICBzdGFuZGFyZGl6ZVNlbGVjdGlvblN0YXJ0OiBmYWxzZSxcblxuICAgICAgICAvKiBzdGF0aWM6IFtib29sZWFuXVxuICAgICAgICAgKiBlbmFibGUvZGlzYWJsZSB0aGUgdG9vbGJhciBhbHdheXMgZGlzcGxheWluZyBpbiB0aGUgc2FtZSBsb2NhdGlvblxuICAgICAgICAgKiByZWxhdGl2ZSB0byB0aGUgbWVkaXVtLWVkaXRvciBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgc3RhdGljOiBmYWxzZSxcblxuICAgICAgICAvKiBzdGlja3k6IFtib29sZWFuXVxuICAgICAgICAgKiBXaGVuIHRoZSBfX3N0YXRpY19fIG9wdGlvbiBpcyB0cnVlLCB0aGlzIGVuYWJsZXMvZGlzYWJsZXMgdGhlIHRvb2xiYXJcbiAgICAgICAgICogXCJzdGlja2luZ1wiIHRvIHRoZSB2aWV3cG9ydCBhbmQgc3RheWluZyB2aXNpYmxlIG9uIHRoZSBzY3JlZW4gd2hpbGVcbiAgICAgICAgICogdGhlIHBhZ2Ugc2Nyb2xscy5cbiAgICAgICAgICovXG4gICAgICAgIHN0aWNreTogZmFsc2UsXG5cbiAgICAgICAgLyogdXBkYXRlT25FbXB0eVNlbGVjdGlvbjogW2Jvb2xlYW5dXG4gICAgICAgICAqIFdoZW4gdGhlIF9fc3RhdGljX18gb3B0aW9uIGlzIHRydWUsIHRoaXMgZW5hYmxlcy9kaXNhYmxlcyB1cGRhdGluZ1xuICAgICAgICAgKiB0aGUgc3RhdGUgb2YgdGhlIHRvb2xiYXIgYnV0dG9ucyBldmVuIHdoZW4gdGhlIHNlbGVjdGlvbiBpcyBjb2xsYXBzZWRcbiAgICAgICAgICogKHRoZXJlIGlzIG5vIHNlbGVjdGlvbiwganVzdCBhIGN1cnNvcikuXG4gICAgICAgICAqL1xuICAgICAgICB1cGRhdGVPbkVtcHR5U2VsZWN0aW9uOiBmYWxzZSxcblxuICAgICAgICAvKiByZWxhdGl2ZUNvbnRhaW5lcjogW25vZGVdXG4gICAgICAgICAqIGFwcGVuZGluZyB0aGUgdG9vbGJhciB0byBhIGdpdmVuIG5vZGUgaW5zdGVhZCBvZiBib2R5XG4gICAgICAgICAqL1xuICAgICAgICByZWxhdGl2ZUNvbnRhaW5lcjogbnVsbCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZWRpdW1FZGl0b3IuRXh0ZW5zaW9uLnByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHRoaXMuaW5pdFRocm90dGxlZE1ldGhvZHMoKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlbGF0aXZlQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRFZGl0b3JPcHRpb24oJ2VsZW1lbnRzQ29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGhpcy5nZXRUb29sYmFyRWxlbWVudCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGl2ZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmdldFRvb2xiYXJFbGVtZW50KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEhlbHBlciBtZXRob2QgdG8gZXhlY3V0ZSBtZXRob2QgZm9yIGV2ZXJ5IGV4dGVuc2lvbiwgYnV0IGlnbm9yaW5nIHRoZSB0b29sYmFyIGV4dGVuc2lvblxuICAgICAgICBmb3JFYWNoRXh0ZW5zaW9uOiBmdW5jdGlvbiAoaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJhc2UuZXh0ZW5zaW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT09IHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IuYXBwbHkoY29udGV4dCB8fCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gVG9vbGJhciBjcmVhdGlvbi9kZWxldGlvblxuXG4gICAgICAgIGNyZWF0ZVRvb2xiYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0b29sYmFyID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICAgICAgdG9vbGJhci5pZCA9ICdtZWRpdW0tZWRpdG9yLXRvb2xiYXItJyArIHRoaXMuZ2V0RWRpdG9ySWQoKTtcbiAgICAgICAgICAgIHRvb2xiYXIuY2xhc3NOYW1lID0gJ21lZGl1bS1lZGl0b3ItdG9vbGJhcic7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRpYykge1xuICAgICAgICAgICAgICAgIHRvb2xiYXIuY2xhc3NOYW1lICs9ICcgc3RhdGljLXRvb2xiYXInO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlbGF0aXZlQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhci5jbGFzc05hbWUgKz0gJyBtZWRpdW0tZWRpdG9yLXJlbGF0aXZlLXRvb2xiYXInO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b29sYmFyLmNsYXNzTmFtZSArPSAnIG1lZGl1bS1lZGl0b3Itc3RhbGtlci10b29sYmFyJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9vbGJhci5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVRvb2xiYXJCdXR0b25zKCkpO1xuXG4gICAgICAgICAgICAvLyBBZGQgYW55IGZvcm1zIHRoYXQgZXh0ZW5zaW9ucyBtYXkgaGF2ZVxuICAgICAgICAgICAgdGhpcy5mb3JFYWNoRXh0ZW5zaW9uKGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoZXh0ZW5zaW9uLmhhc0Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhci5hcHBlbmRDaGlsZChleHRlbnNpb24uZ2V0Rm9ybSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5hdHRhY2hFdmVudEhhbmRsZXJzKCk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b29sYmFyO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVRvb2xiYXJCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdWwgPSB0aGlzLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyksXG4gICAgICAgICAgICAgICAgbGksXG4gICAgICAgICAgICAgICAgYnRuLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnMsXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uLFxuICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWUsXG4gICAgICAgICAgICAgICAgYnV0dG9uT3B0cztcblxuICAgICAgICAgICAgdWwuaWQgPSAnbWVkaXVtLWVkaXRvci10b29sYmFyLWFjdGlvbnMnICsgdGhpcy5nZXRFZGl0b3JJZCgpO1xuICAgICAgICAgICAgdWwuY2xhc3NOYW1lID0gJ21lZGl1bS1lZGl0b3ItdG9vbGJhci1hY3Rpb25zJztcbiAgICAgICAgICAgIHVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMuZm9yRWFjaChmdW5jdGlvbiAoYnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBidXR0b24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWUgPSBidXR0b247XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbk9wdHMgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWUgPSBidXR0b24ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uT3B0cyA9IGJ1dHRvbjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYnV0dG9uIGFscmVhZHkgZXhpc3RzIGFzIGFuIGV4dGVuc2lvbiwgaXQnbGwgYmUgcmV0dXJuZWRcbiAgICAgICAgICAgICAgICAvLyBvdGh3ZXJpc2UgaXQnbGwgY3JlYXRlIHRoZSBkZWZhdWx0IGJ1aWx0LWluIGJ1dHRvblxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IHRoaXMuYmFzZS5hZGRCdWlsdEluRXh0ZW5zaW9uKGJ1dHRvbk5hbWUsIGJ1dHRvbk9wdHMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV4dGVuc2lvbiAmJiB0eXBlb2YgZXh0ZW5zaW9uLmdldEJ1dHRvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBidG4gPSBleHRlbnNpb24uZ2V0QnV0dG9uKHRoaXMuYmFzZSk7XG4gICAgICAgICAgICAgICAgICAgIGxpID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNFbGVtZW50KGJ0bikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaS5pbm5lckhUTUwgPSBidG47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgICBidXR0b25zID0gdWwucXVlcnlTZWxlY3RvckFsbCgnYnV0dG9uJyk7XG4gICAgICAgICAgICBpZiAoYnV0dG9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uc1swXS5jbGFzc0xpc3QuYWRkKHRoaXMuZmlyc3RCdXR0b25DbGFzcyk7XG4gICAgICAgICAgICAgICAgYnV0dG9uc1tidXR0b25zLmxlbmd0aCAtIDFdLmNsYXNzTGlzdC5hZGQodGhpcy5sYXN0QnV0dG9uQ2xhc3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudG9vbGJhcikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvb2xiYXIucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvb2xiYXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnRvb2xiYXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50b29sYmFyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFRvb2xiYXIgYWNjZXNzb3JzXG5cbiAgICAgICAgZ2V0VG9vbGJhckVsZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy50b29sYmFyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b29sYmFyID0gdGhpcy5jcmVhdGVUb29sYmFyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvb2xiYXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0VG9vbGJhckFjdGlvbnNFbGVtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUb29sYmFyRWxlbWVudCgpLnF1ZXJ5U2VsZWN0b3IoJy5tZWRpdW0tZWRpdG9yLXRvb2xiYXItYWN0aW9ucycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFRvb2xiYXIgZXZlbnQgaGFuZGxlcnNcblxuICAgICAgICBpbml0VGhyb3R0bGVkTWV0aG9kczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gdGhyb3R0bGVkUG9zaXRpb25Ub29sYmFyIGlzIHRocm90dGxlZCBiZWNhdXNlOlxuICAgICAgICAgICAgLy8gLSBJdCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBicm93c2VyIGlzIHJlc2l6aW5nLCB3aGljaCBjYW4gZmlyZSBtYW55IHRpbWVzIHZlcnkgcXVpY2tseVxuICAgICAgICAgICAgLy8gLSBGb3Igc29tZSBldmVudCAobGlrZSByZXNpemUpIGEgc2xpZ2h0IGxhZyBpbiBVSSByZXNwb25zaXZlbmVzcyBpcyBPSyBhbmQgcHJvdmlkZXMgcGVyZm9ybWFuY2UgYmVuZWZpdHNcbiAgICAgICAgICAgIHRoaXMudGhyb3R0bGVkUG9zaXRpb25Ub29sYmFyID0gTWVkaXVtRWRpdG9yLnV0aWwudGhyb3R0bGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJhc2UuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblRvb2xiYXJJZlNob3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhdHRhY2hFdmVudEhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBNZWRpdW1FZGl0b3IgY3VzdG9tIGV2ZW50cyBmb3Igd2hlbiB1c2VyIGJlaW5ncyBhbmQgZW5kcyBpbnRlcmFjdGlvbiB3aXRoIGEgY29udGVudGVkaXRhYmxlIGFuZCBpdHMgZWxlbWVudHNcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdibHVyJywgdGhpcy5oYW5kbGVCbHVyLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2ZvY3VzJywgdGhpcy5oYW5kbGVGb2N1cy5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgLy8gVXBkYXRpbmcgdGhlIHN0YXRlIG9mIHRoZSB0b29sYmFyIGFzIHRoaW5ncyBjaGFuZ2VcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZUNsaWNrJywgdGhpcy5oYW5kbGVFZGl0YWJsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlS2V5dXAnLCB0aGlzLmhhbmRsZUVkaXRhYmxlS2V5dXAuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBtb3VzZXVwIG9uIGRvY3VtZW50IGZvciB1cGRhdGluZyB0aGUgc2VsZWN0aW9uIGluIHRoZSB0b29sYmFyXG4gICAgICAgICAgICB0aGlzLm9uKHRoaXMuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMuaGFuZGxlRG9jdW1lbnRNb3VzZXVwLmJpbmQodGhpcykpO1xuXG4gICAgICAgICAgICAvLyBBZGQgYSBzY3JvbGwgZXZlbnQgZm9yIHN0aWNreSB0b29sYmFyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0aWMgJiYgdGhpcy5zdGlja3kpIHtcbiAgICAgICAgICAgICAgICAvLyBPbiBzY3JvbGwgKGNhcHR1cmUpLCByZS1wb3NpdGlvbiB0aGUgdG9vbGJhclxuICAgICAgICAgICAgICAgIHRoaXMub24odGhpcy53aW5kb3csICdzY3JvbGwnLCB0aGlzLmhhbmRsZVdpbmRvd1Njcm9sbC5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT24gcmVzaXplLCByZS1wb3NpdGlvbiB0aGUgdG9vbGJhclxuICAgICAgICAgICAgdGhpcy5vbih0aGlzLndpbmRvdywgJ3Jlc2l6ZScsIHRoaXMuaGFuZGxlV2luZG93UmVzaXplLmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZVdpbmRvd1Njcm9sbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblRvb2xiYXJJZlNob3duKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlV2luZG93UmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnRocm90dGxlZFBvc2l0aW9uVG9vbGJhcigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZURvY3VtZW50TW91c2V1cDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBEbyBub3QgdHJpZ2dlciBjaGVja1N0YXRlIHdoZW4gbW91c2V1cCBmaXJlcyBvdmVyIHRoZSB0b29sYmFyXG4gICAgICAgICAgICBpZiAoZXZlbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ICYmXG4gICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudCh0aGlzLmdldFRvb2xiYXJFbGVtZW50KCksIGV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNoZWNrU3RhdGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVFZGl0YWJsZUNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBEZWxheSB0aGUgY2FsbCB0byBjaGVja1N0YXRlIHRvIGhhbmRsZSBidWcgd2hlcmUgc2VsZWN0aW9uIGlzIGVtcHR5XG4gICAgICAgICAgICAvLyBpbW1lZGlhdGVseSBhZnRlciBjbGlja2luZyBpbnNpZGUgYSBwcmUtZXhpc3Rpbmcgc2VsZWN0aW9uXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRWRpdGFibGVLZXl1cDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja1N0YXRlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlQmx1cjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gS2lsbCBhbnkgcHJldmlvdXNseSBkZWxheWVkIGNhbGxzIHRvIGhpZGUgdGhlIHRvb2xiYXJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcblxuICAgICAgICAgICAgLy8gQmx1ciBtYXkgZmlyZSBldmVuIGlmIHdlIGhhdmUgYSBzZWxlY3Rpb24sIHNvIHdlIHdhbnQgdG8gcHJldmVudCBhbnkgZGVsYXllZCBzaG93VG9vbGJhclxuICAgICAgICAgICAgLy8gY2FsbHMgZnJvbSBoYXBwZW5pbmcgaW4gdGhpcyBzcGVjaWZpYyBjYXNlXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxheVNob3dUaW1lb3V0KTtcblxuICAgICAgICAgICAgLy8gRGVsYXkgdGhlIGNhbGwgdG8gaGlkZVRvb2xiYXIgdG8gaGFuZGxlIGJ1ZyB3aXRoIG11bHRpcGxlIGVkaXRvcnMgb24gdGhlIHBhZ2UgYXQgb25jZVxuICAgICAgICAgICAgdGhpcy5oaWRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVRvb2xiYXIoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFuZGxlRm9jdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tTdGF0ZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEhpZGluZy9zaG93aW5nIHRvb2xiYXJcblxuICAgICAgICBpc0Rpc3BsYXllZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VG9vbGJhckVsZW1lbnQoKS5jbGFzc0xpc3QuY29udGFpbnMoJ21lZGl1bS1lZGl0b3ItdG9vbGJhci1hY3RpdmUnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93VG9vbGJhcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRGlzcGxheWVkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFRvb2xiYXJFbGVtZW50KCkuY2xhc3NMaXN0LmFkZCgnbWVkaXVtLWVkaXRvci10b29sYmFyLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcignc2hvd1Rvb2xiYXInLCB7fSwgdGhpcy5iYXNlLmdldEZvY3VzZWRFbGVtZW50KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVUb29sYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUb29sYmFyRWxlbWVudCgpLmNsYXNzTGlzdC5yZW1vdmUoJ21lZGl1bS1lZGl0b3ItdG9vbGJhci1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2hpZGVUb29sYmFyJywge30sIHRoaXMuYmFzZS5nZXRGb2N1c2VkRWxlbWVudCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpc1Rvb2xiYXJEZWZhdWx0QWN0aW9uc0Rpc3BsYXllZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VG9vbGJhckFjdGlvbnNFbGVtZW50KCkuc3R5bGUuZGlzcGxheSA9PT0gJ2Jsb2NrJztcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlVG9vbGJhckRlZmF1bHRBY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1Rvb2xiYXJEZWZhdWx0QWN0aW9uc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUb29sYmFyQWN0aW9uc0VsZW1lbnQoKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNob3dUb29sYmFyRGVmYXVsdEFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUV4dGVuc2lvbkZvcm1zKCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5pc1Rvb2xiYXJEZWZhdWx0QWN0aW9uc0Rpc3BsYXllZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUb29sYmFyQWN0aW9uc0VsZW1lbnQoKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNpbmcgc2V0VGltZW91dCArIG9wdGlvbnMuZGVsYXkgYmVjYXVzZTpcbiAgICAgICAgICAgIC8vIFdlIHdpbGwgYWN0dWFsbHkgYmUgZGlzcGxheWluZyB0aGUgdG9vbGJhciwgd2hpY2ggc2hvdWxkIGJlIGNvbnRyb2xsZWQgYnkgb3B0aW9ucy5kZWxheVxuICAgICAgICAgICAgdGhpcy5kZWxheVNob3dUaW1lb3V0ID0gdGhpcy5iYXNlLmRlbGF5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dUb29sYmFyKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVFeHRlbnNpb25Gb3JtczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSGlkZSBhbGwgZXh0ZW5zaW9uIGZvcm1zXG4gICAgICAgICAgICB0aGlzLmZvckVhY2hFeHRlbnNpb24oZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb24uaGFzRm9ybSAmJiBleHRlbnNpb24uaXNEaXNwbGF5ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24uaGlkZUZvcm0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBSZXNwb25kaW5nIHRvIGNoYW5nZXMgaW4gdXNlciBzZWxlY3Rpb25cblxuICAgICAgICAvLyBDaGVja3MgZm9yIGV4aXN0YW5jZSBvZiBtdWx0aXBsZSBibG9jayBlbGVtZW50cyBpbiB0aGUgY3VycmVudCBzZWxlY3Rpb25cbiAgICAgICAgbXVsdGlwbGVCbG9ja0VsZW1lbnRzU2VsZWN0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZWdleEVtcHR5SFRNTFRhZ3MgPSAvPFteXFwvPl1bXj5dKj48XFwvW14+XSs+L2dpbSwgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMTI5NzM4L3JlbW92ZS1lbXB0eS10YWdzLXVzaW5nLXJlZ2V4XG4gICAgICAgICAgICAgICAgcmVnZXhCbG9ja0VsZW1lbnRzID0gbmV3IFJlZ0V4cCgnPCgnICsgTWVkaXVtRWRpdG9yLnV0aWwuYmxvY2tDb250YWluZXJFbGVtZW50TmFtZXMuam9pbignfCcpICsgJylbXj5dKj4nLCAnZycpLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbkhUTUwgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvbkh0bWwodGhpcy5kb2N1bWVudCkucmVwbGFjZShyZWdleEVtcHR5SFRNTFRhZ3MsICcnKSwgLy8gRmlsdGVyIG91dCBlbXB0eSBibG9ja3MgZnJvbSBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBoYXNNdWx0aVBhcmFncmFwaHMgPSBzZWxlY3Rpb25IVE1MLm1hdGNoKHJlZ2V4QmxvY2tFbGVtZW50cyk7IC8vIEZpbmQgaG93IG1hbnkgYmxvY2sgZWxlbWVudHMgYXJlIHdpdGhpbiB0aGUgaHRtbFxuXG4gICAgICAgICAgICByZXR1cm4gISFoYXNNdWx0aVBhcmFncmFwaHMgJiYgaGFzTXVsdGlQYXJhZ3JhcGhzLmxlbmd0aCA+IDE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9kaWZ5U2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uID0gdGhpcy53aW5kb3cuZ2V0U2VsZWN0aW9uKCksXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICogSW4gZmlyZWZveCwgdGhlcmUgYXJlIGNhc2VzIChpZSBkb3VibGVjbGljayBvZiBhIHdvcmQpIHdoZXJlIHRoZSBzZWxlY3Rpb25SYW5nZSBzdGFydFxuICAgICAgICAgICAgKiB3aWxsIGJlIGF0IHRoZSB2ZXJ5IGVuZCBvZiBhbiBlbGVtZW50LiAgSW4gb3RoZXIgYnJvd3NlcnMsIHRoZSBzZWxlY3Rpb25SYW5nZSBzdGFydFxuICAgICAgICAgICAgKiB3b3VsZCBpbnN0ZWFkIGJlIGF0IHRoZSB2ZXJ5IGJlZ2lubmluZyBvZiBhbiBlbGVtZW50IHRoYXQgYWN0dWFsbHkgaGFzIGNvbnRlbnQuXG4gICAgICAgICAgICAqIGV4YW1wbGU6XG4gICAgICAgICAgICAqICAgPHNwYW4+Zm9vPC9zcGFuPjxzcGFuPmJhcjwvc3Bhbj5cbiAgICAgICAgICAgICpcbiAgICAgICAgICAgICogSWYgdGhlIHRleHQgJ2JhcicgaXMgc2VsZWN0ZWQsIG1vc3QgYnJvd3NlcnMgd2lsbCBoYXZlIHRoZSBzZWxlY3Rpb25SYW5nZSBzdGFydCBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAgICAqIG9mIHRoZSAnYmFyJyBzcGFuLiAgSG93ZXZlciwgdGhlcmUgYXJlIGNhc2VzIHdoZXJlIGZpcmVmb3ggd2lsbCBoYXZlIHRoZSBzZWxlY3Rpb25SYW5nZSBzdGFydFxuICAgICAgICAgICAgKiBhdCB0aGUgZW5kIG9mIHRoZSAnZm9vJyBzcGFuLiAgVGhlIGNvbnRlbnRlZGl0YWJsZSBiZWhhdmlvciB3aWxsIGJlIG9rLCBidXQgaWYgdGhlcmUgYXJlIGFueVxuICAgICAgICAgICAgKiBwcm9wZXJ0aWVzIG9uIHRoZSAnYmFyJyBzcGFuLCB0aGV5IHdvbid0IGJlIHJlZmxlY3RlZCBhY2N1cmF0ZWx5IGluIHRoZSB0b29sYmFyXG4gICAgICAgICAgICAqIChpZSAnQm9sZCcgYnV0dG9uIHdvdWxkbid0IGJlIGFjdGl2ZSlcbiAgICAgICAgICAgICpcbiAgICAgICAgICAgICogU28sIGZvciBjYXNlcyB3aGVyZSB0aGUgc2VsZWN0aW9uUmFuZ2Ugc3RhcnQgaXMgYXQgdGhlIGVuZCBvZiBhbiBlbGVtZW50L25vZGUsIGZpbmQgdGhlIG5leHRcbiAgICAgICAgICAgICogYWRqYWNlbnQgdGV4dCBub2RlIHRoYXQgYWN0dWFsbHkgaGFzIGNvbnRlbnQgaW4gaXQsIGFuZCBtb3ZlIHRoZSBzZWxlY3Rpb25SYW5nZSBzdGFydCB0aGVyZS5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAodGhpcy5zdGFuZGFyZGl6ZVNlbGVjdGlvblN0YXJ0ICYmXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvblJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVWYWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAoc2VsZWN0aW9uUmFuZ2Uuc3RhcnRPZmZzZXQgPT09IHNlbGVjdGlvblJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVWYWx1ZS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFkamFjZW50Tm9kZSA9IE1lZGl1bUVkaXRvci51dGlsLmZpbmRBZGphY2VudFRleHROb2RlV2l0aENvbnRlbnQoTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25FbGVtZW50KHRoaXMud2luZG93KSwgc2VsZWN0aW9uUmFuZ2Uuc3RhcnRDb250YWluZXIsIHRoaXMuZG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgIGlmIChhZGphY2VudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhZGphY2VudE5vZGUubm9kZVZhbHVlLnN1YnN0cihvZmZzZXQsIDEpLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IG9mZnNldCArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uUmFuZ2UgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLnNlbGVjdCh0aGlzLmRvY3VtZW50LCBhZGphY2VudE5vZGUsIG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvblJhbmdlLmVuZENvbnRhaW5lciwgc2VsZWN0aW9uUmFuZ2UuZW5kT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuYmFzZS5wcmV2ZW50U2VsZWN0aW9uVXBkYXRlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgbm8gZWRpdGFibGUgaGFzIGZvY3VzIE9SIHNlbGVjdGlvbiBpcyBpbnNpZGUgY29udGVudGVkaXRhYmxlID0gZmFsc2VcbiAgICAgICAgICAgIC8vIGhpZGUgdG9vbGJhclxuICAgICAgICAgICAgaWYgKCF0aGlzLmJhc2UuZ2V0Rm9jdXNlZEVsZW1lbnQoKSB8fFxuICAgICAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLnNlbGVjdGlvbkluQ29udGVudEVkaXRhYmxlRmFsc2UodGhpcy53aW5kb3cpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlkZVRvb2xiYXIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBzZWxlY3Rpb24gZWxlbWVudCwgc2VsZWN0aW9uIGVsZW1lbnQgZG9lc24ndCBiZWxvbmcgdG8gdGhpcyBlZGl0b3JcbiAgICAgICAgICAgIC8vIG9yIHRvb2xiYXIgaXMgZGlzYWJsZWQgZm9yIHRoaXMgc2VsZWN0aW9uIGVsZW1lbnRcbiAgICAgICAgICAgIC8vIGhpZGUgdG9vbGJhclxuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbkVsZW1lbnQgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvbkVsZW1lbnQodGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgaWYgKCFzZWxlY3Rpb25FbGVtZW50IHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0RWRpdG9yRWxlbWVudHMoKS5pbmRleE9mKHNlbGVjdGlvbkVsZW1lbnQpID09PSAtMSB8fFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25FbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXRvb2xiYXInKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZGVUb29sYmFyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vdyB3ZSBrbm93IHRoZXJlJ3MgYSBmb2N1c2VkIGVkaXRhYmxlIHdpdGggYSBzZWxlY3Rpb25cblxuICAgICAgICAgICAgLy8gSWYgdGhlIHVwZGF0ZU9uRW1wdHlTZWxlY3Rpb24gb3B0aW9uIGlzIHRydWUsIHNob3cgdGhlIHRvb2xiYXJcbiAgICAgICAgICAgIGlmICh0aGlzLnVwZGF0ZU9uRW1wdHlTZWxlY3Rpb24gJiYgdGhpcy5zdGF0aWMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zaG93QW5kVXBkYXRlVG9vbGJhcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgJ3ZhbGlkJyBzZWxlY3Rpb24gLT4gaGlkZSB0b29sYmFyXG4gICAgICAgICAgICBpZiAodGhpcy53aW5kb3cuZ2V0U2VsZWN0aW9uKCkudG9TdHJpbmcoKS50cmltKCkgPT09ICcnIHx8XG4gICAgICAgICAgICAgICAgKHRoaXMuYWxsb3dNdWx0aVBhcmFncmFwaFNlbGVjdGlvbiA9PT0gZmFsc2UgJiYgdGhpcy5tdWx0aXBsZUJsb2NrRWxlbWVudHNTZWxlY3RlZCgpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZGVUb29sYmFyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hvd0FuZFVwZGF0ZVRvb2xiYXIoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBVcGRhdGluZyB0aGUgdG9vbGJhclxuXG4gICAgICAgIHNob3dBbmRVcGRhdGVUb29sYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGlmeVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5zZXRUb29sYmFyQnV0dG9uU3RhdGVzKCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ3Bvc2l0aW9uVG9vbGJhcicsIHt9LCB0aGlzLmJhc2UuZ2V0Rm9jdXNlZEVsZW1lbnQoKSk7XG4gICAgICAgICAgICB0aGlzLnNob3dUb29sYmFyRGVmYXVsdEFjdGlvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0VG9vbGJhclBvc2l0aW9uKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0VG9vbGJhckJ1dHRvblN0YXRlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5mb3JFYWNoRXh0ZW5zaW9uKGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGV4dGVuc2lvbi5pc0FjdGl2ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgZXh0ZW5zaW9uLnNldEluYWN0aXZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5zZXRJbmFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmNoZWNrQWN0aXZlQnV0dG9ucygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNoZWNrQWN0aXZlQnV0dG9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1hbnVhbFN0YXRlQ2hlY2tzID0gW10sXG4gICAgICAgICAgICAgICAgcXVlcnlTdGF0ZSA9IG51bGwsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uUmFuZ2UgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvblJhbmdlKHRoaXMuZG9jdW1lbnQpLFxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uU3RhdGUgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0ZW5zaW9uLmNoZWNrU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5jaGVja1N0YXRlKHBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHRlbnNpb24uaXNBY3RpdmUgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgZXh0ZW5zaW9uLmlzQWxyZWFkeUFwcGxpZWQgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgZXh0ZW5zaW9uLnNldEFjdGl2ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFleHRlbnNpb24uaXNBY3RpdmUoKSAmJiBleHRlbnNpb24uaXNBbHJlYWR5QXBwbGllZChwYXJlbnROb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5zZXRBY3RpdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghc2VsZWN0aW9uUmFuZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgZXh0ZW5zaW9uc1xuICAgICAgICAgICAgdGhpcy5mb3JFYWNoRXh0ZW5zaW9uKGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgdGhvc2UgZXh0ZW5zaW9ucyB3aGVyZSB3ZSBjYW4gdXNlIGRvY3VtZW50LnF1ZXJ5Q29tbWFuZFN0YXRlKCksIGRvIHNvXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRlbnNpb24ucXVlcnlDb21tYW5kU3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlTdGF0ZSA9IGV4dGVuc2lvbi5xdWVyeUNvbW1hbmRTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBxdWVyeUNvbW1hbmRTdGF0ZSByZXR1cm5zIGEgdmFsaWQgdmFsdWUsIHdlIGNhbiB0cnVzdCB0aGUgYnJvd3NlclxuICAgICAgICAgICAgICAgICAgICAvLyBhbmQgZG9uJ3QgbmVlZCB0byBkbyBvdXIgbWFudWFsIGNoZWNrc1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5U3RhdGUgJiYgdHlwZW9mIGV4dGVuc2lvbi5zZXRBY3RpdmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24uc2V0QWN0aXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gV2UgY2FuJ3QgdXNlIHF1ZXJ5Q29tbWFuZFN0YXRlIGZvciB0aGlzIGV4dGVuc2lvbiwgc28gYWRkIHRvIG1hbnVhbFN0YXRlQ2hlY2tzXG4gICAgICAgICAgICAgICAgbWFudWFsU3RhdGVDaGVja3MucHVzaChleHRlbnNpb24pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGVkUGFyZW50RWxlbWVudChzZWxlY3Rpb25SYW5nZSk7XG5cbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc2VsZWN0aW9uIHBhcmVudCBpc24ndCBvdXRzaWRlIG9mIHRoZSBjb250ZW50ZWRpdGFibGVcbiAgICAgICAgICAgIGlmICghdGhpcy5nZXRFZGl0b3JFbGVtZW50cygpLnNvbWUoZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1lZGl1bUVkaXRvci51dGlsLmlzRGVzY2VuZGFudChlbGVtZW50LCBwYXJlbnROb2RlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2xpbWIgdXAgdGhlIERPTSBhbmQgZG8gbWFudWFsIGNoZWNrcyBmb3Igd2hldGhlciBhIGNlcnRhaW4gZXh0ZW5zaW9uIGlzIGN1cnJlbnRseSBlbmFibGVkIGZvciB0aGlzIG5vZGVcbiAgICAgICAgICAgIHdoaWxlIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgbWFudWFsU3RhdGVDaGVja3MuZm9yRWFjaCh1cGRhdGVFeHRlbnNpb25TdGF0ZSk7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYWJvcnQgdGhlIHNlYXJjaCB1cHdhcmRzIGlmIHdlIGxlYXZlIHRoZSBjb250ZW50RWRpdGFibGUgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChNZWRpdW1FZGl0b3IudXRpbC5pc01lZGl1bUVkaXRvckVsZW1lbnQocGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUgPSBwYXJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUG9zaXRpb25pbmcgdG9vbGJhclxuXG4gICAgICAgIHBvc2l0aW9uVG9vbGJhcklmU2hvd246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRGlzcGxheWVkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFRvb2xiYXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNldFRvb2xiYXJQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuYmFzZS5nZXRGb2N1c2VkRWxlbWVudCgpLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbiA9IHRoaXMud2luZG93LmdldFNlbGVjdGlvbigpLFxuICAgICAgICAgICAgICAgIGFuY2hvclByZXZpZXc7XG5cbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzbid0IGEgdmFsaWQgc2VsZWN0aW9uLCBiYWlsXG4gICAgICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0aWMgJiYgIXRoaXMucmVsYXRpdmVDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dUb29sYmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblN0YXRpY1Rvb2xiYXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1Rvb2xiYXIoKTtcblxuICAgICAgICAgICAgICAgIC8vIHdlIGRvbid0IG5lZWQgYW55IGFic29sdXRlIHBvc2l0aW9uaW5nIGlmIHJlbGF0aXZlQ29udGFpbmVyIGlzIHNldFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZWxhdGl2ZUNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc2l0aW9uVG9vbGJhcihzZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYW5jaG9yUHJldmlldyA9IHRoaXMuYmFzZS5nZXRFeHRlbnNpb25CeU5hbWUoJ2FuY2hvci1wcmV2aWV3Jyk7XG5cbiAgICAgICAgICAgIGlmIChhbmNob3JQcmV2aWV3ICYmIHR5cGVvZiBhbmNob3JQcmV2aWV3LmhpZGVQcmV2aWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yUHJldmlldy5oaWRlUHJldmlldygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBvc2l0aW9uU3RhdGljVG9vbGJhcjogZnVuY3Rpb24gKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgLy8gcG9zaXRpb24gdGhlIHRvb2xiYXIgYXQgbGVmdCAwLCBzbyB3ZSBjYW4gZ2V0IHRoZSByZWFsIHdpZHRoIG9mIHRoZSB0b29sYmFyXG4gICAgICAgICAgICB0aGlzLmdldFRvb2xiYXJFbGVtZW50KCkuc3R5bGUubGVmdCA9ICcwJztcblxuICAgICAgICAgICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IGZvciBJRSA5XG4gICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gKHRoaXMuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIHRoaXMuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgfHwgdGhpcy5kb2N1bWVudC5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICAgICAgICB3aW5kb3dXaWR0aCA9IHRoaXMud2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQgPSB0aGlzLmdldFRvb2xiYXJFbGVtZW50KCksXG4gICAgICAgICAgICAgICAgY29udGFpbmVyUmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJUb3AgPSBjb250YWluZXJSZWN0LnRvcCArIHNjcm9sbFRvcCxcbiAgICAgICAgICAgICAgICBjb250YWluZXJDZW50ZXIgPSAoY29udGFpbmVyUmVjdC5sZWZ0ICsgKGNvbnRhaW5lclJlY3Qud2lkdGggLyAyKSksXG4gICAgICAgICAgICAgICAgdG9vbGJhckhlaWdodCA9IHRvb2xiYXJFbGVtZW50Lm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgICAgICB0b29sYmFyV2lkdGggPSB0b29sYmFyRWxlbWVudC5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICBoYWxmT2Zmc2V0V2lkdGggPSB0b29sYmFyV2lkdGggLyAyLFxuICAgICAgICAgICAgICAgIHRhcmdldExlZnQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0aWNreSkge1xuICAgICAgICAgICAgICAgIC8vIElmIGl0J3MgYmV5b25kIHRoZSBoZWlnaHQgb2YgdGhlIGVkaXRvciwgcG9zaXRpb24gaXQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgZWRpdG9yXG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvcCA+IChjb250YWluZXJUb3AgKyBjb250YWluZXIub2Zmc2V0SGVpZ2h0IC0gdG9vbGJhckhlaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUudG9wID0gKGNvbnRhaW5lclRvcCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgLSB0b29sYmFySGVpZ2h0KSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ21lZGl1bS1lZGl0b3Itc3RpY2t5LXRvb2xiYXInKTtcblxuICAgICAgICAgICAgICAgIC8vIFN0aWNrIHRoZSB0b29sYmFyIHRvIHRoZSB0b3Agb2YgdGhlIHdpbmRvd1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsVG9wID4gKGNvbnRhaW5lclRvcCAtIHRvb2xiYXJIZWlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ21lZGl1bS1lZGl0b3Itc3RpY2t5LXRvb2xiYXInKTtcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUudG9wID0gJzBweCc7XG5cbiAgICAgICAgICAgICAgICAvLyBOb3JtYWwgc3RhdGljIHRvb2xiYXIgcG9zaXRpb25cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0b29sYmFyRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdtZWRpdW0tZWRpdG9yLXN0aWNreS10b29sYmFyJyk7XG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJFbGVtZW50LnN0eWxlLnRvcCA9IGNvbnRhaW5lclRvcCAtIHRvb2xiYXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUudG9wID0gY29udGFpbmVyVG9wIC0gdG9vbGJhckhlaWdodCArICdweCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5hbGlnbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRMZWZ0ID0gY29udGFpbmVyUmVjdC5sZWZ0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TGVmdCA9IGNvbnRhaW5lclJlY3QucmlnaHQgLSB0b29sYmFyV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TGVmdCA9IGNvbnRhaW5lckNlbnRlciAtIGhhbGZPZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXRMZWZ0IDwgMCkge1xuICAgICAgICAgICAgICAgIHRhcmdldExlZnQgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgodGFyZ2V0TGVmdCArIHRvb2xiYXJXaWR0aCkgPiB3aW5kb3dXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRhcmdldExlZnQgPSAod2luZG93V2lkdGggLSBNYXRoLmNlaWwodG9vbGJhcldpZHRoKSAtIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b29sYmFyRWxlbWVudC5zdHlsZS5sZWZ0ID0gdGFyZ2V0TGVmdCArICdweCc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcG9zaXRpb25Ub29sYmFyOiBmdW5jdGlvbiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBwb3NpdGlvbiB0aGUgdG9vbGJhciBhdCBsZWZ0IDAsIHNvIHdlIGNhbiBnZXQgdGhlIHJlYWwgd2lkdGggb2YgdGhlIHRvb2xiYXJcbiAgICAgICAgICAgIHRoaXMuZ2V0VG9vbGJhckVsZW1lbnQoKS5zdHlsZS5sZWZ0ID0gJzAnO1xuXG4gICAgICAgICAgICB2YXIgd2luZG93V2lkdGggPSB0aGlzLndpbmRvdy5pbm5lcldpZHRoLFxuICAgICAgICAgICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCksXG4gICAgICAgICAgICAgICAgYm91bmRhcnkgPSByYW5nZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgICAgICAgICBtaWRkbGVCb3VuZGFyeSA9IChib3VuZGFyeS5sZWZ0ICsgYm91bmRhcnkucmlnaHQpIC8gMixcbiAgICAgICAgICAgICAgICB0b29sYmFyRWxlbWVudCA9IHRoaXMuZ2V0VG9vbGJhckVsZW1lbnQoKSxcbiAgICAgICAgICAgICAgICB0b29sYmFySGVpZ2h0ID0gdG9vbGJhckVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgICAgIHRvb2xiYXJXaWR0aCA9IHRvb2xiYXJFbGVtZW50Lm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgIGhhbGZPZmZzZXRXaWR0aCA9IHRvb2xiYXJXaWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgYnV0dG9uSGVpZ2h0ID0gNTAsXG4gICAgICAgICAgICAgICAgZGVmYXVsdExlZnQgPSB0aGlzLmRpZmZMZWZ0IC0gaGFsZk9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICBpZiAoYm91bmRhcnkudG9wIDwgYnV0dG9uSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnbWVkaXVtLXRvb2xiYXItYXJyb3ctb3ZlcicpO1xuICAgICAgICAgICAgICAgIHRvb2xiYXJFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ21lZGl1bS10b29sYmFyLWFycm93LXVuZGVyJyk7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUudG9wID0gYnV0dG9uSGVpZ2h0ICsgYm91bmRhcnkuYm90dG9tIC0gdGhpcy5kaWZmVG9wICsgdGhpcy53aW5kb3cucGFnZVlPZmZzZXQgLSB0b29sYmFySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnbWVkaXVtLXRvb2xiYXItYXJyb3ctdW5kZXInKTtcbiAgICAgICAgICAgICAgICB0b29sYmFyRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdtZWRpdW0tdG9vbGJhci1hcnJvdy1vdmVyJyk7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUudG9wID0gYm91bmRhcnkudG9wICsgdGhpcy5kaWZmVG9wICsgdGhpcy53aW5kb3cucGFnZVlPZmZzZXQgLSB0b29sYmFySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1pZGRsZUJvdW5kYXJ5IDwgaGFsZk9mZnNldFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUubGVmdCA9IGRlZmF1bHRMZWZ0ICsgaGFsZk9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHdpbmRvd1dpZHRoIC0gbWlkZGxlQm91bmRhcnkpIDwgaGFsZk9mZnNldFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhckVsZW1lbnQuc3R5bGUubGVmdCA9IHdpbmRvd1dpZHRoICsgZGVmYXVsdExlZnQgLSBoYWxmT2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b29sYmFyRWxlbWVudC5zdHlsZS5sZWZ0ID0gZGVmYXVsdExlZnQgKyBtaWRkbGVCb3VuZGFyeSArICdweCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLnRvb2xiYXIgPSBUb29sYmFyO1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSW1hZ2VEcmFnZ2luZyA9IE1lZGl1bUVkaXRvci5FeHRlbnNpb24uZXh0ZW5kKHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLkV4dGVuc2lvbi5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSgnZWRpdGFibGVEcmFnJywgdGhpcy5oYW5kbGVEcmFnLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlRHJvcCcsIHRoaXMuaGFuZGxlRHJvcC5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVEcmFnOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBjbGFzc05hbWUgPSAnbWVkaXVtLWVkaXRvci1kcmFnb3Zlcic7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XG5cbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSAnZHJhZ292ZXInKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQudHlwZSA9PT0gJ2RyYWdsZWF2ZScpIHtcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZURyb3A6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGNsYXNzTmFtZSA9ICdtZWRpdW0tZWRpdG9yLWRyYWdvdmVyJyxcbiAgICAgICAgICAgICAgICBmaWxlcztcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgLy8gSUU5IGRvZXMgbm90IHN1cHBvcnQgdGhlIEZpbGUgQVBJLCBzbyBwcmV2ZW50IGZpbGUgZnJvbSBvcGVuaW5nIGluIGEgbmV3IHdpbmRvd1xuICAgICAgICAgICAgLy8gYnV0IGFsc28gZG9uJ3QgdHJ5IHRvIGFjdHVhbGx5IGdldCB0aGUgZmlsZVxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcykge1xuICAgICAgICAgICAgICAgIGZpbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzLCAwKTtcbiAgICAgICAgICAgICAgICBmaWxlcy5zb21lKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLnR5cGUubWF0Y2goJ2ltYWdlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWxlUmVhZGVyLCBpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9ICdtZWRpdW0taW1nLScgKyAoK25ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuaW5zZXJ0SFRNTENvbW1hbmQodGhpcy5kb2N1bWVudCwgJzxpbWcgY2xhc3M9XCJtZWRpdW0tZWRpdG9yLWltYWdlLWxvYWRpbmdcIiBpZD1cIicgKyBpZCArICdcIiAvPicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1nID0gdGhpcy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcuc3JjID0gZmlsZVJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmltYWdlRHJhZ2dpbmcgPSBJbWFnZURyYWdnaW5nO1xufSgpKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycyB0aGF0IHNob3VsZG4ndCBiZSBleHBvc2VkIGV4dGVybmFsbHlcblxuICAgIGZ1bmN0aW9uIGhhbmRsZURpc2FibGVkRW50ZXJLZXlkb3duKGV2ZW50LCBlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZVJldHVybiB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXJldHVybicpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlRG91YmxlUmV0dXJuIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWRpc2FibGUtZG91YmxlLXJldHVybicpKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IE1lZGl1bUVkaXRvci5zZWxlY3Rpb24uZ2V0U2VsZWN0aW9uU3RhcnQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgICAvLyBpZiBjdXJyZW50IHRleHQgc2VsZWN0aW9uIGlzIGVtcHR5IE9SIHByZXZpb3VzIHNpYmxpbmcgdGV4dCBpcyBlbXB0eVxuICAgICAgICAgICAgaWYgKChub2RlICYmIG5vZGUudGV4dENvbnRlbnQudHJpbSgpID09PSAnJykgfHxcbiAgICAgICAgICAgICAgICAobm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nICYmIG5vZGUucHJldmlvdXNFbGVtZW50U2libGluZy50ZXh0Q29udGVudC50cmltKCkgPT09ICcnKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVUYWJLZXlkb3duKGV2ZW50KSB7XG4gICAgICAgIC8vIE92ZXJyaWRlIHRhYiBvbmx5IGZvciBwcmUgbm9kZXNcbiAgICAgICAgdmFyIG5vZGUgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvblN0YXJ0KHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50KSxcbiAgICAgICAgICAgIHRhZyA9IG5vZGUgJiYgbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmICh0YWcgPT09ICdwcmUnKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuaW5zZXJ0SFRNTENvbW1hbmQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQsICcgICAgJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWIgdG8gaW5kZW50IGxpc3Qgc3RydWN0dXJlcyFcbiAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLmlzTGlzdEl0ZW0obm9kZSkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIC8vIElmIFNoaWZ0IGlzIGRvd24sIG91dGRlbnQsIG90aGVyd2lzZSBpbmRlbnRcbiAgICAgICAgICAgIGlmIChldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmV4ZWNDb21tYW5kKCdvdXRkZW50JywgZmFsc2UsIG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5leGVjQ29tbWFuZCgnaW5kZW50JywgZmFsc2UsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlQmxvY2tEZWxldGVLZXlkb3ducyhldmVudCkge1xuICAgICAgICB2YXIgcCwgbm9kZSA9IE1lZGl1bUVkaXRvci5zZWxlY3Rpb24uZ2V0U2VsZWN0aW9uU3RhcnQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQpLFxuICAgICAgICAgICAgdGFnTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGlzRW1wdHkgPSAvXihcXHMrfDxiclxcLz8+KT8kL2ksXG4gICAgICAgICAgICBpc0hlYWRlciA9IC9oXFxkL2k7XG5cbiAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLmlzS2V5KGV2ZW50LCBbTWVkaXVtRWRpdG9yLnV0aWwua2V5Q29kZS5CQUNLU1BBQ0UsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuRU5URVJdKSAmJlxuICAgICAgICAgICAgICAgIC8vIGhhcyBhIHByZWNlZWRpbmcgc2libGluZ1xuICAgICAgICAgICAgICAgIG5vZGUucHJldmlvdXNFbGVtZW50U2libGluZyAmJlxuICAgICAgICAgICAgICAgIC8vIGluIGEgaGVhZGVyXG4gICAgICAgICAgICAgICAgaXNIZWFkZXIudGVzdCh0YWdOYW1lKSAmJlxuICAgICAgICAgICAgICAgIC8vIGF0IHRoZSB2ZXJ5IGVuZCBvZiB0aGUgYmxvY2tcbiAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldENhcmV0T2Zmc2V0cyhub2RlKS5sZWZ0ID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuQkFDS1NQQUNFKSAmJiBpc0VtcHR5LnRlc3Qobm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLmlubmVySFRNTCkpIHtcbiAgICAgICAgICAgICAgICAvLyBiYWNrc3BhY2luZyB0aGUgYmVnaW5pbmcgb2YgYSBoZWFkZXIgaW50byBhbiBlbXB0eSBwcmV2aW91cyBlbGVtZW50IHdpbGxcbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgdGhlIHRhZ05hbWUgb2YgdGhlIGN1cnJlbnQgbm9kZSB0byBwcmV2ZW50IG9uZVxuICAgICAgICAgICAgICAgIC8vIGluc3RlYWQgZGVsZXRlIHByZXZpb3VzIG5vZGUgYW5kIGNhbmNlbCB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKTtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChNZWRpdW1FZGl0b3IudXRpbC5pc0tleShldmVudCwgTWVkaXVtRWRpdG9yLnV0aWwua2V5Q29kZS5FTlRFUikpIHtcbiAgICAgICAgICAgICAgICAvLyBoaXR0aW5nIHJldHVybiBpbiB0aGUgYmVnaW5pbmcgb2YgYSBoZWFkZXIgd2lsbCBjcmVhdGUgZW1wdHkgaGVhZGVyIGVsZW1lbnRzIGJlZm9yZSB0aGUgY3VycmVudCBvbmVcbiAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkLCBtYWtlIFwiPHA+PGJyPjwvcD5cIiBlbGVtZW50LCB3aGljaCBhcmUgd2hhdCBoYXBwZW5zIGlmIHlvdSBoaXQgcmV0dXJuIGluIGFuIGVtcHR5IHBhcmFncmFwaFxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgICAgICAgICAgICAgcC5pbm5lckhUTUwgPSAnPGJyPic7XG4gICAgICAgICAgICAgICAgbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHAsIG5vZGUpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuREVMRVRFKSAmJlxuICAgICAgICAgICAgICAgICAgICAvLyBiZXR3ZWVuIHR3byBzaWJsaW5nIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nICYmXG4gICAgICAgICAgICAgICAgICAgIG5vZGUucHJldmlvdXNFbGVtZW50U2libGluZyAmJlxuICAgICAgICAgICAgICAgICAgICAvLyBub3QgaW4gYSBoZWFkZXJcbiAgICAgICAgICAgICAgICAgICAgIWlzSGVhZGVyLnRlc3QodGFnTmFtZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gYW4gZW1wdHkgdGFnXG4gICAgICAgICAgICAgICAgICAgIGlzRW1wdHkudGVzdChub2RlLmlubmVySFRNTCkgJiZcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiB0aGUgbmV4dCB0YWcgKmlzKiBhIGhlYWRlclxuICAgICAgICAgICAgICAgICAgICBpc0hlYWRlci50ZXN0KG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICAvLyBoaXR0aW5nIGRlbGV0ZSBpbiBhbiBlbXB0eSBlbGVtZW50IHByZWNlZGluZyBhIGhlYWRlciwgZXg6XG4gICAgICAgICAgICAvLyAgPHA+W0NVUlNPUl08L3A+PGgxPkhlYWRlcjwvaDE+XG4gICAgICAgICAgICAvLyBXaWxsIGNhdXNlIHRoZSBoMSB0byBiZWNvbWUgYSBwYXJhZ3JhcGguXG4gICAgICAgICAgICAvLyBJbnN0ZWFkLCBkZWxldGUgdGhlIHBhcmFncmFwaCBub2RlIGFuZCBtb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2luaW5nIG9mIHRoZSBoMVxuXG4gICAgICAgICAgICAvLyByZW1vdmUgbm9kZSBhbmQgbW92ZSBjdXJzb3IgdG8gc3RhcnQgb2YgaGVhZGVyXG4gICAgICAgICAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLm1vdmVDdXJzb3IodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQsIG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nKTtcblxuICAgICAgICAgICAgbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG5cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuQkFDS1NQQUNFKSAmJlxuICAgICAgICAgICAgICAgIHRhZ05hbWUgPT09ICdsaScgJiZcbiAgICAgICAgICAgICAgICAvLyBoaXR0aW5nIGJhY2tzcGFjZSBpbnNpZGUgYW4gZW1wdHkgbGlcbiAgICAgICAgICAgICAgICBpc0VtcHR5LnRlc3Qobm9kZS5pbm5lckhUTUwpICYmXG4gICAgICAgICAgICAgICAgLy8gaXMgZmlyc3QgZWxlbWVudCAobm8gcHJlY2VlZGluZyBzaWJsaW5ncylcbiAgICAgICAgICAgICAgICAhbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nICYmXG4gICAgICAgICAgICAgICAgLy8gcGFyZW50IGFsc28gZG9lcyBub3QgaGF2ZSBhIHNpYmxpbmdcbiAgICAgICAgICAgICAgICAhbm9kZS5wYXJlbnRFbGVtZW50LnByZXZpb3VzRWxlbWVudFNpYmxpbmcgJiZcbiAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIG9ubHkgbGkgaW4gYSBsaXN0XG4gICAgICAgICAgICAgICAgbm9kZS5uZXh0RWxlbWVudFNpYmxpbmcgJiZcbiAgICAgICAgICAgICAgICBub2RlLm5leHRFbGVtZW50U2libGluZy5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbGknKSB7XG4gICAgICAgICAgICAvLyBiYWNrc3BhY2luZyBpbiBhbiBlbXB0eSBmaXJzdCBsaXN0IGVsZW1lbnQgaW4gdGhlIGZpcnN0IGxpc3QgKHdpdGggbW9yZSBlbGVtZW50cykgZXg6XG4gICAgICAgICAgICAvLyAgPHVsPjxsaT5bQ1VSU09SXTwvbGk+PGxpPkxpc3QgSXRlbSAyPC9saT48L3VsPlxuICAgICAgICAgICAgLy8gd2lsbCByZW1vdmUgdGhlIGZpcnN0IDxsaT4gYnV0IGFkZCBzb21lIGV4dHJhIGVsZW1lbnQgYmVmb3JlICh2YXJpZXMgYmFzZWQgb24gYnJvd3NlcilcbiAgICAgICAgICAgIC8vIEluc3RlYWQsIHRoaXMgd2lsbDpcbiAgICAgICAgICAgIC8vIDEpIHJlbW92ZSB0aGUgbGlzdCBlbGVtZW50XG4gICAgICAgICAgICAvLyAyKSBjcmVhdGUgYSBwYXJhZ3JhcGggYmVmb3JlIHRoZSBsaXN0XG4gICAgICAgICAgICAvLyAzKSBtb3ZlIHRoZSBjdXJzb3IgaW50byB0aGUgcGFyYWdyYXBoXG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHBhcmFncmFwaCBiZWZvcmUgdGhlIGxpc3RcbiAgICAgICAgICAgIHAgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgICAgICAgICBwLmlubmVySFRNTCA9ICc8YnI+JztcbiAgICAgICAgICAgIG5vZGUucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShwLCBub2RlLnBhcmVudEVsZW1lbnQpO1xuXG4gICAgICAgICAgICAvLyBtb3ZlIHRoZSBjdXJzb3IgaW50byB0aGUgbmV3IHBhcmFncmFwaFxuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5tb3ZlQ3Vyc29yKHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LCBwKTtcblxuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBsaXN0IGVsZW1lbnRcbiAgICAgICAgICAgIG5vZGUucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChub2RlKTtcblxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZUtleXVwKGV2ZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25TdGFydCh0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCksXG4gICAgICAgICAgICB0YWdOYW1lO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1lZGl1bUVkaXRvci51dGlsLmlzTWVkaXVtRWRpdG9yRWxlbWVudChub2RlKSAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2Zvcm1hdEJsb2NrJywgZmFsc2UsICdwJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNLZXkoZXZlbnQsIE1lZGl1bUVkaXRvci51dGlsLmtleUNvZGUuRU5URVIpICYmICFNZWRpdW1FZGl0b3IudXRpbC5pc0xpc3RJdGVtKG5vZGUpKSB7XG4gICAgICAgICAgICB0YWdOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gRm9yIGFuY2hvciB0YWdzLCB1bmxpbmtcbiAgICAgICAgICAgIGlmICh0YWdOYW1lID09PSAnYScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5leGVjQ29tbWFuZCgndW5saW5rJywgZmFsc2UsIG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGZvcm1hdCBibG9jayBpZiB0aGlzIGlzIG5vdCBhIGhlYWRlciB0YWdcbiAgICAgICAgICAgICAgICBpZiAoIS9oXFxkLy50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmV4ZWNDb21tYW5kKCdmb3JtYXRCbG9jaycsIGZhbHNlLCAncCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEludGVybmFsIGhlbHBlciBtZXRob2RzIHdoaWNoIHNob3VsZG4ndCBiZSBleHBvc2VkIGV4dGVybmFsbHlcblxuICAgIGZ1bmN0aW9uIGFkZFRvRWRpdG9ycyh3aW4pIHtcbiAgICAgICAgaWYgKCF3aW4uX21lZGl1bUVkaXRvcnMpIHtcbiAgICAgICAgICAgIC8vIFRvIGF2b2lkIGJyZWFraW5nIHVzZXJzIHdobyBhcmUgYXNzdW1pbmcgdGhhdCB0aGUgdW5pcXVlIGlkIG9uXG4gICAgICAgICAgICAvLyBtZWRpdW0tZWRpdG9yIGVsZW1lbnRzIHdpbGwgc3RhcnQgYXQgMSwgaW5zZXJ0aW5nIGEgJ251bGwnIGluIHRoZVxuICAgICAgICAgICAgLy8gYXJyYXkgc28gdGhlIHVuaXF1ZS1pZCBjYW4gYWx3YXlzIG1hcCB0byB0aGUgaW5kZXggb2YgdGhlIGVkaXRvciBpbnN0YW5jZVxuICAgICAgICAgICAgd2luLl9tZWRpdW1FZGl0b3JzID0gW251bGxdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhpcyBhbHJlYWR5IGhhcyBhIHVuaXF1ZSBpZCwgcmUtdXNlIGl0XG4gICAgICAgIGlmICghdGhpcy5pZCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHdpbi5fbWVkaXVtRWRpdG9ycy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB3aW4uX21lZGl1bUVkaXRvcnNbdGhpcy5pZF0gPSB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUZyb21FZGl0b3JzKHdpbikge1xuICAgICAgICBpZiAoIXdpbi5fbWVkaXVtRWRpdG9ycyB8fCAhd2luLl9tZWRpdW1FZGl0b3JzW3RoaXMuaWRdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTZXR0aW5nIHRoZSBpbnN0YW5jZSB0byBudWxsIGluIHRoZSBhcnJheSBpbnN0ZWFkIG9mIGRlbGV0aW5nIGl0IGFsbG93czpcbiAgICAgICAgICogMSkgRWFjaCBpbnN0YW5jZSB0byBwcmVzZXJ2ZSBpdHMgb3duIHVuaXF1ZS1pZCwgZXZlbiBhZnRlciBiZWluZyBkZXN0cm95ZWRcbiAgICAgICAgICogICAgYW5kIGluaXRpYWxpemVkIGFnYWluXG4gICAgICAgICAqIDIpIFRoZSB1bmlxdWUtaWQgdG8gYWx3YXlzIGNvcnJlc3BvbmQgdG8gYW4gaW5kZXggaW4gdGhlIGFycmF5IG9mIG1lZGl1bS1lZGl0b3JcbiAgICAgICAgICogICAgaW5zdGFuY2VzLiBUaHVzLCB3ZSB3aWxsIGJlIGFibGUgdG8gbG9vayBhdCBhIGNvbnRlbnRlZGl0YWJsZSwgYW5kIGRldGVybWluZVxuICAgICAgICAgKiAgICB3aGljaCBpbnN0YW5jZSBpdCBiZWxvbmdzIHRvLCBieSBpbmRleGluZyBpbnRvIHRoZSBnbG9iYWwgYXJyYXkuXG4gICAgICAgICAqL1xuICAgICAgICB3aW4uX21lZGl1bUVkaXRvcnNbdGhpcy5pZF0gPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRzQXJyYXkoc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgICAgICAgc2VsZWN0b3IgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBzdHJpbmcsIHVzZSBhcyBxdWVyeSBzZWxlY3RvclxuICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2VsZWN0b3IgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBlbGVtZW50LCBwdXQgaW50byBhcnJheVxuICAgICAgICBpZiAoTWVkaXVtRWRpdG9yLnV0aWwuaXNFbGVtZW50KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgc2VsZWN0b3IgPSBbc2VsZWN0b3JdO1xuICAgICAgICB9XG4gICAgICAgIC8vIENvbnZlcnQgTm9kZUxpc3QgKG9yIG90aGVyIGFycmF5IGxpa2Ugb2JqZWN0KSBpbnRvIGFuIGFycmF5XG4gICAgICAgIHZhciBlbGVtZW50cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShzZWxlY3Rvcik7XG5cbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGVsZW1lbnRzIGFuZCBjb252ZXJ0IHRleHRhcmVhJ3MgaW50byBkaXZzXG4gICAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd0ZXh0YXJlYScpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnB1c2goY3JlYXRlQ29udGVudEVkaXRhYmxlLmNhbGwodGhpcywgZWxlbWVudCwgaW5kZXgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRFeHRlbnNpb25EZWZhdWx0cyhleHRlbnNpb24sIGRlZmF1bHRzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGRlZmF1bHRzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb25bcHJvcF0gPSBkZWZhdWx0c1twcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBleHRlbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdEV4dGVuc2lvbihleHRlbnNpb24sIG5hbWUsIGluc3RhbmNlKSB7XG4gICAgICAgIHZhciBleHRlbnNpb25EZWZhdWx0cyA9IHtcbiAgICAgICAgICAgICd3aW5kb3cnOiBpbnN0YW5jZS5vcHRpb25zLmNvbnRlbnRXaW5kb3csXG4gICAgICAgICAgICAnZG9jdW1lbnQnOiBpbnN0YW5jZS5vcHRpb25zLm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAnYmFzZSc6IGluc3RhbmNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQWRkIGRlZmF1bHQgb3B0aW9ucyBpbnRvIHRoZSBleHRlbnNpb25cbiAgICAgICAgZXh0ZW5zaW9uID0gc2V0RXh0ZW5zaW9uRGVmYXVsdHMoZXh0ZW5zaW9uLCBleHRlbnNpb25EZWZhdWx0cyk7XG5cbiAgICAgICAgLy8gQ2FsbCBpbml0IG9uIHRoZSBleHRlbnNpb25cbiAgICAgICAgaWYgKHR5cGVvZiBleHRlbnNpb24uaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZXh0ZW5zaW9uLmluaXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCBleHRlbnNpb24gbmFtZSAoaWYgbm90IGFscmVhZHkgc2V0KVxuICAgICAgICBpZiAoIWV4dGVuc2lvbi5uYW1lKSB7XG4gICAgICAgICAgICBleHRlbnNpb24ubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1Rvb2xiYXJFbmFibGVkKCkge1xuICAgICAgICAvLyBJZiBhbnkgb2YgdGhlIGVsZW1lbnRzIGRvbid0IGhhdmUgdGhlIHRvb2xiYXIgZGlzYWJsZWRcbiAgICAgICAgLy8gV2UgbmVlZCBhIHRvb2xiYXJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudHMuZXZlcnkoZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXRvb2xiYXInKTtcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnRvb2xiYXIgIT09IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQW5jaG9yUHJldmlld0VuYWJsZWQoKSB7XG4gICAgICAgIC8vIElmIHRvb2xiYXIgaXMgZGlzYWJsZWQsIGRvbid0IGFkZFxuICAgICAgICBpZiAoIWlzVG9vbGJhckVuYWJsZWQuY2FsbCh0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbmNob3JQcmV2aWV3ICE9PSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1BsYWNlaG9sZGVyRW5hYmxlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciAhPT0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNBdXRvTGlua0VuYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXV0b0xpbmsgIT09IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSW1hZ2VEcmFnZ2luZ0VuYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaW1hZ2VEcmFnZ2luZyAhPT0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNLZXlib2FyZENvbW1hbmRzRW5hYmxlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5rZXlib2FyZENvbW1hbmRzICE9PSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRVc2VGaWxlRHJhZ2dpbmdFeHRlbnNpb24oKSB7XG4gICAgICAgIC8vIFNpbmNlIHRoZSBmaWxlLWRyYWdnaW5nIGV4dGVuc2lvbiByZXBsYWNlcyB0aGUgaW1hZ2UtZHJhZ2dpbmcgZXh0ZW5zaW9uLFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSB1c2VyIHBhc3NlZCBhbiBvdmVycmlkZWQgaW1hZ2UtZHJhZ2dpbmcgZXh0ZW5zaW9uLlxuICAgICAgICAvLyBJZiB0aGV5IGhhdmUsIHRvIGF2b2lkIGJyZWFraW5nIHVzZXJzLCB3ZSB3b24ndCB1c2UgZmlsZS1kcmFnZ2luZyBleHRlbnNpb24uXG4gICAgICAgIHJldHVybiAhdGhpcy5vcHRpb25zLmV4dGVuc2lvbnNbJ2ltYWdlRHJhZ2dpbmcnXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb250ZW50RWRpdGFibGUodGV4dGFyZWEsIGlkKSB7XG4gICAgICAgIHZhciBkaXYgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgIG5vdyA9IERhdGUubm93KCksXG4gICAgICAgICAgICB1bmlxdWVJZCA9ICdtZWRpdW0tZWRpdG9yLScgKyBub3cgKyAnLScgKyBpZCxcbiAgICAgICAgICAgIGF0dHMgPSB0ZXh0YXJlYS5hdHRyaWJ1dGVzO1xuXG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FuIG1vdmUgcHJldHR5IGZhc3QsIHNpbmNlIHdlJ3JlIHVzaW5nIGEgdGltZXN0YW1wXG4gICAgICAgIC8vIHRvIG1ha2UgYSB1bmlxdWUtaWQsIGVuc3VyZSB0aGF0IHRoZSBpZCBpcyBhY3R1YWxseSB1bmlxdWUgb24gdGhlIHBhZ2VcbiAgICAgICAgd2hpbGUgKHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHVuaXF1ZUlkKSkge1xuICAgICAgICAgICAgbm93Kys7XG4gICAgICAgICAgICB1bmlxdWVJZCA9ICdtZWRpdW0tZWRpdG9yLScgKyBub3cgKyAnLScgKyBpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSB0ZXh0YXJlYS5jbGFzc05hbWU7XG4gICAgICAgIGRpdi5pZCA9IHVuaXF1ZUlkO1xuICAgICAgICBkaXYuaW5uZXJIVE1MID0gdGV4dGFyZWEudmFsdWU7XG5cbiAgICAgICAgdGV4dGFyZWEuc2V0QXR0cmlidXRlKCdtZWRpdW0tZWRpdG9yLXRleHRhcmVhLWlkJywgdW5pcXVlSWQpO1xuXG4gICAgICAgIC8vIHJlLWNyZWF0ZSBhbGwgYXR0cmlidXRlcyBmcm9tIHRoZSB0ZXh0ZWFyZWEgdG8gdGhlIG5ldyBjcmVhdGVkIGRpdlxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGF0dHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3QgcmUtY3JlYXRlIGV4aXN0aW5nIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIGlmICghZGl2Lmhhc0F0dHJpYnV0ZShhdHRzW2ldLm5vZGVOYW1lKSkge1xuICAgICAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoYXR0c1tpXS5ub2RlTmFtZSwgYXR0c1tpXS5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGV4dGFyZWEuY2xhc3NMaXN0LmFkZCgnbWVkaXVtLWVkaXRvci1oaWRkZW4nKTtcbiAgICAgICAgdGV4dGFyZWEucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICBkaXYsXG4gICAgICAgICAgICB0ZXh0YXJlYVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBkaXY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdEVsZW1lbnRzKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlRWRpdGluZyAmJiAhZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZGlzYWJsZS1lZGl0aW5nJykpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnY29udGVudEVkaXRhYmxlJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3NwZWxsY2hlY2snLCB0aGlzLm9wdGlvbnMuc3BlbGxjaGVjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1tZWRpdW0tZWRpdG9yLWVsZW1lbnQnLCB0cnVlKTtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3RleHRib3gnKTtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLW11bHRpbGluZScsIHRydWUpO1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ21lZGl1bS1lZGl0b3ItaW5kZXgnLCBpbmRleCk7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnbWVkaXVtLWVkaXRvci10ZXh0YXJlYS1pZCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbihlbGVtZW50LCAnaW5wdXQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRhcmVhID0gdGFyZ2V0LnBhcmVudE5vZGUucXVlcnlTZWxlY3RvcigndGV4dGFyZWFbbWVkaXVtLWVkaXRvci10ZXh0YXJlYS1pZD1cIicgKyB0YXJnZXQuZ2V0QXR0cmlidXRlKCdtZWRpdW0tZWRpdG9yLXRleHRhcmVhLWlkJykgKyAnXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dGFyZWEudmFsdWUgPSB0aGlzLnNlcmlhbGl6ZSgpW3RhcmdldC5pZF0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhdHRhY2hIYW5kbGVycygpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgLy8gYXR0YWNoIHRvIHRhYnNcbiAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlS2V5ZG93blRhYicsIGhhbmRsZVRhYktleWRvd24uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQmluZCBrZXlzIHdoaWNoIGNhbiBjcmVhdGUgb3IgZGVzdHJveSBhIGJsb2NrIGVsZW1lbnQ6IGJhY2tzcGFjZSwgZGVsZXRlLCByZXR1cm5cbiAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlS2V5ZG93bkRlbGV0ZScsIGhhbmRsZUJsb2NrRGVsZXRlS2V5ZG93bnMuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZUtleWRvd25FbnRlcicsIGhhbmRsZUJsb2NrRGVsZXRlS2V5ZG93bnMuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gZGlzYWJsaW5nIHJldHVybiBvciBkb3VibGUgcmV0dXJuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZVJldHVybiB8fCB0aGlzLm9wdGlvbnMuZGlzYWJsZURvdWJsZVJldHVybikge1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUoJ2VkaXRhYmxlS2V5ZG93bkVudGVyJywgaGFuZGxlRGlzYWJsZWRFbnRlcktleWRvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZSgnZGF0YS1kaXNhYmxlLXJldHVybicpIHx8IHRoaXMuZWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKCdkYXRhLWRpc2FibGUtZG91YmxlLXJldHVybicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKCdlZGl0YWJsZUtleWRvd25FbnRlcicsIGhhbmRsZURpc2FibGVkRW50ZXJLZXlkb3duLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3ZSdyZSBub3QgZGlzYWJsaW5nIHJldHVybiwgYWRkIGEgaGFuZGxlciB0byBoZWxwIGhhbmRsZSBjbGVhbnVwXG4gICAgICAgIC8vIGZvciBjZXJ0YWluIGNhc2VzIHdoZW4gZW50ZXIgaXMgcHJlc3NlZFxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlUmV0dXJuKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWRpc2FibGUtcmV0dXJuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbihlbGVtZW50LCAna2V5dXAnLCBoYW5kbGVLZXl1cC5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXRFeHRlbnNpb25zKCkge1xuXG4gICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IFtdO1xuXG4gICAgICAgIC8vIFBhc3NlZCBpbiBleHRlbnNpb25zXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMub3B0aW9ucy5leHRlbnNpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAvLyBBbHdheXMgc2F2ZSB0aGUgdG9vbGJhciBleHRlbnNpb24gZm9yIGxhc3RcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSAndG9vbGJhcicgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4dGVuc2lvbnMucHVzaChpbml0RXh0ZW5zaW9uKHRoaXMub3B0aW9ucy5leHRlbnNpb25zW25hbWVdLCBuYW1lLCB0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIDQgQ2FzZXMgZm9yIGltYWdlRHJhZ2dpbmcgKyBmaWxlRHJhZ2dpbmcgZXh0ZW5zb25zOlxuICAgICAgICAvL1xuICAgICAgICAvLyAxLiBJbWFnZURyYWdnaW5nIE9OICsgTm8gQ3VzdG9tIEltYWdlIERyYWdnaW5nIEV4dGVuc2lvbjpcbiAgICAgICAgLy8gICAgKiBVc2UgZmlsZURyYWdnaW5nIGV4dGVuc2lvbiAoZGVmYXVsdCBvcHRpb25zKVxuICAgICAgICAvLyAyLiBJbWFnZURyYWdnaW5nIE9GRiArIE5vIEN1c3RvbSBJbWFnZSBEcmFnZ2luZyBFeHRlbnNpb246XG4gICAgICAgIC8vICAgICogVXNlIGZpbGVEcmFnZ2luZyBleHRlbnNpb24gdy8gaW1hZ2VzIHR1cm5lZCBvZmZcbiAgICAgICAgLy8gMy4gSW1hZ2VEcmFnZ2luZyBPTiArIEN1c3RvbSBJbWFnZSBEcmFnZ2luZyBFeHRlbnNpb246XG4gICAgICAgIC8vICAgICogRG9uJ3QgdXNlIGZpbGVEcmFnZ2luZyAoY291bGQgaW50ZXJmZXJlIHdpdGggY3VzdG9tIGltYWdlIGRyYWdnaW5nIGV4dGVuc2lvbilcbiAgICAgICAgLy8gNC4gSW1hZ2VEcmFnZ2luZyBPRkYgKyBDdXN0b20gSW1hZ2UgRHJhZ2dpbmc6XG4gICAgICAgIC8vICAgICogRG9uJ3QgdXNlIGZpbGVEcmFnZ2luZyAoY291bGQgaW50ZXJmZXJlIHdpdGggY3VzdG9tIGltYWdlIGRyYWdnaW5nIGV4dGVuc2lvbilcbiAgICAgICAgaWYgKHNob3VsZFVzZUZpbGVEcmFnZ2luZ0V4dGVuc2lvbi5jYWxsKHRoaXMpKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5maWxlRHJhZ2dpbmc7XG4gICAgICAgICAgICBpZiAoIW9wdHMpIHtcbiAgICAgICAgICAgICAgICBvcHRzID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBJbWFnZSBpcyBpbiB0aGUgJ2FsbG93ZWRUeXBlcycgbGlzdCBieSBkZWZhdWx0LlxuICAgICAgICAgICAgICAgIC8vIElmIGltYWdlRHJhZ2dpbmcgaXMgb2ZmIG92ZXJyaWRlIHRoZSAnYWxsb3dlZFR5cGVzJyBsaXN0IHdpdGggYW4gZW1wdHkgb25lXG4gICAgICAgICAgICAgICAgaWYgKCFpc0ltYWdlRHJhZ2dpbmdFbmFibGVkLmNhbGwodGhpcykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5hbGxvd2VkVHlwZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZEJ1aWx0SW5FeHRlbnNpb24oJ2ZpbGVEcmFnZ2luZycsIG9wdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbHQtaW4gZXh0ZW5zaW9uc1xuICAgICAgICB2YXIgYnVpbHRJbnMgPSB7XG4gICAgICAgICAgICBwYXN0ZTogdHJ1ZSxcbiAgICAgICAgICAgICdhbmNob3ItcHJldmlldyc6IGlzQW5jaG9yUHJldmlld0VuYWJsZWQuY2FsbCh0aGlzKSxcbiAgICAgICAgICAgIGF1dG9MaW5rOiBpc0F1dG9MaW5rRW5hYmxlZC5jYWxsKHRoaXMpLFxuICAgICAgICAgICAga2V5Ym9hcmRDb21tYW5kczogaXNLZXlib2FyZENvbW1hbmRzRW5hYmxlZC5jYWxsKHRoaXMpLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IGlzUGxhY2Vob2xkZXJFbmFibGVkLmNhbGwodGhpcylcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmtleXMoYnVpbHRJbnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGlmIChidWlsdEluc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQnVpbHRJbkV4dGVuc2lvbihuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gVXNlcnMgY2FuIHBhc3MgaW4gYSBjdXN0b20gdG9vbGJhciBleHRlbnNpb25cbiAgICAgICAgLy8gc28gY2hlY2sgZm9yIHRoYXQgZmlyc3QgYW5kIGlmIGl0J3Mgbm90IHByZXNlbnRcbiAgICAgICAgLy8ganVzdCBjcmVhdGUgdGhlIGRlZmF1bHQgdG9vbGJhclxuICAgICAgICB2YXIgdG9vbGJhckV4dGVuc2lvbiA9IHRoaXMub3B0aW9ucy5leHRlbnNpb25zWyd0b29sYmFyJ107XG4gICAgICAgIGlmICghdG9vbGJhckV4dGVuc2lvbiAmJiBpc1Rvb2xiYXJFbmFibGVkLmNhbGwodGhpcykpIHtcbiAgICAgICAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG4gICAgICAgICAgICB2YXIgdG9vbGJhck9wdGlvbnMgPSBNZWRpdW1FZGl0b3IudXRpbC5leHRlbmQoe30sIHRoaXMub3B0aW9ucy50b29sYmFyLCB7XG4gICAgICAgICAgICAgICAgYWxsb3dNdWx0aVBhcmFncmFwaFNlbGVjdGlvbjogdGhpcy5vcHRpb25zLmFsbG93TXVsdGlQYXJhZ3JhcGhTZWxlY3Rpb24gLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0b29sYmFyRXh0ZW5zaW9uID0gbmV3IE1lZGl1bUVkaXRvci5leHRlbnNpb25zLnRvb2xiYXIodG9vbGJhck9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHRvb2xiYXIgaXMgbm90IGRpc2FibGVkLCBzbyB3ZSBhY3R1YWxseSBoYXZlIGFuIGV4dGVuc2lvblxuICAgICAgICAvLyBpbml0aWFsaXplIGl0IGFuZCBhZGQgaXQgdG8gdGhlIGV4dGVuc2lvbnMgYXJyYXlcbiAgICAgICAgaWYgKHRvb2xiYXJFeHRlbnNpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5wdXNoKGluaXRFeHRlbnNpb24odG9vbGJhckV4dGVuc2lvbiwgJ3Rvb2xiYXInLCB0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZXJnZU9wdGlvbnMoZGVmYXVsdHMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGRlcHJlY2F0ZWRQcm9wZXJ0aWVzID0gW1xuICAgICAgICAgICAgWydhbGxvd011bHRpUGFyYWdyYXBoU2VsZWN0aW9uJywgJ3Rvb2xiYXIuYWxsb3dNdWx0aVBhcmFncmFwaFNlbGVjdGlvbiddXG4gICAgICAgIF07XG4gICAgICAgIC8vIHdhcm4gYWJvdXQgdXNpbmcgZGVwcmVjYXRlZCBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBkZXByZWNhdGVkUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwYWlyKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkocGFpclswXSkgJiYgb3B0aW9uc1twYWlyWzBdXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLmRlcHJlY2F0ZWQocGFpclswXSwgcGFpclsxXSwgJ3Y2LjAuMCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1lZGl1bUVkaXRvci51dGlsLmRlZmF1bHRzKHt9LCBvcHRpb25zLCBkZWZhdWx0cyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhlY0FjdGlvbkludGVybmFsKGFjdGlvbiwgb3B0cykge1xuICAgICAgICAvKmpzbGludCByZWdleHA6IHRydWUqL1xuICAgICAgICB2YXIgYXBwZW5kQWN0aW9uID0gL15hcHBlbmQtKC4rKSQvZ2ksXG4gICAgICAgICAgICBqdXN0aWZ5QWN0aW9uID0gL2p1c3RpZnkoW0EtWmEtel0qKSQvZywgLyogRGV0ZWN0aW5nIGlmIGlzIGp1c3RpZnlDZW50ZXJ8UmlnaHR8TGVmdCAqL1xuICAgICAgICAgICAgbWF0Y2g7XG4gICAgICAgIC8qanNsaW50IHJlZ2V4cDogZmFsc2UqL1xuXG4gICAgICAgIC8vIEFjdGlvbnMgc3RhcnRpbmcgd2l0aCAnYXBwZW5kLScgc2hvdWxkIGF0dGVtcHQgdG8gZm9ybWF0IGEgYmxvY2sgb2YgdGV4dCAoJ2Zvcm1hdEJsb2NrJykgdXNpbmcgYSBzcGVjaWZpY1xuICAgICAgICAvLyB0eXBlIG9mIGJsb2NrIGVsZW1lbnQgKGllIGFwcGVuZC1ibG9ja3F1b3RlLCBhcHBlbmQtaDEsIGFwcGVuZC1wcmUsIGV0Yy4pXG4gICAgICAgIG1hdGNoID0gYXBwZW5kQWN0aW9uLmV4ZWMoYWN0aW9uKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gTWVkaXVtRWRpdG9yLnV0aWwuZXhlY0Zvcm1hdEJsb2NrKHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LCBtYXRjaFsxXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uID09PSAnZm9udFNpemUnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2ZvbnRTaXplJywgZmFsc2UsIG9wdHMuc2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uID09PSAnY3JlYXRlTGluaycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUxpbmsob3B0cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2luc2VydEltYWdlJywgZmFsc2UsIHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93LmdldFNlbGVjdGlvbigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElzc3VlOiBodHRwczovL2dpdGh1Yi5jb20veWFid2UvbWVkaXVtLWVkaXRvci9pc3N1ZXMvNTk1XG4gICAgICAgICAqIElmIHRoZSBhY3Rpb24gaXMgdG8ganVzdGlmeSB0aGUgdGV4dCAqL1xuICAgICAgICBpZiAoanVzdGlmeUFjdGlvbi5leGVjKGFjdGlvbikpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5leGVjQ29tbWFuZChhY3Rpb24sIGZhbHNlLCBudWxsKSxcbiAgICAgICAgICAgICAgICBwYXJlbnROb2RlID0gTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3RlZFBhcmVudEVsZW1lbnQoTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25SYW5nZSh0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCkpO1xuICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwSnVzdGlmeURpdkZyYWdtZW50cy5jYWxsKHRoaXMsIE1lZGl1bUVkaXRvci51dGlsLmdldFRvcEJsb2NrQ29udGFpbmVyKHBhcmVudE5vZGUpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5leGVjQ29tbWFuZChhY3Rpb24sIGZhbHNlLCBudWxsKTtcbiAgICB9XG5cbiAgICAvKiBJZiB3ZSd2ZSBqdXN0IGp1c3RpZmllZCB0ZXh0IHdpdGhpbiBhIGNvbnRhaW5lciBibG9ja1xuICAgICAqIENocm9tZSBtYXkgaGF2ZSByZW1vdmVkIDxicj4gZWxlbWVudHMgYW5kIGluc3RlYWQgd3JhcHBlZCBsaW5lcyBpbiA8ZGl2PiBlbGVtZW50c1xuICAgICAqIHdpdGggYSB0ZXh0LWFsaWduIHByb3BlcnR5LiAgSWYgc28sIHdlIHdhbnQgdG8gZml4IHRoaXNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjbGVhbnVwSnVzdGlmeURpdkZyYWdtZW50cyhibG9ja0NvbnRhaW5lcikge1xuICAgICAgICBpZiAoIWJsb2NrQ29udGFpbmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGV4dEFsaWduLFxuICAgICAgICAgICAgY2hpbGREaXZzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYmxvY2tDb250YWluZXIuY2hpbGROb2RlcykuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzRGl2ID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGl2JztcbiAgICAgICAgICAgICAgICBpZiAoaXNEaXYgJiYgIXRleHRBbGlnbikge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ24gPSBlbGVtZW50LnN0eWxlLnRleHRBbGlnbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzRGl2O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLyogSWYgd2UgZm91bmQgY2hpbGQgPGRpdj4gZWxlbWVudHMgd2l0aCB0ZXh0LWFsaWduIHN0eWxlIGF0dHJpYnV0ZXNcbiAgICAgICAgICogd2Ugc2hvdWxkIGZpeCB0aGlzIGJ5OlxuICAgICAgICAgKlxuICAgICAgICAgKiAxKSBVbndyYXBwaW5nIGVhY2ggPGRpdj4gd2hpY2ggaGFzIGEgdGV4dC1hbGlnbiBzdHlsZVxuICAgICAgICAgKiAyKSBJbnNlcnQgYSA8YnI+IGVsZW1lbnQgYWZ0ZXIgZWFjaCBzZXQgb2YgJ3Vud3JhcHBlZCcgZGl2IGNoaWxkcmVuXG4gICAgICAgICAqIDMpIFNldCB0aGUgdGV4dC1hbGlnbiBzdHlsZSBvZiB0aGUgcGFyZW50IGJsb2NrIGVsZW1lbnRcbiAgICAgICAgICovXG4gICAgICAgIGlmIChjaGlsZERpdnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSB3ZSdyZSBtdWNraW5nIHdpdGggdGhlIEhUTUwsIHByZXNlcnZlIHNlbGVjdGlvblxuICAgICAgICAgICAgdGhpcy5zYXZlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBjaGlsZERpdnMuZm9yRWFjaChmdW5jdGlvbiAoZGl2KSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpdi5zdHlsZS50ZXh0QWxpZ24gPT09IHRleHRBbGlnbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdENoaWxkID0gZGl2Lmxhc3RDaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5zdGVhZCBvZiBhIGRpdiwgZXh0cmFjdCB0aGUgY2hpbGQgZWxlbWVudHMgYW5kIGFkZCBhIDxicj5cbiAgICAgICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLnVud3JhcChkaXYsIHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiciA9IHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JSJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Q2hpbGQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYnIsIGxhc3RDaGlsZC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIGJsb2NrQ29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9IHRleHRBbGlnbjtcbiAgICAgICAgICAgIC8vIFdlJ3JlIGRvbmUsIHNvIHJlc3RvcmUgc2VsZWN0aW9uXG4gICAgICAgICAgICB0aGlzLnJlc3RvcmVTZWxlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIE1lZGl1bUVkaXRvci5wcm90b3R5cGUgPSB7XG4gICAgICAgIC8vIE5PVCBET0NVTUVOVEVEIC0gZXhwb3NlZCBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHlcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKGVsZW1lbnRzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBtZXJnZU9wdGlvbnMuY2FsbCh0aGlzLCB0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMub3JpZ0VsZW1lbnRzID0gZWxlbWVudHM7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmVsZW1lbnRzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmVsZW1lbnRzQ29udGFpbmVyID0gdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dXAoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXR1cDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNyZWF0ZUVsZW1lbnRzQXJyYXkuY2FsbCh0aGlzLCB0aGlzLm9yaWdFbGVtZW50cyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBhZGRUb0VkaXRvcnMuY2FsbCh0aGlzLCB0aGlzLm9wdGlvbnMuY29udGVudFdpbmRvdyk7XG5cbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1lZGl1bUVkaXRvci5FdmVudHModGhpcyk7XG5cbiAgICAgICAgICAgIC8vIENhbGwgaW5pdGlhbGl6YXRpb24gaGVscGVyc1xuICAgICAgICAgICAgaW5pdEVsZW1lbnRzLmNhbGwodGhpcyk7XG4gICAgICAgICAgICBpbml0RXh0ZW5zaW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgYXR0YWNoSGFuZGxlcnMuY2FsbCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLmZvckVhY2goZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0ZW5zaW9uLmRlc3Ryb3kgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBSZXNldCBlbGVtZW50cyBjb250ZW50LCBmaXggZm9yIGlzc3VlIHdoZXJlIGFmdGVyIGVkaXRvciBkZXN0cm95ZWQgdGhlIHJlZCB1bmRlcmxpbmVzIG9uIHNwZWxsaW5nIGVycm9ycyBhcmUgbGVmdFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3BlbGxjaGVjaykge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGVsZW1lbnQuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNsZWFudXAgZXh0cmEgYWRkZWQgYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdjb250ZW50RWRpdGFibGUnKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnc3BlbGxjaGVjaycpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW1lZGl1bS1lZGl0b3ItZWxlbWVudCcpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdyb2xlJyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtbXVsdGlsaW5lJyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ21lZGl1bS1lZGl0b3ItaW5kZXgnKTtcblxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgY3JlYXRlZCBmb3IgdGV4dGFyZWFzXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCdtZWRpdW0tZWRpdG9yLXRleHRhcmVhLWlkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHRhcmVhID0gZWxlbWVudC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhW21lZGl1bS1lZGl0b3ItdGV4dGFyZWEtaWQ9XCInICsgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ21lZGl1bS1lZGl0b3ItdGV4dGFyZWEtaWQnKSArICdcIl0nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRhcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVbi1oaWRlIHRoZSB0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dGFyZWEuY2xhc3NMaXN0LnJlbW92ZSgnbWVkaXVtLWVkaXRvci1oaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcblxuICAgICAgICAgICAgcmVtb3ZlRnJvbUVkaXRvcnMuY2FsbCh0aGlzLCB0aGlzLm9wdGlvbnMuY29udGVudFdpbmRvdyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb246IGZ1bmN0aW9uICh0YXJnZXQsIGV2ZW50LCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMuYXR0YWNoRE9NRXZlbnQodGFyZ2V0LCBldmVudCwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKHRhcmdldCwgZXZlbnQsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5kZXRhY2hET01FdmVudCh0YXJnZXQsIGV2ZW50LCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5hdHRhY2hDdXN0b21FdmVudChldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5kZXRhY2hDdXN0b21FdmVudChldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uIChuYW1lLCBkYXRhLCBlZGl0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlckN1c3RvbUV2ZW50KG5hbWUsIGRhdGEsIGVkaXRhYmxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxheTogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzLm9wdGlvbnMuZGVsYXkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNlcmlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgZWxlbWVudGlkLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB7fTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudGlkID0gKHRoaXMuZWxlbWVudHNbaV0uaWQgIT09ICcnKSA/IHRoaXMuZWxlbWVudHNbaV0uaWQgOiAnZWxlbWVudC0nICsgaTtcbiAgICAgICAgICAgICAgICBjb250ZW50W2VsZW1lbnRpZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLmVsZW1lbnRzW2ldLmlubmVySFRNTC50cmltKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RXh0ZW5zaW9uQnlOYW1lOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgdmFyIGV4dGVuc2lvbjtcbiAgICAgICAgICAgIGlmICh0aGlzLmV4dGVuc2lvbnMgJiYgdGhpcy5leHRlbnNpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucy5zb21lKGZ1bmN0aW9uIChleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4dC5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9uO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOT1QgRE9DVU1FTlRFRCAtIGV4cG9zZWQgYXMgYSBoZWxwZXIgZm9yIG90aGVyIGV4dGVuc2lvbnMgdG8gdXNlXG4gICAgICAgICAqL1xuICAgICAgICBhZGRCdWlsdEluRXh0ZW5zaW9uOiBmdW5jdGlvbiAobmFtZSwgb3B0cykge1xuICAgICAgICAgICAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuZ2V0RXh0ZW5zaW9uQnlOYW1lKG5hbWUpLFxuICAgICAgICAgICAgICAgIG1lcmdlZDtcbiAgICAgICAgICAgIGlmIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdhbmNob3InOlxuICAgICAgICAgICAgICAgICAgICBtZXJnZWQgPSBNZWRpdW1FZGl0b3IudXRpbC5leHRlbmQoe30sIHRoaXMub3B0aW9ucy5hbmNob3IsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBuZXcgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuYW5jaG9yKG1lcmdlZCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FuY2hvci1wcmV2aWV3JzpcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gbmV3IE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmFuY2hvclByZXZpZXcodGhpcy5vcHRpb25zLmFuY2hvclByZXZpZXcpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhdXRvTGluayc6XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IG5ldyBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5hdXRvTGluaygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdmaWxlRHJhZ2dpbmcnOlxuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBuZXcgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMuZmlsZURyYWdnaW5nKG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdmb250c2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IG5ldyBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5mb250U2l6ZShvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAna2V5Ym9hcmRDb21tYW5kcyc6XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IG5ldyBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5rZXlib2FyZENvbW1hbmRzKHRoaXMub3B0aW9ucy5rZXlib2FyZENvbW1hbmRzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncGFzdGUnOlxuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBuZXcgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMucGFzdGUodGhpcy5vcHRpb25zLnBhc3RlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncGxhY2Vob2xkZXInOlxuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBuZXcgTWVkaXVtRWRpdG9yLmV4dGVuc2lvbnMucGxhY2Vob2xkZXIodGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gQWxsIG9mIHRoZSBidWlsdC1pbiBidXR0b25zIGZvciBNZWRpdW1FZGl0b3IgYXJlIGV4dGVuc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgLy8gc28gY2hlY2sgdG8gc2VlIGlmIHRoZSBleHRlbnNpb24gd2UncmUgY3JlYXRpbmcgaXMgYSBidWlsdC1pbiBidXR0b25cbiAgICAgICAgICAgICAgICAgICAgaWYgKE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbi5pc0J1aWx0SW5CdXR0b24obmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkID0gTWVkaXVtRWRpdG9yLnV0aWwuZGVmYXVsdHMoe30sIG9wdHMsIE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbi5wcm90b3R5cGUuZGVmYXVsdHNbbmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IG5ldyBNZWRpdW1FZGl0b3IuZXh0ZW5zaW9ucy5idXR0b24obWVyZ2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gbmV3IE1lZGl1bUVkaXRvci5leHRlbnNpb25zLmJ1dHRvbihuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goaW5pdEV4dGVuc2lvbihleHRlbnNpb24sIG5hbWUsIHRoaXMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgICAgICAgfSxcblxuICAgICAgICBzdG9wU2VsZWN0aW9uVXBkYXRlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2ZW50U2VsZWN0aW9uVXBkYXRlcyA9IHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRTZWxlY3Rpb25VcGRhdGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZlbnRTZWxlY3Rpb25VcGRhdGVzID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hlY2tTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0b29sYmFyID0gdGhpcy5nZXRFeHRlbnNpb25CeU5hbWUoJ3Rvb2xiYXInKTtcbiAgICAgICAgICAgIGlmICh0b29sYmFyKSB7XG4gICAgICAgICAgICAgICAgdG9vbGJhci5jaGVja1N0YXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBXcmFwcGVyIGFyb3VuZCBkb2N1bWVudC5xdWVyeUNvbW1hbmRTdGF0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBhY3Rpb24gaGFzIGFscmVhZHlcbiAgICAgICAgLy8gYmVlbiBhcHBsaWVkIHRvIHRoZSBjdXJyZW50IHNlbGVjdGlvblxuICAgICAgICBxdWVyeUNvbW1hbmRTdGF0ZTogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgdmFyIGZ1bGxBY3Rpb24gPSAvXmZ1bGwtKC4rKSQvZ2ksXG4gICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgcXVlcnlTdGF0ZSA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIEFjdGlvbnMgc3RhcnRpbmcgd2l0aCAnZnVsbC0nIG5lZWQgdG8gYmUgbW9kaWZpZWQgc2luY2UgdGhpcyBpcyBhIG1lZGl1bS1lZGl0b3IgY29uY2VwdFxuICAgICAgICAgICAgbWF0Y2ggPSBmdWxsQWN0aW9uLmV4ZWMoYWN0aW9uKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGFjdGlvbiA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHF1ZXJ5U3RhdGUgPSB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudC5xdWVyeUNvbW1hbmRTdGF0ZShhY3Rpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXhjKSB7XG4gICAgICAgICAgICAgICAgcXVlcnlTdGF0ZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBxdWVyeVN0YXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4ZWNBY3Rpb246IGZ1bmN0aW9uIChhY3Rpb24sIG9wdHMpIHtcbiAgICAgICAgICAgIC8qanNsaW50IHJlZ2V4cDogdHJ1ZSovXG4gICAgICAgICAgICB2YXIgZnVsbEFjdGlvbiA9IC9eZnVsbC0oLispJC9naSxcbiAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICByZXN1bHQ7XG4gICAgICAgICAgICAvKmpzbGludCByZWdleHA6IGZhbHNlKi9cblxuICAgICAgICAgICAgLy8gQWN0aW9ucyBzdGFydGluZyB3aXRoICdmdWxsLScgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdG8gdGhlIGVudGlyZSBjb250ZW50cyBvZiB0aGUgZWRpdGFibGUgZWxlbWVudFxuICAgICAgICAgICAgLy8gKGllIGZ1bGwtYm9sZCwgZnVsbC1hcHBlbmQtcHJlLCBldGMuKVxuICAgICAgICAgICAgbWF0Y2ggPSBmdWxsQWN0aW9uLmV4ZWMoYWN0aW9uKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiB0byBiZSByZXN0b3JlZCBhZnRlciBhcHBseWluZyB0aGUgYWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgLy8gU2VsZWN0IGFsbCBvZiB0aGUgY29udGVudHMgYmVmb3JlIGNhbGxpbmcgdGhlIGFjdGlvblxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0QWxsQ29udGVudHMoKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBleGVjQWN0aW9uSW50ZXJuYWwuY2FsbCh0aGlzLCBtYXRjaFsxXSwgb3B0cyk7XG4gICAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgcHJldmlvdXMgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGV4ZWNBY3Rpb25JbnRlcm5hbC5jYWxsKHRoaXMsIGFjdGlvbiwgb3B0cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRvIHNvbWUgRE9NIGNsZWFuLXVwIGZvciBrbm93biBicm93c2VyIGlzc3VlcyBhZnRlciB0aGUgYWN0aW9uXG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnaW5zZXJ0dW5vcmRlcmVkbGlzdCcgfHwgYWN0aW9uID09PSAnaW5zZXJ0b3JkZXJlZGxpc3QnKSB7XG4gICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuY2xlYW5MaXN0RE9NKHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LCB0aGlzLmdldFNlbGVjdGVkUGFyZW50RWxlbWVudCgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jaGVja1NlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTZWxlY3RlZFBhcmVudEVsZW1lbnQ6IGZ1bmN0aW9uIChyYW5nZSkge1xuICAgICAgICAgICAgaWYgKHJhbmdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByYW5nZSA9IHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93LmdldFNlbGVjdGlvbigpLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3RlZFBhcmVudEVsZW1lbnQocmFuZ2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNlbGVjdEFsbENvbnRlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY3Vyck5vZGUgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGlvbkVsZW1lbnQodGhpcy5vcHRpb25zLmNvbnRlbnRXaW5kb3cpO1xuXG4gICAgICAgICAgICBpZiAoY3Vyck5vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBsb3dlc3QgZGVzY2VuZGFudCBub2RlIHRoYXQgc3RpbGwgc2VsZWN0cyBhbGwgb2YgdGhlIGNvbnRlbnRzXG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1cnJOb2RlLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0RWxlbWVudChjdXJyTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2VsZWN0RWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIE1lZGl1bUVkaXRvci5zZWxlY3Rpb24uc2VsZWN0Tm9kZShlbGVtZW50LCB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCk7XG5cbiAgICAgICAgICAgIHZhciBzZWxFbGVtZW50ID0gTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25FbGVtZW50KHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93KTtcbiAgICAgICAgICAgIGlmIChzZWxFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudHMuZm9jdXNFbGVtZW50KHNlbEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldEZvY3VzZWRFbGVtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZm9jdXNlZDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHMuc29tZShmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGVsZW1lbnQgdGhhdCBoYXMgZm9jdXNcbiAgICAgICAgICAgICAgICBpZiAoIWZvY3VzZWQgJiYgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbWVkaXVtLWZvY3VzZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICBmb2N1c2VkID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBiYWlsIGlmIHdlIGZvdW5kIHRoZSBlbGVtZW50IHRoYXQgaGFkIGZvY3VzXG4gICAgICAgICAgICAgICAgcmV0dXJuICEhZm9jdXNlZDtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgICByZXR1cm4gZm9jdXNlZDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBFeHBvcnQgdGhlIHN0YXRlIG9mIHRoZSBzZWxlY3Rpb24gaW4gcmVzcGVjdCB0byBvbmUgb2YgdGhpc1xuICAgICAgICAvLyBpbnN0YW5jZSBvZiBNZWRpdW1FZGl0b3IncyBlbGVtZW50c1xuICAgICAgICBleHBvcnRTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3Rpb25FbGVtZW50ID0gTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25FbGVtZW50KHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93KSxcbiAgICAgICAgICAgICAgICBlZGl0YWJsZUVsZW1lbnRJbmRleCA9IHRoaXMuZWxlbWVudHMuaW5kZXhPZihzZWxlY3Rpb25FbGVtZW50KSxcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25TdGF0ZSA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChlZGl0YWJsZUVsZW1lbnRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uU3RhdGUgPSBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLmV4cG9ydFNlbGVjdGlvbihzZWxlY3Rpb25FbGVtZW50LCB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25TdGF0ZSAhPT0gbnVsbCAmJiBlZGl0YWJsZUVsZW1lbnRJbmRleCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXRlLmVkaXRhYmxlRWxlbWVudEluZGV4ID0gZWRpdGFibGVFbGVtZW50SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZWxlY3Rpb25TdGF0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlU2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvblN0YXRlID0gdGhpcy5leHBvcnRTZWxlY3Rpb24oKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBSZXN0b3JlIGEgc2VsZWN0aW9uIGJhc2VkIG9uIGEgc2VsZWN0aW9uU3RhdGUgcmV0dXJuZWQgYnkgYSBjYWxsXG4gICAgICAgIC8vIHRvIE1lZGl1bUVkaXRvci5leHBvcnRTZWxlY3Rpb25cbiAgICAgICAgaW1wb3J0U2VsZWN0aW9uOiBmdW5jdGlvbiAoc2VsZWN0aW9uU3RhdGUsIGZhdm9yTGF0ZXJTZWxlY3Rpb25BbmNob3IpIHtcbiAgICAgICAgICAgIGlmICghc2VsZWN0aW9uU3RhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBlZGl0YWJsZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnRzW3NlbGVjdGlvblN0YXRlLmVkaXRhYmxlRWxlbWVudEluZGV4IHx8IDBdO1xuICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5pbXBvcnRTZWxlY3Rpb24oc2VsZWN0aW9uU3RhdGUsIGVkaXRhYmxlRWxlbWVudCwgdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQsIGZhdm9yTGF0ZXJTZWxlY3Rpb25BbmNob3IpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlc3RvcmVTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0U2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uU3RhdGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUxpbms6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudEVkaXRvciA9IE1lZGl1bUVkaXRvci5zZWxlY3Rpb24uZ2V0U2VsZWN0aW9uRWxlbWVudCh0aGlzLm9wdGlvbnMuY29udGVudFdpbmRvdyksXG4gICAgICAgICAgICAgICAgY3VzdG9tRXZlbnQgPSB7fTtcblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzZWxlY3Rpb24gaXMgd2l0aGluIGFuIGVsZW1lbnQgdGhpcyBlZGl0b3IgaXMgdHJhY2tpbmdcbiAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRzLmluZGV4T2YoY3VycmVudEVkaXRvcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLmRpc2FibGVDdXN0b21FdmVudCgnZWRpdGFibGVJbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLnVybCAmJiBvcHRzLnVybC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNlbGVjdGlvbiA9IHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJSYW5nZSA9IGN1cnJlbnRTZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tb25BbmNlc3RvckNvbnRhaW5lciA9IGN1cnJSYW5nZS5jb21tb25BbmNlc3RvckNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRlZFNlbGVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydENvbnRhaW5lclBhcmVudEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kQ29udGFpbmVyUGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Tm9kZXM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBzZWxlY3Rpb24gaXMgY29udGFpbmVkIHdpdGhpbiBhIHNpbmdsZSB0ZXh0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgc2VsZWN0aW9uIHN0YXJ0cyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSB0ZXh0IG5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNU0lFIHN0aWxsIHNheXMgdGhlIHN0YXJ0Q29udGFpbmVyIGlzIHRoZSBwYXJlbnQgb2YgdGhlIHRleHQgbm9kZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBzZWxlY3Rpb24gaXMgY29udGFpbmVkIHdpdGhpbiBhIHNpbmdsZSB0ZXh0IG5vZGUsIHdlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YW50IHRvIGp1c3QgdXNlIHRoZSBkZWZhdWx0IGJyb3dzZXIgJ2NyZWF0ZUxpbmsnLCBzbyB3ZSBuZWVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBhY2NvdW50IGZvciB0aGlzIGNhc2UgYW5kIGFkanVzdCB0aGUgY29tbW9uQW5jZXN0b3JDb250YWluZXIgYWNjb3JkaW5nbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyUmFuZ2UuZW5kQ29udGFpbmVyLm5vZGVUeXBlID09PSAzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclJhbmdlLnN0YXJ0Q29udGFpbmVyLm5vZGVUeXBlICE9PSAzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclJhbmdlLnN0YXJ0T2Zmc2V0ID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclJhbmdlLnN0YXJ0Q29udGFpbmVyLmZpcnN0Q2hpbGQgPT09IGN1cnJSYW5nZS5lbmRDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tb25BbmNlc3RvckNvbnRhaW5lciA9IGN1cnJSYW5nZS5lbmRDb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q29udGFpbmVyUGFyZW50RWxlbWVudCA9IE1lZGl1bUVkaXRvci51dGlsLmdldENsb3Nlc3RCbG9ja0NvbnRhaW5lcihjdXJyUmFuZ2Uuc3RhcnRDb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kQ29udGFpbmVyUGFyZW50RWxlbWVudCA9IE1lZGl1bUVkaXRvci51dGlsLmdldENsb3Nlc3RCbG9ja0NvbnRhaW5lcihjdXJyUmFuZ2UuZW5kQ29udGFpbmVyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHNlbGVjdGlvbiBpcyBub3QgY29udGFpbmVkIHdpdGhpbiBhIHNpbmdsZSB0ZXh0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1dCB0aGUgc2VsZWN0aW9uIGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHNhbWUgYmxvY2sgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBtYWtlIHN1cmUgd2UgY3JlYXRlIGEgc2luZ2xlIGxpbmssIGFuZCBub3QgbXVsdGlwbGUgbGlua3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdoaWNoIGNhbiBoYXBwZW4gd2l0aCB0aGUgYnVpbHQgaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tbW9uQW5jZXN0b3JDb250YWluZXIubm9kZVR5cGUgIT09IDMgJiYgc3RhcnRDb250YWluZXJQYXJlbnRFbGVtZW50ID09PSBlbmRDb250YWluZXJQYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudEVsZW1lbnQgPSAoc3RhcnRDb250YWluZXJQYXJlbnRFbGVtZW50IHx8IGN1cnJlbnRFZGl0b3IpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHdlIGFyZSBnb2luZyB0byBjcmVhdGUgYSBsaW5rIGZyb20gYW4gZXh0cmFjdGVkIHRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmUgc3VyZSB0aGF0IGlmIHdlIGFyZSB1cGRhdGluZyBhIGxpbmssIHdlIHdvbid0IGxldCBhbiBlbXB0eSBsaW5rIGJlaGluZCAoc2VlICM3NTQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKFdvcmthcm91bmcgZm9yIENocm9tZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV4ZWNBY3Rpb24oJ3VubGluaycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWRTZWxlY3Rpb24gPSB0aGlzLmV4cG9ydFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHBhcmVudEVsZW1lbnQuY2xvbmVOb2RlKHRydWUpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RWRpdG9yID09PSBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgdG8gYXZvaWQgdGhlIGVkaXRvciBpdHNlbGYgYmVpbmcgd2lwZWQgb3V0IHdoZW4gaXQncyB0aGUgb25seSBibG9jayBlbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcyBvdXIgcmVmZXJlbmNlIGluc2lkZSB0aGlzLmVsZW1lbnRzIGdldHMgZGV0YWNoZWQgZnJvbSB0aGUgcGFnZSB3aGVuIGluc2VydEhUTUwgcnVucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UganVzdCB1c2UgW3BhcmVudEVsZW1lbnQsIDBdIGFuZCBbcGFyZW50RWxlbWVudCwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXMgdGhlIHJhbmdlIGJvdW5kYXJpZXMsIHRoaXMgaGFwcGVucyB3aGVuZXZlciBwYXJlbnRFbGVtZW50ID09PSBjdXJyZW50RWRpdG9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdHJhZGVvZmYgdG8gdGhpcyB3b3JrYXJvdW5kIGlzIHRoYXQgYSBvcnBoYW5lZCB0YWcgY2FuIHNvbWV0aW1lcyBiZSBsZWZ0IGJlaGluZCBhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBlZGl0b3IncyBjb250ZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbiBHZWNrbzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXMgYW4gZW1wdHkgPHN0cm9uZz48L3N0cm9uZz4gaWYgcGFyZW50RWxlbWVudC5sYXN0Q2hpbGQgaXMgYSA8c3Ryb25nPiB0YWcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIFdlYktpdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW4gaW52ZW50ZWQgPGJyIC8+IHRhZyBhdCB0aGUgZW5kIGluIHRoZSBzYW1lIHNpdHVhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3Iuc2VsZWN0aW9uLnNlbGVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudC5maXJzdENoaWxkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnQubGFzdENoaWxkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudC5sYXN0Q2hpbGQubm9kZVR5cGUgPT09IDMgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudC5sYXN0Q2hpbGQubm9kZVZhbHVlLmxlbmd0aCA6IHBhcmVudEVsZW1lbnQubGFzdENoaWxkLmNoaWxkTm9kZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5zZWxlY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kaWZpZWRFeHBvcnRlZFNlbGVjdGlvbiA9IHRoaXMuZXhwb3J0U2VsZWN0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Tm9kZXMgPSBNZWRpdW1FZGl0b3IudXRpbC5maW5kT3JDcmVhdGVNYXRjaGluZ1RleHROb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogZXhwb3J0ZWRTZWxlY3Rpb24uc3RhcnQgLSBtb2RpZmllZEV4cG9ydGVkU2VsZWN0aW9uLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBleHBvcnRlZFNlbGVjdGlvbi5lbmQgLSBtb2RpZmllZEV4cG9ydGVkU2VsZWN0aW9uLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGFibGVFbGVtZW50SW5kZXg6IGV4cG9ydGVkU2VsZWN0aW9uLmVkaXRhYmxlRWxlbWVudEluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlcyB0aGUgbGluayBpbiB0aGUgZG9jdW1lbnQgZnJhZ21lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3IudXRpbC5jcmVhdGVMaW5rKHRoaXMub3B0aW9ucy5vd25lckRvY3VtZW50LCB0ZXh0Tm9kZXMsIG9wdHMudXJsLnRyaW0oKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUgdHJpbXMgdGhlIGxlYWRpbmcgd2hpdGVzcGFjZXMgd2hlbiBpbnNlcnRpbmcgSFRNTCwgd2hpY2ggbWVzc2VzIHVwIHJlc3RvcmluZyB0aGUgc2VsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWFkaW5nV2hpdGVzcGFjZXNDb3VudCA9IChmcmFnbWVudC5maXJzdENoaWxkLmlubmVySFRNTC5tYXRjaCgvXlxccysvKSB8fCBbJyddKVswXS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3cgbW92ZSB0aGUgY3JlYXRlZCBsaW5rIGJhY2sgaW50byB0aGUgb3JpZ2luYWwgZG9jdW1lbnQgaW4gYSB3YXkgdG8gcHJlc2VydmUgdW5kby9yZWRvIGhpc3RvcnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZWRpdW1FZGl0b3IudXRpbC5pbnNlcnRIVE1MQ29tbWFuZCh0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCwgZnJhZ21lbnQuZmlyc3RDaGlsZC5pbm5lckhUTUwucmVwbGFjZSgvXlxccysvLCAnJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkU2VsZWN0aW9uLnN0YXJ0IC09IGxlYWRpbmdXaGl0ZXNwYWNlc0NvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydGVkU2VsZWN0aW9uLmVuZCAtPSBsZWFkaW5nV2hpdGVzcGFjZXNDb3VudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0U2VsZWN0aW9uKGV4cG9ydGVkU2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NyZWF0ZUxpbmsnLCBmYWxzZSwgb3B0cy51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRhcmdldEJsYW5rIHx8IG9wdHMudGFyZ2V0ID09PSAnX2JsYW5rJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1lZGl1bUVkaXRvci51dGlsLnNldFRhcmdldEJsYW5rKE1lZGl1bUVkaXRvci5zZWxlY3Rpb24uZ2V0U2VsZWN0aW9uU3RhcnQodGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQpLCBvcHRzLnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmJ1dHRvbkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVkaXVtRWRpdG9yLnV0aWwuYWRkQ2xhc3NUb0FuY2hvcnMoTWVkaXVtRWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3Rpb25TdGFydCh0aGlzLm9wdGlvbnMub3duZXJEb2N1bWVudCksIG9wdHMuYnV0dG9uQ2xhc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEZpcmUgaW5wdXQgZXZlbnQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGlmIGFueW9uZSB3YXMgbGlzdGVuaW5nIGRpcmVjdGx5IHRvIHRoZSBET00gaW5wdXQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRhcmdldEJsYW5rIHx8IG9wdHMudGFyZ2V0ID09PSAnX2JsYW5rJyB8fCBvcHRzLmJ1dHRvbkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUV2ZW50ID0gdGhpcy5vcHRpb25zLm93bmVyRG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tRXZlbnQuaW5pdEV2ZW50KCdpbnB1dCcsIHRydWUsIHRydWUsIHRoaXMub3B0aW9ucy5jb250ZW50V2luZG93KTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzW2ldLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5lbmFibGVDdXN0b21FdmVudCgnZWRpdGFibGVJbnB1dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmlyZSBvdXIgY3VzdG9tIGVkaXRhYmxlSW5wdXQgZXZlbnRcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXJDdXN0b21FdmVudCgnZWRpdGFibGVJbnB1dCcsIGN1c3RvbUV2ZW50LCBjdXJyZW50RWRpdG9yKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhblBhc3RlOiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgdGhpcy5nZXRFeHRlbnNpb25CeU5hbWUoJ3Bhc3RlJykuY2xlYW5QYXN0ZSh0ZXh0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXN0ZUhUTUw6IGZ1bmN0aW9uIChodG1sLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmdldEV4dGVuc2lvbkJ5TmFtZSgncGFzdGUnKS5wYXN0ZUhUTUwoaHRtbCwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0Q29udGVudDogZnVuY3Rpb24gKGh0bWwsIGluZGV4KSB7XG4gICAgICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRzW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmVsZW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy51cGRhdGVJbnB1dCh0YXJnZXQsIHsgdGFyZ2V0OiB0YXJnZXQsIGN1cnJlbnRUYXJnZXQ6IHRhcmdldCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuXG4oZnVuY3Rpb24gKCkge1xuICAgIC8vIHN1bW1hcnk6IFRoZSBkZWZhdWx0IG9wdGlvbnMgaGFzaCB1c2VkIGJ5IHRoZSBFZGl0b3JcblxuICAgIE1lZGl1bUVkaXRvci5wcm90b3R5cGUuZGVmYXVsdHMgPSB7XG4gICAgICAgIGFjdGl2ZUJ1dHRvbkNsYXNzOiAnbWVkaXVtLWVkaXRvci1idXR0b24tYWN0aXZlJyxcbiAgICAgICAgYnV0dG9uTGFiZWxzOiBmYWxzZSxcbiAgICAgICAgZGVsYXk6IDAsXG4gICAgICAgIGRpc2FibGVSZXR1cm46IGZhbHNlLFxuICAgICAgICBkaXNhYmxlRG91YmxlUmV0dXJuOiBmYWxzZSxcbiAgICAgICAgZGlzYWJsZUVkaXRpbmc6IGZhbHNlLFxuICAgICAgICBhdXRvTGluazogZmFsc2UsXG4gICAgICAgIGVsZW1lbnRzQ29udGFpbmVyOiBmYWxzZSxcbiAgICAgICAgY29udGVudFdpbmRvdzogd2luZG93LFxuICAgICAgICBvd25lckRvY3VtZW50OiBkb2N1bWVudCxcbiAgICAgICAgdGFyZ2V0Qmxhbms6IGZhbHNlLFxuICAgICAgICBleHRlbnNpb25zOiB7fSxcbiAgICAgICAgc3BlbGxjaGVjazogdHJ1ZVxuICAgIH07XG59KSgpO1xuXG5NZWRpdW1FZGl0b3IucGFyc2VWZXJzaW9uU3RyaW5nID0gZnVuY3Rpb24gKHJlbGVhc2UpIHtcbiAgICB2YXIgc3BsaXQgPSByZWxlYXNlLnNwbGl0KCctJyksXG4gICAgICAgIHZlcnNpb24gPSBzcGxpdFswXS5zcGxpdCgnLicpLFxuICAgICAgICBwcmVSZWxlYXNlID0gKHNwbGl0Lmxlbmd0aCA+IDEpID8gc3BsaXRbMV0gOiAnJztcbiAgICByZXR1cm4ge1xuICAgICAgICBtYWpvcjogcGFyc2VJbnQodmVyc2lvblswXSwgMTApLFxuICAgICAgICBtaW5vcjogcGFyc2VJbnQodmVyc2lvblsxXSwgMTApLFxuICAgICAgICByZXZpc2lvbjogcGFyc2VJbnQodmVyc2lvblsyXSwgMTApLFxuICAgICAgICBwcmVSZWxlYXNlOiBwcmVSZWxlYXNlLFxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt2ZXJzaW9uWzBdLCB2ZXJzaW9uWzFdLCB2ZXJzaW9uWzJdXS5qb2luKCcuJykgKyAocHJlUmVsZWFzZSA/ICctJyArIHByZVJlbGVhc2UgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuTWVkaXVtRWRpdG9yLnZlcnNpb24gPSBNZWRpdW1FZGl0b3IucGFyc2VWZXJzaW9uU3RyaW5nLmNhbGwodGhpcywgKHtcbiAgICAvLyBncnVudC1idW1wIGxvb2tzIGZvciB0aGlzOlxuICAgICd2ZXJzaW9uJzogJzUuOC4yJ1xufSkudmVyc2lvbik7XG5cbiAgICByZXR1cm4gTWVkaXVtRWRpdG9yO1xufSgpKSk7XG4iLCIvLyBBcHBseSBTY3JvbGxzcHkgdG8gc2lkZSBuYXZcclxuJCgnLmRvYy1wYW5lIC5wYW5lbC1jb250ZW50Jykuc2Nyb2xsc3B5KHtcclxuICAgIHRhcmdldDogJy5icy1kb2NzLXNpZGViYXInLFxyXG4gICAgb2Zmc2V0OiA0MFxyXG59KTtcclxuXHJcbi8vIEFwcGx5IE1lZGl1bSBFZGl0b3IgdG8gYWxsIGNvbnRlbnQgaW4gZG9jIHBhbmVcclxudmFyIE1lZGl1bUVkaXRvciA9IHJlcXVpcmUoJ21lZGl1bS1lZGl0b3InKSxcclxuICAgIGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmVkaXRhYmxlIHAnKSxcclxuICAgIGVkaXRvck9wdGlvbnMgPSB7XHJcbiAgICAgICAgYnV0dG9uTGFiZWxzOiAnZm9udGF3ZXNvbWUnLFxyXG4gICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgYWxsb3dNdWx0aVBhcmFncmFwaFNlbGVjdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgJ2JvbGQnLFxyXG4gICAgICAgICAgICAgICAgJ2l0YWxpYycsXHJcbiAgICAgICAgICAgICAgICAndW5kZXJsaW5lJyxcclxuICAgICAgICAgICAgICAgICdzdHJpa2V0aHJvdWdoJywnYW5jaG9yJyxcclxuICAgICAgICAgICAgICAgICdvcmRlcmVkbGlzdCcsXHJcbiAgICAgICAgICAgICAgICAndW5vcmRlcmVkbGlzdCcsXHJcbiAgICAgICAgICAgICAgICAnaW5kZW50JyxcclxuICAgICAgICAgICAgICAgICdvdXRkZW50J1xyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBkaWZmTGVmdDogMCxcclxuICAgICAgICAgICAgZGlmZlRvcDogLTEwLFxyXG4gICAgICAgICAgICBmaXJzdEJ1dHRvbkNsYXNzOiAnbWVkaXVtLWVkaXRvci1idXR0b24tZmlyc3QnLFxyXG4gICAgICAgICAgICBsYXN0QnV0dG9uQ2xhc3M6ICdtZWRpdW0tZWRpdG9yLWJ1dHRvbi1sYXN0JyxcclxuICAgICAgICAgICAgc3RhbmRhcmRpemVTZWxlY3Rpb25TdGFydDogZmFsc2UsXHJcbiAgICAgICAgICAgIHN0YXRpYzogZmFsc2UsXHJcbiAgICAgICAgICAgIHJlbGF0aXZlQ29udGFpbmVyOiBudWxsLFxyXG4gICAgICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgIHN0aWNreTogZmFsc2UsXHJcbiAgICAgICAgICAgIHVwZGF0ZU9uRW1wdHlTZWxlY3Rpb246IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGVkaXRvciA9IG5ldyBNZWRpdW1FZGl0b3IoZWxlbWVudHMsIGVkaXRvck9wdGlvbnMpO1xyXG4iXX0=
