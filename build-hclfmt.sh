#!/bin/bash

git submodule update --init --recursive

mkdir -p bin

bin=$PWD/bin

pushd hcl/cmd/hclfmt
    GOOS=linux go build -o $bin/hclfmt-linux
    GOOS=darwin go build -o $bin/hclfmt-darwin
    GOOS=windows go build -o $bin/hclfmt-windows.exe 
popd
