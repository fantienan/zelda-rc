const fse = require('fs-extra');

fse.copy('./package.json', './dist/package.json')
fse.copy('./README.md', './dist/README.md')
