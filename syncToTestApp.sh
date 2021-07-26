#! /bin/zsh
if [ "$1" != "" ]; then
  appDir=$1
elif [ "$ITM_TEST_APP_DIR" != "" ]; then
  appDir=$ITM_TEST_APP_DIR
else
  echo Destination must be specified either as argument or in ITM_TEST_APP_DIR
  echo variable.
  exit 1
fi
destDir=${appDir}/node_modules/@bentley/itwin-mobile-ui
[ -d "${destDir}" ] || mkdir "${destDir}"
rsync -aL --delete lib LICENSE.md package.json README.md "${destDir}/"