#! /usr/bin/env sh

bundle exec jekyll build
rm -rf docs/*
cp -R _site/ja/. docs/
