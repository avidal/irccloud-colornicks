// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.5.3
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

        // nicks are represented in an anchor with a title that
        // looks like "<nick> (<hostmask>)", so we match on
        // a title that starts with "<nick> "
        var anchor = "a[title^='"+author+" ']";

        // match on span.author for the chat window
        var rule = "span.author " + anchor;

        // and ul.memberList for the nick list
        rule += ", ul.memberList li.user " + anchor;

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

    $(document).bind('message.cloudinject', process_message);

};

/* CloudInject bootstrapper */
var PLUGIN=['Color Nicks', colornicks, 'v0.5.4'];
(function(d,t,p){
    p[1]=p[1].toString();
    var f=function(){
        var s=d.createElement(t);
        s.textContent='window.CloudInject.inject("'+p[0]+'",'+p[1]+',"'+p[2]+'");';
        g.body.appendChild(s);
    };
    var c=d.createElement(t),s=d.getElementsByTagName(t)[0];c.async=1;
    c.src='https://github.com/avidal/cloudinject/raw/master/cloudinject.js';
    s.parentNode.insertBefore(c,s);
    c.onload=f,c.onreadystatechange=function(){this.readyState=='complete'&&f();};
}(document,'script',PLUGIN));
/* End bootstrapper */
