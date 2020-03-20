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
            writeSingleSchema(schema, opt.language, opt.entry, false);
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

function copyAsset() {

    const assetSrcDir = path.resolve(projectDir, 'asset');

    function doCopy() {
        for (let lang of languages) {
            const assetDestDir = path.resolve(config.releaseDestDir, `${lang}/documents/asset`);
            copydir.sync(assetSrcDir, assetDestDir);
        }
    }
    var doCopyDebounced = debounce(doCopy, 500, {
        leading: false,
        trailing: true
    });

    doCopy();

    if (argv.watch) {
        chokidar.watch(assetSrcDir, {
            ignoreInitial: true
        }).on('all', (event, path) => {
            console.log(path, event);
            doCopyDebounced();
        });
    }
    console.log('Copy asset done.');
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

    console.log('Build doc done.');

    copyAsset();

    console.log('All done.');
}

function writeSingleSchema(schema, language, docName, format) {
    const destPath = path.resolve(config.releaseDestDir, `${language}/documents/${docName}.json`);
    fse.ensureDirSync(path.dirname(destPath));
    fse.outputFileSync(
        destPath,
        format ? JSON.stringify(schema, null, 2) : JSON.stringify(schema),
        'utf-8'
    );
    // console.log(chalk.green('generated: ' + destPath));
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

        optionsNames[optionChain].push({
            type,
            valide,
            name: item.prop || item.arrayItemType || '',
            desc: item.desc
        });
    });
}
function writeSingleSchemaPartioned(schema, language, docName, format) {
    const {outline} = extractDesc(schema, docName);
    outline.children = outline.children.map((i) => {
        if (i.children) {
            const result = {}
            flatObject(i.prop || i.arrayItemType || '', i.children, result);
            let descDestPath = path.resolve(config.releaseDestDir, `${language}/documents/${docName}-parts/${i.prop || i.arrayItemType || ''}.json`);
            fse.ensureDirSync(path.dirname(descDestPath));
            fse.outputFile(
                descDestPath,
                JSON.stringify(result),
                'utf-8'
            );
        }
    });
};

run();
