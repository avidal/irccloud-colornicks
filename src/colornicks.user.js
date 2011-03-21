// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.5.2
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

function colornicks() {

    var _cache = [];
    var S = 0.8;
    var L = 0.25;

    // create the stylesheet
    var style = document.createElement('style');
    $('body').append(style);

    function clean_nick(nick) {
        // attempts to clean up a nickname
        // by removing alternate characters from the end
        // nc_ becomes nc, avidal` becomes avidal

        nick = nick.toLowerCase();

        // typically ` and _ are used on the end alone
        nick = nick.replace(/[`_]+$/, '');

        // remove |<anything> from the end
        nick = nick.replace(/|.*$/, '');

        return nick;
    }

    function hash(s) {
        var s = clean_nick(s);

        var h = 0;

        for(var i = 0; i < s.length; i++) {
            h = s.charCodeAt(i) + (h << 6) + (h << 16) - h;
        }

        return h;

    }


    function get_color(nick) {
        var nickhash = hash(nick);

        // get a positive value for the hue
        var deg = nickhash % 360;
        var h = deg < 0 ? 360 + deg : deg;

        // default L is 50
        var l = 50;

        // half of the hues are too light, for those we
        // decrease lightness
        if(h >= 30 && h <= 210) {
            l = 30;
        }

        // keep saturation above 20
        var s = 20 + Math.abs(nickhash) % 80;

        return "hsl(" + h + "," + s + "%," + l + "%)";

    }

    function add_style(author, color) {
        var cur = $(style).text();

        var rule = "span.author a[title='" + author + "']";
        var _style = "color: " + color + " !important;";

        $(style).text(cur + rule + "{" + _style + "}\n");
    }


    function process_message(evt, message) {
        if(message.type != 'buffer_msg') return;

        var author = message.from;
        if(_cache[author]) return;

        var color = get_color(author);

        _cache[author] = color;

        add_style(author, color);

    }

    $(document).bind('pre.message.irccloud', process_message);

};

function inject(fn) {
    /*
     * This function injects a small piece of code into the page as soon
     * as jQuery is ready, and then when the controller is ready it hooks
     * into the various controller methods to dispatch custom jQuery events
     * that can be bound.
     *
     * The end result is your function looks like this on the page:
     * (function($) {
     *     function colornicks() {
     *         ...
     *     }
     * })(jQuery)
     */

    function waitloop(fn) {
        if(typeof window.jQuery == 'undefined') {
            window.setTimeout(function() { waitloop(fn) }, 100);
            return;
        }

        fn();
    }

    function hook_controller() {
        // this function hooks into the controller as soon as it is ready
        // and monkey patches various events to send jQuery events
        if(!window.controller) {
            window.setTimeout(hook_controller, 100);
            return;
        }

        var events = [
            ['onConnecting', 'connecting'],
            ['onNoSocketData', 'nosocketdata'],
            ['onDisconnect', 'disconnect'],
            ['onBacklogMessage', 'backlogmessage'],
            ['onMessage', 'message'],
            ['onBufferScroll', 'bufferscroll']
        ];

        // make sure none of these events are hooked already
        $.each(events, function(i) {
            var ev = events[i][0];
            var jq_ev = events[i][1];
            var mp_ev = '__monkey_' + ev;
            if(controller.hasOwnProperty(mp_ev)) {
                return;
            }

            //wire em up

            // store a reference to the original event
            controller[mp_ev] = controller[ev];

            // patch the original event
            controller[ev] = function() {
                var event_name = jq_ev + '.irccloud';
                $(document).trigger('pre.' + event_name, arguments);
                controller[mp_ev].apply(controller, arguments);
                $(document).trigger('post.' + event_name, arguments);
            }
        });

    }

    var wrap = "(" + fn.toString() + ")";

    var script = document.createElement('script');
    script.textContent += "(" + waitloop.toString() + ')(' + wrap + ');';
    script.textContent += "\n\n(" + hook_controller.toString() + ")();";
    document.body.appendChild(script);

}

inject(colornicks);
