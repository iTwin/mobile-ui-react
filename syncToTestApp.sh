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
destDir=${appDir}/node_modules/@itwin/mobileui-react
# If destDir is a symlink, it probably came from nmp link or a file: package.json reference. Delete the link.
[ -L "${destDir}" ] && rm "${destDir}"
[ -d "${destDir}" ] || mkdir -p "${destDir}"
rsync -aL --delete lib LICENSE.md package.json README.md "${destDir}/"
