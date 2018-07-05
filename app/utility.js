fs = require('fs');
join = require('path').join;

module.exports = {
	URLEncode : function(object) {
        let body = Object.keys( object ).map(function( key ) {
            return encodeURIComponent( key ) + '=' + encodeURIComponent( object[ key ])
        }).join('&');
        return body;
    },

    readQueryHTML : function(options) {
    	fs.readFile(join(__dirname + './../public/query.html'), function(err, data) {
            if (!err) {
                options.htmlFile=data.toString();
            }
        });
    },

    readAVMs : function(options) {
        options.queryTable = {};
        fs.readFile(join(__dirname + './../public/AFAVM.csv'),'utf8', function(err, data) {
            let rows = data.split(/\r?\n|\r/);
            rows.forEach( (row)=> {
                cols = row.split(/,/);
                options.queryTable[cols[0]] = cols[1];
            });
        });
    }
}