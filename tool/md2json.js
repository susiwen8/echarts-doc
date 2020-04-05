var fs = require('fs');
var marked = require('marked');
var etpl = require('etpl');
var glob = require('glob');


function convert(opts, cb) {
    var mdPath = opts.path;
    var sectionsAnyOf = opts.sectionsAnyOf;
    var entry = opts.entry;
    var tplEnv = opts.tplEnv;
    var maxDepth = opts.maxDepth || 10;
    var etplEngine = new etpl.Engine({
        commandOpen: '{{',
        commandClose: '}}',
        missTarget: 'error'
    });
    etplEngine.addFilter('default', function (source, defaultVal) {
        return (source === '' || source == null) ? defaultVal : source;
    });
    glob(mdPath, function (err, files) {
        var mdTpl = files.filter(function (fileName) {
            return fileName.indexOf('__') !== 0;
        }).map(function (fileName) {
            return fs.readFileSync(fileName, 'utf-8');
        });

        // Render tpl
        etplEngine.compile(mdTpl.join('\n'));

        // ETPL do not support global variables, without which we have to pass
        // parameters like `galleryViewPath` each time `{{use: ...}}` used, which
        // is easy to forget. So we mount global variables on Object prototype when
        // ETPL rendering.
        // I know this approach is ugly, but I am sorry that I have no time to make
        // a pull request to ETPL yet.
        Object.keys(tplEnv).forEach(function (key) {
            var originalItem = [key];
            if (Object.prototype.hasOwnProperty(key)) {
                throw new Error(key + ' can not be used in tpl config');
            }

            Object.prototype[key] = tplEnv[key];
        });

        var mdStr = etplEngine.getRenderer(entry)({});

        // Restore the global variables.
        Object.keys(tplEnv).forEach(function (key) {
            delete Object.prototype[key];
        });

        // Markdown to JSON
        var schema = mdToJsonSchema(mdStr, maxDepth, opts.imageRoot);
        // console.log(mdStr);
        var topLevel = schema.option.properties;

        (sectionsAnyOf || []).forEach(function (componentName) {
            var newProperties = schema.option.properties = {};
            var componentNameParsed = componentName.split('.');
            componentName = componentNameParsed[0];

            for (var name in topLevel) {
                if (componentNameParsed.length > 1) {
                    newProperties[name] = topLevel[name];
                    var secondLevel = topLevel[name].properties;
                    var secondNewProps = topLevel[name].properties = {};
                    for (var secondName in secondLevel) {
                        makeOptionArr(
                            secondName, componentNameParsed[1], secondNewProps, secondLevel
                        );
                    }
                }
                else {
                    makeOptionArr(name, componentName, newProperties, topLevel);
                }
            }
            topLevel = newProperties;

            function makeOptionArr(nm, cptName, newProps, level) {
                var nmParsed = nm.split('.');
                if (nmParsed[0] === cptName) {
                    newProps[cptName] = newProps[cptName] || {
                        'type': 'Array',
                        'items': {
                            'anyOf': []
                        }
                    };
                    // Use description in excatly #series
                    if (cptName === nm) {
                        newProps[cptName].description = level[nm].description;
                    }
                    else {
                        newProps[cptName].items.anyOf.push(level[nm]);
                    }
                }
                else {
                    newProps[nm] = level[nm];
                }
            }
        });

        cb && cb(schema);
        // console.log(JSON.stringify(schema, null, 2));

    });
}

