# Compose Backend

## Prerequisites

- [Node JS](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)
- [Make 4.x](https://formulae.brew.sh/formula/make)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

You must also configure a local AWS profile and ensure this is configured in your terminal:

```
% cat ~/.aws/credential
[compose-sandbox]
aws_access_key_id=xxxxx
aws_secret_access_key=xxxx
region=us-east-1

% export AWS_PROFILE=compose-sandbox
```

## Running the workflow

Checkout a new branch and run `make`:

```
% git checkout -b new-shiny-feature
% make
```