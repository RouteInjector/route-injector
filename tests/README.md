# Tests

## Usage

        cd route-injector
        npm link
        cd test
        cd test-simple
        npm install
        npm link route-injector
        RI_ENV=test ../../node_modules/.bin/mocha --preserve-symlinks *

## Usage as a standalone example

        cd route-injector
        npm link
        cd test
        cd test-simple
        npm install
        npm link route-injector
        RI_ENV=test node --preserve-symlinks bin/www