function mdToJsonSchema(mdStr, maxDepth, imagePath) {

    var renderer = new marked.Renderer();
    renderer.link = function (href, title, text) {
        if (href.match(/^~/)) { // Property link
            return '<a href="#' + href.slice(1) + '">' + text + '</a>';
        }
        else {
            // All other links are opened in new page
            return '<a href="' + href + '" target="_blank">' + text + '</a>';
        }
    };

    renderer.image = function (href, title, text) {
        var size = (text || '').split('x');
        if (isNaN(size[0])) {
            size[0] = 'auto';
        }
        if (isNaN(size[1])) {
            size[1] = 'auto';
        }
        if (href.match(/^~/)) { // Property link
            return '<img width="' + size[0] + '" height="' + size[1] + '" src="documents/' + imagePath + href.slice(1) + '">';
        }
        else {
            // All other links are opened in new page
            return '<img width="' + size[0] + '" height="' + size[1] + '" src="' + href + '">';
        }
    };

    renderer.codespan = function (code) {
        return '<code class="codespan">' + code + '</code>';
    };

    var currentLevel = 0;
    var result = {
        '$schema': 'https://echarts.apache.org/doc/json-schem',
        'option': {
            'type': 'Object',
            'properties': {},
        }
    };
    var current = result.option;
    var stacks = [current];

    function top() {
        return stacks[stacks.length - 1];
    }

    function _unescape(html) {
        return html.replace(/&([#\w]+);/g, function(_, n) {
            n = n.toLowerCase();
            if (n === 'colon') return ':';
            if (n.charAt(0) === '#') {
                return n.charAt(1) === 'x'
                    ? String.fromCharCode(parseInt(n.substring(2), 16))
                    : String.fromCharCode(+n.substring(1));
            }
            return '';
        });
    }

    function convertType(val) {
        val = _unescape(val.trim());
        switch (val) {
            case 'null':
                return null;
            case 'true':
                return true;
            case 'false':
                return false;
        }
        if (!isNaN(val)) {
            return +val;
        }
        return val;
    }

    function appendProperty(name, property) {
        var parent = top();
        var types = parent.type;
        var properties;
        if (types[0] === 'Array') {
            // Name is index
            // if (name == +name) {
            //     if (top().items && !(top().items instanceof Array)) {
            //         throw new Error('Can\'t mix number indices with string properties');
            //     }
            //     properties = top().items = top().items || [];
            // }
            // else {
                top().items = top().items || {
                    type: 'Object',
                    properties: {}
                };
                if (top().items instanceof Array) {
                    throw new Error('Can\'t mix number indices with string properties');
                }
                properties = top().items.properties;
            // }
        }
        else {
            top().properties = top().properties || {};
            properties = top().properties;
        }
        properties[name] = property;
    }

    function repeat(str, count) {
        var res = '';
        for (var i = 0; i < count; i++) {
            res += str;
        }
        return res;
    }


    var headers = [];

    // FIXME
    mdStr.replace(
        new RegExp('(?:^|\n) *(#{1,' + maxDepth + '}) *([^#][^\n]+)', 'g'),
        function (header, headerPrefix, text) {
            headers.push({
                text: text,
                level: headerPrefix.length
            });
        }
    );

    mdStr.split(new RegExp('(?:^|\n) *(?:#{1,' + maxDepth + '}) *(?:[^#][^\n]+)','g'))
        .slice(1).forEach(move);

    function move(section, idx) {
        var text = headers[idx].text;
        var parts = /(.*)\(([\w\|\*]*)\)(\s*=\s*(.*))*/.exec(text);
        var key;
        var type = '*';
        var defaultValue = null;
        var level = headers[idx].level;
        if (parts === null) {
            key = text;
        }
        else {
            key = parts[1];
            type = parts[2];
            defaultValue = parts[4] || null;
        }
        var types = type.split('|').map(function (item) {
            return item.trim();
        });

        key = key.trim();

        section = section.replace(/~\[(.*)\]\((.*)\)/g, function (text, size, href) {
            size = size.split('x');
            var width = +size[0];
            var height = +size[1];
            var iframe = ['<iframe data-src="', href, '"'];
            if (size[0].match(/[0-9%]/)) {
                iframe.push(' width="', size[0], '"');
            }
            if (size[1].match(/[0-9%]/)) {
                iframe.push(' height="', size[1], '"');
            }
            iframe.push(' ></iframe>\n');
            return iframe.join('');
        });
        var property = {
            'type': types,
            'description': section
        };

        if (section.indexOf('{require') > -1) {
            var require = section.match(/{require:(.*?)}/);
            property.require = require[1];
        }
        if (section.indexOf('{range') > -1) {
            var range = section.match(/{range: (.*?)}/);
            property.range = range[1];
        }

        if (defaultValue != null) {
            property['default'] = convertType(defaultValue);
        }
        if (level < currentLevel) {
            var diff = currentLevel - level;
            var count = 0;
            while (count <= diff) {
                stacks.pop();
                count++;
            }
            appendProperty(key, property);
            current = property;
            stacks.push(current);
        }
        else if (level > currentLevel) {
            if (level - currentLevel > 1) {
                throw new Error(
                    text + '\n标题层级 "' + repeat('#', level) + '" 不能直接跟在标题层级 "' + repeat('#', currentLevel) + '"后'
                );
            }
            current = property;
            appendProperty(key, property);
            stacks.push(current);
        }
        else {
            stacks.pop();
            appendProperty(key, property);
            stacks.push(property);
        }
        currentLevel = level;
    }

    return result;
}

module.exports = convert;