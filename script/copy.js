const fse = require('fs-extra')

fse.copy('./package.json', './build/package.json')
fse.copy('./README.md', './build/README.md')