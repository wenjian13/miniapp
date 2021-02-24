const { resolve, extname } = require('path');
const { readFileSync } = require('fs-extra');
const { platformMap } = require('miniapp-builder-shared');
const { UNRECURSIVE_TEMPLATE_TYPE } = require('../constants');
const addFileToCompilation = require('../utils/addFileToCompilation');
const getAssetPath = require('../utils/getAssetPath');
const adjustCSS = require('../utils/adjustCSS');

function generateAppJS(
  compilation,
  commonAppJSFilePaths,
  mainPackageRoot = 'main',
  { target, command }
) {
  const init = `
function init(window, document) {${commonAppJSFilePaths.map(filePath => `require('${getAssetPath(filePath, 'app.js')}')(window, document)`).join(';')}}`;
  const appJsContent = `
const render = require('./render');
const config = require('./config');
${init}
App(render.createAppConfig(init, config, '${mainPackageRoot}'));
`;

  addFileToCompilation(compilation, {
    filename: 'app.js',
    content: appJsContent,
    target,
    command,
  });
}

function generateAppCSS(compilation, { target, command, pluginDir, subPackages }) {
  // Add default css file to compilation
  const defaultCSSTmpl = adjustCSS(readFileSync(
    resolve(pluginDir, 'static', 'default.css'),
    'utf-8'
  ), UNRECURSIVE_TEMPLATE_TYPE.has(target));
  // Generate __rax-view and __rax-text style for rax compiled components
  const raxDefaultCSSTmpl = readFileSync(
    resolve(pluginDir, 'static', 'rax-default.css'),
    'utf-8'
  );
  addFileToCompilation(compilation, {
    filename: `default${platformMap[target].extension.css}`,
    content: defaultCSSTmpl + raxDefaultCSSTmpl,
    target,
    command,
  });

  let content = '@import "./default";';

  Object.keys(compilation.assets).forEach(asset => {
    if (extname(asset) === '.css') {
      delete compilation.assets[asset];
      if (!subPackages) {
        content += `@import "./${asset}";`;
      }
    }
  });

  addFileToCompilation(compilation, {
    filename: `app${platformMap[target].extension.css}`,
    content,
    target,
    command,
  });
}

module.exports = {
  generateAppJS,
  generateAppCSS
};
