module.exports = {
    substringBefore: function (string, pattern) {
        if (string != null) {
            let pos = string.indexOf(pattern);
            if (pos > 0) {
                return string.substring(0, pos);
            }
        }
        return "";
    },
    substringBeforeLast: function(string, pattern) {
        if (string != null) {
            let pos = string.lastIndexOf(pattern);
            if (pos > 0) {
                return string.substring(0, pos);
            }
        }
        return "";
    },
    substringAfter : function(string, pattern) {
        if (string != null) {
            let pos = string.indexOf(pattern);
            if (pos !== -1) {
                return string.substring(pos + pattern.length());
            }
        }
        return "";
    },
    substringAfterLast: function(string, pattern) {
        if (string != null) {
            let pos = string.lastIndexOf(pattern);
            if (pos !== -1) {
                return string.substring(pos + pattern.length());
            }
        }
        return "";
    },
    substringBetween: function (string, begin, end) {
        if (string != null) {
            let s = string.indexOf(begin);
            if (s !== -1) {
                let result = string.substring(s + begin.length);
                return module.exports.substringBefore(result, end);
            }
        }
        return "";
    }
};

