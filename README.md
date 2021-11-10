# Compose Backend

## Prerequisites

- [Node JS](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)
- [Make 4.x](https://formulae.brew.sh/formula/make)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### Installing Make on Mac

```
echo 'export PATH="/usr/local/opt/make/libexec/gnubin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

You must also configure a local AWS profile and ensure this is configured in your terminal:

```
% cat ~/.aws/credentials
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

## DynamoDB

As per https://github.com/compose-run/compose/issues/6 there are three primary entities in DynanoDB:

- State - pk of `state#<name>`
- Users - pk of `user#<user-id>`
- Subscriptions - pk of `subscription#<user-id>`

For primary items, the `pk` and `sk` values are set identically.

All primary entities support for following access patterns:

- Lookup up entity by ID

A single GSI also exists that uses `gsi1pk` and `gsi1sk` for its key. GSI1 supports the following access pattens:

- Lookup user by email address - `gsi1pk = user#email#<email-address>`
- Lookup active subscriptions for a user - `gsi1pk = subscription#user#<user-id> AND attribute_not_exists(gsi1sk)`

For all entities, the `ttl` attribute can be set which will automatically expire the item after the `ttl` timestamp is passed. DynamoDB will periodically delete all expired items, reducing storage.
