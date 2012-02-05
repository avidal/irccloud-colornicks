// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.7.0
// @author          Alex Vidal, based on http://userscripts.org/scripts/show/88258, based on http://chatlogs.musicbrainz.org/mb_chatlogger.user.js
// @licence         BSD
//
// @include         http://irccloud.com/*
// @include         https://irccloud.com/*
// @include         http://www.irccloud.com/*
// @include         https://www.irccloud.com/*
// @include         http://alpha.irccloud.com/*
// @include         https://alpha.irccloud.com/*
// ==/UserScript==

/*
 * Based on this userscript http://userscripts.org/scripts/show/88258
 * by Lukáš Lalinský
 */

// Hashing and color algorithms borrowed from the chromatabs Firefox extension.

function colornicks() {
    'use strict';

    var _cache = [];
    var S = 0.8;
    var L = 0.25;

    var is_alpha = typeof(window.SESSION) !== 'undefined';

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

    function hash(nick) {
        var cleaned = clean_nick(nick);
        var h = 0;

        for(var i = 0; i < cleaned.length; i++) {
            h = cleaned.charCodeAt(i) + (h << 6) + (h << 16) - h;
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
        var attr = "", chat_rule = "", list_rule = "", rule = "", _style = "";

        if(is_alpha === true) {
            // for the alpha, we use the data-name attribute instead of
            // the title attribute
            attr = "[data-name='"+author+"']";
            chat_rule = "span.author a"+attr;
            list_rule = "ul.memberList li.user a.present"+attr;
        } else {
            attr = "[title^='"+author+" ']";
            chat_rule = "span.author a"+attr;
            list_rule = "ul.memberList li.user a"+attr;
        }

        rule = chat_rule + ", " + list_rule;
        _style = "color: " + color + " !important;";

        $(style).text(cur + rule + "{" + _style + "}\n");
    }


    function process_message(message) {
        if(message.type !== 'buffer_msg') {
            return;
        }

        var author = message.from;
        if(_cache[author]) {
            return;
        }

        var color = get_color(author);

        _cache[author] = color;

        add_style(author, color);

    }

    if(is_alpha === true) {
        window.SESSION.backend.bind('message', process_message);
    } else {
        // for compatibility purposes, strip out the first argument
        // before dispatching
        $(document).bind('pre.message.irccloud', function(evt, message) {
            process_message(message);
        });
    }

}

function inject(fn) {
    'use strict';
    /*
     * This function injects a small piece of code into the page as soon
     * as jQuery is ready, and then when the controller is ready it hooks
     * into the various controller methods to dispatch custom jQuery events
     * that can be bound.
     *
     * The end result is your function looks like this on the page:
     * (function() {
     *     function colornicks() {
     *         ...
     *     }
     * })()
     */

    function waitloop(fn) {
        var has_controller = typeof(window.controller) !== 'undefined';
        var has_jquery = typeof(window.jQuery) !== 'undefined';

        if(has_jquery === false || has_controller === false) {
            console.log("[CN] Resources are not ready...");
            window.setTimeout(function() { waitloop(fn); }, 100);
            return;
        }

        console.log("[CN] Required resources are ready, calling plugin function.");
        fn();
    }

    function hook_controller() {
        // wait for existence of the controller OR the SESSION object
        // this function hooks into the controller as soon as it is ready
        // and monkey patches various events to send jQuery events
        var has_controller = typeof(window.controller) !== 'undefined';
        var has_session = typeof(window.SESSION) !== 'undefined';

        console.log("[CN] Controller? " + has_controller + "; Session? " + has_session);

        if(has_session === false && has_controller === false) {
            console.log("[CN] Controller or session not available.");
            window.setTimeout(hook_controller, 100);
            return;
        }

        // Starting with the irccloud alpha, there's no need to monkeypatch
        // the event routines, since they dispatch using Backbone.js anyway
        // so we don't want to do the monkeying
        if(has_session === false) {
            console.log("[CN] Patching controller events.");
            var events = [
                ['handleMessage', 'message']
            ];

            // local alias of window.controller
            var controller = window.controller;

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
                };
                console.log("[CN] Finished binding event " + ev);
            });

            window.controller = controller;
        }
    }

    var wrap = "(" + fn.toString() + ")";

    console.log("[CN] Injecting wrapper script.");
    var script = document.createElement('script');
    script.textContent += "(" + waitloop.toString() + ')(' + wrap + ');';
    script.textContent += "\n\n(" + hook_controller.toString() + ")();";
    document.body.appendChild(script);
    console.log("[CN] Done injecting wrapper script.");

}

inject(colornicks);
