-include .env
PROJECT_NAME = compose-backend
ARTIFACTS_BUCKET = compose-sandbox-us-east-1-artifacts

make: install test build deploy integration

install:
	yarn install

build:
	yarn build
	sam build --cached

build-%:
	$(MAKE) copy-artifacts

build-Dependencies:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	yarn workspaces focus --production
	cp -r node_modules "$(ARTIFACTS_DIR)/nodejs"

copy-artifacts:
	cp -r dist "$(ARTIFACTS_DIR)"

deploy:
	sam deploy --stack-name $(STACK_NAME) \
					   --s3-bucket $(ARTIFACTS_BUCKET) \
						 --s3-prefix $(STACK_NAME) \
						 --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
						 --no-fail-on-empty-changeset

test:
	yarn test


test-integration-verbose:
	yarn test-integration-verbose


watch:
	yarn watch

integration:
	yarn integration

destroy:
	sam delete --stack-name $(STACK_NAME) --no-prompts --region $$(aws configure get region)

# General settings
BRANCH_NAME != git rev-parse --abbrev-ref HEAD
BRANCH_ID ?= $(BRANCH_ID_CMD)
BRANCH_ID_CMD != echo $(BRANCH_NAME) | md5 | cut -c 1-7 -
STACK_NAME ?= $(if $(filter master main,$(BRANCH_NAME)),$(PROJECT_NAME),$(PROJECT_NAME)-$(BRANCH_ID))

# Make settings
.PHONY: *
.ONESHELL:
.SILENT:
SHELL=bash
.SHELLFLAGS=-ceo pipefail
MAKEFLAGS += --no-print-directory
export
