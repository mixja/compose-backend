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

## Data Model

### Entities

There are three primary entities in DynamoDB:

- **State** - pk of `state#<name>`
- **User** - pk of `user#<user-id>`
- **Connection** - pk of `connection#<connection-id>`

In addition to the above, we model **Subscription** as a sub-entity of **State**.  A **Subscription** represents an active **Connection** that should receive updates to any change in a specific piece of **State**.

The following table summarizes the current DynamoDB entities:

| Entity       | pk                          | sk                            | gsi1pk                      | gsi1sk                              | Attributes                                                       |
|--------------|-----------------------------|-------------------------------|-----------------------------|-------------------------------------|------------------------------------------------------------------|
| state        | `state#<name>`              | `state#<name>`                |                             |                                     | `name` `value`                                                   |
| subscription | `state#<name> `             | `subscription#<connectionId>` | `connection#<connectionId>` | `status#<status>#<statusTimestamp>` | `connectionId` `status` `subscribedAt` `unsubscribedAt` `reason` |
| connection   | `connection#<connectionId>` | `connection#<connectionId>`   | `user#<userId>`             |                                     | `connectionId` `userId`                                          |
| user         | `user#<userId>`             | `user#<userId>`               | `user#<email>`              |                                     | `email` `userId`                                                 |


### Key Attributes vs Data Attributes

Key attributes (`pk`, `sk`, `gsi1pk` and `gsi1sk`) are used for DynamoDB lookup and indexing.

Key attributes should **NOT** be used to extract embedded data attributes.  This means any data attributes must be duplicated separately in the DynamoDB item.  

For example, the following `State` item embeds the `name` data attribute within the `pk` and `sk`:

```js
{
  pk: "state#foo",
  sk: "state#foo",
  name: "foo",
  value: "bar"
}
```

Similarly the following `Subscription` item defines all embedded data attributes (`stateName` and `connectionId`) separately:

```js
{
  pk: "state#foo",
  sk: "subscription#conn-1234",
  gsi1pk: "connection#conn-1234",
  gsi1sk: "status#subscribed#1643245799",
  stateName: "foo"
  connectionId: "conn-1234",
  status: "subscribed",
  subscribedAt: 1643245799
}
```

Adopting this approach means we can consistently deserialize an object representation of the entity as follows:

```js
const item = {
  pk: "state#foo",
  sk: "state#foo",
  name: "foo",
  value: "bar"
}
const { pk, sk, gsi1pk, gsi1sk, ...state } = item
```

which generates the following `state` object:

```js
{
  name: "foo",
  value: "bar"
}
```

### Query Patterns

| Requirement                               | Context | Key Expression                                                                  | Filter Expression     |
|-------------------------------------------|---------|---------------------------------------------------------------------------------|-----------------------|
| Lookup state                              | Table   | `pk = state#<name> AND sk = state#<name>`                                       |                       |
| Lookup active subscriptions by state      | Table   | `pk = state#<name> AND begins_with(sk, subscription#)`                          | ` status = subscribed` |
| Lookup active subscriptions by connection | GSI1    | `gsi1pk = connection#<connectionId> AND begins_with(gsi1sk, status#subscribed#)` |                       |
| Lookup user                               | Table   | `pk = user#<userId> AND sk = user#<userId>`                                     |                       |
| Lookup user by email address              | GSI1    | `gsi1pk = user#<email-address>`                                                 |                       |
| Lookup connection                         | Table   | `pk = connection#<connectionId> AND sk = connection#<connectionId>`             |                       |

### Item Expiration

For all entities, the `ttl` attribute can be set which will automatically expire the item after the `ttl` timestamp is passed. DynamoDB will periodically delete all expired items, reducing storage.
