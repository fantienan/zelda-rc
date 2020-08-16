const fse = require('fs-extra')

fse.copy('./package.json', './es/package.json')