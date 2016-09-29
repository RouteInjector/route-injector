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
    check_exit
    bower install --allow-root
    check_exit
    grunt dist
    check_exit
    log "Install ENDED"
}
# INTERNAL USAGE
clean(){
    log "Clean STARTED"
    cd lib/engine/backoffice/public/admin
    rm -r bower_components
    cd $DIR
    log "Clean ENDED"
}

version(){
    log "Setting version"
    cd src
    BRANCH=$(git branch | awk '/^\*/{print $2}')
    VTAG=$(git describe --tags --abbrev=0)
    TAG=${VTAG:1}
    NUM_COMMITS=$(git log `git describe --tags --abbrev=0`..HEAD --oneline | wc -l | xargs)
    VER=${TAG%.*}
    VER=$VER.$NUM_COMMITS
    npm version $VER
    cd $DIR
    log "Version: $VER"
}
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
    version
    clean
    publish_injector
    log "Release ENDED"
}

transpile(){
    log "Do the transpilation"
    ./node_modules/.bin/typings install
    check_exit
    ./node_modules/.bin/tsc
    # Return 0 to avoid failing because of warnings not solved
    return 0
}

#tsdocs(){
#    ./node_modules/.bin/typedoc --out typedoc/ lib/ --module commonjs --target ES5 --exclude "**/bower_components/**/*.ts"
#}

typings(){
    ./node_modules/.bin/typings install
}

help() {
  echo -e -n "$BLUE"
  echo "-----------------------------------------------------------------------"
  echo "-                     Available commands                              -"
  echo "-----------------------------------------------------------------------"
  echo "   > install - Resolve npm and bower dependencies"
  echo "   > build - Install dependencies and transpile code"
  echo "   > release - Release a new version"
  echo "   > test - Run tests"
  echo "   > releaseProfiler - Release Profiler Plugin"
  echo "   > releaseHistory - Release History Plugin"
  echo "   > releaseStatuscode - Release StatusCode Library"
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