#! /usr/bin/env sh

bundle exec rake
bundle exec jekyll build
rm -rf docs/*
cp -R _site/css docs/css/
cp -R _site/images docs/images/
cp -R _site/js docs/js/
cp -R _site/ja/. docs/
cp _site/CNAME docs/
