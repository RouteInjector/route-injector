#!/usr/bin/env bash

# Output colors
NORMAL='\033[0m' # No Color
RED='\033[0;31m'
BLUE='\033[0;34m'
DIR=`pwd`

# INTERNAL USAGE
log() {
    echo -e "${BLUE}${1}${NORMAL}"
}
# INTERNAL USAGE
error() {
    echo -e "${RED}ERROR - ${1}${NORMAL}"
    return -1
}
check_exit() {
    rc=$?; if [[ $rc != 0 ]]; then
        error "Something wrong happened. Check logs :(";
        exit $rc;
    fi
}
install(){
    log "Install STARTED"
    npm install
    typings
    check_exit
    log "Install ENDED"
}
# INTERNAL USAGE
clean(){
    log "Clean STARTED"
    rm -r node_modules
    rm -r typings
    cd $DIR
    log "Clean ENDED"
}

#version(){
#    log "Setting version"
#    BRANCH=$(git branch | awk '/^\*/{print $2}')
#    VTAG=$(git describe --tags --abbrev=0)
#    TAG=${VTAG:1}
#    NUM_COMMITS=$(git log `git describe --tags --abbrev=0`..HEAD --oneline | wc -l | xargs)
#    VER=${TAG%.*}
#    VER=$VER.$NUM_COMMITS
#    npm version $VER
#    cd $DIR
#    log "Version: $VER"
#}

build() {
    log "Build STARTED"
    install
    transpile
    log "Build ENDED"
}

release(){
    log "Release STARTED"
    install
    transpile
#    version
    clean
    clean_tests
    log "Release ENDED"
}

transpile(){
    log "Do the transpilation"
    typings
    check_exit
    ./node_modules/.bin/tsc
    # Return 0 to avoid failing because of warnings not solved
    return 0
}

#tsdocs(){
#    ./node_modules/.bin/typedoc --out typedoc/ lib/ --module commonjs --target ES5 --exclude "**/bower_components/**/*.ts"
#}

typings(){
    $(npm bin)/typings install
}

transpile_pre_commit(){
    files=`git status -s -uno|grep -v '^ '|awk '{print $2}'`

    transpile

    echo "$files" | while read a
    do
        if [ "${a##*.}" == "ts" ]; then
            git add ${a//".ts"/".js"}
            git add ${a//".ts"/".js.map"}
        fi
    done
}

test(){
    npm link
    cd tests
    for D in *; do
        if [ -d "${D}" ]; then
            cd "${D}"
            npm install
            npm link route-injector
            RI_ENV=test $DIR/node_modules/.bin/mocha --preserve-symlinks *
            cd ..
        fi
    done
    cd $DIR
}

clean_tests(){
    cd tests
    for D in *; do
        if [ -d "${D}" ]; then
            cd "${D}"
            rm -rf node_modules
            cd ..
        fi
    done
    cd $DIR
}

help() {
  echo -e -n "$BLUE"
  echo "-----------------------------------------------------------------------"
  echo "-                     Available commands                              -"
  echo "-----------------------------------------------------------------------"
  echo "   > install - Resolve npm dependencies"
  echo "   > build - Install dependencies and transpile code"
  echo "   > release - Release a new version"
  echo "   > test - Run tests"
  echo "   > transpile - Install typings and transpile typecsript to javascript"
  echo "-----------------------------------------------------------------------"
  echo -e -n "$NORMAL"
}
if [ ! -f command.sh ]; then
    error "Script must be run from project root-dir (route-injector)"
    exit -1
fi
if [ -z "$*" ]; then
    help
else
    $*
fi