/**
 * ------------------------------------------------------------------------
 * Usage:
 *
 * ```shell
 * node build.js --env asf # build all for asf
 * node build.js --env echartsjs # build all for echartsjs.
 * node build.js --env localsite # build all for localsite.
 * node build.js --env dev # the same as "debug", dev the content of docs.
 * # Check `./config` to see the available env
 * ```
 * ------------------------------------------------------------------------
 */

const md2json = require('./tool/md2json');
const extractDesc = require('./tool/extractDesc');
const fs = require('fs');
const fse = require('fs-extra');
const marked = require('marked');
const copydir = require('copy-dir');
const chalk = require('chalk');
// const MarkDownTOCRenderer = require('./tool/MarkDownTOCRenderer');
const argv = require('yargs').argv;
const path = require('path');
const assert = require('assert');
const chokidar = require('chokidar');
const debounce = require('lodash.debounce');
const {getDocJSONPVarNname} = require('./src/shared');
const { basename } = require('path');

const projectDir = __dirname;

function initEnv() {
    let envType = argv.env;
    let isDev = argv.dev != null || argv.debug != null || argv.env === 'dev';

    if (isDev) {
        console.warn('=============================');
        console.warn('!!! THIS IS IN DEV MODE !!!');
        console.warn('=============================');
        envType = 'dev';
    }

    if (!envType) {
        throw new Error('--env MUST be specified');
    }

    let config = require('./config/env.' + envType);

    assert(path.isAbsolute(config.releaseDestDir) && path.isAbsolute(config.ecWWWGeneratedDir));

    config.envType = envType;

    return config;
}

const config = initEnv();

const languages = ['en'];

config.gl = config.gl || {};
for (let key in config) {
    if (key !== 'gl' && !config.gl.hasOwnProperty(key)) {
        config.gl[key] = config[key];
    }
}

async function md2jsonAsync(opt) {
    var newOpt = Object.assign({
        path: path.join(opt.language, opt.entry, '**/*.md'),
        tplEnv: config,
        imageRoot: config.imagePath
    }, opt);

    function run(cb) {
        md2json(newOpt, schema => {
            writeSingleSchemaPartioned(schema, opt.language, opt.entry, false);
            console.log(chalk.green('generated: ' + opt.language + '/' + opt.entry));
            cb && cb();
        });
    }

    var runDebounced = debounce(run, 500, {
        leading: false,
        trailing: true
    });
    return await new Promise((resolve, reject) => {
        run(resolve);

        if (argv.watch) {
            chokidar.watch(path.resolve(__dirname, opt.language, opt.entry), {
                ignoreInitial: true
            }).on('all', (event, path) => {
                console.log(path, event);
                runDebounced();
            });
        }
    });
}

async function run() {

    for (let language of languages) {
        await md2jsonAsync({
            sectionsAnyOf: ['visualMap', 'dataZoom', 'series', 'graphic.elements'],
            entry: 'option',
            language
        });

        await md2jsonAsync({
            sectionsAnyOf: ['series'],
            entry: 'option-gl',
            // Overwrite
            tplEnv: config.gl,
            imageRoot: config.gl.imagePath,
            language
        });
    }

    console.log('All done.');
}

function flatObject(
    optionChain,
    children,
    optionsNames,
    descriptions
) {
    children.map(item => {
        if (item.children) {
            flatObject(`${optionChain}.${item.prop || item.arrayItemType || ''}`, item.children, optionsNames, descriptions);
        }

        if (!optionsNames[optionChain]) {
            optionsNames[optionChain] = [];
        }

        let type = [];
        let valide = [];
        item.type = item.type === '*' ? 'object' : (item.type ? item.type : typeof item.default);
        if (typeof item.type === 'string') {
            type = [item.type];
        } else {
            type = item.type;
        }

        if (typeof item.default === 'string' && item.default.length) {
            item.default = item.default.replace(/,/g, '\',\'');
            valide = item.default.split(',');
        } else if (item.default === '') {
            valide = [''];
        } else if (typeof item.default === 'number') {
            valide = [item.default];
        }

        const data = {
            type,
            valide,
            name: item.prop || item.arrayItemType || '',
            desc: item.desc
        };
        if (item.require) {
            data.require = item.require.trim();
        }
        if (item.requireCondition) {
            data.requireCondition = item.requireCondition.trim();
        }
        
        if (item.range) {
            data.range = JSON.parse(item.range);
        }

        optionsNames[optionChain].push(data);
    });
}
function writeSingleSchemaPartioned(schema, language, docName) {
    const {outline} = extractDesc(schema, docName);
    const result = {}
    const options = {};
    options[docName] = [];
    outline.children = outline.children.map((i) => {
        let type;
        if (i.type == null) {
            type = [typeof i.default]
        }
        else if (typeof i.type === 'string') {
            type = [i.type === '*' ? 'Object' : i.type];
        } else {
            type = i.type;
        }
        options[docName].push({
            name: i.prop,
            type: type,
            desc: i.desc,
            valide: []
        });
        if (i.children) {
            flatObject(i.prop || i.arrayItemType || '', i.children, result);
        }
    });
    Object.assign(result, options);
    let descDestPath = path.resolve(config.releaseDestDir, `${language}/option/${docName}.json`);
    fse.ensureDirSync(path.dirname(descDestPath));
    fse.outputFile(
        descDestPath,
        JSON.stringify(result),
        'utf-8'
    );
};

run();
