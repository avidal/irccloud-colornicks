// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.5
// @author          Alex Vidal, based on http://userscripts.org/scripts/show/88258, based on http://chatlogs.musicbrainz.org/mb_chatlogger.user.js
// @licence         BSD
//
// @include         http://irccloud.com/*
// @include         https://irccloud.com/*
// @include         http://www.irccloud.com/*
// @include         https://www.irccloud.com/*
// ==/UserScript==

/*
 * Based on this userscript http://userscripts.org/scripts/show/88258
 * by Lukáš Lalinský
 */

// Hashing and color algorithms borrowed from the chromatabs Firefox extension.

function colornicks($) {

    if(!controller) {
        window.setTimeout(function() { colornicks($) }, 100);
        return;
    }

    var _cache = [];
    var S = 1.0;
    var L = 0.4;

    // create the stylesheet
    var style = document.createElement('style');
    $('body').append(style);

    function hash(s) {
        var h = 5381;

        for(var i = 0; i < s.length; i++) {
            h = ((h << 5) + h) + s.charCodeAt(i);
        }

        return h;
    }

    function get_color(nick) {
        var hue = hash(nick) % 360;

        return "hsl(" + hue + "," + S*100 + "%," + L*100 + "%)";

    }

    function add_style(author, color) {
        var cur = $(style).text();

        var rule = "span.author a[title=" + author + "]";
        var _style = "color: " + color + " !important;";

        $(style).text(cur + rule + "{" + _style + "}");
    }


    function process_message(message) {
        if(message.type != 'buffer_msg') return;

        var author = message.from;
        if(_cache[author]) return;

        var color = get_color(author);

        _cache[author] = color;

        add_style(author, color);

    }
    
    // monkey patch controller.onMessage to call our function as well
    controller.__monkey_onMessage = controller.onMessage;
    controller.onMessage = function(message) {
        process_message(message);
        controller.__monkey_onMessage(message);
    };

};

function inject(fn) {
    /*
     * this function works by injecting a small piece of bootstrap code
     * that waits for the jQuery object to become available.
     * once it is available, it calls the callback function, passing it
     * the jQuery object
     */

    function busyloop(fn) {
        if(typeof window.jQuery == 'undefined') {
            window.setTimeout(function() { busyloop(fn) }, 100);
            return;
        }

        fn(window.jQuery);
    }

    var wrap = '(' + fn.toString() + ')';

    var script = document.createElement('script');
    script.textContent += "(" + busyloop.toString() + ')(' + wrap + ');';
    document.body.appendChild(script);

}

inject(colornicks);
