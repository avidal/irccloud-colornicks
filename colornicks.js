/*
 * Based on this userscript http://userscripts.org/scripts/review/88258
 * by Lukáš Lalinský
 */

(function () {

    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) {
            h = h * 33 + s.charCodeAt(i);
        }
        return h;
    }

    var _cache = [];
    function get_color(nick) {
        /* this function will return a proper color based on the 
         * hashed value of the nickname */
        if(_cache[nick]) return _cache[nick];

        var color;

        var h = hash(nick);
        var mod = 200;
        var r = 0 + 150 * (1.0 * (h % mod) / mod); h = Math.floor(h/mod);
        var g = 0 + 150 * (1.0 * (h % mod) / mod); h = Math.floor(h/mod);
        var b = 0 + 150 * (1.0 * (h % mod) / mod); h = Math.floor(h/mod);

        color = "rgb("+Math.floor(r)+","+Math.floor(g)+","+Math.floor(b)+")";
        return _cache[nick] = color;
    }

    function recv(event) {
        var t = event.target;

        // new messages are divs with a class of chat
        if(t.tagName != 'DIV' || $(t).hasClass('chat') == false) {
            return;
        }

        //the actual div contains a bunch of spans, one for each part
        //of the message

        var $author = $(t).find('span.author');
        var nick = $author.find('a').text();

        // get the color
        var color = get_color(nick);

        // finally, set the property
        $author.css('color', color);

        // need to set it on the anchor as well, since the css overrides it
        $author.find('a').css('color', color);

        return;

    }

    $('#buffer').bind('DOMNodeInserted', recv);

})();
