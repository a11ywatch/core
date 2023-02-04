#!/bin/sh

docker build -t core .
docker tag core:latest 608440221714.dkr.ecr.us-east-2.amazonaws.com/core:latest
docker push 608440221714.dkr.ecr.us-east-2.amazonaws.com/core:latest